// src/app/global-error.tsx
"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Global Error Boundary]", error);
    // 这里会自动上报到 Sentry（如果配置了）
  }, [error]);

  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>BoxGoods Guinee — Erreur</title>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Inter, -apple-system, sans-serif; background: #f5f6f4; color: #1c1f1d; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
          .container { max-width: 400px; width: 100%; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 12px 32px rgba(20,30,25,0.1); text-align: center; }
          .icon { font-size: 64px; margin-bottom: 16px; }
          h1 { font-size: 20px; font-weight: 800; color: #1c1f1d; margin-bottom: 12px; }
          p { color: #6f7a72; margin-bottom: 24px; line-height: 1.5; }
          button { background: #16A34A; color: white; border: none; border-radius: 999px; padding: 14px 28px; font-weight: 700; font-size: 16px; cursor: pointer; box-shadow: 0 6px 18px rgba(22,163,74,.3); display: inline-flex; align-items: center; gap: 8px; }
          button:hover { opacity: 0.9; }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="icon">⚠️</div>
          <h1>{"Une erreur critique est survenue"}</h1>
          <p>{"L'application a rencontré une erreur inattendue. Veuillez réessayer ou contacter le support si le problème persiste."}</p>
          <button onClick={reset}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M21 12v5a2 2 0 0 1-2 2h-5" /></svg>
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}