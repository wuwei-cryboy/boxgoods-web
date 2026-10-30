import type { Metadata } from "next";
import { getCategories, getProductsByCat } from "@/lib/catalog";
import { getTranslation, getLocale } from "@/lib/lang";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const lang = await getLocale();
  const categories = await getCategories();
  const cat = categories.find((c) => c.id === id);
  const products = await getProductsByCat(id);
  const productCount = products.length;

  if (!cat) {
    return { title: "Catégorie introuvable", robots: { index: false, follow: false } };
  }

  const name = lang === "zh" ? cat.zh : cat.fr;
  const productsLabel = await getTranslation("products");

  return {
    title: name,
    description: `${productCount} ${productsLabel} — ${name}`,
    openGraph: {
      title: name,
      description: `${productCount} ${productsLabel} — ${name}`,
      type: "website",
      locale: lang === "zh" ? "zh_CN" : "fr_FR",
      images: ["/img/og-default.webp"],
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description: `${productCount} ${productsLabel}`,
      images: ["/img/og-default.webp"],
    },
    robots: { index: true, follow: true },
    alternates: {
      languages: {
        fr: `/fr/cat/${id}`,
        zh: `/zh/cat/${id}`,
        "x-default": `/cat/${id}`,
      },
    },
  };
}

import Header from "@/components/Header";
import MobileTabBar from "@/components/MobileTabBar";
import CatView from "@/components/CatView";
import { BreadcrumbJsonLd, WebSiteJsonLd } from "@/components/StructuredData";

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c) => ({ id: c.id }));
}

export default async function CatPage({ params }: PageProps) {
  const { id } = await params;
  const lang = await getLocale();
  const categories = await getCategories();
  const cat = categories.find((c) => c.id === id);
  const products = await getProductsByCat(id);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://boxgoods-guinee.com";
  const catName = cat ? (lang === "zh" ? cat.zh : cat.fr) : id;

  return (
    <>
      <WebSiteJsonLd />
      <BreadcrumbJsonLd
        items={[
          { name: lang === "zh" ? "首页" : "Accueil", url: siteUrl },
          { name: lang === "zh" ? "品类" : "Catégories", url: `${siteUrl}/categories` },
          { name: catName, url: `${siteUrl}/cat/${id}` },
        ]}
      />
      <Header />
      <CatView id={id} />
      <MobileTabBar />
    </>
  );
}