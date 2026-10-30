# 核心业务模块分析

## 1. 数据访问层 — `lib/catalog.ts`
**职责**：本地 JSON 数据层，提供类型安全的产品/分类/供应商/变体访问接口
- **类型定义完整**：Category, Supplier, Variant, Product 均有严格 TS 类型
- **数据源**：`catalog.json` (产品/分类/供应商) + `i18n.json` (翻译键值)
- **查询函数**：getCategories, getSuppliers, getProducts, getProductsByCat, getProduct, getSupplier
- **i18n**：`t(lang, key)` 回退机制 (zh → fr → key)
- **扩展性**：注释标明「以后接 MongoDB 只改这里，接口不变」——良好的抽象边界

**观察**：
- ✅ 类型安全、接口稳定、易于替换数据源
- ⚠️ 无缓存层，每次调用均读取内存对象（数据量小暂无问题）
- ⚠️ 无分页/筛选/排序能力，未来接数据库需补齐

---

## 2. Supabase 集成 — 认证/数据库/实时
### 2.1 客户端 — `lib/supabase/client.ts`
- `createBrowserClient` (SSR 兼容)
- 仅导出匿名密钥，适合浏览器端只读/用户级操作

### 2.2 服务端 — `lib/supabase/server.ts`
- `createSupabaseServerClient()` — RSC/Route Handler 用，Cookie 同步会话
- `createSupabaseAdminClient()` — Service Role 绕过 RLS，用于后台写入 (inquiries POST)

**观察**：
- ✅ 标准 @supabase/ssr 模式，Cookie 处理正确（set 捕获异常）
- ✅ Admin 客户端隔离，仅在需要绕过 RLS 时使用
- ⚠️ 无显式错误边界/重试逻辑，网络抖动可能导致 500

---

## 3. 对象存储 — `lib/storage.ts`
**职责**：S3 兼容存储封装（Supabase Storage / Cloudflare R2 双模式）
- **单例 S3Client**：按 `STORAGE_PROVIDER` 切换 endpoint/凭证
- **核心能力**：
  - `uploadFile` — 服务端直传
  - `getPresignedDownloadUrl` — 私有文件下载（默认 1h）
  - `getPresignedUploadUrl` — **前端直传**，含 `content-length-range` + `starts-with $Content-Type` 条件限制
  - `deleteFile`
  - `generateObjectKey` — `prefix/yyyy/mm/dd/random.ext` 防单目录过多
- **安全**：预签名 URL 仅 1 小时有效，强制 `image/*` 类型，限制大小

**观察**：
- ✅ 前端直传架构正确，绕过 Next.js Body 限制
- ✅ R2/Supabase 双模式切换干净
- ⚠️ 无上传后回调/校验流程（如恶意文件类型、病毒扫描）
- ⚠️ `conditions` 仅在预签名时生效，实际上传仍依赖存储桶策略

---

## 4. 询盘流程 — `app/api/inquiries/route.ts`
**POST**：
1. Zod 校验入参（含 UTM 字段）
2. Admin Client 写入 `inquiries` 表（关联 user_id 可为 null）
3. 记录 UA/Referer 到 metadata

**GET**：
1. Server Client 校验用户登录
2. 分页查询当前用户询盘（支持 status 筛选）

**观察**：
- ✅ Zod 校验完整，Admin 写入绕过 RLS 正确
- ✅ 元数据记录完整（UTM + UA + Referer）
- ⚠️ 无频率限制，可能被刷接口
- ⚠️ 无邮件/通知触发（仅入库）

---

## 5. 收藏功能 — `app/api/favorites/route.ts`
- **POST** upsert（onConflict user_id+product_id）
- **DELETE** 单条移除
- **GET** 列表（仅 product_id + created_at）
- 全程 Server Client + 用户校验

**观察**：
- ✅ 简洁正确，RLS 保护用户隔离
- ⚠️ 返回字段极简，前端需再次查询产品详情

---

