"use client";

import Link from "next/link";
import { useLang } from "@/lib/lang-context";

export default function ProductNotFound() {
  const { tr } = useLang();

  return (
    <main className="max-w-[680px] mx-auto px-4 pt-16 pb-20 flex flex-col items-center text-center">
      <div className="text-6xl mb-4">📦</div>
      <h1 className="text-2xl font-extrabold mb-2">404 — {tr("errorTitle")}</h1>
      <p className="text-[var(--color-muted)] mb-6 max-w-xs">商品不存在或已下架。</p>
      <Link
        href="/categories"
        className="bg-[var(--color-accent)] text-white font-bold rounded-full px-6 py-3 shadow-[0_6px_18px_rgba(22,163,74,.3)]"
      >
        {tr("cats")}
      </Link>
    </main>
  );
}