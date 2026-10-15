"use client";
import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { getProducts } from "@/lib/catalog";
import { useLang } from "@/lib/lang-context";

export default function SearchView() {
  const sp = useSearchParams();
  const { lang, tr } = useLang();
  const [q, setQ] = useState(sp.get("q") || "");
  useEffect(() => { const v = sp.get("q"); if (v !== null) setQ(v); }, [sp]);
  const all = getProducts();
  const hits = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return all.filter(p => p.nameFr.toLowerCase().includes(s) || (p.nameZh||"").toLowerCase().includes(s));
  }, [q, all]);
  return (
    <main className="max-w-[680px] mx-auto px-4 pt-3.5">
      <a href="/" className="text-xs text-[var(--color-muted)] inline-block mb-2">&larr; {tr("home")}</a>
      <div className="text-lg font-extrabold mb-3">{tr("recherche")}</div>
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder={tr("searchPh")}
        autoFocus
        className="w-full border border-[var(--color-line)] rounded-xl px-4 py-3 text-sm bg-[var(--color-bg)] outline-none focus:border-[var(--color-accent)] focus:bg-card transition"
      />
      <div className="mt-4">
        {q.trim() === "" && <div className="text-xs text-[var(--color-muted)]">{tr("searchPh")}</div>}
        {q.trim() !== "" && hits.length === 0 && <div className="text-center text-[var(--color-muted)] py-10">{tr("nores")}</div>}
        {hits.map(p => (
          <a key={p.id} href={"/product/" + p.id} className="flex items-center gap-3 bg-card border border-[var(--color-line)] rounded-[14px] p-3 mb-2.5">
            <span className="w-12 h-12 rounded-[10px] bg-[var(--color-brand-soft)] grid place-items-center overflow-hidden shrink-0">
              {p.image ? <img src={p.image} alt="" loading="lazy" className="w-full h-full object-contain"/> : <span>📦</span>}
            </span>
            <span className="flex-1 min-w-0">
              <span className="font-bold text-sm truncate block">{lang === "zh" ? p.nameZh : p.nameFr}</span>
              <span className="text-xs text-[var(--color-muted)] mt-0.5 block">{p.boxSpec}</span>
            </span>
            <span className="text-[var(--color-muted)]">&rsaquo;</span>
          </a>
        ))}
      </div>
    </main>
  );
}