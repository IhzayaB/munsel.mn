import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ProductDetailClient } from "./product-detail-client";
import type { Metadata } from "next";

export const revalidate = 60;

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

  // Check if in stock
  const totalStock = product.variants.reduce((sum: number, v: { stock: number }) => sum + v.stock, 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.nameMn,
    description: product.descriptionMn || product.nameMn,
    image: product.images || [],
    brand: {
      "@type": "Brand",
      name: "Pajama.mn",
    },
    offers: {
      "@type": "Offer",
      url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://pajama.mn"}/products/${product.slug}`,
      priceCurrency: "MNT",
      price: Number(product.price),
      availability: totalStock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "Pajama.mn",
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient
        product={JSON.parse(JSON.stringify(product))}
        relatedProducts={JSON.parse(
          JSON.stringify(related.filter((p) => p.id !== product.id))
        )}
      />
    </>
  );
}
