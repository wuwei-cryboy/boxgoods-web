"use client";
import { useLang } from "@/lib/lang-context";

export default function Header({ isHome }: { isHome?: boolean }) {
  const { lang, toggle, tr } = useLang();
  return (
    <header className={"topbar " + (isHome ? "is-home" : "")}>
      {!isHome && (
        <a href="/" className="brand">
          <span className="brand-mark">BG</span> {tr("brandName")} <small>Guinee</small>
        </a>
      )}
      <button className="langbtn" onClick={toggle} aria-label="Changer de langue">
        {lang === "fr" ? "FR" : "ZH"}
      </button>
      {!isHome && (
        <a href="/search" className="iconbtn" aria-label={tr("search")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
          </svg>
        </a>
      )}
    </header>
  );
}