// sentry.server.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_APP_VERSION || process.env.npm_package_version,

  debug: process.env.NODE_ENV === "development",

  beforeSend(event, hint) {
    const error = hint.originalException;
    if (error instanceof Error) {
      if (
        error.message.includes("hydration") ||
        error.message.includes("Hydration")
      ) {
        return null;
      }
      if (error.message.includes("NetworkError") || error.message.includes("Failed to fetch")) {
        return null;
      }
    }
    return event;
  },

  // Sentry v8+: 使用 instrumentNode 自动捕获未处理的 rejection 和全局错误
  // 无需手动添加 onUnhandledRejectionIntegration / globalHandlersIntegration
});