"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useLang } from "@/lib/lang-context";
import { User } from "@supabase/supabase-js";

export default function UserMenu() {
  const { tr } = useLang();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      window.location.href = "/";
    } catch {
      alert("登出失败，请重试");
    }
  };

  if (loading || !user) return null;

  return (
    <div className="relative" onClick={() => setOpen(!open)}>
      <button
        className="flex items-center gap-2 px-3 py-2 rounded-full bg-[var(--color-bg)] border border-[var(--color-line)]"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <div className="w-8 h-8 rounded-full bg-[var(--color-brand-soft)] grid place-items-center text-[var(--color-brand)] font-bold text-sm">
          {user.email?.[0]?.toUpperCase() ?? "U"}
        </div>
        <span className="text-xs font-medium text-[var(--color-ink)] hidden sm:block">
          {user.email?.split("@")[0]}
        </span>
        <svg className="w-4 h-4 text-[var(--color-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[var(--color-line)] rounded-xl shadow-lg z-50 py-2">
            <div className="px-3 py-2 border-b border-[var(--color-line)]">
              <p className="text-xs font-medium text-[var(--color-ink)]">{user.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full px-3 py-2 text-left text-sm text-[var(--color-error)] hover:bg-[var(--color-error-soft)]"
            >
              {tr("logout")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}