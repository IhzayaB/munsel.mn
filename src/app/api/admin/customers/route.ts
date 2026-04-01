import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, orders } from "@/lib/db/schema";
import { sql, desc, eq } from "drizzle-orm";
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
        .where(eq(orders.userId, userId))
        .orderBy(desc(orders.createdAt))
        .limit(20);

      return NextResponse.json({ orders: userOrders });
    }

    const customerList = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        createdAt: users.createdAt,
        orderCount: sql<number>`(SELECT COUNT(*) FROM orders WHERE orders.user_id = ${users.id})`.as("order_count"),
        totalSpent: sql<string>`COALESCE((SELECT SUM(orders.total::numeric) FROM orders WHERE orders.user_id = ${users.id} AND orders.status IN ('paid', 'processing', 'shipped', 'delivered')), 0)`.as("total_spent"),
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    return NextResponse.json(customerList);
  } catch (error) {
    console.error("Fetch customers error:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}
