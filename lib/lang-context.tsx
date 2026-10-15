"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import type { Lang } from "./catalog";
import { t as translate } from "./catalog";

type LangCtx = {
  lang: Lang;
  toggle: () => void;
  /** 取当前语言的 i18n 文案（key 不存在时回退法语） */
  tr: (key: string) => string;
};
const Ctx = createContext<LangCtx>({ lang: "fr", toggle: () => {}, tr: (k) => translate("fr", k) });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("fr");
  const toggle = () => setLang(l => (l === "fr" ? "zh" : "fr"));
  const tr = (key: string) => translate(lang, key);
  return <Ctx.Provider value={{ lang, toggle, tr }}>{children}</Ctx.Provider>;
}
export const useLang = () => useContext(Ctx);