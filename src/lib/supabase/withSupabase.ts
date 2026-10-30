// lib/supabase/withSupabase.ts
import { createSupabaseServerClient, createSupabaseAdminClient } from "./server";
import { SupabaseClient } from "@supabase/supabase-js";

export interface WithSupabaseOptions {
  /** 最大重试次数（默认 2） */
  maxRetries?: number;
  /** 基础延迟 ms（默认 500ms） */
  baseDelayMs?: number;
  /** 最大延迟 ms（默认 5000ms） */
  maxDelayMs?: number;
  /** 是否使用 admin client 绕过 RLS（默认 false） */
  useAdmin?: boolean;
  /** 自定义错误码映射 */
  mapError?: (error: unknown) => { code: string; message: string; status: number };
}

function getCode(error: unknown): string | undefined {
  const candidate = error as { code?: unknown };
  return typeof candidate.code === "string" ? candidate.code : undefined;
}

function getMessage(error: unknown): string | undefined {
  const candidate = error as { message?: unknown };
  return typeof candidate.message === "string" ? candidate.message : undefined;
}

function getCauseCode(error: unknown): string | undefined {
  const candidate = error as { cause?: { code?: unknown } };
  return typeof candidate.cause?.code === "string" ? candidate.cause.code : undefined;
}

/** 默认错误码映射 */
function defaultMapError(error: unknown): { code: string; message: string; status: number } {
  // PostgREST 错误码
  const code = getCode(error);
  if (code) {
    switch (code) {
      case "PGRST116": // 无结果
        return { code: "NOT_FOUND", message: "资源不存在", status: 404 };
      case "23505": // 唯一约束冲突
        return { code: "CONFLICT", message: "资源已存在", status: 409 };
      case "23503": // 外键约束
        return { code: "BAD_REQUEST", message: "关联资源不存在", status: 400 };
      case "42501": // 权限不足
        return { code: "FORBIDDEN", message: "权限不足", status: 403 };
      case "PGRST301": // JWT 过期/无效
        return { code: "UNAUTHORIZED", message: "登录已过期，请重新登录", status: 401 };
    }
  }

  const message = getMessage(error);
  // 网络错误
  if (message?.includes("fetch") || message?.includes("network") || getCauseCode(error) === "ENOTFOUND") {
    return { code: "SERVICE_UNAVAILABLE", message: "服务暂时不可用，请稍后重试", status: 503 };
  }

  // 超时
  if (message?.includes("timeout") || code === "ETIMEDOUT") {
    return { code: "TIMEOUT", message: "请求超时，请稍后重试", status: 504 };
  }

  // 默认
  return { code: "INTERNAL_ERROR", message: "服务器内部错误", status: 500 };
}

/** 计算指数退避延迟 */
function calculateDelay(attempt: number, baseDelay: number, maxDelay: number): number {
  const delay = baseDelay * Math.pow(2, attempt);
  return Math.min(delay, maxDelay);
}

/**
 * 统一的 Supabase 操作包装器
 * - 自动重试（指数退避）
 * - 统一错误码映射
 * - 可选 admin client
 */
export async function withSupabase<T>(
  fn: (client: SupabaseClient) => Promise<T>,
  options: WithSupabaseOptions = {}
): Promise<{ data: T | null; error: { code: string; message: string; status: number } | null }> {
  const {
    maxRetries = 2,
    baseDelayMs = 500,
    maxDelayMs = 5000,
    useAdmin = false,
    mapError = defaultMapError,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const client = useAdmin ? createSupabaseAdminClient() : await createSupabaseServerClient();

    try {
      const data = await fn(client);
      return { data, error: null };
    } catch (err: unknown) {
      lastError = err;

      // 最后一次尝试不再重试
      if (attempt === maxRetries) break;

      // 仅在可重试的错误上重试：网络错误、超时、5xx
      const mapped = mapError(err);
      const isRetryable = mapped.status >= 500 || mapped.code === "TIMEOUT" || mapped.code === "SERVICE_UNAVAILABLE";

      if (!isRetryable) break;

      const delay = calculateDelay(attempt, baseDelayMs, maxDelayMs);
      console.warn(`[withSupabase] Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, mapped.message);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // 所有重试均失败
  const mapped = mapError(lastError);
  console.error(`[withSupabase] All ${maxRetries + 1} attempts failed:`, mapped);
  return { data: null, error: mapped };
}

/** 便捷方法：使用 admin client */
export function withSupabaseAdmin<T>(
  fn: (client: SupabaseClient) => Promise<T>,
  options?: Omit<WithSupabaseOptions, "useAdmin">
) {
  return withSupabase(fn, { ...options, useAdmin: true });
}