// lib/i18n/config.ts
// 语言配置中心：单一来源，便于扩展新语言

export type Lang = "fr" | "zh";

export const SUPPORTED_LANGS: readonly Lang[] = ["fr", "zh"] as const;
export const DEFAULT_LANG: Lang = "fr";

export const LANG_COOKIE_NAME = "locale";
export const LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/** 语言原生名称（用于语言切换器显示） */
export const LANG_NATIVE_NAMES: Record<Lang, string> = {
  fr: "Français",
  zh: "中文",
};

/** 语言显示名称（当前 UI 语言下的显示） */
export const LANG_DISPLAY_NAMES: Record<Lang, Record<Lang, string>> = {
  fr: { fr: "Français", zh: "Chinois" },
  zh: { fr: "法语", zh: "中文" },
};

/** 区域设置映射（用于 Intl、OpenGraph 等） */
export const LOCALE_MAP: Record<Lang, string> = {
  fr: "fr-FR",
  zh: "zh-CN",
};

/**
 * 从 Accept-Language 头解析首选语言
 * 例：Accept-Language: zh-CN,zh;q=0.9,fr;q=0.8,en;q=0.7
 */
export function parseAcceptLanguage(header: string | null): Lang | null {
  if (!header) return null;

  // 按 q-value 排序，取最高优先级匹配的受支持语言
  const entries = header
    .split(",")
    .map(part => {
      const [lang, qPart] = part.trim().split(";");
      const q = qPart ? parseFloat(qPart.replace("q=", "")) : 1;
      return { lang: lang.trim().toLowerCase(), q };
    })
    .sort((a, b) => b.q - a.q);

  for (const { lang } of entries) {
    // 精确匹配或前缀匹配（如 zh-CN -> zh）
    const matched = SUPPORTED_LANGS.find(supported => 
      lang === supported || lang.startsWith(supported + "-")
    );
    if (matched) return matched;
  }

  return null;
}

/**
 * 规范化语言代码（去除区域后缀，仅保留基础语言）
 */
export function normalizeLang(code: string): Lang | null {
  const base = code.toLowerCase().split("-")[0] as Lang;
  return SUPPORTED_LANGS.includes(base) ? base : null;
}

/**
 * 验证语言是否受支持
 */
export function isSupportedLang(lang: string): lang is Lang {
  return SUPPORTED_LANGS.includes(lang as Lang);
}