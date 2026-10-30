import type { Metadata } from "next";
import { getTranslation } from "@/lib/lang";

export async function generateMetadata(): Promise<Metadata> {
  const [title, description] = await Promise.all([
    getTranslation("form"),
    getTranslation("trust"),
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
    robots: { index: true, follow: false },
    alternates: {
      languages: {
        fr: "/fr/inquiry",
        zh: "/zh/inquiry",
        "x-default": "/inquiry",
      },
    },
  };
}

import Header from "@/components/Header";
import MobileTabBar from "@/components/MobileTabBar";
import InquiryView from "@/components/InquiryView";
import { WebSiteJsonLd } from "@/components/StructuredData";

export default function Inquiry() {
  return (
    <>
      <WebSiteJsonLd />
      <Header />
      <InquiryView />
      <MobileTabBar />
    </>
  );
}