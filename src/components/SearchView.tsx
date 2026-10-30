"use client";

// components/SearchView.tsx
import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLang } from "@/lib/lang-context";
import { trackSearch } from "@/lib/analytics";
// trackClick is intentionally not used in this file.

type SearchResult = {
  id: string;
  cat: string;
  image?: string;
  nameFr: string;
  nameZh: string;
  nameFrHighlighted: string;
  nameZhHighlighted: string;
  priceMin?: number;
  priceMax?: number;
  currency?: string;
  moq?: number;
  boxSpec?: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

type SearchResponse = {
  success: boolean;
  data: SearchResult[];
  pagination: Pagination;
  query: { q: string; cat?: string; sort: string; lang: string };
  error?: string;
};

export default function SearchView() {
  const sp = useSearchParams();
  const router = useRouter();
  const { lang, tr } = useLang();

  const [q, setQ] = useState(sp.get("q") || "");
  const [cat, _setCat] = useState(sp.get("cat") || "");
  const [sort, setSort] = useState(sp.get("sort") || "relevance");
  const [page, setPage] = useState(Number(sp.get("page")) || 1);

  const [results, setResults] = useState<SearchResult[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [_error, setError] = useState<string | null>(null);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSearch = useCallback(async (searchParams: URLSearchParams, append = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/search?${searchParams.toString()}`);
      const json: SearchResponse = await res.json();
      if (!json.success) throw new Error(json.error || "搜索失败");
      setResults((prev) => (append ? [...prev, ...json.data] : json.data));
      setPagination(json.pagination);
      // 埋点：搜索结果
      if (q.trim() && !append) {
        trackSearch(q.trim(), json.pagination.total, lang);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "搜索失败");
    } finally {
      setLoading(false);
    }
  }, [lang]);

  // 防抖搜索
  const debouncedSearch = useCallback(
    (params: URLSearchParams) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        fetchSearch(params);
      }, 300);
    },
    [fetchSearch]
  );

  // 查询参数变化触发搜索
  useEffect(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (cat) params.set("cat", cat);
    params.set("sort", sort);
    params.set("page", "1");
    params.set("lang", lang);
    setPage(1);
    debouncedSearch(params);
    // 埋点：搜索触发
    if (q.trim()) trackSearch(q.trim(), 0, lang);
  }, [q, cat, sort, lang, debouncedSearch]);

  // 加载更多
  const loadMore = () => {
    if (!pagination || !pagination.hasNext || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (cat) params.set("cat", cat);
    params.set("sort", sort);
    params.set("page", String(nextPage));
    params.set("lang", lang);
    fetchSearch(params, true);
  };

  // 更新 URL（不触发重新搜索）
  const updateUrl = () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (cat) params.set("cat", cat);
    if (sort !== "relevance") params.set("sort", sort);
    router.replace(`/search?${params.toString()}`, { scroll: false });
  };

  // 输入处理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQ(value);
    updateUrl();
  };

  const handleSortChange = (newSort: string) => {
    setSort(newSort);
    updateUrl();
  };

  const displayName = (r: SearchResult) => (lang === "zh" ? r.nameZhHighlighted || r.nameZh : r.nameFrHighlighted || r.nameFr);

  return (
    <main className="max-w-[680px] mx-auto px-4 pt-3.5">
      <a href="/" className="text-xs text-[var(--color-muted)] inline-block mb-2">&larr; {tr("home")}</a>
      <div className="text-lg font-extrabold mb-3">{tr("recherche")}</div>
      <input
        value={q}
        onChange={handleInputChange}
        placeholder={tr("searchPh")}
        autoFocus
        className="w-full border border-[var(--color-line)] rounded-xl px-4 py-3 text-sm bg-[var(--color-bg)] outline-none focus:border-[var(--color-accent)] focus:bg-card transition"
      />

      {/* 排序选择 */}
      <div className="flex items-center gap-2 mt-3 mb-2">
        <span className="text-xs text-[var(--color-muted)]">{tr("sort") || "排序"}</span>
        <select
          value={sort}
          onChange={(e) => handleSortChange(e.target.value)}
          className="flex-1 border border-[var(--color-line)] rounded-xl px-3 py-2 text-sm bg-[var(--color-bg)] outline-none focus:border-[var(--color-accent)]"
        >
          <option value="relevance">{tr("sortRelevance") || "相关度"}</option>
          <option value="price_asc">{tr("sortPriceAsc") || "价格升序"}</option>
          <option value="price_desc">{tr("sortPriceDesc") || "价格降序"}</option>
          <option value="newest">{tr("sortNewest") || "最新"}</option>
        </select>
      </div>

      <div className="mt-4">
        {q.trim() === "" && <div className="text-xs text-[var(--color-muted)]">{tr("searchPh")}</div>}
        {q.trim() !== "" && results.length === 0 && !loading && (
          <div className="text-center text-[var(--color-muted)] py-10">{tr("nores")}</div>
        )}
        {results.map((r) => (
          <a
            key={r.id}
            href={"/product/" + r.id}
            className="flex items-center gap-3 bg-card border border-[var(--color-line)] rounded-[14px] p-3 mb-2.5"
          >
            <span className="w-12 h-12 rounded-[10px] bg-[var(--color-brand-soft)] grid place-items-center overflow-hidden shrink-0">
              {r.image ? <Image src={r.image} alt="" width={48} height={48} loading="lazy" className="w-full h-full object-contain" /> : <span>📦</span>}
            </span>
            <span className="flex-1 min-w-0">
              <span className="font-bold text-sm truncate block" dangerouslySetInnerHTML={{ __html: displayName(r) }} />
              <span className="text-xs text-[var(--color-muted)] mt-0.5 block">{r.boxSpec}</span>
              {r.priceMin && (
                <span className="text-xs font-bold text-[var(--color-accent)] mt-0.5 block">
                  {r.priceMin}{r.priceMax && r.priceMax !== r.priceMin ? `–${r.priceMax}` : ""} {r.currency || "USD"}
                </span>
              )}
            </span>
            <span className="text-[var(--color-muted)]">&rsaquo;</span>
          </a>
        ))}
        {pagination && pagination.hasNext && (
          <button
            onClick={loadMore}
            disabled={loading}
            className="w-full mt-4 py-3 text-sm font-semibold text-[var(--color-brand)] border border-[var(--color-brand)] rounded-xl disabled:opacity-50"
          >
            {loading ? "加载中…" : `${tr("loadMore") || "加载更多"} (${results.length}/${pagination.total})`}
          </button>
        )}
      </div>
    </main>
  );
}