import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq, or, ilike, and, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q")?.trim();
    if (!q || q.length < 1) {
      return NextResponse.json([]);
    }

    const results = await db.query.products.findMany({
      where: and(
        eq(products.active, true),
        or(
          ilike(products.name, `%${q}%`),
          ilike(products.nameMn, `%${q}%`)
        )
      ),
      with: { variants: true, category: true },
      orderBy: [desc(products.featured)],
      limit: 8,
    });

    // Filter out products with no stock
    const inStock = results.filter((p) => {
      if (!p.variants || p.variants.length === 0) return true;
      return p.variants.some((v) => v.stock > 0);
    });

    // Return minimal data for search results
    const data = inStock.map((p) => ({
      id: p.id,
      name: p.name,
      nameMn: p.nameMn,
      slug: p.slug,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      image: p.images?.[0] ?? null,
      category: p.category?.nameMn ?? null,
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
