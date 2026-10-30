"use client";
import { useState, useEffect } from "react";
import { useLang } from "@/lib/lang-context";
import { getCartCount, onCartChange } from "@/lib/cart";

export default function CartButton({ onClick }: { onClick: () => void }) {
  const { tr } = useLang();
  const [count, setCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCount(getCartCount());
    const unsubscribe = onCartChange((items) => setCount(items.reduce((s, i) => s + i.qty, 0)));
    return unsubscribe;
  }, []);

  if (!mounted || count === 0) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-[var(--color-accent)] text-white shadow-[0_6px_18px_rgba(22,163,74,.4)] flex items-center justify-center active:scale-95 transition-transform"
      aria-label={tr("cart") || "购物车"}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[var(--color-error)] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
        {count > 99 ? "99+" : count}
      </span>
    </button>
  );
}