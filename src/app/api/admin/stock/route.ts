import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { productVariants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { updates } = await req.json();
    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    for (const u of updates) {
      if (u.id && typeof u.stock === "number" && u.stock >= 0) {
        await db.update(productVariants).set({ stock: Math.floor(u.stock) }).where(eq(productVariants.id, u.id));
      }
    }

    return NextResponse.json({ success: true, count: updates.length });
  } catch (error) {
    console.error("Bulk stock update error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
