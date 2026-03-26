import { db } from "@/lib/db";
import { products, categories } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { ProductsClient } from "./products-client";
import type { Metadata } from "next";
import type { Product, ProductVariant } from "@/lib/db/schema";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Бүтээгдэхүүн — pajama.mn",
    description: "Нярайн хувцас, комбинезон, малгай болон бусад бүтээгдэхүүнүүд",
    openGraph: {
      title: "Бүтээгдэхүүн — pajama.mn",
      description: "Нярайн хувцас, комбинезон, малгай болон бусад бүтээгдэхүүнүүд",
      siteName: "Pajama.mn",
      locale: "mn_MN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Бүтээгдэхүүн — pajama.mn",
      description: "Нярайн хувцас, комбинезон, малгай болон бусад бүтээгдэхүүнүүд",
    },
  };
}

export default async function ProductsPage() {
  const allProductsRaw = await db.query.products.findMany({
    where: eq(products.active, true),
    with: {
      category: true,
      variants: true,
    },
    orderBy: [desc(products.createdAt)],
  });

  // Filter out products with zero total stock
  const allProducts = allProductsRaw.filter((p: Product & { variants: ProductVariant[] }) => {
    if (!p.variants || p.variants.length === 0) return true;
    return p.variants.some((v: ProductVariant) => v.stock > 0);
  });

  const allCategories = await db.query.categories.findMany({
    orderBy: [desc(categories.priority)],
  });

  return (
    <ProductsClient
      products={JSON.parse(JSON.stringify(allProducts))}
      categories={JSON.parse(JSON.stringify(allCategories))}
    />
  );
}
