// lib/monitoring.ts
// 统一监控指标上报：Web Vitals + 业务指标 + 自定义事件
// 设计：发送失败不阻塞、批量上报、支持 Sentry / 自建端点 / Console

import * as Sentry from "@sentry/nextjs";

export type MetricType = 
  | "web_vital"      // CLS, FID, LCP, FCP, TTFB
  | "custom"         // 业务自定义指标
  | "error"          // 错误率/异常
  | "performance";   // API 耗时、资源加载

export interface MetricPayload {
  type: MetricType;
  name: string;           // 指标名称，如 "LCP", "inquiry_submit_latency"
  value: number;          // 数值（毫秒、字节、计数等）
  unit: "ms" | "bytes" | "count" | "ratio" | "score";
  tags?: Record<string, string>;  // 维度：page, route, user_type, etc.
  timestamp?: number;     // 默认 Date.now()
  sessionId?: string;     // 关联会话
}

export interface AlertRule {
  metric: string;         // 监控指标名
  condition: "gt" | "lt" | "eq" | "gte" | "lte";
  threshold: number;      // 阈值
  window: "1m" | "5m" | "15m" | "1h";  // 统计窗口
  severity: "info" | "warning" | "critical";
  channels: ("sentry" | "webhook" | "email" | "slack")[];
  message: string;        // 告警文案模板
}

// 内置告警规则（可通过环境变量/数据库动态覆盖）
export const DEFAULT_ALERT_RULES: AlertRule[] = [
  // Web Vitals
  { metric: "LCP", condition: "gt", threshold: 4000, window: "5m", severity: "warning", channels: ["sentry"], message: "LCP 超过 4s (p75)" },
  { metric: "CLS", condition: "gt", threshold: 0.25, window: "5m", severity: "warning", channels: ["sentry"], message: "CLS 超过 0.25" },
  { metric: "FID", condition: "gt", threshold: 300, window: "5m", severity: "warning", channels: ["sentry"], message: "FID 超过 300ms" },
  { metric: "TTFB", condition: "gt", threshold: 800, window: "5m", severity: "info", channels: ["sentry"], message: "TTFB 超过 800ms" },
  
  // 业务指标
  { metric: "inquiry_submit_latency", condition: "gt", threshold: 3000, window: "5m", severity: "warning", channels: ["sentry", "webhook"], message: "询盘提交延迟超过 3s" },
  { metric: "inquiry_submit_error_rate", condition: "gt", threshold: 0.05, window: "5m", severity: "critical", channels: ["sentry", "webhook", "slack"], message: "询盘提交错误率超过 5%" },
  { metric: "search_latency_p95", condition: "gt", threshold: 1000, window: "5m", severity: "warning", channels: ["sentry"], message: "搜索 P95 延迟超过 1s" },
  { metric: "api_error_rate_5xx", condition: "gt", threshold: 0.02, window: "5m", severity: "critical", channels: ["sentry", "webhook", "slack"], message: "API 5xx 错误率超过 2%" },
  
  // 资源/性能
  { metric: "js_bundle_size", condition: "gt", threshold: 500 * 1024, window: "1h", severity: "info", channels: ["sentry"], message: "JS Bundle 超过 500KB" },
];

// 批量缓冲区
const buffer: MetricPayload[] = [];
const BUFFER_MAX = 50;
const FLUSH_INTERVAL = 10_000; // 10s
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function getEndpoint(): string | null {
  return process.env.MONITORING_ENDPOINT ?? null;
}

function getSessionId(): string {
  if (typeof window !== "undefined") {
    let sid = sessionStorage.getItem("monitoring_session_id");
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem("monitoring_session_id", sid);
    }
    return sid;
  }
  return "ssr";
}

/** 记录指标（自动批量上报） */
export function recordMetric(metric: Omit<MetricPayload, "timestamp" | "sessionId">): void {
  const payload: MetricPayload = {
    ...metric,
    timestamp: Date.now(),
    sessionId: getSessionId(),
  };
  
  buffer.push(payload);
  
  // 立即刷新关键指标
  if (metric.type === "error" || (metric.type === "web_vital" && metric.value > 5000)) {
    flush();
  } else if (buffer.length >= BUFFER_MAX) {
    flush();
  } else if (!flushTimer) {
    flushTimer = setTimeout(flush, FLUSH_INTERVAL);
  }
}

/** 刷新缓冲区 */
async function flush(): Promise<void> {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (buffer.length === 0) return;
  
  const toSend = buffer.splice(0, buffer.length);
  
  // 1. Sentry 自动捕获（已在 Sentry.init 中配置）
  // 这里仅做自定义指标的简单记录，不依赖 metrics API
  
  // 2. 自建端点（可选）
  const endpoint = getEndpoint();
  if (endpoint) {
    try {
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metrics: toSend }),
        keepalive: true,
      });
    } catch {
      // 静默失败，避免影响主流程
    }
  }
  
  // 3. 本地开发环境打印
  if (process.env.NODE_ENV === "development") {
    console.log("[Monitoring] Flushed:", toSend.length, "metrics");
  }
}

