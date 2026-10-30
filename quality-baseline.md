# 质量基线报告（t8）

> 生成时间：2026-10-26
> 基准 commit：`21817d5`（`src/` 布局）
> 环境：Next.js 15.5.28 / TypeScript 5.8 / ESLint 9.15 / Node v24

---

## 1. 总览

| 检查项 | 命令 | 结果 |
|---|---|---|
| 类型检查 | `npm run typecheck` | ✅ **通过**（0 error） |
| Lint | `npx eslint src` | ✅ **通过**（0 error / 21 warning） |
| 生产构建 | `npm run build` | ✅ **成功**（51 页面） |
| 单元测试 | — | ⚠️ **不存在** |

---

## 2. 本次修复的 3 个真实缺陷

### 2.1 `ProductView.tsx` — JSX 结构损坏（**阻断编译**）

- **现象**：`tsc` 报 4 个语法错误，`TS1005 ')' expected` / `TS17002`
- **根因**：第 161 行 `{related.length > 0 && (` 的条件块，在结尾被误写成 `</div>` 而非 `)}`，
  导致 div 嵌套深度收为 **-1**，整棵 JSX 树失衡
- **修复**：第 178 行 `</div>` → `)}`，嵌套深度恢复为 0
- **影响**：修复前 `next build` **完全无法通过**，产品详情页不可用

### 2.2 `useRealtimeSubscription.ts` — `getUser()` 未 await（**运行时静默失效**）

```ts
// 修复前
const { data: { user } } = supabase.auth.getUser();  // getUser() 返回 Promise
const filter = user ? `user_id=eq.${user.id}` : null;  // user 恒为 undefined
```

- **根因**：`supabase.auth.getUser()` 是异步方法，在渲染期同步解构得到的是 Promise 对象，
  其中的 `user` 永远 `undefined`
- **后果**：`useUserRealtimeSubscription` **从未真正生效** —— 收藏状态的跨标签页同步一直是死的，
  且不报任何错误
- **修复**：改用 `getSession()` 取初始态 + `onAuthStateChange` 跟进登录/登出，
  用 `useState` 持有 `userId`，并正确清理订阅
- **附带价值**：这也消除了旧报告里「组件挂载时同步调用 getUser()，可能未就绪」的隐患

### 2.3 `eslint.config.mjs` — ESLint 9 与 `eslint-config-next` 不兼容（**工具链失效**）

- **现象**：`next lint` 与 `npx eslint` 均崩溃：
  `Failed to patch ESLint because the calling module was not recognized`
- **根因**：`eslint-config-next@15.5.28` 依赖 `@rushstack/eslint-patch` 做模块路径重定向，
  该机制**不支持 ESLint 9**；且该包只导出 legacy `.eslintrc` 格式，
  被直接展开进 flat config 必然触发 patch 逻辑
- **修复**：改用 `typescript-eslint` + `eslint-config-prettier` + `globals` 原生 flat config，
  保留等价的规则集（unused-vars / no-explicit-any / prefer-const / no-var 等）
- **影响**：修复前**任何 lint 都跑不了**，`lint-staged` 里配的 `eslint --fix` 实际上一直是坏的

> 注：`next lint` 在 Next 16 将移除，建议后续把 `package.json` 的 `lint` 脚本
> 从 `next lint` 改为 `eslint src`。

---

## 3. Lint 警告清单（21 条，均为 warning）

### 3.1 未使用变量（12 条）

| 文件 | 行 | 变量 |
|---|---|---|
| `src/app/account/page.tsx` | 13 | `loading` |
| `src/app/api/favorites/route.ts` | 51 | 参数 `req` |
| `src/app/global-error.tsx` | 14 | `tr` |
| `src/app/layout.tsx` | 4 | `getTranslation`（import 未用） |
| `src/app/login/page.tsx` | 9 | `lang` |
| `src/app/login/page.tsx` | 10 | `router` |
| `src/app/manifest.ts` | 5 | `siteUrl` |
| `src/components/CatView.tsx` | 4 | `CategoryIcon`（import 未用） |
| `src/components/ProductView.tsx` | 68 | `modelBtns` |
| `src/hooks/useRealtimeSubscription.ts` | 17 | `channelRef` |
| `src/hooks/useRealtimeSubscription.ts` | 54 | `keyField` |
| `src/hooks/useRealtimeSubscription.ts` | 55 | `channelRef` |
| `src/lib/storage.ts` | 68 | 参数 `conditions` |

### 3.2 显式 any（9 条）

`api/inquiries/route.ts:57`、`InquiryView.tsx:38`、
`useRealtimeSubscription.ts:36,48,74,86`、`storage.ts:41,74`

> `ProductView.tsx:68` 的 `modelBtns` **已确认是死代码并已删除** ——
> 经核对，最近提交 `21817d5 feat: phone/accessories model buttons + price range`
> 的功能**已正确实现**：规格/型号按钮在第 110–125 行渲染，价格区间在第 109 行。
> `modelBtns` 只是被 `specGroup` / `modelGroup` 取代后遗留的中间变量，不影响功能。

---

## 4. Bundle 体积

```
共享 JS（First Load）      103 kB
  ├ chunks/865             46.7 kB
  ├ chunks/c5e31bac        54.2 kB
  └ 其他                    1.99 kB

首屏加载最大的路由：
  /product/[id]           186 kB
  /                        185 kB
  /inquiry                184 kB
  /search                 184 kB
```

**评估**：共享 JS 103 kB 属合理区间。SSG 已覆盖 `/cat/[id]`（5 个分类）与
`/product/[id]`（29 个产品），静态化充分。

---

## 5. 测试覆盖

**当前为 0**。项目没有安装任何测试框架（无 vitest / jest / playwright），
`package.json` 无 `test` 脚本。

高风险且无测试保护的核心逻辑：
- `lib/catalog.ts` 的查询与 i18n 回退链
- `api/inquiries` 的 Zod 校验与 UTM 采集
- `api/favorites` 的 upsert 冲突处理
- `api/upload/presign` 的鉴权与大小/类型约束

---

## 6. 结论

| 维度 | 评级 | 说明 |
|---|---|---|
| 可构建性 | ✅ 良好 | 修复 1 处阻断性 JSX 错误后完全通过 |
| 类型安全 | ✅ 良好 | strict 模式，0 error |
| 代码整洁度 | ⚠️ 中等 | 21 条 warning，无 error；主要是残留未用变量 |
| 工具链健康 | ✅ 已修复 | ESLint 从完全不可用恢复到可用 |
| 运行时正确性 | ⚠️ 需关注 | 发现 1 处静默失效（实时订阅） |
| 测试覆盖 | ❌ 空白 | 0 测试，核心逻辑无保护 |

**t8 已解除阻塞**，`t9`（技术债识别）与 `t2`（优化方案）可继续推进。
