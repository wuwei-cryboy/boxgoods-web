// src/app/manifest.ts
import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  const _siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://boxgoods-guinee.com";

  return {
    name: "BoxGoods Guinee — Grossiste B2B",
    short_name: "BoxGoods",
    description: "Parfums, montres, téléphones, accessoires, lunettes — fournisseurs vérifiés, stock local en Guinée.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f6f4",
    theme_color: "#0F5132",
    orientation: "portrait-primary",
    scope: "/",
    lang: "fr",
    categories: ["business", "shopping", "wholesale"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/screenshot-home.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
        label: "Accueil BoxGoods",
      },
      {
        src: "/screenshot-catalog.png",
        sizes: "750x1334",
        type: "image/png",
        form_factor: "narrow",
        label: "Catalogue produits",
      },
    ],
    shortcuts: [
      {
        name: "Catalogue",
        short_name: "Catalogue",
        description: "Parcourir le catalogue produits",
        url: "/categories",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Recherche",
        short_name: "Recherche",
        description: "Rechercher un produit",
        url: "/search",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Demande de prix",
        short_name: "Devis",
        description: "Soumettre une demande de devis",
        url: "/inquiry",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
    ],
    prefer_related_applications: false,
    related_applications: [],
  };
}