/** Web Vitals 采集（仅客户端） */
export function initWebVitals(): void {
  if (typeof window === "undefined") return;
  
  // 动态导入避免 SSR 打包
  import("web-vitals").then(({ onCLS, onFID, onLCP, onFCP, onTTFB }) => {
    onCLS((metric) => recordMetric({
      type: "web_vital",
      name: "CLS",
      value: metric.value,
      unit: "score",
      tags: { page: window.location.pathname, id: metric.id },
    }));
    
    onFID((metric) => recordMetric({
      type: "web_vital",
      name: "FID",
      value: metric.value,
      unit: "ms",
      tags: { page: window.location.pathname, id: metric.id },
    }));
    
    onLCP((metric) => recordMetric({
      type: "web_vital",
      name: "LCP",
      value: metric.value,
      unit: "ms",
      tags: { page: window.location.pathname, id: metric.id },
    }));
    
    onFCP((metric) => recordMetric({
      type: "web_vital",
      name: "FCP",
      value: metric.value,
      unit: "ms",
      tags: { page: window.location.pathname, id: metric.id },
    }));
    
    onTTFB((metric) => recordMetric({
      type: "web_vital",
      name: "TTFB",
      value: metric.value,
      unit: "ms",
      tags: { page: window.location.pathname, id: metric.id },
    }));
  }).catch(() => {
    // web-vitals 未安装时静默
  });
}

/** 记录 API 请求延迟 */
export function recordApiLatency(endpoint: string, method: string, durationMs: number, status: number): void {
  recordMetric({
    type: "performance",
    name: "api_latency",
    value: durationMs,
    unit: "ms",
    tags: { endpoint, method, status: String(status), statusClass: `${Math.floor(status / 100)}xx` },
  });
  
  if (status >= 500) {
    recordMetric({
      type: "error",
      name: "api_error_5xx",
      value: 1,
      unit: "count",
      tags: { endpoint, method, status: String(status) },
    });
  } else if (status >= 400) {
    recordMetric({
      type: "error",
      name: "api_error_4xx",
      value: 1,
      unit: "count",
      tags: { endpoint, method, status: String(status) },
    });
  }
}

/** 记录业务事件 */
export function recordBusinessEvent(name: string, value: number, unit: MetricPayload["unit"], tags?: Record<string, string>): void {
  recordMetric({
    type: "custom",
    name,
    value,
    unit,
    tags,
  });
}

/** 页面加载性能（Navigation Timing API） */
export function recordNavigationTiming(): void {
  if (typeof window === "undefined") return;
  
  const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
  if (!nav) return;
  
  recordMetric({
    type: "performance",
    name: "page_load",
    value: nav.loadEventEnd - nav.fetchStart,
    unit: "ms",
    tags: { page: window.location.pathname },
  });
  
  recordMetric({
    type: "performance",
    name: "dom_content_loaded",
    value: nav.domContentLoadedEventEnd - nav.fetchStart,
    unit: "ms",
    tags: { page: window.location.pathname },
  });
  
  recordMetric({
    type: "performance",
    name: "ttfb",
    value: nav.responseStart - nav.requestStart,
    unit: "ms",
    tags: { page: window.location.pathname },
  });
}

/** 资源加载性能 */
export function recordResourceTiming(): void {
  if (typeof window === "undefined") return;
  
  const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
  const jsResources = resources.filter(r => r.name.endsWith(".js") && r.transferSize);
  const cssResources = resources.filter(r => r.name.endsWith(".css") && r.transferSize);
  
  const totalJsSize = jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
  const totalCssSize = cssResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
  
  recordMetric({
    type: "custom",
    name: "js_bundle_size",
    value: totalJsSize,
    unit: "bytes",
  });
  
  recordMetric({
    type: "custom",
    name: "css_bundle_size",
    value: totalCssSize,
    unit: "bytes",
  });
}

/** 初始化监控（客户端入口调用） */
export function initMonitoring(): void {
  if (typeof window === "undefined") return;
  
  initWebVitals();
  recordNavigationTiming();
  
  // 页面卸载前刷新
  window.addEventListener("beforeunload", () => {
    flush();
  }, { once: true });
  
  // 定期刷新资源指标
  setInterval(recordResourceTiming, 60_000);
}

/** 手动触发告警检查（供外部调度器/定时任务调用） */
export async function checkAlerts(metrics: Map<string, number[]>): Promise<AlertRule[]> {
  const triggered: AlertRule[] = [];
  
  for (const rule of DEFAULT_ALERT_RULES) {
    const values = metrics.get(rule.metric) ?? [];
    if (values.length === 0) continue;
    
    // 简单统计：取最近窗口内的平均值（实际应按时间窗口聚合）
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    
    let fired = false;
    switch (rule.condition) {
      case "gt": fired = avg > rule.threshold; break;
      case "gte": fired = avg >= rule.threshold; break;
      case "lt": fired = avg < rule.threshold; break;
      case "lte": fired = avg <= rule.threshold; break;
      case "eq": fired = avg === rule.threshold; break;
    }
    
    if (fired) {
      triggered.push({ ...rule, message: rule.message.replace("{value}", avg.toFixed(2)) });
    }
  }
  
  return triggered;
}