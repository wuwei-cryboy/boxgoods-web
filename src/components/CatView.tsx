"use client";

import Image from "next/image";
import { useCategory } from "@/hooks/useCategories";
import { useProductsByCategory } from "@/hooks/useProducts";
import { useLang } from "@/lib/lang-context";
import { norm } from "@/lib/utils";

type CatViewProps = {
  id: string;
};

export default function CatView({ id }: CatViewProps) {
  const { lang, tr } = useLang();
  const c = useCategory(id);
  
  if (!c) {
    const notFound = lang === "zh" ? "找不到品类" : "Catégorie introuvable";
    return <div className="max-w-[680px] mx-auto p-8">{notFound}</div>;
  }

  const prods = useProductsByCategory(id);
  const back = tr("back");
  const inq = tr("inq");
  const moqLabel = tr("moq");

  return (
    <main className="max-w-[680px] mx-auto px-4 pt-2">
      <div className="grad-hero -mx-4 px-4 py-3.5 flex items-center justify-between gap-2.5">
        <a href="/categories" className="glass-strong rounded-full w-[42px] h-[42px] grid place-items-center shadow-sm" aria-label={back}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a3570" strokeWidth="2.2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </a>
        <div className="text-lg font-extrabold text-[#4a3570]">{lang === "zh" ? c.zh : c.fr}</div>
        <a href={"/inquiry?cat=" + c.id} className="glass-strong rounded-full w-[42px] h-[42px] grid place-items-center shadow-sm" aria-label={inq}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a3570" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 10h10M7 14h6"/></svg>
        </a>
      </div>
      <div className="pt-2">
        {prods.map((p) => {
          const moq = p.moq || 24;
          return (
            <a key={p.id} href={"/product/" + p.id} className="cat-row flex items-center gap-3 bg-card border border-[var(--color-line)] rounded-[14px] p-3 mb-2.5 block">
              <span className="w-14 h-14 rounded-[10px] bg-[var(--color-brand-soft)] grid place-items-center overflow-hidden shrink-0">
                {p.image ? <Image src={norm(p.image)} alt="" width={56} height={56} loading="lazy" className="w-full h-full object-contain" /> : <span className="text-xl">📦</span>}
              </span>
              <span className="flex-1 min-w-0">
                <span className="font-bold text-sm truncate block">{lang === "zh" ? p.nameZh : p.nameFr}</span>
                <span className="text-xs text-[var(--color-muted)] mt-0.5 block">{p.boxSpec || "1 pce / carton"}</span>
              </span>
              <span className="text-xs font-bold text-[var(--color-accent)] whitespace-nowrap bg-[var(--color-brand-soft)] rounded-full px-3 py-1.5 shrink-0">
                {moqLabel} {moq}
              </span>
            </a>
          );
        })}
      </div>
    </main>
  );
}