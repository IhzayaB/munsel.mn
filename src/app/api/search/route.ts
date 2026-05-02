import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq, or, ilike, and, desc } from "drizzle-orm";
import { rateLimitAsync, getRateLimitKey } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  try {
    // Rate limit: 30 searches per minute per IP
    const rlKey = getRateLimitKey(req, "search");
    const rl = await rateLimitAsync(rlKey, { limit: 30, windowMs: 60_000 });
    if (!rl.success) {
      return NextResponse.json([], { status: 429 });
    }

    const q = req.nextUrl.searchParams.get("q")?.trim();
    if (!q || q.length < 1) {
      return NextResponse.json([]);
    }

    // Escape SQL LIKE special characters to prevent wildcard injection
    const escaped = q.replace(/[%_\\]/g, "\\$&");

    const results = await db.query.products.findMany({
      where: and(
        eq(products.active, true),
        or(
          ilike(products.name, `%${escaped}%`),
          ilike(products.nameMn, `%${escaped}%`)
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
