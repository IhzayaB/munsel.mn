import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { productVariants } from "@/lib/db/schema";
import { eq, sql, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { updates } = await req.json();
    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: "Invalid or empty data" }, { status: 400 });
    }

    if (updates.length > 500) {
      return NextResponse.json({ error: "Хэт олон шинэчлэлт (дээд тал нь 500)" }, { status: 400 });
    }

    // Filter valid entries
    const validUpdates = updates.filter(
      (u: { id?: string; stock?: number }) => u.id && typeof u.stock === "number" && u.stock >= 0
    );

    if (validUpdates.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    // Batch update using SQL CASE for performance (single query instead of N queries)
    const ids = validUpdates.map((u: { id: string }) => u.id);
    const cases = validUpdates
      .map((u: { id: string; stock: number }) => {
        const stock = Math.max(0, Math.floor(u.stock));
        return sql`WHEN id = ${u.id} THEN ${stock}`;
      });

    await db.execute(
      sql`UPDATE product_variants SET stock = CASE ${sql.join(cases, sql` `)} END WHERE id IN (${sql.join(ids.map((id: string) => sql`${id}`), sql`, `)})`
    );

    return NextResponse.json({ success: true, count: validUpdates.length });
  } catch (error) {
    console.error("Bulk stock update error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
