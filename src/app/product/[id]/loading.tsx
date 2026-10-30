// src/app/product/[id]/loading.tsx
export default function ProductLoading() {
  return (
    <main className="max-w-[680px] mx-auto px-4 pt-4 space-y-4">
      <div className="h-12 w-full bg-[var(--color-brand-soft)]/30 rounded-full animate-pulse" />
      <div className="aspect-square bg-[var(--color-brand-soft)]/30 rounded-3xl animate-pulse max-w-[360px] mx-auto" />
      <div className="space-y-2 px-4">
        <div className="h-8 w-1/2 bg-[var(--color-brand-soft)]/30 rounded animate-pulse" />
        <div className="h-4 w-1/4 bg-[var(--color-brand-soft)]/30 rounded animate-pulse" />
        <div className="h-4 w-1/3 bg-[var(--color-brand-soft)]/30 rounded animate-pulse" />
        <div className="h-12 w-full bg-[var(--color-brand-soft)]/30 rounded-full animate-pulse max-w-xs" />
      </div>
      <div className="h-32 bg-[var(--color-brand-soft)]/30 rounded-xl animate-pulse px-4" />
      <div className="space-y-3 px-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 bg-[var(--color-brand-soft)]/30 rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="h-12 w-full bg-[var(--color-brand-soft)]/30 rounded-full animate-pulse max-w-xs mx-4" />
      <div className="space-y-2 px-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-4 w-1/3 bg-[var(--color-brand-soft)]/30 rounded animate-pulse" />
        ))}
      </div>
    </main>
  );
}