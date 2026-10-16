import raw from "./data/catalog.json";
import i18nRaw from "./data/i18n.json";

export type Category = { id: string; fr: string; zh: string; icon?: string };
export type Supplier = { id: string; name: string; address: string; phone?: string; wa?: string; icon?: string };
export type Variant = { type: "color"|"memory"|"model"|"spec"; label: string; img?: string; price?: number };
export type Product = {
  id: string; cat: string; supplierId: string; image?: string;
  detailImages?: string[]; nameFr: string; nameZh: string;
  priceMin?: number; priceMax?: number; currency?: string; moq?: number;
  boxSpec?: string; specs?: string[][]; variants?: Variant[];
};

// 本地数据层（以后接 MongoDB 只改这里，接口不变）
const CATALOG = raw as unknown as { categories: Category[]; suppliers: Supplier[]; products: Product[] };

export const getCategories = (): Category[] => CATALOG.categories;
export const getSuppliers = (): Supplier[] => CATALOG.suppliers;
export const getProducts = (): Product[] => CATALOG.products;
export const getProductsByCat = (cat: string): Product[] => CATALOG.products.filter(p => p.cat === cat);
export const getProduct = (id: string): Product | undefined => CATALOG.products.find(p => p.id === id);
export const getSupplier = (id: string): Supplier | undefined => CATALOG.suppliers.find(s => s.id === id);

export const I18N = i18nRaw as unknown as { fr: Record<string, string>; zh: Record<string, string> };
export type Lang = "fr" | "zh";
export const t = (lang: Lang, key: string): string => I18N[lang][key] ?? I18N.fr[key] ?? key;
