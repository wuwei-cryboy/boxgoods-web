import type { Metadata } from "next";
import { getTranslation } from "@/lib/lang";

export async function generateMetadata(): Promise<Metadata> {
  const [title, description] = await Promise.all([
    getTranslation("cats"),
    getTranslation("homeSub"),
  ]);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "fr_FR",
      alternateLocale: ["zh_CN"],
      images: ["/img/og-default.webp"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/img/og-default.webp"],
    },
    robots: { index: true, follow: true },
    alternates: {
      languages: {
        fr: "/fr/categories",
        zh: "/zh/categories",
        "x-default": "/categories",
      },
    },
  };
}

import Header from "@/components/Header";
import MobileTabBar from "@/components/MobileTabBar";
import CategoriesView from "@/components/CategoriesView";
import { BreadcrumbJsonLd, WebSiteJsonLd } from "@/components/StructuredData";

export default function Categories() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://boxgoods-guinee.com";

  return (
    <>
      <WebSiteJsonLd />
      <BreadcrumbJsonLd
        items={[
          { name: "Accueil", url: siteUrl },
          { name: "Catégories", url: `${siteUrl}/categories` },
        ]}
      />
      <Header />
      <CategoriesView />
      <MobileTabBar />
    </>
  );
}