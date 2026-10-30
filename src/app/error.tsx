// src/app/error.tsx
"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { useLang } from "@/lib/lang-context";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { tr } = useLang();

  useEffect(() => {
    // 上报到 Sentry
    Sentry.captureException(error, {
      extra: {
        digest: error.digest,
      },
    });
    console.error("[Error Boundary]", error);
  }, [error]);

  return (
    <main className="max-w-[680px] mx-auto px-4 pt-16 pb-20">
      <div className="bg-card border border-[var(--color-line)] rounded-2xl p-8 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-xl font-extrabold text-[var(--color-ink)] mb-2">
          {tr("errorTitle")}
        </h1>
        <p className="text-[var(--color-muted)] mb-6 max-w-md mx-auto">
          {tr("errorDesc")}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 bg-[var(--color-accent)] text-white font-bold rounded-full px-6 py-3 shadow-[0_6px_18px_rgba(22,163,74,.3)]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M21 12v5a2 2 0 0 1-2 2h-5" />
          </svg>
          <span>{tr("retry")}</span>
        </button>
        {process.env.NODE_ENV === "development" && (
          <details className="mt-6 text-left max-w-md mx-auto">
            <summary className="text-xs text-[var(--color-muted-light)] cursor-pointer mb-2">
              技术详情 (仅开发环境)
            </summary>
            <pre className="bg-[var(--color-bg)] p-4 rounded-lg text-xs overflow-auto text-[var(--color-muted)]">
              {error.message}
              {error.stack && "\n\n" + error.stack}
            </pre>
          </details>
        )}
      </div>
    </main>
  );
}