## 6. 预签名上传 — `app/api/upload/presign/route.ts`
- 校验：filename, contentType (image/*), bucket (enum), maxSize (≤10MB)
- 鉴权：必须登录
- 生成 key：`users/{userId}/yyyy/mm/dd/random.ext`
- 返回：{ url, key, bucket }，前端直传 S3/R2

**观察**：
- ✅ 安全：鉴权 + 类型限制 + 大小限制 + 条件策略
- ✅ Key 设计防冲突、按用户隔离
- ⚠️ 无上传完成后的回调/确认机制

---

## 7. 认证回调 — `app/auth/callback/route.ts`
- 标准 PKCE 流程：code → exchangeCodeForSession → 重定向
- 失败回 `/login?error=auth_failed`

**观察**：
- ✅ 标准实现
- ⚠️ 无登录后自动跳转原页面逻辑（redirect 参数已支持但前端未必传递）

---

## 8. 实时订阅 — `hooks/useRealtimeSubscription.ts`
三层封装：
1. `useRealtimeSubscription` — 基础版，要求有 `id` 字段
2. `useRealtimeSubscriptionFlexible` — 可指定 `keyField`
3. `useUserRealtimeSubscription` — 自动按 `user_id` 过滤

**观察**：
- ✅ 正确清理 channel（useEffect return）
- ✅ callbackRef 避免闭包陈旧
- ⚠️ 无重连/指数退避策略，网络断开后需手动恢复
- ⚠️ `useUserRealtimeSubscription` 在组件挂载时同步调用 `getUser()`，可能未就绪

---

## 9. 国际化 — `lib/lang.ts` + `lib/lang-context.tsx`
- **语言**：fr (默认) / zh
- **存储**：Cookie `locale` (1 年，Lax)
- **服务端**：`getLocale()` / `getTranslation()` 读 Cookie
- **客户端**：`LangProvider` + `useLang()`，mounted 前渲染默认值避免 hydration mismatch

**观察**：
- ✅ SSR 友好，Cookie 同步机制正确
- ✅ 仅两语言，实现极简
- ⚠️ 无语言检测（Accept-Language / GeoIP）
- ⚠️ 翻译键值维护在单 JSON，规模扩大需拆分/工具化

---

## 10. UI 组件架构
| 组件 | 职责 |
|------|------|
| `HomeView` | 首页聚合展示 |
| `CategoriesView` / `CatView` | 分类列表/详情 |
| `ProductView` | 产品详情 + 变体选择 + 收藏/询盘入口 |
| `SearchView` | 搜索界面 |
| `InquiryForm` / `InquiryView` | 询盘表单/记录 |
| `Header` / `MobileTabBar` | 导航 |
| `UserMenu` / `LangToggle` | 用户/语言 |
| `CategoryIcons` | 图标映射 |

**观察**：
- ✅ 组件拆分合理，页面即组合
- ⚠️ 无 Storybook/视觉回归测试
- ⚠️ 部分组件耦合数据获取逻辑（如 ProductView 直接 import catalog）

---

## 总结：模块健康度评分
| 模块 | 完整性 | 可维护性 | 安全性 | 扩展性 | 备注 |
|------|--------|----------|--------|--------|------|
| 数据层 | ★★★★☆ | ★★★★★ | ★★★★☆ | ★★★★★ | 接口抽象优秀 |
| Supabase | ★★★★☆ | ★★★★☆ | ★★★★☆ | ★★★★☆ | 标准模式，缺重试 |
| 存储/S3 | ★★★★★ | ★★★★☆ | ★★★★★ | ★★★★☆ | 前端直传最佳实践 |
| 询盘 | ★★★★☆ | ★★★★☆ | ★★★☆☆ | ★★★★☆ | 缺限流/通知 |
| 收藏 | ★★★★★ | ★★★★★ | ★★★★☆ | ★★★★☆ | 简洁完整 |
| 上传预签名 | ★★★★★ | ★★★★☆ | ★★★★★ | ★★★★☆ | 条件策略完善 |
| 认证 | ★★★★☆ | ★★★★☆ | ★★★★☆ | ★★★★☆ | 标准流程 |
| 实时订阅 | ★★★★☆ | ★★★★☆ | ★★★★☆ | ★★★★☆ | 缺重连 |
| i18n | ★★★★☆ | ★★★★☆ | ★★★★☆ | ★★★☆☆ | 仅两语言，键值集中 |
| UI组件 | ★★★★☆ | ★★★★☆ | ★★★★☆ | ★★★★☆ | 无视觉测试 |