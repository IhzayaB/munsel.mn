import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { ProductCard } from "@/components/products/product-card";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "pajama.mn — Нярайн хувцас",
    description: "Монголын шилдэг нярай, бяцхан хүүхдийн хувцасны онлайн дэлгүүр",
  };
}

export default async function HomePage() {
  const allProducts = await db.query.products.findMany({
    where: eq(products.active, true),
    with: { category: true, variants: true },
    orderBy: [desc(products.featured), desc(products.createdAt)],
  });

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {allProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
