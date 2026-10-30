// lib/notifications.ts
// 统一通知发送抽象：支持 Email、Webhook、IM（飞书/钉钉/企微）等渠道
// 设计原则：发送失败不阻塞主流程、支持模板、可扩展新渠道

import { createSupabaseAdminClient } from "./supabase/server";

export type NotificationChannel = "email" | "webhook" | "feishu" | "dingtalk" | "wework";

export interface NotificationTemplate {
  subject?: string;
  text?: string;
  html?: string;
  /** 渠道特有字段，如飞富卡片 JSON */
  payload?: Record<string, unknown>;
}

export interface NotificationPayload {
  /** 目标渠道 */
  channels: NotificationChannel[];
  /** 模板标识（对应数据库 notifications_templates 表） */
  templateKey: string;
  /** 模板变量替换 */
  variables: Record<string, string | number | boolean>;
  /** 直接覆盖模板（优先级高于 templateKey） */
  override?: Partial<NotificationTemplate>;
  /** 关联业务 ID（用于去重、追踪） */
  refId?: string;
  /** 关联业务类型 */
  refType?: string;
}

/** 通知发送结果 */
export interface NotificationResult {
  channel: NotificationChannel;
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * 渲染模板（简单 {{var}} 替换，后续可接 Handlebars）
 */
function renderTemplate(template: string, variables: Record<string, string | number | boolean>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(variables[key] ?? ""));
}

/**
 * 获取模板（优先从数据库读取，回退内置默认）
 */
async function getTemplate(templateKey: string): Promise<NotificationTemplate | null> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from("notification_templates")
      .select("subject, text, html, payload")
      .eq("key", templateKey)
      .eq("enabled", true)
      .single();
    return data as NotificationTemplate | null;
  } catch {
    return null;
  }
}

/** 内置默认模板 */
const DEFAULT_TEMPLATES: Record<string, NotificationTemplate> = {
  inquiry_created_admin: {
    subject: "🔔 新询盘提醒 - {{inquiryId}}",
    text: `收到新询盘：
客户：{{name}} ({{email}})
公司：{{company}}
电话：{{phone}}
品类：{{category}}
商品：{{product}}
数量：{{qty}}
备注：{{message}}

询盘ID：{{inquiryId}}
时间：{{createdAt}}`,
  },
  inquiry_created_user: {
    subject: "✅ 您的询盘已收到 - {{inquiryId}}",
    text: `你好 {{name}}，

我们已收到您的询盘（编号：{{inquiryId}}），将在 1 个工作日内回复。

询盘详情：
品类：{{category}}
商品：{{product}}
数量：{{qty}}
备注：{{message}}

如有疑问，请回复此邮件或联系客服。

—— BoxGoods Guinee 团队`,
  },
};

/**
 * 发送单渠道通知
 */
