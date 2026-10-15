"use client";
import { useLang } from "@/lib/lang-context";
import { getProducts } from "@/lib/catalog";
import { useEffect, useState } from "react";

const norm = (p?: string) => (p ? (p.startsWith("img/") ? "/" + p : p) : "");

export default function AccountView() {
  const { lang, tr } = useLang();
  const [favs, setFavs] = useState<string[]>([]);

  useEffect(() => {
    try { setFavs(JSON.parse(localStorage.getItem("favs") || "[]")); } catch { /* ignore */ }
  }, []);

  const favProds = getProducts().filter(p => favs.includes(p.id));

  return (
    <main className="max-w-[680px] mx-auto px-4 pt-3.5 pb-20">
      <a href="/" className="text-xs text-[var(--color-muted)] inline-block mb-2">&larr; {tr("home")}</a>
      <div className="text-lg font-extrabold mb-3">{tr("me")}</div>

      <div className="grad-banner rounded-2xl p-4 mb-4">
        <div className="text-lg font-extrabold">{tr("hello")}</div>
        <div className="text-[12px] mt-1 opacity-90">{tr("helloSub")}</div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-card border border-[var(--color-line)] rounded-2xl p-3.5 block">
          <div className="w-9 h-9 rounded-full bg-[var(--color-brand-soft)] grid place-items-center text-base mb-2">⭐</div>
          <div className="text-[11px] text-[var(--color-muted)]">{tr("fav")}</div>
          <div className="text-xl font-extrabold">{favs.length}</div>
        </div>
        <a href="/inquiry" className="bg-card border border-[var(--color-line)] rounded-2xl p-3.5 block">
          <div className="w-9 h-9 rounded-full bg-[var(--color-brand-soft)] grid place-items-center text-base mb-2">✉️</div>
          <div className="text-[11px] text-[var(--color-muted)]">{tr("myinq")}</div>
          <div className="text-xl font-extrabold">0</div>
        </a>
      </div>

      <a href="/inquiry" className="block bg-[var(--color-accent)] text-white font-bold text-sm rounded-full py-3 text-center mb-4 shadow-[0_6px_18px_rgba(22,163,74,.3)]">
        + {tr("newInquiry")}
      </a>

      <div className="bg-card border border-[var(--color-line)] rounded-2xl p-4 mb-4">
        <div className="text-sm font-bold mb-2">{tr("fav")}</div>
        {favProds.length > 0 ? (
          <div className="grid grid-cols-2 gap-2.5">
            {favProds.map(p => (
              <a key={p.id} href={"/product/" + p.id} className="bg-white border border-[var(--color-line)] rounded-xl overflow-hidden block">
                <div className="aspect-square grid place-items-center p-2 bg-[var(--color-bg)]">
                  {p.image ? <img src={norm(p.image)} alt="" loading="lazy" className="w-full h-full object-contain" /> : <div className="text-2xl">📦</div>}
                </div>
                <div className="p-2">
                  <div className="text-[11px] font-bold line-clamp-2">{lang === "zh" ? p.nameZh : p.nameFr}</div>
                  <div className="text-[10px] text-[var(--color-muted)]">{p.boxSpec}</div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-5">
            <div className="text-3xl mb-2">⭐</div>
            <div className="text-[13px] text-[var(--color-muted)]">{tr("noFav")}</div>
          </div>
        )}
      </div>

      <div className="bg-card border border-[var(--color-line)] rounded-2xl p-4">
        <div className="text-sm font-bold mb-2">{tr("myinq")}</div>
        <div className="text-center py-5">
          <div className="text-3xl mb-2">✉️</div>
          <div className="text-[13px] text-[var(--color-muted)]">{tr("noInq")}</div>
        </div>
      </div>
    </main>
  );
}