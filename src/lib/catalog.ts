import { createSupabaseServerClient } from "./supabase/server";
import type { Lang } from "./i18n/config";

// 类型定义（保持与原接口兼容）
export type Category = { id: string; fr: string; zh: string; icon?: string };
export type Supplier = { id: string; name: string; address: string; phone?: string; wa?: string; icon?: string };
export type Variant = { type: "color"|"memory"|"model"|"spec"; label: string; img?: string; price?: number };
export type Product = {
  id: string; cat: string; supplierId: string; image?: string;
  detailImages?: string[]; nameFr: string; nameZh: string;
  priceMin?: number; priceMax?: number; currency?: string; moq?: number;
  boxSpec?: string; specs?: string[][]; variants?: Variant[];
};

/** 通用产品查询选项 */
export interface ProductQueryOptions {
  /** 关键词搜索（匹配 nameFr/nameZh） */
  query?: string;
  /** 分类筛选 */
  category?: string;
  /** 排序字段 */
  sortBy?: "relevance" | "price_asc" | "price_desc" | "newest" | "name_asc" | "name_desc";
  /** 分页：页码（从 1 开始） */
  page?: number;
  /** 分页：每页条数 */
  limit?: number;
  /** 语言（影响 relevance 排序时的名称匹配优先级） */
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

/**
 * 获取 Supabase 客户端（服务端专用）
 * 客户端组件请使用 hooks/useProducts.ts
 */
async function getClient() {
  return createSupabaseServerClient();
}

/**
 * 将数据库行转换为前端 Product 类型
 */
function mapProductRow(row: Record<string, unknown>): Product {
  return {
    id: row.id as string,
    cat: row.category_id as string,
    supplierId: row.supplier_id as string,
    image: row.image_url as string | undefined,
    detailImages: (row.detail_images as string[]) ?? [],
    nameFr: row.name_fr as string,
    nameZh: row.name_zh as string,
    priceMin: row.price_min ? Number(row.price_min) : undefined,
    priceMax: row.price_max ? Number(row.price_max) : undefined,
    currency: row.currency as string,
    moq: row.moq ? Number(row.moq) : undefined,
    boxSpec: row.box_spec as string | undefined,
    specs: (row.specs as string[][]) ?? [],
    variants: (row.variants as Array<Record<string, unknown>> | undefined)?.map((v) => ({
      type: v.variant_type as "color" | "memory" | "model" | "spec",
      label: v.label as string,
      img: v.image_url as string | undefined,
      price: v.price ? Number(v.price) : undefined,
    })) ?? [],
  };
}

function mapCategoryRow(row: Record<string, unknown>): Category {
  return {
    id: row.id as string,
    fr: row.name_fr as string,
    zh: row.name_zh as string,
    icon: row.icon_svg as string | undefined,
  };
}

function mapSupplierRow(row: Record<string, unknown>): Supplier {
  return {
    id: row.id as string,
    name: row.name as string,
    address: (row.address as string) ?? "",
    phone: row.phone as string | undefined,
    wa: row.whatsapp as string | undefined,
    icon: row.icon_svg as string | undefined,
  };
}

// 简单内存缓存（生产环境建议用 Redis）
const cache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL = 60 * 1000; // 1分钟

async function cachedQuery<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expires > now) {
    return hit.data as T;
  }
  const data = await fetcher();
  cache.set(key, { data, expires: now + CACHE_TTL });
  return data;
}

/**
 * 获取所有分类（带缓存）
 */
export async function getCategories(): Promise<Category[]> {
  return cachedQuery("categories:all", async () => {
    const supabase = await getClient();
    const { data, error } = await supabase
      .from("categories")
      .select("id, name_fr, name_zh, icon_svg")
      .eq("is_active", true)
      .order("sort_order");
    if (error) throw error;
    return (data ?? []).map(mapCategoryRow);
  });
}

/**
 * 获取单个分类
 */
export async function getCategory(id: string): Promise<Category | undefined> {
  const categories = await getCategories();
  return categories.find(c => c.id === id);
}

/**
 * 获取所有供应商
 */
export async function getSuppliers(): Promise<Supplier[]> {
  return cachedQuery("suppliers:all", async () => {
    const supabase = await getClient();
    const { data, error } = await supabase
      .from("suppliers")
      .select("id, name, address, phone, whatsapp, icon_svg")
      .eq("is_active", true);
    if (error) throw error;
    return (data ?? []).map(mapSupplierRow);
  });
}

/**
 * 获取单个供应商
 */
export async function getSupplier(id: string): Promise<Supplier | undefined> {
  const suppliers = await getSuppliers();
  return suppliers.find(s => s.id === id);
}

/**
 * 获取所有产品（带缓存）
 */
export async function getProducts(): Promise<Product[]> {
  return cachedQuery("products:all", async () => {
    const supabase = await getClient();
    const { data, error } = await supabase
      .from("products")
      .select(`
        id, category_id, supplier_id, image_url, name_fr, name_zh,
        price_min, price_max, currency, moq, box_spec,
        detail_images, specs, variants:product_variants(variant_type, label, image_url, price)
      `)
      .eq("is_active", true);
    if (error) throw error;
    return (data ?? []).map(mapProductRow);
  });
}

/**
 * 按分类获取产品
 */
