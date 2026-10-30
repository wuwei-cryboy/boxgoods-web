// src/app/inquiry/loading.tsx
export default function InquiryLoading() {
  return (
    <main className="max-w-[680px] mx-auto px-4 pt-4 space-y-4">
      <div className="h-12 w-full bg-[var(--color-brand-soft)]/30 rounded-full animate-pulse" />
      <div className="h-8 w-1/4 bg-[var(--color-brand-soft)]/30 rounded animate-pulse" />
      <div className="space-y-3 bg-[var(--color-bg)] border border-[var(--color-line)] rounded-2xl p-4 animate-pulse">
        <div className="h-6 w-1/3 bg-[var(--color-brand-soft)]/30 rounded animate-pulse" />
        <div className="space-y-2.5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-10 w-full bg-[var(--color-brand-soft)]/30 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-12 w-full bg-[var(--color-brand-soft)]/30 rounded-full animate-pulse mt-4" />
      </div>
    </main>
  );
}