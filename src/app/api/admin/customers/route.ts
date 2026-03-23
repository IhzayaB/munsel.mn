import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, orders } from "@/lib/db/schema";
import { eq, sql, count } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      totalSpent: sql<string>`COALESCE((SELECT SUM(orders.total::numeric) FROM orders WHERE orders.user_id = ${users.id} AND orders.status = 'paid'), 0)`.as("total_spent"),
    })
    .from(users)
    .orderBy(users.createdAt);

  return NextResponse.json(customerList);
}
