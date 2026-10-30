"use client"

import { useState, useRef, useEffect } from "react";
import { useCategories } from "@/hooks/useCategories";
import { useLang } from "@/lib/lang-context";
import { clearCart } from "@/lib/cart";
import { trackInquirySubmit } from "@/lib/analytics";

export default function InquiryView() {
  const { lang, tr } = useLang();
  const cats = useCategories();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  // 成功提交后清空购物车（如果是从购物车跳转过来）
  useEffect(() => {
    if (sent) {
      clearCart();
    }
  }, [sent]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setSent(true);
      // 埋点：询盘提交
      trackInquirySubmit({
        product_id: body.product_id as string,
        category_id: body.category_id as string,
        qty: body.qty ? Number(body.qty) : undefined,
      });
      // 聚焦到成功消息
      setTimeout(() => {
        errorRef.current?.focus();
      }, 100);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "提交失败，请稍后重试";
      setError(message);
      // 聚焦到错误消息
      setTimeout(() => {
        errorRef.current?.focus();
      }, 100);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center py-16" role="status" aria-live="polite" ref={errorRef} tabIndex={-1}>
        <div className="text-5xl" aria-hidden="true">✅</div>
        <div className="text-lg font-extrabold mt-4">{tr("submitted")}</div>
      </div>
    );
  }

  return (
    <main className="max-w-[680px] mx-auto px-4 pt-3.5">
      <a href="/" className="text-xs text-[var(--color-muted)] inline-block mb-2">
        &larr; {tr("home")}
      </a>
      <div className="bg-card border border-[var(--color-line)] rounded-2xl p-4">
        <h2 className="text-lg font-extrabold m-0 mb-3">{tr("form")}</h2>
        <form ref={formRef} className="grid gap-2.5" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="category_id" className="block text-sm font-semibold mb-1 required-marker">
              {tr("cat")}
            </label>
            <input
              id="category_id"
              name="category_id"
              list="cats"
              placeholder={tr("cat") + " *"}
              required
              aria-required="true"
              className="border border-[var(--color-line)] rounded-xl px-3.5 py-2.5 text-sm bg-[var(--color-bg)] outline-none focus:border-[var(--color-accent)] w-full"
            />
            <datalist id="cats">
              {cats.map((c) => (
                <option key={c.id} value={c.id} label={lang === "zh" ? c.zh : c.fr} />
              ))}
            </datalist>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-semibold mb-1 required-marker">
              {tr("name")}
            </label>
            <input
              id="name"
              name="name"
              required
              placeholder={tr("name") + " *"}
              aria-required="true"
              autoComplete="name"
              className="border border-[var(--color-line)] rounded-xl px-3.5 py-2.5 text-sm bg-[var(--color-bg)] outline-none focus:border-[var(--color-accent)] w-full"
            />
          </div>

          <div>
            <label htmlFor="company" className="block text-sm font-semibold mb-1">
              {tr("company")}
            </label>
            <input
              id="company"
              name="company"
              placeholder={tr("company")}
              autoComplete="organization"
              className="border border-[var(--color-line)] rounded-xl px-3.5 py-2.5 text-sm bg-[var(--color-bg)] outline-none focus:border-[var(--color-accent)] w-full"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold mb-1 required-marker">
              {tr("email")}
            </label>
            <input
              id="email"
              name="email"
              required
              type="email"
              placeholder={tr("email") + " *"}
              aria-required="true"
              autoComplete="email"
              className="border border-[var(--color-line)] rounded-xl px-3.5 py-2.5 text-sm bg-[var(--color-bg)] outline-none focus:border-[var(--color-accent)] w-full"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-semibold mb-1">
              {tr("call")}
            </label>
            <input
              id="phone"
              name="phone"
              placeholder={tr("call")}
              autoComplete="tel"
              className="border border-[var(--color-line)] rounded-xl px-3.5 py-2.5 text-sm bg-[var(--color-bg)] outline-none focus:border-[var(--color-accent)] w-full"
            />
          </div>

          <div>
            <label htmlFor="qty" className="block text-sm font-semibold mb-1">
              {tr("qty")}
            </label>
            <input
              id="qty"
              name="qty"
              type="number"
              min="1"
              placeholder={tr("qty")}
              className="border border-[var(--color-line)] rounded-xl px-3.5 py-2.5 text-sm bg-[var(--color-bg)] outline-none focus:border-[var(--color-accent)] w-full"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-semibold mb-1">
              {tr("msg")}
            </label>
            <textarea
              id="message"
              name="message"
              rows={3}
              placeholder={tr("msg")}
              className="border border-[var(--color-line)] rounded-xl px-3.5 py-2.5 text-sm bg-[var(--color-bg)] outline-none focus:border-[var(--color-accent)] w-full"
            />
          </div>

          {error && (
            <div
              ref={errorRef}
              className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2"
              role="alert"
              tabIndex={-1}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-[var(--color-accent)] text-white font-bold rounded-full py-3 text-sm w-full mt-1 shadow-[0_6px_18px_rgba(22,163,74,.3)] disabled:opacity-50"
            aria-busy={loading}
          >
            {loading ? "提交中…" : tr("submit") + " →"}
          </button>
        </form>
        <div className="text-[11px] text-[var(--color-muted)] mt-3">{tr("trust")}</div>
      </div>
    </main>
  );
}