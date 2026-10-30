"use client"
import { usePathname } from "next/navigation";
import { useLang } from "@/lib/lang-context";
import { useEffect, useRef, useState, useCallback } from "react";
import type { ReactNode } from "react";

const ITEMS = [
  { key: "home", href: "/" },
  { key: "cats", href: "/categories" },
  { key: "inq", href: "/inquiry" },
  { key: "me", href: "/account" },
] as const;

function activeKey(path: string) {
  if (path === "/") return "home";
  if (path.startsWith("/categories") || path.startsWith("/cat/")) return "cats";
  if (path.startsWith("/inquiry")) return "inq";
  if (path === "/account") return "me";
  return "cats";
}

export default function MobileTabBar() {
  const { tr } = useLang();
  const path = usePathname();
  const barRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(activeKey(path));
  const [pillStyle, setPillStyle] = useState<React.CSSProperties>({});

  const keys: Record<string, string> = {
    home: tr("tabHome"),
    cats: tr("tabCats"),
    inq: tr("tabInq"),
    me: tr("tabMe"),
  };
  const icons: Record<string, ReactNode> = {
    home: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    cats: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    inq: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M7 10h10M7 14h6" />
      </svg>
    ),
    me: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  };

  // 计算药丸位置
  const updatePill = useCallback(() => {
    const bar = barRef.current;
    if (!bar) return;
    const target = bar.querySelector(`[data-key="${current}"]`) as HTMLElement | null;
    if (!target) return;
    const barRect = bar.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const cx = targetRect.left - barRect.left + targetRect.width / 2;
    const cy = targetRect.top - barRect.top - 8;
    const pillW = 88;
    setPillStyle({
      transform: `translateX(${cx - pillW / 2}px)`,
      top: `${cy}px`,
      width: `${pillW}px`,
    });
  }, [current]);

  // 路由变化时更新
  useEffect(() => {
    const nextKey = activeKey(path);
    setCurrent(nextKey);
    Promise.resolve().then(updatePill);
  }, [path, updatePill]);

  // 首次挂载
  useEffect(() => {
    updatePill();
  }, [updatePill]);

  // 键盘导航：左右箭头切换标签
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const currentIndex = ITEMS.findIndex(it => it.key === current);
    if (currentIndex === -1) return;
    let nextIndex = currentIndex;
    if (e.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % ITEMS.length;
    } else if (e.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + ITEMS.length) % ITEMS.length;
    } else if (e.key === "Home") {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      nextIndex = ITEMS.length - 1;
    } else {
      return;
    }
    const nextKey = ITEMS[nextIndex].key;
    setCurrent(nextKey);
    // 导航到新页面
    window.location.href = ITEMS[nextIndex].href;
  };

  return (
    <nav className="tabbar" role="tablist" aria-label={tr("mainNavigation") || "主导航"} onKeyDown={handleKeyDown}>
      <div ref={barRef} className="tabbar-inner">
        {ITEMS.map((it, _index) => {
          const isActive = current === it.key;
          return (
            <a
              key={it.key}
              href={it.href}
              data-key={it.key}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${it.key}`}
              id={`tab-${it.key}`}
              tabIndex={isActive ? 0 : -1}
              className={"tab-item" + (isActive ? " active" : "")}
              onFocus={() => setCurrent(it.key)} // 键盘聚焦时更新激活态
            >
              {!isActive && (
                <>
                  <span className="ico">{icons[it.key]}</span>
                  <span className="lbl">{keys[it.key]}</span>
                </>
              )}
            </a>
          );
        })}
        <div
          className="tab-pill"
          aria-hidden="true"
          style={pillStyle}
        >
          <span className="tab-pill-txt">{keys[current]}</span>
        </div>
      </div>
    </nav>
  );
}