export async function getProductsByCat(categoryId: string): Promise<Product[]> {
  return cachedQuery(`products:cat:${categoryId}`, async () => {
    const supabase = await getClient();
    const { data, error } = await supabase
      .from("products")
      .select(`
        id, category_id, supplier_id, image_url, name_fr, name_zh,
        price_min, price_max, currency, moq, box_spec,
        detail_images, specs, variants:product_variants(variant_type, label, image_url, price)
      `)
      .eq("category_id", categoryId)
      .eq("is_active", true);
    if (error) throw error;
    return (data ?? []).map(mapProductRow);
  });
}

/**
 * 获取单个产品
 */
export async function getProduct(id: string): Promise<Product | undefined> {
  return cachedQuery(`product:${id}`, async () => {
    const supabase = await getClient();
    const { data, error } = await supabase
      .from("products")
      .select(`
        id, category_id, supplier_id, image_url, name_fr, name_zh,
        price_min, price_max, currency, moq, box_spec,
        detail_images, specs, variants:product_variants(variant_type, label, image_url, price)
      `)
      .eq("id", id)
      .eq("is_active", true)
      .single();
    if (error) {
      if (error.code === "PGRST116") return undefined;
      throw error;
    }
    return data ? mapProductRow(data) : undefined;
  });
}

/**
 * 通用产品分页查询（走 Supabase，支持全文搜索、排序、分页）
 */
export async function getProductsPaginated(options: ProductQueryOptions = {}): Promise<PaginatedResult<Product>> {
  const { query, category, sortBy = "relevance", page = 1, limit = 20, lang = "fr" as Lang } = options;

  const supabase = await getClient();

  let qb = supabase
    .from("products")
    .select(`
      id, category_id, supplier_id, image_url, name_fr, name_zh,
      price_min, price_max, currency, moq, box_spec,
      detail_images, specs, variants:product_variants(variant_type, label, image_url, price)
    `, { count: "exact" })
    .eq("is_active", true);

  // 分类筛选
  if (category) {
    qb = qb.eq("category_id", category);
  }

  // 关键词搜索（使用 ilike 模糊匹配）
  if (query?.trim()) {
    const q = query.trim();
    qb = qb.or(`name_fr.ilike.%${q}%,name_zh.ilike.%${q}%`);
  }

  // 排序
  const sortMap: Record<string, { column: string; ascending: boolean }> = {
    price_asc: { column: "price_min", ascending: true },
    price_desc: { column: "price_min", ascending: false },
    name_asc: { column: lang === "zh" ? "name_zh" : "name_fr", ascending: true },
    name_desc: { column: lang === "zh" ? "name_zh" : "name_fr", ascending: false },
    newest: { column: "created_at", ascending: false },
    relevance: { column: "sort_order", ascending: true }, // 默认按 sort_order
  };
  const sort = sortMap[sortBy] ?? sortMap.relevance;
  qb = qb.order(sort.column, { ascending: sort.ascending });

  // 分页
  const safePage = Math.max(1, page);
  const from = (safePage - 1) * limit;
  const to = from + limit - 1;
  qb = qb.range(from, to);

  const { data, error, count } = await qb;
  if (error) throw error;

  const total = count ?? 0;
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    data: (data ?? []).map(mapProductRow),
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

/** 简易别名：保持旧调用风格兼容 */
export const getProductsFiltered = async (cat?: string): Promise<Product[]> =>
  cat ? getProductsByCat(cat) : getProducts();

/** 国际化翻译（走 Supabase i18n_keys 表） */
export async function t(lang: Lang, key: string): Promise<string> {
  return cachedQuery(`i18n:${lang}:${key}`, async () => {
    const supabase = await getClient();
    const { data, error } = await supabase
      .from("i18n_keys")
      .select(lang === "zh" ? "zh" : "fr")
      .eq("key", key)
      .single();
    if (error || !data) return key;
    const row = data as Record<string, unknown>;
    return (row[lang === "zh" ? "zh" : "fr"] as string) ?? key;
  });
}

// 向后兼容：同步版本（仅用于已迁移前的过渡期，建议逐步替换为异步版本）
// 注意：这些同步函数会阻塞事件循环，仅作为过渡方案
let syncCache: { categories?: Category[]; suppliers?: Supplier[]; products?: Product[] } = {};

function ensureSyncCache() {
  if (!syncCache.categories || !syncCache.suppliers || !syncCache.products) {
    // 这里无法真正同步获取，实际使用请改用异步版本
    // 保留空数组避免运行时崩溃，实际数据通过异步 API 获取
    syncCache = { categories: [], suppliers: [], products: [] };
  }
}

export const getCategoriesSync = (): Category[] => { ensureSyncCache(); return syncCache.categories ?? []; };
export const getSuppliersSync = (): Supplier[] => { ensureSyncCache(); return syncCache.suppliers ?? []; };
export const getProductsSync = (): Product[] => { ensureSyncCache(); return syncCache.products ?? []; };
export const getProductsByCatSync = (cat: string): Product[] => getProductsSync().filter(p => p.cat === cat);
export const getProductSync = (id: string): Product | undefined => getProductsSync().find(p => p.id === id);
export const getSupplierSync = (id: string): Supplier | undefined => getSuppliersSync().find(s => s.id === id);

// 导出类型和翻译键
export { type Lang } from "./i18n/config";

// 同步翻译（过渡期使用，建议改用异步 t()）
const i18nSyncCache: { fr: Record<string, string>; zh: Record<string, string> } = { fr: {}, zh: {} };
export const tSync = (lang: Lang, key: string): string => 
  i18nSyncCache[lang]?.[key] ?? i18nSyncCache.fr[key] ?? key;
