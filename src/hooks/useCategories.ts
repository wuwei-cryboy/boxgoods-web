// hooks/useCategories.ts
// 分类数据 Hook：统一分类获取入口

"use client";

import { useMemo } from "react";
import { 
  getCategoriesSync, 
  getSuppliersSync, 
  getSupplierSync,
  type Category,
  type Supplier,
} from "@/lib/catalog.client";

/** 获取所有分类 */
export function useCategories(): Category[] {
  return useMemo(() => getCategoriesSync(), []);
}

/** 获取单个分类 */
export function useCategory(categoryId: string | null | undefined): Category | undefined {
  return useMemo(() => {
    if (!categoryId) return undefined;
    return getCategoriesSync().find(c => c.id === categoryId);
  }, [categoryId]);
}

/** 获取所有供应商 */
export function useSuppliers(): Supplier[] {
  return useMemo(() => getSuppliersSync(), []);
}

/** 获取单个供应商 */
export function useSupplier(supplierId: string | null | undefined): Supplier | undefined {
  return useMemo(() => {
    if (!supplierId) return undefined;
    return getSupplierSync(supplierId);
  }, [supplierId]);
}

/** 获取分类的本地化名称 */
export function useCategoryName(categoryId: string | null | undefined, lang: "fr" | "zh" = "fr"): string | undefined {
  const category = useCategory(categoryId);
  return category ? (lang === "zh" ? category.zh : category.fr) : undefined;
}