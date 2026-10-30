// scripts/migrate-catalog.mjs
// 纯 ES 模块迁移脚本：不需要 tsx，直接用 node 运行
// 运行：node scripts/migrate-catalog.mjs

import { config } from "dotenv";
import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

// 显式加载 .env.local
config({ path: resolve(".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ 缺少环境变量：NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY");
  console.error("当前工作目录:", process.cwd());
  console.error("环境变量:", {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// 读取本地 JSON
const catalog = JSON.parse(readFileSync(resolve("src/lib/data/catalog.json"), "utf-8"));
const i18n = JSON.parse(readFileSync(resolve("src/lib/data/i18n.json"), "utf-8"));

async function main() {
  console.log("🚀 Starting catalog migration to Supabase...\n");

  // 1. Categories
  console.log("🔄 Migrating categories...");
  const catRows = catalog.categories.map((c, idx) => ({
    id: c.id,
    name_fr: c.fr,
    name_zh: c.zh,
    icon_svg: c.icon,
    sort_order: idx,
    is_active: true,
  }));
  const { error: catErr } = await supabase.from("categories").upsert(catRows);
  if (catErr) throw catErr;
  console.log(`✅ Categories: ${catRows.length} rows`);

  // 2. Suppliers
  console.log("🔄 Migrating suppliers...");
  const supRows = catalog.suppliers.map((s) => ({
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
  }));
  const { error: supErr } = await supabase.from("suppliers").upsert(supRows);
  if (supErr) throw supErr;

  const relRows = catalog.suppliers.flatMap((s) =>
    s.cats.map((catId) => ({ supplier_id: s.id, category_id: catId }))
  );
  const { error: relErr } = await supabase.from("supplier_categories").upsert(relRows);
  if (relErr) throw relErr;
  console.log(`✅ Suppliers: ${supRows.length} rows, relations: ${relRows.length}`);

  // 3. Products + Variants
  console.log("🔄 Migrating products...");
  let productCount = 0;
  let variantCount = 0;

  for (const p of catalog.products) {
    const { error: prodErr } = await supabase.from("products").upsert({
      id: p.id,
      category_id: p.cat,
      supplier_id: p.supplierId,
      image_url: p.image,
      name_fr: p.nameFr,
      name_zh: p.nameZh ?? p.nameFr ?? "",
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
    if (prodErr) throw prodErr;
    productCount++;

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
      const { error: varErr } = await supabase.from("product_variants").upsert(variants);
      if (varErr) throw varErr;
      variantCount += variants.length;
    }
  }
  console.log(`✅ Products: ${productCount} rows, Variants: ${variantCount} rows`);

  // 4. i18n keys
  console.log("🔄 Migrating i18n keys...");
  const allKeys = new Set([...Object.keys(i18n.fr), ...Object.keys(i18n.zh)]);
  const i18nRows = Array.from(allKeys).map((key) => ({
    key,
    fr: i18n.fr[key] ?? null,
    zh: i18n.zh[key] ?? null,
  }));
  const { error: i18nErr } = await supabase.from("i18n_keys").upsert(i18nRows);
  if (i18nErr) throw i18nErr;
  console.log(`✅ i18n keys: ${i18nRows.length} rows`);

  console.log("\n🎉 Migration completed!");
}

main().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});