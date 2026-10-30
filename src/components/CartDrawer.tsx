"use client"
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useLang } from "@/lib/lang-context";
import { getCart, onCartChange, updateQty, removeFromCart, updateNote, clearCart, CartItem } from "@/lib/cart";
import { norm } from "@/lib/utils";
import { exportCartToXLSX, copyInquiryToClipboard } from "@/lib/export";
import { trackCartRemove, trackCartQtyChange } from "@/lib/analytics";

export default function CartDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { lang, tr } = useLang();
  const [items, setItems] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const drawerRef = useRef<HTMLAsideElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // 焦点陷阱所需的可聚焦元素选择器
  const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

  useEffect(() => {
    const cart = getCart();
    setItems(cart);
    setSubtotal(cart.reduce((s, i) => s + (i.product.priceMin || 0) * i.qty, 0));
    const unsubscribe = onCartChange((newItems) => {
      setItems(newItems);
      setSubtotal(newItems.reduce((s, i) => s + (i.product.priceMin || 0) * i.qty, 0));
    });
    return unsubscribe;
  }, []);

  // 打开时：记录之前的活动元素、陷阱焦点、阻止背景滚动
  useEffect(() => {
    if (!isOpen) return;
    previousActiveElement.current = document.activeElement as HTMLElement;
    document.body.style.overflow = "hidden";
    // 延迟聚焦到关闭按钮，确保动画完成
    setTimeout(() => {
      const closeBtn = drawerRef.current?.querySelector('button[aria-label*="关闭"], button[aria-label*="Fermer"]') as HTMLElement;
      closeBtn?.focus();
    }, 100);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab") {
        trapFocus(e, drawerRef.current!);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      // 关闭时恢复焦点
      previousActiveElement.current?.focus();
    };
  }, [isOpen, onClose]);

  const trapFocus = (e: KeyboardEvent, container: HTMLElement) => {
    const focusableElements = container.querySelectorAll<HTMLElement>(focusableSelectors);
    if (focusableElements.length === 0) return;
    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const handleQtyChange = (productId: string, delta: number) => {
    const item = items.find((i) => i.product.id === productId);
    if (item) {
      const newQty = item.qty + delta;
      if (newQty > 0) {
        updateQty(productId, newQty);
        trackCartQtyChange(productId, newQty);
      }
    }
  };

  const handleNoteChange = (productId: string, note: string) => {
    updateNote(productId, note);
  };

  const formatPrice = (price?: number, currency = "USD") => {
    if (!price) return tr("priceOnRequest");
    return new Intl.NumberFormat(lang === "zh" ? "zh-CN" : "fr-FR", { style: "currency", currency }).format(price);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <aside
        ref={drawerRef}
        className="fixed right-0 top-0 h-full w-full max-w-sm z-50 bg-white shadow-[-24px_0_48px_rgba(0,0,0,.12)] flex flex-col animate-slide-in focus-trap"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-line)]">
          <h2 id="cart-title" className="text-lg font-extrabold">{tr("cart") || "购物车"}</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[var(--color-bg)] grid place-items-center text-[var(--color-muted)] active:bg-[var(--color-line)]"
            aria-label={tr("closeCart") || "关闭购物车"}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-[var(--color-muted)]">
              <div className="text-4xl mb-2">🛒</div>
              <p>{tr("cartEmpty") || "购物车为空"}</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.product.id} className="flex gap-3 bg-[var(--color-bg)] rounded-xl p-3 border border-[var(--color-line)]">
                <div className="w-20 h-20 rounded-lg bg-white overflow-hidden shrink-0 flex items-center justify-center">
                  {item.product.image ? (
                    <Image src={norm(item.product.image)} alt="" width={80} height={80} className="object-contain" />
                  ) : (
                    <span className="text-2xl">📦</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{lang === "zh" ? item.product.nameZh : item.product.nameFr}</p>
                  <p className="text-xs text-[var(--color-muted)] mt-0.5">{item.product.boxSpec}</p>
                  <p className="text-xs font-bold text-[var(--color-accent)] mt-1">
                    {formatPrice(item.product.priceMin, item.product.currency)}
                    {item.product.priceMax && item.product.priceMax !== item.product.priceMin
                      ? `–${formatPrice(item.product.priceMax, item.product.currency)}`
                      : ""}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => handleQtyChange(item.product.id, -1)}
                      className="w-8 h-8 rounded-full border border-[var(--color-line)] bg-white grid place-items-center text-[var(--color-ink)] active:scale-95"
                      aria-label={tr("decreaseQty") || "减少"}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/></svg>
                    </button>
                    <span className="text-sm font-bold w-8 text-center">{item.qty}</span>
                    <button
                      onClick={() => handleQtyChange(item.product.id, 1)}
                      className="w-8 h-8 rounded-full border border-[var(--color-line)] bg-white grid place-items-center text-[var(--color-ink)] active:scale-95"
                      aria-label={tr("increaseQty") || "增加"}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                    </button>
                    <button
                      onClick={() => {
                        removeFromCart(item.product.id);
                        trackCartRemove(item.product.id);
                      }}
                      className="ml-auto w-8 h-8 rounded-full bg-[var(--color-error-soft)] text-[var(--color-error)] grid place-items-center active:scale-95"
                      aria-label={tr("remove") || "移除"}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                  <textarea
                    value={item.note || ""}
                    onChange={(e) => handleNoteChange(item.product.id, e.target.value)}
                    placeholder={tr("notePlaceholder") || "备注（颜色、规格要求等）"}
                    rows={1}
                    className="mt-2 w-full text-xs border border-[var(--color-line)] rounded-lg px-2 py-1.5 bg-white outline-none focus:border-[var(--color-accent)]"
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--color-line)] p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-muted)]">{tr("subtotal") || "小计"}</span>
            <span className="font-bold">{formatPrice(subtotal)}</span>
          </div>
          <div className="text-xs text-[var(--color-muted)]">{tr("cartNote") || "价格面议，最终以供应商报价为准"}</div>
          <div className="flex gap-2">
            <button
              onClick={() => { clearCart(); onClose(); }}
              className="flex-1 border border-[var(--color-line)] text-[var(--color-muted)] rounded-full py-3 text-sm font-semibold"
            >
              {tr("clearCart") || "清空"}
            </button>
            <a
              href="/inquiry"
              onClick={onClose}
              className="flex-1 bg-[var(--color-accent)] text-white font-bold rounded-full py-3 text-sm text-center shadow-[0_6px_18px_rgba(22,163,74,.3)]"
            >
              {tr("goToInquiry") || "去询价"}
            </a>
          </div>
          <div className="flex gap-2 pt-2 border-t border-[var(--color-line)]">
            <button
              onClick={exportCartToXLSX}
              className="flex-1 border border-[var(--color-brand)] text-[var(--color-brand)] rounded-full py-2.5 text-sm font-semibold"
            >
              {tr("exportXLSX") || "导出 Excel"}
            </button>
            <button
              onClick={copyInquiryToClipboard}
              className="flex-1 border border-[var(--color-brand)] text-[var(--color-brand)] rounded-full py-2.5 text-sm font-semibold"
            >
              {tr("copyInquiry") || "复制询价单"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}