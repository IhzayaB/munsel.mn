import { db } from "@/lib/db";
import { products, categories } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { ProductsClient } from "./products-client";

export default async function AdminProductsPage() {
  const [allProducts, allCategories] = await Promise.all([
    db.query.products.findMany({
      with: { category: true, variants: true },
      orderBy: [desc(products.createdAt)],
    }),
    db.select({ id: categories.id, nameMn: categories.nameMn }).from(categories).orderBy(categories.nameMn),
  ]);

  return (
    <ProductsClient
      products={JSON.parse(JSON.stringify(allProducts))}
      categories={allCategories}
    />
  );
}
