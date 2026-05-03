import { db } from "@/lib/db";
import { products, categories } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { ProductsClient } from "./products-client";
import type { Metadata } from "next";

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
    columns: {
      id: true,
      name: true,
      nameMn: true,
      slug: true,
      price: true,
      compareAtPrice: true,
      images: true,
      featured: true,
      ageRange: true,
      categoryId: true,
      createdAt: true,
    },
    with: {
      category: {
        columns: {
          id: true,
          name: true,
          nameMn: true,
        },
      },
      variants: {
        columns: {
          stock: true,
        },
      },
    },
    orderBy: [desc(products.createdAt)],
  });

  // Filter out products with zero total stock
  const allProducts = allProductsRaw.filter((p) => {
    if (!p.variants || p.variants.length === 0) return true;
    return p.variants.some((v) => v.stock > 0);
  });

  const allCategories = await db.query.categories.findMany({
    columns: {
      id: true,
      nameMn: true,
    },
    orderBy: [desc(categories.priority)],
  });

  const serializedProducts = allProducts.map((p) => ({
    id: p.id,
    name: p.name,
    nameMn: p.nameMn,
    slug: p.slug,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    images: p.images || [],
    featured: Boolean(p.featured),
    ageRange: p.ageRange,
    categoryId: p.categoryId,
    category: p.category
      ? {
          id: p.category.id,
          name: p.category.name,
          nameMn: p.category.nameMn,
        }
      : null,
  }));

  return (
    <ProductsClient
      products={serializedProducts}
      categories={allCategories}
    />
  );
}
