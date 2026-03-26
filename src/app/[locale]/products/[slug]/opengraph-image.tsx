import { ImageResponse } from "next/og";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq, or, sql } from "drizzle-orm";
import { sanitizeSlug } from "@/lib/utils";

export const runtime = "nodejs";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };

export default async function ProductOGImage({
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
        {/* Decorative circle */}
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "rgba(64, 155, 160, 0.06)",
            display: "flex",
          }}
        />

        {/* Product image */}
        {image && (
          <div
            style={{
              width: "45%",
              padding: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 24,
                overflow: "hidden",
                boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
                display: "flex",
                position: "relative",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
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
          {/* Brand */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, #409ba0, #357e82)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: 18, color: "white", fontWeight: 700 }}>P</span>
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#409ba0" }}>
              Pajama.mn
            </span>
          </div>

          {/* Category */}
          {category && (
            <div
              style={{
                fontSize: 18,
                color: "#409ba0",
                fontWeight: 600,
                marginBottom: 8,
                display: "flex",
              }}
            >
              {category}
            </div>
          )}

          {/* Product name */}
          <div
            style={{
              fontSize: 44,
              fontWeight: 800,
              color: "#1a2f30",
              lineHeight: 1.2,
              letterSpacing: "-1px",
              marginBottom: 20,
              display: "flex",
            }}
          >
            {name}
          </div>

          {/* Price */}
          {price && (
            <div
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: "#409ba0",
                marginBottom: 24,
                display: "flex",
              }}
            >
              {price}
            </div>
          )}

          {/* Bottom bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginTop: "auto",
            }}
          >
            <div
              style={{
                background: "linear-gradient(135deg, #409ba0, #357e82)",
                color: "white",
                padding: "10px 24px",
                borderRadius: 50,
                fontSize: 14,
                fontWeight: 700,
                display: "flex",
              }}
            >
              pajama.mn дээр үзэх
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
