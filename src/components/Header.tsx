"use client"
import LangToggle from "@/components/LangToggle";
import UserMenu from "@/components/UserMenu";
import ColorBlindToggle from "@/components/ColorBlindToggle";
import { useLang } from "@/lib/lang-context";

type HeaderProps = {
  isHome?: boolean;
};

export default function Header({ isHome }: HeaderProps) {
  const { tr } = useLang();
  const brandName = tr("brandName");
  const search = tr("search");

  return (
    <>
      <a href="#main-content" className="skip-link">
        {tr("skipToContent") || "跳至主内容"}
      </a>
      <header className={"topbar " + (isHome ? "is-home" : "")} role="banner">
        {!isHome && (
          <a href="/" className="brand" aria-label={`${brandName} - ${tr("home") || "首页"}`}>
            <span className="brand-mark" aria-hidden="true">BG</span> {brandName} <small>Guinee</small>
          </a>
        )}
        <div className="flex items-center gap-2">
          <LangToggle />
          {!isHome && (
            <>
              <a href="/search" className="iconbtn" aria-label={search}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" />
                </svg>
              </a>
              <ColorBlindToggle />
              <UserMenu />
            </>
          )}
        </div>
      </header>
    </>
  );
}