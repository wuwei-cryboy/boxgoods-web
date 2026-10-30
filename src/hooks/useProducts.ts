// hooks/useProducts.ts
// 产品数据 Hook：统一数据获取入口，内部可接入 SWR/TanStack Query
// 当前实现：使用 catalog 同步兼容函数，保持向后兼容
// 未来可平滑升级为 useSWR/useQuery + 服务端 API

"use client";

import { useMemo } from "react";
import { 
  getProductsSync, 
  getProductsByCatSync, 
  getProductSync, 
  getProductsFilteredSync,
  getProductsPaginatedSync,
  type Product,
  type ProductQueryOptions,
  type PaginatedResult,
} from "@/lib/catalog.client";

/** 获取所有产品（同步，适合 Client Component 直接使用） */
export function useProducts(): Product[] {
  return useMemo(() => getProductsSync(), []);
}

/** 按分类获取产品 */
export function useProductsByCategory(categoryId: string | null | undefined): Product[] {
  return useMemo(() => {
    if (!categoryId) return getProductsSync();
    return getProductsByCatSync(categoryId);
  }, [categoryId]);
}

/** 获取单个产品 */
export function useProduct(productId: string | null | undefined): Product | undefined {
  return useMemo(() => {
    if (!productId) return undefined;
    return getProductSync(productId);
  }, [productId]);
}

/** 通用分页查询 Hook（可替换为 SWR/React Query） */
export function useProductsPaginated(options: ProductQueryOptions = {}): PaginatedResult<Product> {
  return useMemo(() => getProductsPaginated(options), [
    options.query,
    options.category,
    options.sortBy,
    options.page,
    options.limit,
    options.lang,
  ]);
}

/** 搜索产品（关键词 + 分类 + 分页） */
export function useProductSearch(
  query: string,
  category?: string,
  page = 1,
  limit = 20,
  sortBy: ProductQueryOptions["sortBy"] = "relevance",
  lang: ProductQueryOptions["lang"] = "fr"
): PaginatedResult<Product> {
  return useProductsPaginated({ query, category, page, limit, sortBy, lang });
}

/** 兼容旧 API：getProductsFiltered 的 Hook 版本 */
export function useProductsFiltered(categoryId?: string): Product[] {
  return useMemo(() => getProductsFilteredSync(categoryId), [categoryId]);
}

/** 批量获取多个分类的产品（避免在循环中调用 Hook） */
export function useProductsByCategories(categoryIds: (string | undefined)[]): Record<string, Product[]> {
  return useMemo(() => {
    const result: Record<string, Product[]> = {};
    for (const id of categoryIds) {
      if (id) {
        result[id] = getProductsByCatSync(id);
      }
    }
    return result;
  }, [categoryIds]);
}