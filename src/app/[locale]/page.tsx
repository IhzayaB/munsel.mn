import { db } from "@/lib/db";
import { products, categories } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { HomeClient } from "./home-client";
import type { Metadata } from "next";
import type { Product, ProductVariant, Category } from "@/lib/db/schema";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "pajama.mn — Нярайн хувцас",
    description: "Монголын шилдэг нярай, бяцхан хүүхдийн хувцасны онлайн дэлгүүр",
    openGraph: {
      title: "pajama.mn — Нярайн хувцас",
      description: "Монголын шилдэг нярай, бяцхан хүүхдийн хувцасны онлайн дэлгүүр",
      siteName: "Pajama.mn",
      locale: "mn_MN",
      type: "website",
      url: process.env.NEXT_PUBLIC_SITE_URL || "https://pajama.mn",
      images: [
        {
          url: "/api/og",
          width: 1200,
          height: 630,
          alt: "Pajama.mn — Нярайн хувцасны онлайн дэлгүүр",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "pajama.mn — Нярайн хувцас",
      description: "Монголын шилдэг нярай, бяцхан хүүхдийн хувцасны онлайн дэлгүүр",
      images: ["/api/og"],
    },
  };
}

export default async function HomePage() {
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
          name: true,
          nameMn: true,
          priority: true,
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
    orderBy: [desc(products.featured), desc(products.createdAt)],
  });

  // Filter out products with zero total stock
  const allProducts = allProductsRaw
    .filter((p: Product & { variants: ProductVariant[] }) => {
      if (!p.variants || p.variants.length === 0) return true;
      return p.variants.some((v: ProductVariant) => v.stock > 0);
    })
    .sort((a: Product & { category: Category | null }, b: Product & { category: Category | null }) => {
      // Sort by category priority (high → low), then featured, then newest
      const priA = a.category?.priority ?? 0;
      const priB = b.category?.priority ?? 0;
      if (priB !== priA) return priB - priA;
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const allCategories = await db.query.categories.findMany({
    columns: {
      id: true,
      name: true,
      nameMn: true,
      priority: true,
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
    images: p.images,
    featured: p.featured,
    ageRange: p.ageRange,
    categoryId: p.categoryId,
    category: p.category
      ? {
          name: p.category.name,
          nameMn: p.category.nameMn,
        }
      : null,
    variants: p.variants?.map((v) => ({
      id: v.id,
      size: v.size,
      stock: v.stock,
    })),
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Pajama.mn",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://pajama.mn",
    description: "Монголын шилдэг нярай, бяцхан хүүхдийн хувцасны онлайн дэлгүүр",
    publisher: {
      "@type": "Organization",
      name: "Pajama.mn",
      logo: {
        "@type": "ImageObject",
        url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://pajama.mn"}/logo.png`,
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient
        products={serializedProducts}
        categories={allCategories}
      />
    </>
  );
}
