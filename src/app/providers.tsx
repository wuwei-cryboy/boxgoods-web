// src/app/providers.tsx
"use client";

// Polyfill for crypto.randomUUID (client-side)
if (typeof window !== "undefined" && typeof crypto.randomUUID !== "function") {
  crypto.randomUUID = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };
}

import { LangProvider } from "@/lib/lang-context";
import { ReactNode, useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import CartButton from "@/components/CartButton";
import CartDrawer from "@/components/CartDrawer";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import A11yAudit from "@/components/A11yAudit";
import AnalyticsProvider from "@/components/AnalyticsProvider";
import { initMonitoring } from "@/lib/monitoring";

export default function Providers({ children }: { children: ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false);
  const monitoringInitedRef = useRef(false);

  // 初始化监控（顶层调用，避免 Hook 规则警告）
  if (!monitoringInitedRef.current && typeof window !== "undefined") {
    initMonitoring();
    monitoringInitedRef.current = true;
  }

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    // 初始化会话
    supabase.auth.getSession();

    // 监听认证状态变化，保持会话同步
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session === null) {
        // 用户登出，可选：重定向到首页
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <LangProvider>
      <AnalyticsProvider>
        {children}
      </AnalyticsProvider>
      <CartButton onClick={() => setCartOpen(true)} />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <PWAInstallPrompt />
      <A11yAudit />
    </LangProvider>
  );
}