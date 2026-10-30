import type { Metadata } from "next";
import { getTranslation } from "@/lib/lang";

export async function generateMetadata(): Promise<Metadata> {
  const [title, description] = await Promise.all([
    getTranslation("recherche"),
    getTranslation("searchPh"),
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
    robots: { index: false, follow: true },
    alternates: {
      languages: {
        fr: "/fr/search",
        zh: "/zh/search",
        "x-default": "/search",
      },
    },
  };
}

import { Suspense } from "react";
import Header from "@/components/Header";
import MobileTabBar from "@/components/MobileTabBar";
import SearchView from "@/components/SearchView";
import { WebSiteJsonLd } from "@/components/StructuredData";

export default function Search() {
  return (
    <>
      <WebSiteJsonLd />
      <Header />
      <Suspense>
        <SearchView />
      </Suspense>
      <MobileTabBar />
    </>
  );
}