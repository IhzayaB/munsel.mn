import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  // Fetch featured product images for the collage
  let productImages: string[] = [];
  try {
    const featured = await db.query.products.findMany({
      where: eq(products.active, true),
      columns: { images: true },
      orderBy: [desc(products.featured), desc(products.createdAt)],
      limit: 4,
    });
    productImages = featured
      .map((p) => p.images?.[0])
      .filter((img): img is string => !!img)
      .slice(0, 4);
  } catch {
    // Fallback to no images
  }

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
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: -60, right: -60, width: 300, height: 300, borderRadius: "50%", background: "rgba(64,155,160,0.08)", display: "flex" }} />
        <div style={{ position: "absolute", bottom: -80, left: -80, width: 400, height: 400, borderRadius: "50%", background: "rgba(64,155,160,0.06)", display: "flex" }} />

        {/* Left content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "60px 50px",
            width: productImages.length > 0 ? "50%" : "100%",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", marginBottom: 32 }}>
            <img src={`${process.env.NEXT_PUBLIC_SITE_URL || "https://munsel.mn"}/logo.png`} alt="Munsel.mn" style={{ height: 48 }} />
          </div>

          <div style={{ fontSize: 52, fontWeight: 800, color: "#1a2f30", lineHeight: 1.15, letterSpacing: "-1.5px", marginBottom: 16 }}>
            Алт, гоёл чимэглэлийн
          </div>
          <div style={{ fontSize: 52, fontWeight: 800, color: "#409ba0", lineHeight: 1.15, letterSpacing: "-1.5px", marginBottom: 28 }}>
            онлайн дэлгүүр
          </div>

          <div style={{ fontSize: 20, color: "#5a7a7c", fontWeight: 500, lineHeight: 1.5, marginBottom: 32 }}>
            Бөгж • Ээмэг • Зүүлт
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: "linear-gradient(135deg, #409ba0, #357e82)", color: "white", padding: "12px 28px", borderRadius: 50, fontSize: 16, fontWeight: 700, display: "flex" }}>
              munsel.mn
            </div>
          </div>
        </div>

        {/* Right: product collage */}
        {productImages.length > 0 && (
          <div style={{ display: "flex", width: "50%", padding: "40px 40px 40px 0", gap: 12, position: "relative", zIndex: 1 }}>
            <div style={{ flex: 1, borderRadius: 20, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", display: "flex", position: "relative" }}>
              <img src={productImages[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            {productImages.length > 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 180 }}>
                {productImages.slice(1, 4).map((img, i) => (
                  <div key={i} style={{ flex: 1, borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", display: "flex", position: "relative" }}>
                    <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
