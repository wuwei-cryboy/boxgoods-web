"use client";

import Image from "next/image";
import { useLang } from "@/lib/lang-context";
import { useEffect, useState } from "react";
import { norm } from "@/lib/utils";
import { useUserRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

export default function AccountView() {
  const { lang, tr } = useLang();
  const [favIds, setFavIds] = useState<string[]>([]);
  const [inquiries, setInquiries] = useState<Array<{ id: string; status: string; created_at: string }>>([]);

  useEffect(() => {
    fetch("/api/favorites")
      .then((r) => r.json())
      .then(({ data }) => setFavIds(data ?? []))
      .catch(console.error);
  }, []);

  // 实时订阅收藏变化
  useUserRealtimeSubscription<{ user_id: string; product_id: string; created_at: string }>(
    "favorites",
    (payload) => {
      if (payload.eventType === "INSERT" && payload.new) {
        setFavIds((prev) => [...new Set([...prev, payload.new.product_id])]);
      } else if (payload.eventType === "DELETE" && payload.old) {
        setFavIds((prev) => prev.filter((id) => id !== payload.old!.product_id));
      }
    }
  );

  // 实时订阅询盘变化
  useUserRealtimeSubscription<{ id: string; user_id: string; status: string; created_at: string }>(
    "inquiries",
    (payload) => {
      if (payload.eventType === "INSERT" && payload.new) {
        setInquiries((prev) => [payload.new, ...prev.filter((i) => i.id !== payload.new!.id)]);
      } else if (payload.eventType === "UPDATE" && payload.new) {
        setInquiries((prev) => prev.map((i) => (i.id === payload.new!.id ? payload.new! : i)));
      } else if (payload.eventType === "DELETE" && payload.old) {
        setInquiries((prev) => prev.filter((i) => i.id !== payload.old!.id));
      }
    }
  );

  const favProds = getProducts().filter((p) => favIds.includes(p.id));

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
          <div className="text-xl font-extrabold">{favIds.length}</div>
        </div>
        <a href="/inquiry" className="bg-card border border-[var(--color-line)] rounded-2xl p-3.5 block">
          <div className="w-9 h-9 rounded-full bg-[var(--color-brand-soft)] grid place-items-center text-base mb-2">✉️</div>
          <div className="text-[11px] text-[var(--color-muted)]">{tr("myinq")}</div>
          <div className="text-xl font-extrabold">{inquiries.length}</div>
        </a>
      </div>

      <a href="/inquiry" className="block bg-[var(--color-accent)] text-white font-bold text-sm rounded-full py-3 text-center mb-4 shadow-[0_6px_18px_rgba(22,163,74,.3)]">
        + {tr("newInquiry")}
      </a>

      <div className="bg-card border border-[var(--color-line)] rounded-2xl p-4 mb-4">
        <div className="text-sm font-bold mb-2">{tr("fav")}</div>
        {favProds.length > 0 ? (
          <div className="grid grid-cols-2 gap-2.5">
            {favProds.map((p) => (
              <a key={p.id} href={"/product/" + p.id} className="bg-white border border-[var(--color-line)] rounded-xl overflow-hidden block">
                <div className="aspect-square grid place-items-center p-2 bg-[var(--color-bg)]">
                  {p.image ? <Image src={norm(p.image)} alt="" width={80} height={80} loading="lazy" className="w-full h-full object-contain" /> : <div className="text-2xl">📦</div>}
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
        {inquiries.length > 0 ? (
          <div className="space-y-3">
            {inquiries.map((inq) => (
              <div key={inq.id} className="bg-white border border-[var(--color-line)] rounded-xl p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold">{inq.id.slice(0, 8)}...</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                    {inq.status}
                  </span>
                </div>
                <div className="text-xs text-[var(--color-muted)]">
                  {new Date(inq.created_at).toLocaleDateString(lang === "zh" ? "zh-CN" : "fr-FR")}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-5">
            <div className="text-3xl mb-2">✉️</div>
            <div className="text-[13px] text-[var(--color-muted)]">{tr("noInq")}</div>
          </div>
        )}
      </div>
    </main>
  );
}