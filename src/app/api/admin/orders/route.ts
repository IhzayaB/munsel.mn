import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq, inArray, isNull, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, status } = body;

    const validStatuses = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"];
    if (!orderId || !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Verify order exists and is not soft-deleted
    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, orderId), isNull(orders.deletedAt)),
    });
    if (!order) {
      return NextResponse.json({ error: "Захиалга олдсонгүй" }, { status: 404 });
    }

    if (status === order.status) {
      return NextResponse.json({ success: true });
    }

    const allowedTransitions: Record<string, string[]> = {
      pending: ["paid", "cancelled"],
      paid: ["processing", "cancelled"],
      processing: ["shipped", "cancelled"],
      shipped: ["delivered", "cancelled"],
      delivered: [],
      cancelled: ["pending"],
    };

    const allowedNext = allowedTransitions[order.status] || [];
    if (!allowedNext.includes(status)) {
      return NextResponse.json(
        {
          error: `Төлөв солих боломжгүй: ${order.status} -> ${status}`,
        },
        { status: 400 }
      );
    }

    await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update order status error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orderIds } = body as { orderIds: string[] };

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Safety: only allow deleting cancelled orders
    const toDelete = await db.query.orders.findMany({
      where: inArray(orders.id, orderIds),
      columns: { id: true, status: true },
    });

    const nonCancelled = toDelete.filter((o) => o.status !== "cancelled");
    if (nonCancelled.length > 0) {
      return NextResponse.json(
        { error: "Зөвхөн цуцлагдсан захиалгыг устгах боломжтой" },
        { status: 400 }
      );
    }

    const validIds = toDelete.map((o) => o.id);
    if (validIds.length > 0) {
      // Soft-delete: mark as deleted instead of permanently removing
      await db
        .update(orders)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(inArray(orders.id, validIds));
    }

    return NextResponse.json({ success: true, deleted: validIds.length });
  } catch (error) {
    console.error("Delete orders error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
