import { db } from "@/lib/db";
import { products, categories } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { HomeClient } from "./home-client";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";

export const revalidate = 60;

const getHomePageData = unstable_cache(
  async () => {
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
        materialMn: true,
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

    const allProducts = allProductsRaw
      .filter((p) => {
        if (!p.variants || p.variants.length === 0) return true;
        return p.variants.some((v) => v.stock > 0);
      })
      .sort((a, b) => {
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
      images: p.images || [],
      featured: Boolean(p.featured),
      ageRange: p.ageRange,
      materialMn: p.materialMn,
      categoryId: p.categoryId,
      category: p.category
        ? {
            name: p.category.name,
            nameMn: p.category.nameMn,
          }
        : null,
      variants: p.variants?.map((v) => ({
        id: v.id,
        size: v.size || undefined,
        stock: v.stock,
      })),
    }));

    return { serializedProducts, allCategories };
  },
  ["home-page-data"],
  { revalidate: 60, tags: ["products", "categories"] }
);

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Munsel.mn — Алт, гоёл чимэглэл",
    description: "Монголын чанартай алт, гоёл чимэглэлийн онлайн дэлгүүр",
    openGraph: {
      title: "Munsel.mn — Алт, гоёл чимэглэл",
      description: "Монголын чанартай алт, гоёл чимэглэлийн онлайн дэлгүүр",
      siteName: "Munsel.mn",
      locale: "mn_MN",
      type: "website",
      url: process.env.NEXT_PUBLIC_SITE_URL || "https://munsel.mn",
      images: [
        {
          url: "/api/og",
          width: 1200,
          height: 630,
          alt: "Munsel.mn — Алт, гоёл чимэглэлийн онлайн дэлгүүр",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Munsel.mn — Алт, гоёл чимэглэл",
      description: "Монголын чанартай алт, гоёл чимэглэлийн онлайн дэлгүүр",
      images: ["/api/og"],
    },
  };
}

export default async function HomePage() {
  const { serializedProducts, allCategories } = await getHomePageData();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Munsel.mn",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://munsel.mn",
    description: "Монголын чанартай алт, гоёл чимэглэлийн онлайн дэлгүүр",
    publisher: {
      "@type": "Organization",
      name: "Munsel.mn",
      logo: {
        "@type": "ImageObject",
        url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://munsel.mn"}/logo.jpg`,
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
