// src/app/account/loading.tsx
export default function AccountLoading() {
  return (
    <main className="max-w-[680px] mx-auto px-4 pt-4 space-y-4">
      <div className="h-12 w-full bg-[var(--color-brand-soft)]/30 rounded-full animate-pulse" />
      <div className="h-8 w-1/4 bg-[var(--color-brand-soft)]/30 rounded animate-pulse" />
      <div className="h-24 w-full bg-[var(--color-brand-soft)]/30 rounded-2xl animate-pulse" />
      <div className="grid grid-cols-2 gap-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-24 bg-[var(--color-brand-soft)]/30 rounded-2xl animate-pulse" />
        ))}
      </div>
      <div className="h-12 w-full bg-[var(--color-brand-soft)]/30 rounded-full animate-pulse" />
      <div className="space-y-3">
        <div className="h-6 w-1/4 bg-[var(--color-brand-soft)]/30 rounded animate-pulse" />
        <div className="space-y-2.5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-[var(--color-bg)] border border-[var(--color-line)] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </main>
  );
}