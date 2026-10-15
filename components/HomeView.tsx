"use client";
import { useState, useMemo } from "react";
import { getCategories, getProductsByCat, getProducts } from "@/lib/catalog";
import { useLang } from "@/lib/lang-context";

export default function HomeView() {
  const { lang, tr } = useLang();
  const cats = getCategories();
  const rec = useMemo(() => cats.map(c => getProductsByCat(c.id)[0]).filter(Boolean), [cats]);
  const [q, setQ] = useState("");
  const hits = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return getProducts().filter(p => p.nameFr.toLowerCase().includes(s) || (p.nameZh || "").toLowerCase().includes(s)).slice(0, 8);
  }, [q]);

  return (
    <main className="max-w-[680px] mx-auto px-4 pt-2">
      <div className="grad-hero -mx-4 px-4 pt-16 pb-16 rounded-b-[28px] overflow-hidden">
        <form
          className="glass-strong rounded-full flex items-center gap-2 px-4 py-3 shadow-[0_4px_18px_rgba(120,90,200,.14)] relative"
          onSubmit={(e) => { e.preventDefault(); if (q.trim()) location.href = "/search?q=" + encodeURIComponent(q.trim()); }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7a6a9a" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
          <input
            className="flex-1 min-w-0 bg-transparent outline-none text-sm text-[#4a3570] placeholder-[#9d8fb5] border-none"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={tr("searchHero")}
            aria-label={tr("searchHero")}
          />
          {hits.length > 0 && (
            <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 bg-card rounded-2xl shadow-[0_12px_36px_rgba(90,60,140,.22)] overflow-hidden border border-[var(--color-line)]">
              {hits.map(p => (
                <a key={p.id} href={"/product/" + p.id} className="flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-[var(--color-brand-soft)]" onClick={() => setQ("")}>
                  <span className="w-9 h-9 rounded-lg bg-[var(--color-brand-soft)] grid place-items-center overflow-hidden shrink-0">
                    {p.image ? <img src={p.image} alt="" className="w-full h-full object-contain"/> : <span>📦</span>}
                  </span>
                  <span className="text-[13px] font-bold min-w-0 truncate">{lang === "zh" ? p.nameZh : p.nameFr}</span>
                </a>
              ))}
            </div>
          )}
        </form>
        {hits.length === 0 && q.trim() && (
          <div className="text-xs text-[#6d5a96] font-semibold mt-2 px-1">{tr("nores")}</div>
        )}
        <div className="text-[32px] font-extrabold text-[#4a3570] mt-5 leading-none">{tr("brandName")}</div>
        <div className="text-xs font-semibold text-[#7a6a9a] mt-1">B2B · {lang === "zh" ? "几内亚" : "Guinee"}</div>
        <div className="mt-12 flex gap-3.5 overflow-x-auto no-scrollbar snap-x pb-2" style={{scrollSnapType:"x mandatory"}}>
          {cats.map(c => (
            <a key={c.id} href={"/cat/" + c.id} className="snap-start flex flex-col items-center gap-2.5 shrink-0 w-[74px]">
              <span className="orb" dangerouslySetInnerHTML={{__html: c.icon || ""}} />
              <span className="text-xs font-semibold text-[#4a3570] text-center leading-tight w-[74px] line-clamp-2">{lang === "zh" ? c.zh : c.fr}</span>
            </a>
          ))}
        </div>
      </div>
      <a href="/categories" className="grad-banner block rounded-[22px] p-5 mt-3.5 flex items-center gap-3.5 shadow-[0_10px_30px_rgba(140,100,200,.2)] relative overflow-hidden">
        <div className="text-2xl">📦</div>
        <div className="flex-1">
          <h2 className="text-lg font-extrabold text-white leading-tight text-shadow m-0">{tr("heroTitle")}</h2>
          <p className="text-xs text-white/90 mt-1 mb-0">{tr("heroSub")}</p>
        </div>
        <span className="bg-white/95 text-[#3a2a5a] font-bold text-[13px] rounded-full px-4 py-2.5">{tr("catalogue")} →</span>
      </a>
      <div className="flex items-baseline justify-between mt-4 mb-2.5">
        <h3 className="text-[15px] font-bold m-0">{tr("recTitle")}</h3>
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x pb-3" style={{scrollSnapType:"x mandatory"}}>
        {rec.map(p => (
          <a key={p.id} href={"/product/" + p.id} className="snap-start shrink-0 w-[45%] bg-card border border-[var(--color-line)] rounded-2xl overflow-hidden shadow-sm">
            <div className="aspect-square bg-white flex items-center justify-center p-3">
              {p.image ? <img src={p.image} alt={p.nameFr} loading="lazy" className="object-contain w-full h-full"/> : <div>📦</div>}
            </div>
            <div className="p-3">
              <div className="text-sm font-bold line-clamp-2">{lang === "zh" ? p.nameZh : p.nameFr}</div>
              <div className="text-[11px] text-[var(--color-muted)] mt-1">{p.boxSpec || "1 pce / carton"}</div>
            </div>
          </a>
        ))}
      </div>
    </main>
  );
}