# 项目结构与技术栈速览

## 目录树（核心源码）
```
src/
├── app/                    # Next.js 15 App Router
│   ├── api/
│   │   ├── auth/signout/route.ts
│   │   ├── favorites/route.ts
│   │   ├── inquiries/route.ts
│   │   └── upload/presign/route.ts
│   ├── auth/callback/route.ts
│   ├── login/page.tsx + loading.tsx
│   ├── account/page.tsx
│   ├── categories/page.tsx
│   ├── cat/[id]/page.tsx
│   ├── product/[id]/page.tsx
│   ├── search/page.tsx
│   ├── inquiry/page.tsx
│   ├── layout.tsx          # 根布局 + Metadata + i18n
│   ├── page.tsx            # 首页
│   ├── providers.tsx
│   ├── globals.css
│   ├── robots.ts / manifest.ts / sitemap.ts
│   ├── error.tsx / global-error.tsx
│   └── instrumentation.ts  # Sentry
├── components/
│   ├── InquiryForm.tsx / InquiryView.tsx
│   ├── HomeView.tsx / CatView.tsx / CategoriesView.tsx / SearchView.tsx
│   ├── ProductView.tsx
│   ├── Header.tsx / MobileTabBar.tsx / UserMenu.tsx / LangToggle.tsx
│   └── icons/CategoryIcons.tsx
├── hooks/
│   └── useRealtimeSubscription.ts
├── lib/
│   ├── catalog.ts          # 核心数据层（本地 JSON → 未来接 MongoDB）
│   ├── supabase/client.ts / server.ts
│   ├── storage.ts          # S3 预签名上传
│   ├── utils.ts
│   ├── lang.ts / lang-context.tsx  # i18n (fr/zh)
│   └── data/
│       ├── catalog.json    # 产品/分类/供应商数据
│       └── i18n.json       # 翻译键值
```

## 关键配置文件
- `package.json` - Next.js 15.5.28, React 19.1.0, TypeScript 5.8
- `tsconfig.json` - strict 模式，path alias `@/*`
- `postcss.config.mjs` - Tailwind CSS v4
- `.gitignore`

## 依赖概览
**生产依赖**：
- `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` - S3 上传
- `@sentry/nextjs` - 监控
- `@supabase/ssr`, `@supabase/supabase-js` - 认证/数据库/实时
- `zod` - 验证
- `clsx` - 类名工具

**开发依赖**：
- `eslint`, `typescript-eslint`, `prettier`, `husky`, `lint-staged`
- `@tailwindcss/postcss`, `tailwindcss` v4

## 路由结构
| 路由 | 页面 | 备注 |
|------|------|------|
| `/` | HomeView | 首页展示 |
| `/categories` | CategoriesView | 分类列表 |
| `/cat/[id]` | CatView | 分类详情 + 产品列表 |
| `/product/[id]` | ProductView | 产品详情 |
| `/search` | SearchView | 搜索 |
| `/inquiry` | InquiryForm/InquiryView | 询盘流程 |
| `/login` | 登录页 | Supabase Auth |
| `/account` | 用户中心 | 收藏/询盘历史 |
| `/api/*` | 后端路由 | inquiries, favorites, upload, auth |

## 核心库文件清单
| 文件 | 职责 |
|------|------|
| `lib/catalog.ts` | 数据访问层（类型定义 + 本地 JSON 读取） |
| `lib/supabase/client.ts` | 浏览器端 Supabase 客户端 |
| `lib/supabase/server.ts` | 服务端 Supabase 客户端 (RSC) |
| `lib/storage.ts` | S3 预签名 URL 生成 |
| `lib/lang.ts` | i18n 核心：fr/zh 双语、t() 函数 |
| `lib/lang-context.tsx` | React Context 提供语言状态 |
| `hooks/useRealtimeSubscription.ts` | Supabase Realtime 订阅封装 |

## 技术栈总结
- **框架**：Next.js 15 (App Router, RSC, Turbopack)
- **语言**：TypeScript 5.8 (strict)
- **样式**：Tailwind CSS v4 (PostCSS)
- **数据库/认证/实时**：Supabase (PostgreSQL + Auth + Realtime)
- **对象存储**：AWS S3 (预签名上传)
- **监控**：Sentry
- **国际化**：自研 fr/zh 双语方案
- **代码质量**：ESLint 9 + TypeScript-Eslint + Prettier + Husky