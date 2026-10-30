// app/api/inquiries/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { withSupabase, withSupabaseAdmin } from "@/lib/supabase/withSupabase";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { notifyInquiryCreated } from "@/lib/notifications";
import { z } from "zod";

const inquirySchema = z.object({
  category_id: z.string().optional(),
  product_id: z.string().optional(),
  name: z.string().min(1),
  company: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  qty: z.coerce.number().int().positive().optional(),
  message: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // 频率限制：同一 IP 每分钟最多 5 次询盘提交，防止接口被刷
    const ip = getClientIp(req);
    const rl = rateLimit(ip, { limit: 5, windowMs: 60 * 1000 });
    if (!rl.allowed) {
      const retryAfter = Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000));
      return NextResponse.json(
        { success: false, error: "请求过于频繁，请稍后再试" },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const body = await req.json();
    const parsed = inquirySchema.parse(body);

    // 会话必须从「带 Cookie 的」server client 读取：
    // admin client 用 service_role 且不读 Cookie，其 getUser() 永远返回 null。
    const authClient = await createSupabaseServerClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    // 写入用 admin client 绕过 RLS（匿名访客也要能提交询盘），使用统一包装器自动重试
    const { data, error } = await withSupabaseAdmin(async (supabase) => {
      const result = await supabase
        .from("inquiries")
        .insert({
          user_id: user?.id ?? null,
          category_id: parsed.category_id ?? null,
          product_id: parsed.product_id ?? null,
          name: parsed.name,
          company: parsed.company ?? null,
          email: parsed.email,
          phone: parsed.phone ?? null,
          qty: parsed.qty ?? null,
          message: parsed.message ?? null,
          metadata: {
            utm_source: parsed.utm_source,
            utm_medium: parsed.utm_medium,
            utm_campaign: parsed.utm_campaign,
            user_agent: req.headers.get("user-agent"),
            referer: req.headers.get("referer"),
          },
        })
        .select("id, created_at")
        .single();
      return result;
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }

    const inquiryId = data?.id;
    
    // 异步发送通知（不阻塞响应）
    if (inquiryId) {
      // 获取品类/商品名称用于通知模板
      let categoryName: string | undefined;
      let productName: string | undefined;
      
      // 使用同一 admin client 查询关联信息（避免新建连接）
      const { data: catData } = await withSupabaseAdmin(async (supabase) => {
        if (parsed.category_id) {
          const { data } = await supabase
            .from("categories")
            .select("fr, zh")
            .eq("id", parsed.category_id)
            .single();
          return data;
        }
        return null;
      });
      if (catData) categoryName = catData.fr;

      const { data: prodData } = await withSupabaseAdmin(async (supabase) => {
        if (parsed.product_id) {
          const { data } = await supabase
            .from("products")
            .select("nameFr, nameZh")
            .eq("id", parsed.product_id)
            .single();
          return data;
        }
        return null;
      });
      if (prodData) productName = prodData.nameFr;

      // 后台触发通知（fire-and-forget，不 await）
      notifyInquiryCreated({
        inquiryId,
        name: parsed.name,
        email: parsed.email,
        company: parsed.company ?? undefined,
        phone: parsed.phone ?? undefined,
        category: categoryName,
        product: productName,
        qty: parsed.qty ?? undefined,
        message: parsed.message ?? undefined,
        createdAt: new Date().toISOString(),
      }).catch(err => console.error("[notifyInquiryCreated] Failed:", err));
    }

    return NextResponse.json({ success: true, inquiryId });
  } catch (err: unknown) {
    // Zod 校验失败属于客户端错误(400)；其余按服务端错误(500)处理，避免误导
    const isValidation = err instanceof z.ZodError;
    const message = isValidation
      ? err.issues.map((i) => i.message).join("; ")
      : "提交失败，请稍后重试";

    if (!isValidation) console.error("[inquiries POST]", err);

    return NextResponse.json(
      { success: false, error: message },
      { status: isValidation ? 400 : 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { data: authData, error: authError } = await withSupabase(async (supabase) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { user: null };

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);
    const offset = Number(searchParams.get("offset") ?? 0);

    let query = supabase
      .from("inquiries")
      .select("id, category_id, product_id, name, email, status, created_at, updated_at", {
        count: "exact",
      })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq("status", status);

    return query;
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status });
  }

  if (!authData) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error, count } = await authData;

  if (error) {
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }

  return NextResponse.json({ data, count, limit, offset });
}