// src/app/sitemap.ts
import { MetadataRoute } from "next";
import { getProducts, getCategories } from "@/lib/catalog";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://boxgoods-guinee.com";
  const currentDate = new Date();

  // 静态页面
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/inquiry`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.6,
    },
  ];

  // 品类页面
  const categoryRoutes: MetadataRoute.Sitemap = getCategories().map((cat) => ({
    url: `${baseUrl}/cat/${cat.id}`,
    lastModified: currentDate,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // 商品页面
  const productRoutes: MetadataRoute.Sitemap = getProducts().map((product) => ({
    url: `${baseUrl}/product/${product.id}`,
    lastModified: currentDate,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}