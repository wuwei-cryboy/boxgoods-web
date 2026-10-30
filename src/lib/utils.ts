// lib/utils.ts
/** 相对路径 img/... -> 绝对路径 /img/... */
export const norm = (p?: string): string =>
  p?.startsWith("img/") ? "/" + p : p ?? "";

/** 合并 className，过滤 falsy */
export const cn = (...classes: (string | undefined | null | false)[]): string =>
  classes.filter(Boolean).join(" ");

/** 延迟 ms */
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 生成简单 ID */
export const uid = (prefix = "") =>
  prefix + Math.random().toString(36).slice(2, 10);