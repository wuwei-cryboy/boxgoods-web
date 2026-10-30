# 技术债与优化机会清单（t9）

> 基于 `structure-summary.md`（t1）、`module-analysis.md`（t7）、`quality-baseline.md`（t8）
> 生成时间：2026-10-26 · 基准 `21817d5`

---

## 优先级说明

| 级别 | 含义 |
|---|---|
| **P0** | 安全/正确性缺陷，应立即处理 |
| **P1** | 明显影响可用性或可维护性，本迭代内处理 |
| **P2** | 改进项，有时间再做 |
| **P3** | 长期架构建议 |

---

## P0 — 安全与正确性

### P0-1 询盘接口无频率限制

- **位置**：`src/app/api/inquiries/route.ts`
- **问题**：POST 只做 Zod 校验，无任何限流。攻击者可脚本化批量写入
  `inquiries` 表，造成数据库膨胀、真实询盘被淹没
- **证据**：`module-analysis.md` §4 明确标注「无频率限制，可能被刷接口」
- **建议**：加 IP/用户维度限流（Upstash Ratelimit 或 Supabase RPC 计数），
  建议阈值 5 次/分钟
- **成本**：0.5 天

### P0-2 收藏 API 的 `req` 参数未使用，鉴权路径需复核

- **位置**：`src/app/api/favorites/route.ts:51`
- **问题**：lint 报 `'req' is defined but never used`，说明该 handler 未读取请求上下文。
  结合 `module-analysis.md` §5「全程 Server Client + 用户校验」的说法，
  需确认是否每个分支都真正做了用户校验，而非依赖 RLS 兜底
- **建议**：逐个 handler 添加显式 `getUser()` 校验与未登录 401 返回
- **成本**：0.5 天

### P0-3 上传无完成回调校验

- **位置**：`src/lib/storage.ts` + `api/upload/presign`
- **问题**：预签名 URL 生成后，服务端不知道文件是否真的上传、内容是否合法。
  `conditions` 仅在签名时生效，实际约束依赖桶策略
- **建议**：加 S3 事件通知或上传后 HEAD 校验（大小/类型/魔数），
  并记录到 `uploads` 表供审计
- **成本**：1.5 天

---

## P1 — 可用性与可维护性

### P1-1 零测试覆盖

- **问题**：无测试框架，无 `test` 脚本。核心逻辑（catalog 查询、i18n 回退、
  Zod 校验、预签名约束）全部裸奔
- **建议**：引入 Vitest，优先覆盖 4 处：
  1. `lib/catalog.ts` 的 `t()` 回退链（zh→fr→key）
  2. `api/inquiries` 的 Zod schema 边界
  3. `api/upload/presign` 的大小/类型拒绝逻辑
  4. `lib/storage.ts` 的 `generateObjectKey` 格式
- **成本**：2 天

### P1-2 实时订阅缺重连/退避

- **位置**：`src/hooks/useRealtimeSubscription.ts`
- **问题**：网络断开后 channel 不会自动重连，需用户刷新页面。
  虽然已修复 `getUser()` 未 await 的致命问题，但断线恢复仍未处理
- **建议**：监听 `CHANNEL_ERROR` / `TIMED_OUT`，用指数退避重订阅（1s→2s→4s，上限 30s）
- **成本**：1 天

### P1-3 Supabase 调用缺错误边界与重试

- **位置**：`lib/supabase/*` 及所有 API route
- **问题**：网络抖动直接冒泡为 500
- **建议**：封装统一的 `withSupabase()` 包装器，做 2 次指数退避重试 +
  友好错误码；RSC 层用 `error.tsx` 兜底
- **成本**：1 天

### P1-4 ESLint 工具链已修，但 `lint` 脚本仍指向废弃命令

- **位置**：`package.json` scripts
- **问题**：`"lint": "next lint"` 在 Next 16 将移除，且当前已与 ESLint 9 冲突
  （已在本次修复 `eslint.config.mjs`，但脚本本身还没改）
