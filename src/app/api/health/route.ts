// app/api/health/route.ts
// 健康检查端点：供 uptime 监控（UptimeRobot、Pingdom、Cloudflare、自建）轮询
// 返回：服务状态、依赖检查、关键指标快照

import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { recordMetric } from "@/lib/monitoring";

export const runtime = "edge"; // 边缘运行时，冷启动极快

export async function GET() {
  const start = Date.now();
  const checks: Record<string, { ok: boolean; latencyMs: number; error?: string }> = {};
  let overallOk = true;

  // 1. Supabase 连通性
  const sbStart = Date.now();
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("categories").select("id").limit(1).single();
    checks.supabase = { ok: !error, latencyMs: Date.now() - sbStart };
    if (error) overallOk = false;
  } catch (e) {
    checks.supabase = { ok: false, latencyMs: Date.now() - sbStart, error: String(e) };
    overallOk = false;
  }

  // 2. Sentry DSN 配置检查
  checks.sentry = { 
    ok: !!process.env.SENTRY_DSN, 
    latencyMs: 0,
    error: process.env.SENTRY_DSN ? undefined : "SENTRY_DSN not configured" 
  };
  if (!process.env.SENTRY_DSN) overallOk = false;

  // 3. Storage (S3/R2) 配置检查
  checks.storage = { 
    ok: !!(process.env.STORAGE_PROVIDER && (process.env.R2_ACCESS_KEY_ID || process.env.SUPABASE_STORAGE_ACCESS_KEY)), 
    latencyMs: 0,
    error: "Storage credentials missing"
  };
  if (!checks.storage.ok) overallOk = false;

  // 4. 记录健康检查自身延迟
  const totalLatency = Date.now() - start;
  recordMetric({
    type: "performance",
    name: "health_check_latency",
    value: totalLatency,
    unit: "ms",
  });

  return NextResponse.json(
    {
      status: overallOk ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? "unknown",
      environment: process.env.NODE_ENV,
      checks,
      uptimeSeconds: process.uptime(),
      memoryUsage: process.memoryUsage(),
    },
    { 
      status: overallOk ? 200 : 503,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Health-Check": overallOk ? "pass" : "fail",
      }
    }
  );
}