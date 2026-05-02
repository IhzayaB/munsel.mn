import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderItems } from "@/lib/db/schema";
import { eq, desc, and, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userOrders = await db.query.orders.findMany({
      where: and(eq(orders.userId, session.user.id), isNull(orders.deletedAt)),
      with: { items: true },
      orderBy: [desc(orders.createdAt)],
      limit: 50,
    });

    return NextResponse.json(userOrders);
  } catch (error) {
    console.error("Fetch orders error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
