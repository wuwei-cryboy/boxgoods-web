// src/app/search/loading.tsx
export default function SearchLoading() {
  return (
    <main className="max-w-[680px] mx-auto px-4 pt-4 space-y-4">
      <div className="h-12 w-full bg-[var(--color-brand-soft)]/30 rounded-full animate-pulse" />
      <div className="h-8 w-1/4 bg-[var(--color-brand-soft)]/30 rounded animate-pulse" />
      <div className="h-12 w-full bg-[var(--color-brand-soft)]/30 rounded-xl animate-pulse" />
      <div className="space-y-2.5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-16 bg-[var(--color-bg)] border border-[var(--color-line)] rounded-[14px] animate-pulse" />
        ))}
      </div>
    </main>
  );
}