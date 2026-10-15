"use client";
import { useState } from "react";
import { getCategories, getProducts } from "@/lib/catalog";
import { useLang } from "@/lib/lang-context";

export default function InquiryView() {
  const { lang, tr } = useLang();
  const cats = getCategories();
  const [sent, setSent] = useState(false);
  if (sent) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl">✅</div>
        <div className="text-lg font-extrabold mt-4">{tr("submitted")}</div>
      </div>
    );
  }
  return (
    <main className="max-w-[680px] mx-auto px-4 pt-3.5">
      <a href="/" className="text-xs text-[var(--color-muted)] inline-block mb-2">&larr; {tr("home")}</a>
      <div className="bg-card border border-[var(--color-line)] rounded-2xl p-4">
        <h2 className="text-lg font-extrabold m-0 mb-3">{tr("form")}</h2>
        <form className="grid gap-2.5" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
          <input name="cat" list="cats" placeholder={tr("cat") + " *"} required className="border border-[var(--color-line)] rounded-xl px-3.5 py-2.5 text-sm bg-[var(--color-bg)] outline-none focus:border-[var(--color-accent)]" />
          <datalist id="cats">{cats.map(c => <option key={c.id} value={lang === "zh" ? c.zh : c.fr} />)}</datalist>
          <input name="name" required placeholder={tr("name") + " *"} className="border border-[var(--color-line)] rounded-xl px-3.5 py-2.5 text-sm bg-[var(--color-bg)] outline-none focus:border-[var(--color-accent)]" />
          <input name="company" placeholder={tr("company")} className="border border-[var(--color-line)] rounded-xl px-3.5 py-2.5 text-sm bg-[var(--color-bg)] outline-none focus:border-[var(--color-accent)]" />
          <input name="email" required placeholder={tr("email") + " *"} className="border border-[var(--color-line)] rounded-xl px-3.5 py-2.5 text-sm bg-[var(--color-bg)] outline-none focus:border-[var(--color-accent)]" />
          <input name="qty" type="number" min="1" placeholder={tr("qty")} className="border border-[var(--color-line)] rounded-xl px-3.5 py-2.5 text-sm bg-[var(--color-bg)] outline-none focus:border-[var(--color-accent)]" />
          <textarea name="msg" rows={3} placeholder={tr("msg")} className="border border-[var(--color-line)] rounded-xl px-3.5 py-2.5 text-sm bg-[var(--color-bg)] outline-none focus:border-[var(--color-accent)]" />
          <button type="submit" className="bg-[var(--color-accent)] text-white font-bold rounded-full py-3 text-sm w-full mt-1 shadow-[0_6px_18px_rgba(22,163,74,.3)]">{tr("submit")} →</button>
        </form>
        <div className="text-[11px] text-[var(--color-muted)] mt-3">{tr("trust")}</div>
      </div>
    </main>
  );
}