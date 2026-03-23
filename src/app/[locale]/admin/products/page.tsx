import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { ProductsClient } from "./products-client";

export default async function AdminProductsPage() {
  const allProducts = await db.query.products.findMany({
    with: { category: true, variants: true },
    orderBy: [desc(products.createdAt)],
  });

  return <ProductsClient products={JSON.parse(JSON.stringify(allProducts))} />;
}
