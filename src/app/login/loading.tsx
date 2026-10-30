// app/login/loading.tsx
export default function LoginLoading() {
  return (
    <main className="max-w-[680px] mx-auto px-4 pt-16 pb-20">
      <div className="bg-card border border-[var(--color-line)] rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[var(--color-line)] rounded w-1/3"></div>
          <div className="h-4 bg-[var(--color-line)] rounded w-full"></div>
          <div className="h-4 bg-[var(--color-line)] rounded w-3/4"></div>
          <div className="h-12 bg-[var(--color-line)] rounded w-full mt-4"></div>
        </div>
      </div>
    </main>
  );
}