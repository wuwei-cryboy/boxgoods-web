// sentry.edge.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_APP_VERSION || process.env.npm_package_version,

  debug: process.env.NODE_ENV === "development",

  // Edge Runtime: Sentry v8+ 自动处理错误捕获
  // 无需手动添加 onUnhandledRejectionIntegration / globalHandlersIntegration
});