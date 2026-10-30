import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import withPWA from "next-pwa";

// Polyfill for crypto.randomUUID (Node.js < 14.17.0 compatibility)
if (typeof crypto.randomUUID !== "function") {
  crypto.randomUUID = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };
}

const isProd = process.env.NODE_ENV === "production";

/** 生成 CSP nonce（每次请求唯一） */
function generateNonce() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString("base64");
}

/** CSP 策略：开发环境宽松（无 nonce，允许 unsafe-inline/eval），生产环境严格（nonce + 无 unsafe-inline） */
function buildCSP(nonce: string): string {
  if (!isProd) {
    // 开发环境：宽松 CSP，无 nonce，允许内联脚本/样式和 eval（热更新需要），移除 upgrade-insecure-requests
    return [
      `default-src 'self'`,
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com`,
      `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
      `img-src 'self' data: blob: https://*.supabase.co https://*.r2.cloudflarestorage.com https://fonts.gstatic.com https://lh3.googleusercontent.com`,
      `font-src 'self' data: https://fonts.gstatic.com`,
      `connect-src 'self' https://*.supabase.co https://*.sentry.io https://ingest.sentry.io wss://*.supabase.co`,
      `frame-src 'self'`,
      `frame-ancestors 'none'`,
      `form-action 'self'`,
      `base-uri 'self'`,
      `object-src 'none'`,
      `worker-src 'self' blob:`,
      `manifest-src 'self'`,
      `script-src-elem 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com`,
      `script-src-attr 'unsafe-inline'`,
      `style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com`,
      `style-src-attr 'unsafe-inline'`,
      `block-all-mixed-content`,
    ].join("; ");
  }
  
  // 生产环境：严格 CSP + nonce
  const policies = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' https://cdn.jsdelivr.net https://unpkg.com`,
    `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`,
    `img-src 'self' data: blob: https://*.supabase.co https://*.r2.cloudflarestorage.com https://fonts.gstatic.com https://lh3.googleusercontent.com`,
    `font-src 'self' data: https://fonts.gstatic.com`,
    `connect-src 'self' https://*.supabase.co https://*.sentry.io https://ingest.sentry.io wss://*.supabase.co`,
    `frame-src 'self'`,
    `frame-ancestors 'none'`,
    `form-action 'self'`,
    `base-uri 'self'`,
    `object-src 'none'`,
    `worker-src 'self' blob:`,
    `manifest-src 'self'`,
    `script-src-elem 'self' 'nonce-${nonce}' https://cdn.jsdelivr.net https://unpkg.com`,
    `script-src-attr 'none'`,
    `style-src-elem 'self' 'nonce-${nonce}' https://fonts.googleapis.com`,
    `style-src-attr 'unsafe-inline'`,
    `upgrade-insecure-requests`,
    `block-all-mixed-content`,
  ];
  return policies.join("; ");
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    // 本地开发允许未优化图片，避免 400 错误
    unoptimized: process.env.NODE_ENV !== "production",
  },
  outputFileTracingRoot: __dirname,
  poweredByHeader: false, // 隐藏 X-Powered-By
  compress: true, // gzip/brotli 压缩
  reactStrictMode: true,
  // 实验性功能
  ...(process.env.SENTRY_DSN && {
    experimental: {
      instrumentationHook: true,
    },
  }),
  // 安全响应头（通过 headers() 异步函数动态生成 nonce）
  async headers() {
    const nonce = generateNonce();
    const csp = buildCSP(nonce);
    
    // 开发环境且非 localhost 时，移除需要安全上下文的头
    const isDevNonLocal = !isProd && process.env.HOSTNAME !== "localhost" && process.env.HOSTNAME !== "127.0.0.1";
    
    return [
      {
        source: "/:path*",
        headers: [
          // CSP
          { key: "Content-Security-Policy", value: csp },
          { key: "Content-Security-Policy-Report-Only", value: csp.replace("upgrade-insecure-requests", "") },
          
          // 基础安全头
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), fullscreen=(self), clipboard-read=(), clipboard-write=()" },
          
          // 需要安全上下文的头：仅生产环境或 localhost 发送
          ...(!isDevNonLocal ? [
            { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
            { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
            { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
          ] : []),
          
          // HSTS（仅生产环境）
          ...(isProd ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" }] : []),
          
          // Cookie 安全（Edge Runtime 无法设置，这里作为参考）
          { key: "Set-Cookie", value: "__Host-session=; Path=/; Secure; HttpOnly; SameSite=Strict" },
        ],
      },
    ];
  },
};

nextConfig.eslint = { ignoreDuringBuilds: true };

// Sentry 配置
const sentryConfig = {
  silent: !process.env.SENTRY_DSN,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  include: [".", "src"],
  ignore: ["node_modules", ".next", "out"],
  widenClientFileUpload: true,
  hideSourceMaps: true,
  automaticVercelMonitors: true,
};

// PWA 配置
const pwaConfig = {
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts",
        expiration: { maxEntries: 4, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts-static",
        expiration: { maxEntries: 4, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|webp|avif|ico)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "images",
        expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "supabase-api",
        networkTimeoutSeconds: 10,
        expiration: { maxEntries: 100, maxAgeSeconds: 24 * 60 * 60 },
      },
    },
  ],
};

// 组合配置：先 PWA 再 Sentry
const combinedConfig = withPWA(pwaConfig)(nextConfig);

export default process.env.SENTRY_DSN
  ? withSentryConfig(combinedConfig, sentryConfig)
  : combinedConfig;