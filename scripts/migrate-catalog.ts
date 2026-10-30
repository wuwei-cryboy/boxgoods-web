// scripts/migrate-catalog.ts
// 将本地 catalog.json / i18n.json 迁移到 Supabase
// 运行方式：npx tsx scripts/migrate-catalog.ts

import "dotenv/config";  // 加载 .env.local 环境变量

import { createSupabaseAdminClient } from "@/lib/supabase/server";
import catalogRaw from "@/lib/data/catalog.json";
import i18nRaw from "@/lib/data/i18n.json";

const supabase = createSupabaseAdminClient();

// 类型定义（与 JSON 结构对应）
type CategoryJson = {
  id: string;
  fr: string;
  zh: string;
  icon?: string;
};

type SupplierJson = {
  id: string;
  name: string;
  country?: string;
  whatsapp?: string;
  phone?: string;
  email?: string;
  address?: string;
  warehouse?: string;
  licenseNo?: string;
  cats: string[];
  tag?: string;
  icon?: string;
  intro?: string;
};

type VariantJson = {
  type: "color" | "memory" | "model" | "spec";
  label: string;
  img?: string;
  price?: number;
};

type ProductJson = {
  id: string;
  cat: string;
  supplierId: string;
  image?: string;
  detailImages?: string[];
  nameFr: string;
  nameZh: string;
  priceMin?: number;
  priceMax?: number;
  currency?: string;
  moq?: number;
  boxSpec?: string;
  specs?: string[][];
  variants?: VariantJson[];
  sellingPoint?: string;
};

const CATALOG = catalogRaw as { categories: CategoryJson[]; suppliers: SupplierJson[]; products: ProductJson[] };
const I18N = i18nRaw as { fr: Record<string, string>; zh: Record<string, string> };

async function migrateCategories() {
  console.log("🔄 Migrating categories...");
  const { error } = await supabase.from("categories").upsert(
    CATALOG.categories.map((c, idx) => ({
      id: c.id,
      name_fr: c.fr,
      name_zh: c.zh,
      icon_svg: c.icon,
      sort_order: idx,
      is_active: true,
    }))
  );
  if (error) throw error;
  console.log(`✅ Categories: ${CATALOG.categories.length} rows`);
}

async function migrateSuppliers() {
  console.log("🔄 Migrating suppliers...");
  const { error } = await supabase.from("suppliers").upsert(
    CATALOG.suppliers.map((s) => ({
      id: s.id,
      name: s.name,
      country: s.country,
      whatsapp: s.whatsapp,
      phone: s.phone,
      email: s.email,
      address: s.address,
      warehouse: s.warehouse,
      license_no: s.licenseNo,
      tag: s.tag,
      icon_svg: s.icon,
      intro: s.intro,
      is_active: true,
    }))
  );
  if (error) throw error;

  // 供应商-分类关联
  const relations = CATALOG.suppliers.flatMap((s) =>
    s.cats.map((catId) => ({ supplier_id: s.id, category_id: catId }))
  );
  const { error: relError } = await supabase.from("supplier_categories").upsert(relations);
  if (relError) throw relError;
  console.log(`✅ Suppliers: ${CATALOG.suppliers.length} rows, relations: ${relations.length}`);
}

async function migrateProducts() {
  console.log("🔄 Migrating products...");
  let productCount = 0;
  let variantCount = 0;

  for (const p of CATALOG.products) {
    // 1. 插入产品
    const { error: prodError } = await supabase.from("products").upsert({
      id: p.id,
      category_id: p.cat,
      supplier_id: p.supplierId,
      image_url: p.image,
      name_fr: p.nameFr,
      name_zh: p.nameZh,
      price_min: p.priceMin ?? null,
      price_max: p.priceMax ?? null,
      currency: p.currency ?? "USD",
      moq: p.moq ?? null,
      box_spec: p.boxSpec,
      detail_images: p.detailImages ?? [],
      specs: p.specs ?? [],
      selling_point: p.sellingPoint,
      is_active: true,
    });
    if (prodError) throw prodError;
    productCount++;

    // 2. 插入变体
    if (p.variants?.length) {
      const variants = p.variants.map((v, idx) => ({
        product_id: p.id,
        variant_type: v.type,
        label: v.label,
        image_url: v.img,
        price: v.price ?? null,
        sort_order: idx,
        is_active: true,
      }));
      const { error: varError } = await supabase.from("product_variants").upsert(variants);
      if (varError) throw varError;
      variantCount += variants.length;
    }
  }
  console.log(`✅ Products: ${productCount} rows, Variants: ${variantCount} rows`);
}

async function migrateI18n() {
  console.log("🔄 Migrating i18n keys...");
  const allKeys = new Set([...Object.keys(I18N.fr), ...Object.keys(I18N.zh)]);
  const rows = Array.from(allKeys).map((key) => ({
    key,
    fr: I18N.fr[key] ?? null,
    zh: I18N.zh[key] ?? null,
  }));
  const { error } = await supabase.from("i18n_keys").upsert(rows);
  if (error) throw error;
  console.log(`✅ i18n keys: ${rows.length} rows`);
}

async function main() {
  console.log("🚀 Starting catalog migration to Supabase...\n");
  const start = Date.now();

  try {
    await migrateCategories();
    await migrateSuppliers();
    await migrateProducts();
    await migrateI18n();

    console.log(`\n🎉 Migration completed in ${((Date.now() - start) / 1000).toFixed(1)}s`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
}

main();