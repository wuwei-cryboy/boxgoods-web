"use client"
import type { Product } from "@/lib/catalog.client";
import { useLang } from "@/lib/lang-context";
import { norm } from "@/lib/utils";

interface ProductJsonLdProps {
  product: Product;
  categoryName: string;
  supplierName?: string;
}

export function ProductJsonLd({ product, categoryName, supplierName = "BoxGoods" }: ProductJsonLdProps) {
  const { lang } = useLang();
  const name = lang === "zh" ? product.nameZh : product.nameFr;
  const description = `${categoryName} · MOQ ${product.moq} · ${product.boxSpec}`;
  const price = product.priceMin ?? 0;
  const currency = product.currency || "USD";
  const image = product.image ? norm(product.image) : undefined;

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name,
    description,
    brand: { "@type": "Brand", name: supplierName },
    category: categoryName,
    sku: product.id,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: currency,
      lowPrice: price,
      highPrice: product.priceMax ?? price,
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: "BoxGoods Guinee" },
    },
    ...(image && { image }),
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}

interface BreadcrumbJsonLdProps {
  items: Array<{ name: string; url: string }>;
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}

export function WebSiteJsonLd() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://boxgoods-guinee.com";

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "WebSite",
    name: "BoxGoods Guinee",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${siteUrl}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}