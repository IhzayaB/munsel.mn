import { db } from "@/lib/db";
import { products, categories } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { HomeClient } from "./home-client";
import type { Metadata } from "next";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "pajama.mn — Нярайн хувцас",
    description: "Монголын шилдэг нярай, бяцхан хүүхдийн хувцасны онлайн дэлгүүр",
    openGraph: {
      title: "pajama.mn — Нярайн хувцас",
      description: "Монголын шилдэг нярай, бяцхан хүүхдийн хувцасны онлайн дэлгүүр",
      images: [{ url: "/logo.png", width: 512, height: 512 }],
      siteName: "Pajama.mn",
    },
  };
}

export default async function HomePage() {
  const allProducts = await db.query.products.findMany({
    where: eq(products.active, true),
    with: { category: true, variants: true },
    orderBy: [desc(products.featured), desc(products.createdAt)],
  });

  const allCategories = await db.query.categories.findMany();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Pajama.mn",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://pajama.mn",
    description: "Монголын шилдэг нярай, бяцхан хүүхдийн хувцасны онлайн дэлгүүр",
    publisher: {
      "@type": "Organization",
      name: "Pajama.mn",
      logo: {
        "@type": "ImageObject",
        url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://pajama.mn"}/logo.png`,
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient
        products={JSON.parse(JSON.stringify(allProducts))}
        categories={JSON.parse(JSON.stringify(allCategories))}
      />
    </>
  );
}
