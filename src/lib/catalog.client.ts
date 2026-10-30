// lib/catalog.client.ts
// 客户端安全的目录数据：直接读取本地 JSON，不依赖 next/headers
// 仅供 Client Components / Hooks 使用，服务端请使用 lib/catalog.ts

import catalogRaw from "./data/catalog.json";
import i18nRaw from "./data/i18n.json";
import type { Lang } from "./i18n/config";

export type Category = { id: string; fr: string; zh: string; icon?: string };
export type Supplier = { id: string; name: string; address: string; phone?: string; wa?: string; icon?: string };
export type Variant = { type: "color"|"memory"|"model"|"spec"; label: string; img?: string; price?: number };
export type Product = {
  id: string; cat: string; supplierId: string; image?: string;
  detailImages?: string[]; nameFr: string; nameZh: string;
  priceMin?: number; priceMax?: number; currency?: string; moq?: number;
  boxSpec?: string; specs?: string[][]; variants?: Variant[];
};

const CATALOG = catalogRaw as unknown as { categories: Category[]; suppliers: Supplier[]; products: Product[] };
const I18N = i18nRaw as unknown as { fr: Record<string, string>; zh: Record<string, string> };

export const getCategoriesSync = (): Category[] => CATALOG.categories;
export const getSuppliersSync = (): Supplier[] => CATALOG.suppliers;
export const getProductsSync = (): Product[] => CATALOG.products;
export const getProductsByCatSync = (cat: string): Product[] => CATALOG.products.filter(p => p.cat === cat);
export const getProductSync = (id: string): Product | undefined => CATALOG.products.find(p => p.id === id);
export const getSupplierSync = (id: string): Supplier | undefined => CATALOG.suppliers.find(s => s.id === id);

export const getProductsFilteredSync = (cat?: string): Product[] => 
  cat ? CATALOG.products.filter(p => p.cat === cat) : CATALOG.products;

/** 分页查询选项 */
export interface ProductQueryOptions {
  query?: string;
  category?: string;
  sortBy?: "relevance" | "price_asc" | "price_desc" | "newest" | "name_asc" | "name_desc";
  page?: number;
  limit?: number;
  lang?: Lang;
}

/** 分页查询结果 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/** 客户端分页查询（基于本地 JSON） */
export function getProductsPaginatedSync(options: ProductQueryOptions = {}): PaginatedResult<Product> {
  const { query, category, sortBy = "relevance", page = 1, limit = 20, lang = "fr" as Lang } = options;

  let filtered = CATALOG.products;

  if (category) {
    filtered = filtered.filter(p => p.cat === category);
  }

  if (query?.trim()) {
    const q = query.trim().toLowerCase();
    filtered = filtered.filter(p => 
      p.nameFr.toLowerCase().includes(q) || (p.nameZh || "").toLowerCase().includes(q)
    );
  }

  const langKey = lang === "zh" ? "nameZh" : "nameFr";
  switch (sortBy) {
    case "price_asc":
      filtered.sort((a, b) => (a.priceMin ?? 0) - (b.priceMin ?? 0));
      break;
    case "price_desc":
      filtered.sort((a, b) => (b.priceMin ?? 0) - (a.priceMin ?? 0));
      break;
    case "name_asc":
      filtered.sort((a, b) => (a[langKey] || "").localeCompare(b[langKey] || ""));
      break;
    case "name_desc":
      filtered.sort((a, b) => (b[langKey] || "").localeCompare(a[langKey] || ""));
      break;
    case "newest":
      filtered.reverse();
      break;
    case "relevance":
    default:
      break;
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const safePage = Math.max(1, Math.min(page, totalPages));
  const start = (safePage - 1) * limit;
  const data = filtered.slice(start, start + limit);

  return {
    data,
    pagination: {
      page: safePage,
      limit,
      total,
      totalPages,
      hasNext: safePage < totalPages,
      hasPrev: safePage > 1,
    },
  };
}

export { type Lang } from "./i18n/config";
export const tSync = (lang: Lang, key: string): string => 
  I18N[lang]?.[key] ?? I18N.fr[key] ?? key;