// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // 采样率：生产环境 10%，开发环境 100%
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // 环境标识
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,

  // 发布版本（用于 Source Map 关联）
  release: process.env.NEXT_PUBLIC_APP_VERSION || process.env.npm_package_version,

  // 调试模式
  debug: process.env.NODE_ENV === "development",

  // 过滤掉不需要的错误
  beforeSend(event, hint) {
    // 过滤掉已知的无害错误
    const error = hint.originalException;
    if (error instanceof Error) {
      // 忽略 React 的 hydration mismatch（开发环境常见）
      if (
        error.message.includes("hydration") ||
        error.message.includes("Hydration")
      ) {
        return null;
      }
      // 忽略网络错误
      if (error.message.includes("NetworkError") || error.message.includes("Failed to fetch")) {
        return null;
      }
    }
    return event;
  },

  // Sentry v8+: 浏览器端自动捕获 unhandled rejection 和全局错误
  // 无需手动添加 unhandledRejectionIntegration / globalHandlersIntegration
});