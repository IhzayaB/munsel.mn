import { db } from "@/lib/db";
import { products, categories } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { HomeClient } from "./home-client";
import type { Metadata } from "next";

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

  return (
    <HomeClient
      products={JSON.parse(JSON.stringify(allProducts))}
      categories={JSON.parse(JSON.stringify(allCategories))}
    />
  );
}
