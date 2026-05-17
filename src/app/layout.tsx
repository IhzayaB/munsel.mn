import type { Metadata } from "next";
import localFont from "next/font/local";
import { Montserrat, JetBrains_Mono, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
  display: "swap",
  weight: ["400", "600", "700"],
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin", "cyrillic"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  style: ["normal"],
});

const kzRomul = localFont({
  src: "../../logos/KZ_Romul.ttf",
  variable: "--font-brand",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Munsel.mn — Алт, гоёл чимэглэл",
  description:
    "Монголын чанартай алт, гоёл чимэглэлийн онлайн дэлгүүр",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://munsel.mn"),
  openGraph: {
    title: "Munsel.mn — Алт, гоёл чимэглэл",
    description: "Монголын чанартай алт, гоёл чимэглэлийн онлайн дэлгүүр",
    siteName: "Munsel.mn",
    locale: "mn_MN",
    type: "website",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://munsel.mn",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "Munsel.mn — Алт, гоёл чимэглэлийн онлайн дэлгүүр",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Munsel.mn — Алт, гоёл чимэглэл",
    description: "Монголын чанартай алт, гоёл чимэглэлийн онлайн дэлгүүр",
    images: ["/api/og"],
  },
  icons: {
    icon: [{ url: "/icon", type: "image/png" }],
    shortcut: [{ url: "/icon", type: "image/png" }],
    apple: [{ url: "/apple-icon", type: "image/png" }],
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${montserrat.variable} ${cormorantGaramond.variable} ${kzRomul.variable} ${jetbrainsMono.variable} h-full antialiased`}
      lang="mn"
      suppressHydrationWarning
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        <meta name="theme-color" content="#FAFAF8" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="icon" href="/icon" type="image/png" />
        <link rel="shortcut icon" href="/icon" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-icon" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      </head>
      <body className="min-h-full flex flex-col safe-bottom">{children}</body>
    </html>
  );
}
