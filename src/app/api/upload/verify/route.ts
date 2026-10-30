// app/api/upload/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { verifyUploadedFile } from "@/lib/storage";
import { z } from "zod";

const verifySchema = z.object({
  bucket: z.enum(["product-images", "avatars", "documents"]).default("product-images"),
  key: z.string().min(1),
  expectedContentType: z.string().startsWith("image/").optional(),
  maxSize: z.number().max(10_000_000).default(5_000_000),
  checkMagicBytes: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = verifySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "参数无效", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { bucket, key, expectedContentType, maxSize, checkMagicBytes } = parsed.data;

  // 验证 key 归属当前用户（防止遍历他人文件）
  if (!key.startsWith(`users/${user.id}/`)) {
    return NextResponse.json({ error: "Forbidden: key does not belong to user" }, { status: 403 });
  }

  const result = await verifyUploadedFile({
    bucket,
    key,
    expectedContentType,
    maxSize,
    checkMagicBytes,
  });

  if (!result.ok) {
    // 可选：记录失败审计日志到数据库
    console.warn("[upload verify] failed", { userId: user.id, bucket, key, error: result.error });
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }

  // 成功：可记录到 uploads 审计表（如有）
  // await supabase.from("uploads").insert({ user_id: user.id, bucket, key, content_type: result.contentType, size: result.contentLength });

  return NextResponse.json({ success: true, contentType: result.contentType, contentLength: result.contentLength });
}