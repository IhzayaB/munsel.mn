import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pajama.mn — Нярайн хувцас",
  description:
    "Монголын шилдэг нярайн хувцасны онлайн дэлгүүр",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://pajama-mn.vercel.app"),
  openGraph: {
    title: "Pajama.mn — Нярайн хувцас",
    description: "Монголын шилдэг нярайн хувцасны онлайн дэлгүүр",
    siteName: "Pajama.mn",
    images: [{ url: "/logo.png", width: 512, height: 512 }],
    locale: "mn_MN",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Pajama.mn — Нярайн хувцас",
    description: "Монголын шилдэг нярайн хувцасны онлайн дэлгүүр",
    images: ["/logo.png"],
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      lang="mn"
      suppressHydrationWarning
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        <meta name="theme-color" content="#faf6f1" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
