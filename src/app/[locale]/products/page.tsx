import { db } from "@/lib/db";
import { products, categories } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { ProductsClient } from "./products-client";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Бүтээгдэхүүн — pajama.mn",
    description: "Нярайн хувцас, комбинезон, малгай болон бусад бүтээгдэхүүнүүд",
  };
}

export default async function ProductsPage() {
  const allProducts = await db.query.products.findMany({
    where: eq(products.active, true),
    with: {
      category: true,
      variants: true,
    },
    orderBy: [desc(products.createdAt)],
  });

  const allCategories = await db.query.categories.findMany();

  return (
    <ProductsClient
      products={JSON.parse(JSON.stringify(allProducts))}
      categories={JSON.parse(JSON.stringify(allCategories))}
    />
  );
}
