import type { Metadata } from "next";
import { getProduct, getCategories, getSupplier } from "@/lib/catalog";
import { getTranslation, getLocale } from "@/lib/lang";
import { norm } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const lang = await getLocale();
  const prod = await getProduct(id);

  if (!prod) {
    return { title: "Produit introuvable", robots: { index: false, follow: false } };
  }

  const categories = await getCategories();
  const cat = categories.find((c) => c.id === prod.cat);
  const sup = await getSupplier(prod.supplierId);
  const name = lang === "zh" ? prod.nameZh : prod.nameFr;
  const catName = cat ? (lang === "zh" ? cat.zh : cat.fr) : prod.cat;
  const moqLabel = await getTranslation("moq");
  const priceRange = prod.priceMin && prod.priceMax && prod.priceMin !== prod.priceMax
    ? `${prod.priceMin}–${prod.priceMax} ${prod.currency || "USD"}`
    : prod.priceMin
    ? `${prod.priceMin} ${prod.currency || "USD"}`
    : await getTranslation("priceOnRequest");

  return {
    title: name,
    description: `${name} — ${catName} · ${moqLabel} ${prod.moq} · ${priceRange} · ${sup?.name || "Fournisseur vérifié"}`,
    openGraph: {
      title: name,
      description: `${name} — ${catName} · ${moqLabel} ${prod.moq} · ${priceRange}`,
      type: "website",
      locale: lang === "zh" ? "zh_CN" : "fr_FR",
      images: prod.image ? [{ url: norm(prod.image), width: 800, height: 800, alt: name }] : ["/img/og-default.webp"],
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description: `${catName} · ${moqLabel} ${prod.moq} · ${priceRange}`,
      images: prod.image ? [norm(prod.image)] : ["/img/og-default.webp"],
    },
    robots: { index: true, follow: true },
    other: {
      "product:brand": sup?.name || "BoxGoods",
      "product:category": catName,
      "product:price:amount": String(prod.priceMin || 0),
      "product:price:currency": prod.currency || "USD",
      "product:availability": "in_stock",
    },
    alternates: {
      languages: {
        fr: `/fr/product/${id}`,
        zh: `/zh/product/${id}`,
        "x-default": `/product/${id}`,
      },
    },
  };
}

import { getProducts } from "@/lib/catalog";
import Header from "@/components/Header";
import MobileTabBar from "@/components/MobileTabBar";
import ProductView from "@/components/ProductView";
import { ProductJsonLd, BreadcrumbJsonLd, WebSiteJsonLd } from "@/components/StructuredData";

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ id: p.id }));
}

export default async function Product({ params }: PageProps) {
  const { id } = await params;
  const lang = await getLocale();
  const prod = await getProduct(id);
  const categories = await getCategories();
  const cat = categories.find((c) => c.id === prod?.cat);
  const sup = prod?.supplierId ? await getSupplier(prod.supplierId) : undefined;
  const catName = cat ? (lang === "zh" ? cat.zh : cat.fr) : prod?.cat;
  const supplierName = (sup?.name ?? "BoxGoods") as string;

  return (
    <>
      {prod && (
        <>
          <ProductJsonLd product={prod} categoryName={catName} supplierName={supplierName} />
          <BreadcrumbJsonLd
            items={[
              { name: lang === "zh" ? "首页" : "Accueil", url: siteUrl },
              { name: lang === "zh" ? "品类" : "Catégories", url: `${siteUrl}/categories` },
              { name: catName, url: `${siteUrl}/cat/${prod.cat}` },
              { name: lang === "zh" ? prod.nameZh : prod.nameFr, url: `${siteUrl}/product/${id}` },
            ]}
          />
        </>
      )}
      <WebSiteJsonLd />
      <Header />
      <ProductView id={id} />
      <MobileTabBar />
    </>
  );
}