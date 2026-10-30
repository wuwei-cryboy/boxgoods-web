// src/app/loading.tsx
export default function Loading() {
  return (
    <main className="max-w-[680px] mx-auto px-4 pt-4 space-y-4">
      {/* Header skeleton */}
      <div className="h-12 w-full bg-[var(--color-brand-soft)]/30 rounded-full animate-pulse" />
      {/* Hero / content skeleton */}
      <div className="space-y-3">
        <div className="h-[180px] w-full bg-[var(--color-brand-soft)]/30 rounded-2xl animate-pulse" />
        <div className="h-8 w-3/4 bg-[var(--color-brand-soft)]/30 rounded animate-pulse" />
        <div className="h-4 w-1/2 bg-[var(--color-brand-soft)]/30 rounded animate-pulse" />
      </div>
      {/* Grid items skeleton */}
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="aspect-square bg-[var(--color-brand-soft)]/30 rounded-xl animate-pulse" />
            <div className="h-5 w-3/4 bg-[var(--color-brand-soft)]/30 rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-[var(--color-brand-soft)]/30 rounded animate-pulse" />
          </div>
        ))}
      </div>
      {/* List items skeleton */}
      <div className="space-y-2.5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-[var(--color-bg)] border border-[var(--color-line)] rounded-[14px] animate-pulse" />
        ))}
      </div>
    </main>
  );
}