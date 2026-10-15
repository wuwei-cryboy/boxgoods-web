"use client";
import { getCategories, getProductsByCat } from "@/lib/catalog";
import { useLang } from "@/lib/lang-context";

export default function CategoriesView() {
  const { lang, tr } = useLang();
  const cats = getCategories();
  return (
    <main className="max-w-[680px] mx-auto px-4 pt-2">
      <div className="grad-hero -mx-4 px-4 py-3.5 flex items-center justify-between gap-2.5">
        <a href="/" className="glass-strong rounded-full w-[42px] h-[42px] grid place-items-center shadow-sm" aria-label={tr("back")}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a3570" strokeWidth="2.2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </a>
        <div className="text-lg font-extrabold text-[#4a3570]">{tr("cats")}</div>
        <a href="/inquiry" className="glass-strong rounded-full w-[42px] h-[42px] grid place-items-center shadow-sm" aria-label={tr("inq")}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a3570" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 10h10M7 14h6"/></svg>
        </a>
      </div>
      <img src="/img/heromain.webp" alt="" className="w-full h-[260px] object-cover rounded-2xl my-4" />
      <div className="text-[28px] font-extrabold">{tr("homeHero")}</div>
      <div className="text-sm text-[var(--color-muted)] mt-1.5 mb-4">{tr("homeSub")}</div>
      {cats.map(c => {
        const n = getProductsByCat(c.id).length;
        return (
          <a key={c.id} href={"/cat/" + c.id} className="cat-row flex items-center gap-3 bg-card border border-[var(--color-line)] rounded-[14px] p-3 mb-2.5">
            <span className="orb" dangerouslySetInnerHTML={{__html: c.icon || ""}} />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm truncate">{lang === "zh" ? c.zh : c.fr}</div>
              <div className="text-xs text-[var(--color-muted)] mt-0.5">{n} {tr("products")}</div>
            </div>
            <span className="text-[var(--color-muted)] text-lg">&rsaquo;</span>
          </a>
        );
      })}
    </main>
  );
}