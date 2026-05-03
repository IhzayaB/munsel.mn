import { db } from "@/lib/db";
import { products, categories } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { ProductsClient } from "./products-client";

export default async function AdminProductsPage() {
  const [allProducts, allCategories] = await Promise.all([
    db.query.products.findMany({
      columns: {
        id: true,
        name: true,
        nameMn: true,
        price: true,
        active: true,
        images: true,
        createdAt: true,
      },
      with: {
        category: {
          columns: {
            nameMn: true,
          },
        },
        variants: {
          columns: {
            id: true,
            stock: true,
          },
        },
      },
      orderBy: [desc(products.createdAt)],
    }),
    db.select({ id: categories.id, nameMn: categories.nameMn }).from(categories).orderBy(categories.nameMn),
  ]);

  const serializedProducts = allProducts.map((p) => ({
    id: p.id,
    name: p.name,
    nameMn: p.nameMn,
    price: p.price,
    active: Boolean(p.active),
    images: p.images,
    createdAt: p.createdAt.toISOString(),
    category: p.category ? { nameMn: p.category.nameMn } : null,
    variants: (p.variants || []).map((v) => ({
      id: v.id,
      stock: v.stock ?? undefined,
    })),
  }));

  return (
    <ProductsClient
      products={serializedProducts}
      categories={allCategories}
    />
  );
}