- **建议**：改为 `"lint": "eslint src"`，并给 CI 加 `typecheck + lint + build` 三步
- **成本**：0.5 天

### P1-5 `lib/catalog.ts` 注释乱码

- **位置**：`src/lib/catalog.ts:15`
- **问题**：`// 鏈湴鏁版嵁灞傦紙浠ュ悗鎺?MongoDB 鍙敼杩欓噷锛屾帴鍙ｄ笉鍙橈級`
  是 GBK 被按 UTF-8 解码的典型乱码
- **建议**：修正为「本地数据层（以后接 MongoDB 只改这里，接口不变）」。
  同类乱码可能存在于其他文件的历史注释，建议全局搜 `鍙` / `锛` 排查
- **成本**：0.2 天

---

## P2 — 改进项

### P2-1 数据层缺分页/筛选/排序

- `getProducts()` 返回全量数组，前端自己 filter。当前 29 个产品无压力，
  接入 MongoDB 后必须补 `.limit().skip()` 与索引设计
- **成本**：随数据迁移一起做

### P2-2 i18n 结构待扩展

- 仅 fr/zh 两种语言，键值集中在单个 `i18n.json`（6KB）
- 无 `Accept-Language` / GeoIP 自动检测，法语用户和新用户都看到同一默认
- **建议**：语言 >3 时拆分文件 + 引入 ICU MessageFormat 处理复数/性别
- **成本**：1 天（语言数增加时）

### P2-3 无上传后通知

- 询盘仅入库，无邮件/IM 通知。B2B 场景下响应速度直接影响成单
- **建议**：Supabase Database Webhook → Resend/邮件 + 企业微信机器人
- **成本**：1 天

### P2-4 组件耦合数据获取

- `ProductView` 等组件直接 `import { getProduct } from "@/lib/catalog"`
- **建议**：改为 props 注入或 RSC 层统一取数，便于测试与替换数据源
- **成本**：2 天（涉及范围大）

### P2-5 20 条 lint warning 待清理

主要是未使用变量（`loading` / `tr` / `getTranslation` / `CategoryIcon` /
`channelRef` / `keyField` / `conditions` 等）与 9 处显式 `any`
- **建议**：`eslint --fix` 无法自动处理的大部分是「删除未用代码」，
  需人工确认后清理
- **成本**：0.5 天

---

## P3 — 长期架构

### P3-1 从本地 JSON 迁移到 MongoDB

- `catalog.ts` 的抽象边界已经预留好，接口不变即可换实现
- **前置条件**：先补分页/筛选能力（P2-1），否则换库后性能反而下降
- **成本**：3–5 天

### P3-2 视觉回归测试

- 无 Storybook，无 Playwright 快照
- **建议**：至少给 5 个核心页面加 Playwright 冒烟测试（首页/分类/详情/搜索/询盘）
- **成本**：2 天

### P3-3 Sentry 已接入但未配置 Performance / Replay

- 目前只有错误上报，无慢请求追踪与用户行为回放
- **成本**：0.5 天

---

## 汇总与建议顺序

| 阶段 | 内容 | 工期 |
|---|---|---|
| **第一优先** | P0-1 限流、P0-2 鉴权复核、P1-5 乱码 | 1.5 天 |
| **第二优先** | P1-1 测试框架 + 4 处核心用例 | 2 天 |
| **第三优先** | P1-2 重连、P1-3 错误边界、P1-4 CI | 2.5 天 |
| **第四优先** | P0-3 上传校验、P2-3 通知 | 2.5 天 |
| **技术债清理** | P2-5 清理 warning | 0.5 天 |
| **架构升级** | P3-1 MongoDB 迁移（含 P2-1） | 3–5 天 |

> **关键判断**：项目当前**可构建、可运行、类型安全**，基础健康度良好。
> 最大风险不是代码质量，而是 **P0-1 限流缺失** 与 **P1-1 零测试** ——
> 前者是线上可被攻击的入口，后者让任何改动都没有回归保护。
> 建议在功能迭代前先把这两项补上。
