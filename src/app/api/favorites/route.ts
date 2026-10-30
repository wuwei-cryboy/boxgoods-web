// app/api/favorites/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const favSchema = z.object({
  product_id: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { product_id } = favSchema.parse(body);

  const { error } = await supabase
    .from("favorites")
    .upsert({ user_id: user.id, product_id }, { onConflict: "user_id,product_id" });

  if (error) throw error;
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const product_id = searchParams.get("product_id");
  if (!product_id) return NextResponse.json({ error: "Missing product_id" }, { status: 400 });

  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("product_id", product_id);

  if (error) throw error;
  return NextResponse.json({ success: true });
}

export async function GET(_req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("favorites")
    .select("product_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return NextResponse.json({ data: data?.map((d) => d.product_id) ?? [] });
}