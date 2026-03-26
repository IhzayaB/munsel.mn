import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, coupons } from "@/lib/db/schema";
import { eq, and, lt, sql } from "drizzle-orm";

const STALE_MINUTES = 30;

export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cutoff = new Date(Date.now() - STALE_MINUTES * 60 * 1000);

    // Find pending orders older than cutoff
    const staleOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        couponCode: orders.couponCode,
      })
      .from(orders)
      .where(
        and(
          eq(orders.status, "pending"),
          lt(orders.createdAt, cutoff)
        )
      );

    if (staleOrders.length === 0) {
      return NextResponse.json({ cancelled: 0 });
    }

    // Cancel each stale order and restore coupon usage
    for (const order of staleOrders) {
      await db
        .update(orders)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(orders.id, order.id));

      // Restore coupon used count if a coupon was applied
      if (order.couponCode) {
        await db
          .update(coupons)
          .set({ usedCount: sql`GREATEST(${coupons.usedCount} - 1, 0)` })
          .where(eq(coupons.code, order.couponCode));
      }
    }

    console.log(`Cancelled ${staleOrders.length} stale pending orders`);

    return NextResponse.json({
      cancelled: staleOrders.length,
      orders: staleOrders.map((o) => o.orderNumber),
    });
  } catch (error) {
    console.error("Cleanup orders error:", error);
    return NextResponse.json(
      { error: "Failed to cleanup orders" },
      { status: 500 }
    );
  }
}
