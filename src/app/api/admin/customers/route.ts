import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, orders } from "@/lib/db/schema";
import { sql, desc, eq, and, isNull, count as countFn } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = req.nextUrl.searchParams.get("userId");

    // If a specific user is requested, return their orders
    if (userId) {
      const userOrders = await db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          status: orders.status,
          total: orders.total,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .where(and(eq(orders.userId, userId), isNull(orders.deletedAt)))
        .orderBy(desc(orders.createdAt))
        .limit(20);

      return NextResponse.json({ orders: userOrders });
    }

    // Use LEFT JOIN aggregation instead of correlated subqueries
    const customerList = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        createdAt: users.createdAt,
        orderCount: sql<number>`COUNT(CASE WHEN ${orders.deletedAt} IS NULL THEN 1 END)`.as("order_count"),
        totalSpent: sql<string>`COALESCE(SUM(CASE WHEN ${orders.status} IN ('paid', 'processing', 'shipped', 'delivered') AND ${orders.deletedAt} IS NULL THEN ${orders.total}::numeric ELSE 0 END), 0)`.as("total_spent"),
      })
      .from(users)
      .leftJoin(orders, eq(orders.userId, users.id))
      .groupBy(users.id, users.name, users.email, users.phone, users.role, users.createdAt)
      .orderBy(desc(users.createdAt))
      .limit(500);

    return NextResponse.json(customerList);
  } catch (error) {
    console.error("Fetch customers error:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}
