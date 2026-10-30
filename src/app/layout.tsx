import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "./providers";
import { getLocale } from "@/lib/lang";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://boxgoods-guinee.com";
const siteName = "BoxGoods Guinee";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "BoxGoods Guinee — Grossiste B2B",
    template: "%s | BoxGoods Guinee",
  },
  description: "Parfums, montres, téléphones, accessoires, lunettes — fournisseurs vérifiés, stock local en Guinée.",
  keywords: [
    "grossiste", "B2B", "Guinée", "Conakry",
    "parfums", "montres", "téléphones", "accessoires", "lunettes",
    "fournisseurs vérifiés", "stock local", "paiement mobile"
  ],
  authors: [{ name: "BoxGoods Guinee" }],
  creator: "BoxGoods Guinee",
  publisher: "BoxGoods Guinee",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    alternateLocale: ["zh_CN"],
    url: siteUrl,
    siteName,
    title: "BoxGoods Guinee — Grossiste B2B",
    description: "Parfums, montres, téléphones, accessoires, lunettes — fournisseurs vérifiés, stock local en Guinée.",
    images: [
      {
        url: "/img/og-default.webp",
        width: 1200,
        height: 630,
        alt: "BoxGoods Guinee — Grossiste B2B",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@boxgoods_guinee",
    creator: "@boxgoods_guinee",
    title: "BoxGoods Guinee — Grossiste B2B",
    description: "Parfums, montres, téléphones, accessoires, lunettes — fournisseurs vérifiés, stock local en Guinée.",
    images: ["/img/og-default.webp"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
    other: [
      { rel: "icon", type: "image/png", sizes: "32x32", url: "/favicon-32x32.png" },
      { rel: "manifest", url: "/manifest.json" },
    ],
  },
  manifest: "/manifest.json",
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_SITE_VERIFICATION,
  },
  category: "Business",
  classification: "B2B Wholesale Marketplace",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0F5132" },
    { media: "(prefers-color-scheme: dark)", color: "#16A34A" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const alternates = {
  languages: {
    fr: `${siteUrl}/fr`,
    zh: `${siteUrl}/zh`,
    "x-default": siteUrl,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}