"use client";
import { useState, useEffect } from "react";
import { useLang } from "@/lib/lang-context";
import { trackPwaInstallPrompt } from "@/lib/analytics";

export default function PWAInstallPrompt() {
  const { tr } = useLang();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // 延迟显示，避免打断首屏体验
      const timer = setTimeout(() => {
        if (!dismissed && !("standalone" in window.navigator) && !window.matchMedia("(display-mode: standalone)").matches) {
          setShow(true);
        }
      }, 30000); // 30秒后提示
      return () => clearTimeout(timer);
    };

    window.addEventListener("beforeinstallprompt", handler as unknown as EventListener);

    // 检查是否已安装
    const isInstalled = "standalone" in window.navigator || window.matchMedia("(display-mode: standalone)").matches;
    if (isInstalled) setDismissed(true);

    return () => window.removeEventListener("beforeinstallprompt", handler as unknown as EventListener);
  }, [dismissed]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShow(false);
      setDismissed(true);
      trackPwaInstallPrompt(true);
    } else {
      trackPwaInstallPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    trackPwaInstallPrompt(false);
  };

  if (!show || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 md:right-auto md:w-[320px] z-50 animate-slide-up">
      <div className="bg-white border border-[var(--color-line)] rounded-2xl p-4 shadow-[0_12px_40px_rgba(0,0,0,.15)]">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-brand-soft)] grid place-items-center shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M17 10l-5 5-5-5" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm">{tr("pwaInstallTitle") || "安装 BoxGoods"}</h3>
            <p className="text-xs text-[var(--color-muted)] mt-0.5">
              {tr("pwaInstallDesc") || "添加到主屏幕，像原生应用一样快速访问"}
            </p>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={handleDismiss}
              className="w-8 h-8 rounded-full bg-[var(--color-bg)] grid place-items-center text-[var(--color-muted)] active:scale-95"
              aria-label={tr("dismiss") || "关闭"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleInstall}
            className="flex-1 bg-[var(--color-accent)] text-white font-bold rounded-full py-2.5 text-sm shadow-[0_4px_14px_rgba(22,163,74,.3)]"
          >
            {tr("pwaInstallBtn") || "安装"}
          </button>
          <button
            onClick={handleDismiss}
            className="flex-1 border border-[var(--color-line)] text-[var(--color-ink)] font-bold rounded-full py-2.5 text-sm"
          >
            {tr("later") || "稍后"}
          </button>
        </div>
      </div>
    </div>
  );
}

// 类型声明
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}