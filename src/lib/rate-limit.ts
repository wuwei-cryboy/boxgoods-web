/**
 * 轻量级内存滑动窗口限流器。
 *
 * 不引入外部依赖，适合单实例 Next.js 项目。数据保存在进程内 Map 中，
 * 重启后重置。每个窗口结束后自动清理，防止内存泄漏。
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// 每小时清理一次过期条目，防止内存持续增长
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetAt) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);
}

/**
 * 对给定标识符进行限流检查。
 *
 * @returns { allowed, remaining, resetAt }
 *   - allowed: 是否允许本次请求
 *   - remaining: 本窗口内还剩多少次可用额度
 *   - resetAt: 当前窗口的重置时间戳（ms）
 */
export function rateLimit(
  identifier: string,
  options: { limit: number; windowMs: number }
): { allowed: boolean; remaining: number; resetAt: number } {
  const { limit, windowMs } = options;
  const now = Date.now();
  const entry = store.get(identifier);

  // 无记录或窗口已过期：新建窗口
  if (!entry || now > entry.resetAt) {
    store.set(identifier, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  // 已达上限
  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

/**
 * 从请求头中提取客户端 IP。
 * 支持 X-Forwarded-For（代理/负载均衡）与 X-Real-IP，无法识别时返回 "unknown"。
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}
