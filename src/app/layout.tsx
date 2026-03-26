import type { Metadata } from "next";
import { Montserrat, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pajama.mn — Нярайн хувцас",
  description:
    "Монголын шилдэг нярайн хувцасны онлайн дэлгүүр",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://pajama.mn"),
  openGraph: {
    title: "Pajama.mn — Нярайн хувцас",
    description: "Монголын шилдэг нярайн хувцасны онлайн дэлгүүр",
    siteName: "Pajama.mn",
    locale: "mn_MN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pajama.mn — Нярайн хувцас",
    description: "Монголын шилдэг нярайн хувцасны онлайн дэлгүүр",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/logo.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/logo.png",
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
      className={`${montserrat.variable} ${jetbrainsMono.variable} h-full antialiased`}
      lang="mn"
      suppressHydrationWarning
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        <meta name="theme-color" content="#f5fafa" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-full flex flex-col safe-bottom">{children}</body>
    </html>
  );
}
