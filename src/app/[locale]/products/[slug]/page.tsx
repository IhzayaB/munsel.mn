import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq, or, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { ProductDetailClient } from "./product-detail-client";
import type { Metadata } from "next";
import { sanitizeSlug } from "@/lib/utils";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const sanitized = sanitizeSlug(slug);
  const product = await db.query.products.findFirst({
    where: or(
      eq(products.slug, slug),
      eq(sql`trim(${products.slug})`, slug),
      ...(sanitized && sanitized !== slug ? [eq(products.slug, sanitized)] : [])
    ),
  });

  if (!product) return { title: "Олдсонгүй" };

  const name = product.nameMn;
  const desc = product.descriptionMn;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pajama.mn";

  return {
    title: `${name} — pajama.mn`,
    description: desc || `${name} - нярайн хувцас`,
    openGraph: {
      title: name,
      description: desc || `${name} - нярайн хувцас`,
      type: "website",
      siteName: "Pajama.mn",
      locale: "mn_MN",
      images: [
        {
          url: `${baseUrl}/api/og/product?slug=${encodeURIComponent(slug)}`,
          width: 1200,
          height: 630,
          alt: name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description: desc || `${name} - нярайн хувцас`,
      images: [`${baseUrl}/api/og/product?slug=${encodeURIComponent(slug)}`],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sanitized = sanitizeSlug(slug);

  const product = await db.query.products.findFirst({
    where: or(
      eq(products.slug, slug),
      eq(sql`trim(${products.slug})`, slug),
      ...(sanitized && sanitized !== slug ? [eq(products.slug, sanitized)] : [])
    ),
    with: {
      category: {
        columns: {
          id: true,
          nameMn: true,
        },
      },
      variants: {
        columns: {
          id: true,
          size: true,
          color: true,
          stock: true,
        },
      },
    },
    columns: {
      id: true,
      name: true,
      nameMn: true,
      slug: true,
      descriptionMn: true,
      price: true,
      compareAtPrice: true,
      images: true,
      ageRange: true,
      materialMn: true,
      categoryId: true,
    },
  });

  if (!product) {
    notFound();
  }

  // Redirect to canonical (clean) slug URL if the current slug differs
  const canonicalSlug = sanitizeSlug(product.slug);
  if (canonicalSlug && canonicalSlug !== slug) {
    redirect(`/products/${canonicalSlug}`);
  }

  // Get related products from same category (in stock only)
  const relatedRaw = product.categoryId
    ? await db.query.products.findMany({
        where: eq(products.categoryId, product.categoryId),
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
          active: true,
        },
        with: {
          category: {
            columns: {
              name: true,
              nameMn: true,
            },
          },
          variants: {
            columns: {
              id: true,
              size: true,
              stock: true,
            },
          },
        },
        limit: 6,
      })
    : [];
  const related = relatedRaw.filter((p) => {
    if (p.id === product.id) return false;
    if (!p.active) return false;
    if (!p.variants || p.variants.length === 0) return true;
    return p.variants.some((v: { stock: number }) => v.stock > 0);
  }).slice(0, 5);

  // Check if in stock
  const totalStock = product.variants.reduce((sum: number, v: { stock: number }) => sum + v.stock, 0);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pajama.mn";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.nameMn,
    description: product.descriptionMn || product.nameMn,
    image: (product.images || []).map((img: string) => img.startsWith("http") ? img : `${baseUrl}${img}`),
    sku: product.slug,
    brand: {
      "@type": "Brand",
      name: "Pajama.mn",
    },
    offers: {
      "@type": "Offer",
      url: `${baseUrl}/mn/products/${product.slug}`,
      priceCurrency: "MNT",
      price: Number(product.price),
      priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0],
      itemCondition: "https://schema.org/NewCondition",
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
        product={{
          id: product.id,
          name: product.name,
          nameMn: product.nameMn,
          slug: product.slug,
          descriptionMn: product.descriptionMn,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          images: product.images || [],
          ageRange: product.ageRange,
          materialMn: product.materialMn,
          category: product.category
            ? {
                id: product.category.id,
                nameMn: product.category.nameMn,
              }
            : null,
          variants: (product.variants || []).map((v) => ({
            id: v.id,
            size: v.size,
            color: v.color,
            stock: v.stock,
          })),
        }}
        relatedProducts={related
          .filter((p) => p.id !== product.id)
          .map((p) => ({
            id: p.id,
            name: p.name,
            nameMn: p.nameMn,
            slug: p.slug,
            price: p.price,
            compareAtPrice: p.compareAtPrice,
            images: p.images || [],
            featured: Boolean(p.featured),
            ageRange: p.ageRange,
            category: p.category
              ? {
                  name: p.category.name,
                  nameMn: p.category.nameMn,
                }
              : null,
            variants: (p.variants || []).map((v) => ({
              id: v.id,
              size: v.size,
              stock: v.stock,
            })),
          }))}
      />
    </>
  );
}
