// src/app/auth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect") || "/account";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(redirect, req.url));
    }

    console.error("[Auth Callback] Exchange code error:", error);
  }

  // 出错回登录页带错误提示
  return NextResponse.redirect(new URL(`/login?error=auth_failed`, req.url));
}