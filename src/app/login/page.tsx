"use client";

import { WebSiteJsonLd } from "@/components/StructuredData";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/lang-context";
import { useSearchParams } from "next/navigation";

export default function Login() {
  const { tr } = useLang();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/account";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <>
      <WebSiteJsonLd />
      <main className="max-w-[680px] mx-auto px-4 pt-16 pb-20">
        <a href="/" className="text-xs text-[var(--color-muted)] inline-block mb-4">&larr; {tr("home")}</a>
        <div className="bg-card border border-[var(--color-line)] rounded-2xl p-6">
          <h1 className="text-2xl font-extrabold mb-2">{sent ? tr("checkEmail") : tr("loginTitle")}</h1>
          <p className="text-[var(--color-muted)] mb-6">
            {sent
              ? tr("magicLinkSent")
              : tr("magicLinkDesc")}
          </p>

          {!sent && (
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">{tr("email")}</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={tr("emailPlaceholder")}
                  className="w-full border border-[var(--color-line)] rounded-xl px-4 py-3 text-sm bg-[var(--color-bg)] outline-none focus:border-[var(--color-accent)]"
                />
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="bg-[var(--color-accent)] text-white font-bold rounded-full py-3 text-sm w-full shadow-[0_6px_18px_rgba(22,163,74,.3)] disabled:opacity-50"
              >
                {loading ? tr("sending") : tr("sendMagicLink")}
              </button>
            </form>
          )}

          {sent && (
            <div className="text-center">
              <p className="text-lg font-semibold text-[var(--color-accent)] mb-4">✅</p>
              <p className="text-[var(--color-muted)]">{tr("magicLinkSentDetail")}</p>
              <a
                href={redirect}
                className="mt-4 inline-block text-sm text-[var(--color-accent)] font-semibold underline"
              >
                {tr("backToApp")}
              </a>
            </div>
          )}
        </div>
      </main>
    </>
  );
}