import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq, or, sql } from "drizzle-orm";
import { sanitizeSlug } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug") || "";
  const sanitized = sanitizeSlug(slug);

  const product = await db.query.products.findFirst({
    where: or(
      eq(products.slug, slug),
      eq(sql`trim(${products.slug})`, slug),
      ...(sanitized && sanitized !== slug ? [eq(products.slug, sanitized)] : [])
    ),
    with: { category: true },
  });

  const name = product?.nameMn || "Бүтээгдэхүүн";
  const price = product?.price ? `${Number(product.price).toLocaleString()}₮` : "";
  const category = product?.category?.nameMn || "";
  const image = product?.images?.[0];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(145deg, #f5fafa 0%, #e8f4f5 40%, #d4ecee 100%)",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, borderRadius: "50%", background: "rgba(64,155,160,0.06)", display: "flex" }} />

        {/* Product image */}
        {image && (
          <div style={{ width: "45%", padding: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "100%", height: "100%", borderRadius: 24, overflow: "hidden", boxShadow: "0 12px 40px rgba(0,0,0,0.12)", display: "flex", position: "relative" }}>
              <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          </div>
        )}

        {/* Product info */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: image ? "50px 50px 50px 10px" : "60px",
            width: image ? "55%" : "100%",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
            <img src={`${process.env.NEXT_PUBLIC_SITE_URL || "https://munsel.mn"}/logo.png`} alt="Munsel.mn" style={{ height: 40 }} />
          </div>

          {category && (
            <div style={{ fontSize: 18, color: "#409ba0", fontWeight: 600, marginBottom: 8, display: "flex" }}>{category}</div>
          )}

          <div style={{ fontSize: 44, fontWeight: 800, color: "#1a2f30", lineHeight: 1.2, letterSpacing: "-1px", marginBottom: 20, display: "flex" }}>
            {name}
          </div>

          {price && (
            <div style={{ fontSize: 36, fontWeight: 700, color: "#409ba0", marginBottom: 24, display: "flex" }}>{price}</div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: "auto" }}>
            <div style={{ background: "linear-gradient(135deg, #409ba0, #357e82)", color: "white", padding: "10px 24px", borderRadius: 50, fontSize: 14, fontWeight: 700, display: "flex" }}>
              munsel.mn дээр үзэх
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
