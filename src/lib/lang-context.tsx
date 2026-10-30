// lib/lang-context.tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Lang } from "./catalog.client";
import { tSync as translate } from "./catalog.client";

const COOKIE_NAME = "locale";

type LangCtx = {
  lang: Lang;
  toggle: () => void;
  tr: (key: string) => string;
};

const Ctx = createContext<LangCtx>({
  lang: "fr",
  toggle: () => {},
  tr: (k) => translate("fr", k),
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("fr");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 从 cookie 读取初始语言
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${COOKIE_NAME}=`));
    const locale = cookie?.split("=")[1];
    if (locale === "zh" || locale === "fr") {
      setLang(locale);
    }
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = lang === "fr" ? "zh" : "fr";
    setLang(next);
    // 写入 cookie，供服务端读取
    document.cookie = `${COOKIE_NAME}=${next}; path=/; max-age=31536000; SameSite=Lax`;
  };

  const tr = (key: string) => translate(lang, key);

  // 避免 hydration mismatch：mounted 前渲染默认值
  if (!mounted) {
    return (
      <Ctx.Provider value={{ lang: "fr", toggle: () => {}, tr: (k) => translate("fr", k) }}>
        {children}
      </Ctx.Provider>
    );
  }

  return <Ctx.Provider value={{ lang, toggle, tr }}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);