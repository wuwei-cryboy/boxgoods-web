"use client";
import { useState, useEffect } from "react";
import { getProduct, getProductsByCat, getSupplier, getCategories } from "@/lib/catalog";
import { useLang } from "@/lib/lang-context";

// 相对路径 img/... -> 绝对路径 /img/...
const norm = (p?: string) => (p ? (p.startsWith("img/") ? "/" + p : p) : "");

export default function ProductView({ id }: { id: string }) {
  const { lang, tr } = useLang();
  const [mainIdx, setMainIdx] = useState(0);
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    try {
      const favs = JSON.parse(localStorage.getItem("favs") || "[]");
      setIsFav(favs.includes(id));
    } catch { /* ignore */ }
  }, [id]);

  const toggleFav = () => {
    try {
      const favs: string[] = JSON.parse(localStorage.getItem("favs") || "[]");
      const next = isFav ? favs.filter(x => x !== id) : [...favs, id];
      localStorage.setItem("favs", JSON.stringify(next));
      setIsFav(!isFav);
    } catch { /* ignore */ }
  };
  const prod = getProduct(id);
  if (!prod) return <div className="max-w-[680px] mx-auto p-8">{lang === "zh" ? "找不到商品" : "Produit introuvable"}</div>;
  const c = getCategories().find(x => x.id === prod.cat);
  const sup = getSupplier(prod.supplierId);
  const rawVariants = prod.variants || [];
  const variantsArr = Array.isArray(rawVariants) ? rawVariants : [rawVariants];
  const colorThumbs = variantsArr.filter(v => v.type === "color");
  const modelBtns = variantsArr.filter(v => v.type === "model" || v.type === "spec");
  const colors = colorThumbs.length ? colorThumbs : [];
  // 手机/配件：型号文字按钮 + 价格区间（无圆形缩略图）
  const isPhoneOrAcc = prod.cat === "telephones" || prod.cat === "accessoires";
  const specGroup = variantsArr.filter(v => v.type === "spec");
  const modelGroup = variantsArr.filter(v => v.type === "model");
  const allP = (specGroup.concat(modelGroup)).map(v => v.price).filter((x): x is number => x != null);
  const priceLabel = allP.length > 0
    ? (new Set(allP).size > 1 ? Math.min(...allP) + "-" + Math.max(...allP) : allP[0]) + " " + (prod.currency || "USD")
    : null;
  const details = prod.detailImages || [];
  const related = getProductsByCat(prod.cat).filter(x => x.id !== prod.id).slice(0, 4);
  const activeVariant = mainIdx > 0 && colorThumbs[mainIdx - 1] ? colorThumbs[mainIdx - 1] : null;
  const mainImg = activeVariant && activeVariant.img ? activeVariant.img : prod.image;
  const mainSrc = norm(mainImg);
  const name = lang === "zh" ? prod.nameZh : prod.nameFr;
  return (
    <main className="max-w-[680px] mx-auto px-4 pt-2">
      <a href={"/cat/" + prod.cat} className="text-xs text-[var(--color-muted)] inline-block mb-2">&larr; {c ? (lang === "zh" ? c.zh : c.fr) : prod.cat}</a>
      <div className="bg-card border border-[var(--color-line)] rounded-3xl overflow-hidden shadow-sm">
        <div className="relative bg-white grid place-items-center overflow-hidden" style={{maxWidth:"360px",margin:"0 auto",width:"100%"}}>
          {mainSrc ? <img src={mainSrc} alt={name} className="w-full p-3" style={{height:"auto"}} /> : <div className="text-[#c0392b] text-xs py-8">Image introuvable</div>}
          <button type="button" onClick={toggleFav} aria-label={tr("fav")} className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/85 backdrop-blur border border-[var(--color-line)] grid place-items-center shadow-sm active:scale-90 transition-transform cursor-pointer" style={{ cursor: "pointer" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill={isFav ? "#F59E0B" : "none"} stroke={isFav ? "#F59E0B" : "var(--color-brand)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </button>
        </div>
        {!isPhoneOrAcc && colors.length > 1 && (
          <div className="flex gap-3 px-3.5 py-3 bg-white border-t border-[var(--color-line)] overflow-x-auto no-scrollbar">
            {colors.map((v, i) => (
              <button key={i} type="button" onClick={() => setMainIdx(i + 1)}
                className={"w-[52px] h-[52px] rounded-full border-2 overflow-hidden shrink-0 p-0 bg-white cursor-pointer " + (mainIdx === i + 1 ? "border-[var(--color-accent)] scale-105 shadow-[0_2px_8px_rgba(22,163,74,.3)]" : "border-transparent")}>
                {v.img ? <img src={norm(v.img)} alt={v.label} className="w-full h-full object-cover" /> : null}
              </button>
            ))}
          </div>
        )}
        <div className="px-4 py-3.5 border-t border-[var(--color-line)]">
          <h1 className="text-[22px] font-extrabold m-0 leading-tight">{name}</h1>
          <div className="text-xs text-[var(--color-muted)] mt-1.5 font-semibold">SKU {prod.id.toUpperCase()}</div>
          <div className="text-xs text-[var(--color-accent)] font-bold mt-0.5">{tr("moq")} {prod.moq} · {prod.boxSpec}</div>
          {isPhoneOrAcc && (
            <div className="mt-2.5 space-y-2">
              {priceLabel && <div className="text-lg font-extrabold text-[var(--color-accent)]">{priceLabel}</div>}
              {specGroup.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-[var(--color-muted)] mb-1">{lang === "zh" ? "规格" : "Spécification"}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {specGroup.map((v,i) => <span key={i} className="text-xs font-semibold px-3 py-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-text)]">{v.label}</span>)}
                  </div>
                </div>
              )}
              {modelGroup.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-[var(--color-muted)] mb-1">{lang === "zh" ? "型号" : "Modèle"}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {modelGroup.map((v,i) => <span key={i} className="text-xs font-semibold px-3 py-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-text)]">{v.label}</span>)}
                  </div>
                </div>
              )}
            </div>
          )}
          <a href={"/inquiry?pid=" + prod.id} className="inline-block mt-3 bg-[var(--color-accent)] text-white font-bold text-sm rounded-full px-5 py-2.5 shadow-[0_6px_18px_rgba(22,163,74,.3)]">{tr("askPrice")} &rarr;</a>
        </div>
        {prod.specs && prod.specs.length > 0 && (
          <div className="px-4 py-3 border-t border-[var(--color-line)]">
            <div className="text-xs font-bold text-[var(--color-muted)] mb-2">{tr("specsLbl")}</div>
            {prod.specs.map((row, i) => (
              <div key={i} className="grid grid-cols-[110px_1fr] gap-2 py-1 border-b border-[var(--color-line)] last:border-0">
                <span className="text-xs text-[var(--color-muted)]">{row[0]}</span>
                <span className="text-sm font-semibold">{row[1]}</span>
              </div>
            ))}
          </div>
        )}
        {details.length > 0 && (
          <details className="border-t border-[var(--color-line)]">
            <summary className="min-h-[56px] flex items-center justify-between px-4 py-4 cursor-pointer font-extrabold text-base list-none">
              <span>{tr("details")} ({details.length})</span>
              <span className="text-[var(--color-accent)] text-lg transition-transform">&rsaquo;</span>
            </summary>
            <div className="px-3.5 pb-3">
              {details.map((src, i) => <img key={i} src={norm(src)} alt="" className="rounded-xl w-full mb-2" loading="lazy" />)}
            </div>
          </details>
        )}
        {sup && (
          <div className="mx-4 my-3.5 p-3.5 bg-[var(--color-brand-soft)] rounded-xl">
            <div className="text-xs font-bold text-[var(--color-muted)] mb-2">{tr("supplier")}</div>
            <div className="text-sm font-bold">{sup.name}</div>
            <div className="text-xs text-[var(--color-muted)] mt-0.5">{sup.address}</div>
            <div className="text-[11px] text-[var(--color-accent)] font-bold mt-2">{tr("trust")}</div>
          </div>
        )}
      </div>
      {related.length > 0 && (
        <div className="mt-4">
          <h3 className="text-[15px] font-bold mb-2.5 m-0">{tr("related")}</h3>
          <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x">
            {related.map(r => (
              <a key={r.id} href={"/product/" + r.id} className="snap-start shrink-0 w-[45%] bg-card border border-[var(--color-line)] rounded-2xl overflow-hidden shadow-sm">
                <div className="aspect-square bg-white grid place-items-center p-3">
                  {r.image ? <img src={norm(r.image)} alt={r.nameFr} loading="lazy" className="object-contain w-full h-full" /> : null}
                </div>
                <div className="p-3">
                  <div className="text-sm font-bold line-clamp-2">{lang === "zh" ? r.nameZh : r.nameFr}</div>
                  <div className="text-[11px] text-[var(--color-muted)] mt-1">{r.boxSpec}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