async function sendSingleChannel(
  channel: NotificationChannel,
  template: NotificationTemplate,
  payload: NotificationPayload
): Promise<NotificationResult> {
  const rendered = {
    subject: renderTemplate(template.subject ?? "", payload.variables),
    text: renderTemplate(template.text ?? "", payload.variables),
    html: renderTemplate(template.html ?? "", payload.variables),
    payload: template.payload,
  };

  try {
    switch (channel) {
      case "email": {
        // TODO: 接入真实邮件服务
        console.log(`[Notification:email] To: ${payload.variables.toEmail ?? "admin"}`);
        console.log(`[Notification:email] Subject: ${rendered.subject}`);
        console.log(`[Notification:email] Body: ${rendered.text}`);
        return { channel, success: true, messageId: `email_${Date.now()}` };
      }
      case "webhook": {
        const webhookUrl = process.env.NOTIFICATION_WEBHOOK_URL;
        if (!webhookUrl) throw new Error("NOTIFICATION_WEBHOOK_URL not configured");
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...rendered.payload, ...rendered, refId: payload.refId, refType: payload.refType }),
        });
        if (!res.ok) throw new Error(`Webhook ${res.status}`);
        return { channel, success: true, messageId: `webhook_${Date.now()}` };
      }
      case "feishu": {
        const webhookUrl = process.env.FEISHU_WEBHOOK_URL;
        if (!webhookUrl) throw new Error("FEISHU_WEBHOOK_URL not configured");
        const card = rendered.payload as Record<string, unknown> ?? {
          msg_type: "interactive",
          card: {
            header: { title: { tag: "plain_text", content: rendered.subject } },
            elements: [{ tag: "div", text: { tag: "lark_md", content: rendered.text } }],
          },
        };
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(card),
        });
        if (!res.ok) throw new Error(`Feishu ${res.status}`);
        return { channel, success: true, messageId: `feishu_${Date.now()}` };
      }
      case "dingtalk": {
        const webhookUrl = process.env.DINGTALK_WEBHOOK_URL;
        if (!webhookUrl) throw new Error("DINGTALK_WEBHOOK_URL not configured");
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ msgtype: "markdown", markdown: { title: rendered.subject, text: rendered.text } }),
        });
        if (!res.ok) throw new Error(`DingTalk ${res.status}`);
        return { channel, success: true, messageId: `dingtalk_${Date.now()}` };
      }
      case "wework": {
        const webhookUrl = process.env.WEWORK_WEBHOOK_URL;
        if (!webhookUrl) throw new Error("WEWORK_WEBHOOK_URL not configured");
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ msgtype: "markdown", markdown: { content: rendered.text } }),
        });
        if (!res.ok) throw new Error(`WeWork ${res.status}`);
        return { channel, success: true, messageId: `wework_${Date.now()}` };
      }
      default:
        return { channel, success: false, error: `Unknown channel: ${channel}` };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Notification:${channel}] Failed:`, msg);
    return { channel, success: false, error: msg };
  }
}

/**
 * 发送通知（支持多渠道、模板、异步不阻塞）
 * @param payload 通知载荷
 * @returns 发送结果数组
 */
export async function sendNotification(payload: NotificationPayload): Promise<NotificationResult[]> {
  // 1. 获取模板（数据库优先 → 内置默认）
  const dbTemplate = await getTemplate(payload.templateKey);
  const baseTemplate = dbTemplate ?? DEFAULT_TEMPLATES[payload.templateKey];
  if (!baseTemplate) {
    console.error(`[Notification] Template not found: ${payload.templateKey}`);
    return [{ channel: payload.channels[0], success: false, error: "Template not found" }];
  }

  // 2. 合并 override
  const template: NotificationTemplate = {
    ...baseTemplate,
    ...payload.override,
    subject: payload.override?.subject ?? baseTemplate.subject,
    text: payload.override?.text ?? baseTemplate.text,
    html: payload.override?.html ?? baseTemplate.html,
    payload: payload.override?.payload ?? baseTemplate.payload,
  };

  // 3. 并发发送所有渠道
  const results = await Promise.allSettled(
    payload.channels.map(ch => sendSingleChannel(ch, template, payload))
  );

  return results.map((r, i) => 
    r.status === "fulfilled" ? r.value : { channel: payload.channels[i], success: false, error: String(r.reason) }
  );
}

/**
 * 便捷方法：发送询盘创建通知（管理员 + 用户）
 */
export async function notifyInquiryCreated(params: {
  inquiryId: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  category?: string;
  product?: string;
  qty?: number;
  message?: string;
  createdAt: string;
}): Promise<void> {
  const vars = {
    inquiryId: params.inquiryId,
    name: params.name,
    email: params.email,
    company: params.company ?? "—",
    phone: params.phone ?? "—",
    category: params.category ?? "—",
    product: params.product ?? "—",
    qty: String(params.qty ?? "—"),
    message: params.message ?? "—",
    createdAt: params.createdAt,
  };

  // 并发发送：管理员通知 + 用户确认
  await Promise.allSettled([
    // 管理员通知（多渠道）
    sendNotification({
      channels: ["email", "webhook", "feishu"].filter(ch => {
        if (ch === "webhook") return !!process.env.NOTIFICATION_WEBHOOK_URL;
        if (ch === "feishu") return !!process.env.FEISHU_WEBHOOK_URL;
        return true;
      }),
      templateKey: "inquiry_created_admin",
      variables: { ...vars, toEmail: process.env.ADMIN_EMAIL ?? "admin@boxgoods-guinee.com" },
      refId: params.inquiryId,
      refType: "inquiry",
    }),
    // 用户确认邮件
    sendNotification({
      channels: ["email"],
      templateKey: "inquiry_created_user",
      variables: vars,
      refId: params.inquiryId,
      refType: "inquiry",
    }),
  ]);
}