/**
 * 埋点事件工具
 * 开发环境输出控制台；生产环境可接 GA4 / 自建后端上报
 */

type AnalyticsEvent =
  | { type: "page_view"; path: string; title: string }
  | { type: "click"; element: string; location: string }
  | { type: "search"; query: string; results: number; lang: string }
  | { type: "inquiry_submit"; product_id?: string; category_id?: string; qty?: number }
  | { type: "cart_add"; product_id: string; qty: number }
  | { type: "cart_remove"; product_id: string }
  | { type: "cart_qty_change"; product_id: string; qty: number }
  | { type: "fav_toggle"; product_id: string; action: "add" | "remove" }
  | { type: "lang_switch"; from: string; to: string }
  | { type: "colorblind_switch"; mode: string }
  | { type: "pwa_install_prompt"; accepted: boolean }
  | { type: "error"; message: string; path: string };

const isDev = process.env.NODE_ENV === "development";

/** 发送事件（开发环境 console，生产环境可接上报） */
export function track(event: AnalyticsEvent) {
  const payload = {
    ...event,
    ts: Date.now(),
    env: process.env.NODE_ENV,
    path: typeof window !== "undefined" ? window.location.pathname : "",
  };

  if (isDev) {
    console.group(`📊 Analytics: ${event.type}`);
    console.log(JSON.stringify(payload, null, 2));
    console.groupEnd();
    return;
  }

  // 生产环境占位：接 GA4 gtag 或自建 /api/analytics
  // void fetch("/api/analytics", { method: "POST", body: JSON.stringify(payload) });
}

/** 页面浏览埋点 */
export function trackPageView(path: string, title: string) {
  track({ type: "page_view", path, title });
}

/** 点击埋点 */
export function trackClick(element: string, location: string) {
  track({ type: "click", element, location });
}

/** 搜索埋点 */
export function trackSearch(query: string, results: number, lang: string) {
  track({ type: "search", query, results, lang });
}

/** 询盘提交埋点 */
export function trackInquirySubmit(data: {
  product_id?: string;
  category_id?: string;
  qty?: number;
}) {
  track({ type: "inquiry_submit", ...data });
}

/** 购物车加入埋点 */
export function trackCartAdd(productId: string, qty: number) {
  track({ type: "cart_add", product_id: productId, qty });
}

/** 购物车移除埋点 */
export function trackCartRemove(productId: string) {
  track({ type: "cart_remove", product_id: productId });
}

/** 购物车数量变更埋点 */
export function trackCartQtyChange(productId: string, qty: number) {
  track({ type: "cart_qty_change", product_id: productId, qty });
}

/** 收藏切换埋点 */
export function trackFavToggle(productId: string, action: "add" | "remove") {
  track({ type: "fav_toggle", product_id: productId, action });
}

/** 语言切换埋点 */
export function trackLangSwitch(from: string, to: string) {
  track({ type: "lang_switch", from, to });
}

/** 色盲模式切换埋点 */
export function trackColorblindSwitch(mode: string) {
  track({ type: "colorblind_switch", mode });
}

/** PWA 安装提示埋点 */
export function trackPwaInstallPrompt(accepted: boolean) {
  track({ type: "pwa_install_prompt", accepted });
}

/** 错误埋点 */
export function trackError(message: string, path: string) {
  track({ type: "error", message, path });
}