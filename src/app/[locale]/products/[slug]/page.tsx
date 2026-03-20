import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ProductDetailClient } from "./product-detail-client";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await db.query.products.findFirst({
    where: eq(products.slug, slug),
  });

  if (!product) return { title: "Олдсонгүй" };

  const name = product.nameMn;
  const desc = product.descriptionMn;

  return {
    title: `${name} — pajama.mn`,
    description: desc || `${name} - нярайн хувцас`,
    openGraph: {
      title: name,
      description: desc || undefined,
      images: product.images?.[0] ? [product.images[0]] : undefined,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = await db.query.products.findFirst({
    where: eq(products.slug, slug),
    with: {
      category: true,
      variants: true,
    },
  });

  if (!product) {
    notFound();
  }

  // Get related products from same category
  const related = product.categoryId
    ? await db.query.products.findMany({
        where: eq(products.categoryId, product.categoryId),
        with: { category: true, variants: true },
        limit: 4,
      })
    : [];

  return (
    <ProductDetailClient
      product={JSON.parse(JSON.stringify(product))}
      relatedProducts={JSON.parse(
        JSON.stringify(related.filter((p) => p.id !== product.id))
      )}
    />
  );
}
