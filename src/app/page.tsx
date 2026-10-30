import type { Metadata } from "next";
import { getTranslation } from "@/lib/lang";
import { WebSiteJsonLd } from "@/components/StructuredData";

export async function generateMetadata(): Promise<Metadata> {
  const [title, description] = await Promise.all([
    getTranslation("brandName"),
    getTranslation("heroSub"),
  ]);

  return {
    title: `${title} — Grossiste B2B`,
    description,
    openGraph: {
      title: `${title} — Grossiste B2B`,
      description,
      type: "website",
      locale: "fr_FR",
      alternateLocale: ["zh_CN"],
      images: ["/img/og-default.webp"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — Grossiste B2B`,
      description,
      images: ["/img/og-default.webp"],
    },
    robots: { index: true, follow: true },
    alternates: {
      languages: {
        fr: "/fr",
        zh: "/zh",
        "x-default": "/",
      },
    },
  };
}

import Header from "@/components/Header";
import MobileTabBar from "@/components/MobileTabBar";
import HomeView from "@/components/HomeView";

export default function Home() {
  return (
    <>
      <WebSiteJsonLd />
      <Header isHome />
      <HomeView />
      <MobileTabBar />
    </>
  );
}