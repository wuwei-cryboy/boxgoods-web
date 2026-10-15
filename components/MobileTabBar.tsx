"use client";
import { usePathname } from "next/navigation";
import { useLang } from "@/lib/lang-context";
import { useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";
import gsap from "gsap";

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
  const pillRef = useRef<HTMLDivElement>(null);
  const isInit = useRef(true);
  const keys: Record<string,string> = { home: tr("tabHome"), cats: tr("tabCats"), inq: tr("tabInq"), me: tr("tabMe") };
  const icons: Record<string, ReactNode> = {
    home: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    cats: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
    inq: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 10h10M7 14h6"/></svg>,
    me: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  };
  const current = activeKey(path);

  useLayoutEffect(() => {
    const bar = barRef.current, pill = pillRef.current;
    if (!bar || !pill) return;
    const target = bar.querySelector(`a[data-key="${current}"]`) as HTMLElement | null;
    if (!target) return;
    const barRect = bar.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    // 本格中心相对容器(基准 left:0)
    const cx = targetRect.left - barRect.left + targetRect.width / 2;
    const cy = targetRect.top - barRect.top - 8;
    const pillW = 88; // 固定药丸宽, 不随格宽, 避免盖邻格
    if (isInit.current) {
      // 首次: 直接定位, 不滑动
      gsap.set(pill, { x: cx - pillW/2, y: cy, width: pillW });
      isInit.current = false;
    } else {
      // 之后: 从当前位置滑向新位置(横移 = 新中心 - 当前中心)
      const curX = gsap.getProperty(pill, "x") as number;
      const curW = gsap.getProperty(pill, "width") as number;
      // 让药丸左边缘 = 新中心 - 新宽/2, 平滑过渡 x 与 width
      gsap.to(pill, {
        x: cx - pillW/2, y: cy, width: pillW,
        duration: .38, ease: "power3.out",
        overwrite: true,
      });
    }
  }, [current]);

  return (
    <nav className="tabbar">
      <div ref={barRef} className="tabbar-inner">
        {ITEMS.map(it => {
          const isActive = current === it.key;
          return (
            <a key={it.key} href={it.href} data-key={it.key}
              className={"tab-item" + (isActive ? " active" : "")}>
              {!isActive && (
                <>
                  <span className="ico">{icons[it.key]}</span>
                  <span className="lbl">{keys[it.key]}</span>
                </>
              )}
            </a>
          );
        })}
        <div ref={pillRef} className="tab-pill" aria-hidden="true">
          <span className="tab-pill-txt">{keys[current]}</span>
        </div>
      </div>
    </nav>
  );
}