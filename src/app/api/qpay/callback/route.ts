import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderItems, productVariants } from "@/lib/db/schema";
import { checkQPayPayment } from "@/lib/qpay";
import { eq, sql } from "drizzle-orm";
import { sendOrderConfirmation } from "@/lib/email";
import { formatPrice } from "@/lib/utils";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";

async function handlePaymentConfirmed(orderNumber: string, paymentId: string) {
  // Idempotency guard: only process if order is still pending
  const existingOrder = await db.query.orders.findFirst({
    where: eq(orders.orderNumber, orderNumber),
  });

  if (!existingOrder || existingOrder.status === "paid") {
    return; // Already processed or not found
  }

  // Update order status
  await db
    .update(orders)
    .set({
      status: "paid",
      qpayPaymentId: paymentId,
      updatedAt: new Date(),
    })
    .where(eq(orders.orderNumber, orderNumber));

  // Get the order with items
  const order = await db.query.orders.findFirst({
    where: eq(orders.orderNumber, orderNumber),
    with: { items: true },
  });

  if (!order) return;

  // Decrement stock for each variant
  for (const item of order.items) {
    if (item.variantId) {
      await db
        .update(productVariants)
        .set({
          stock: sql`GREATEST(${productVariants.stock} - ${item.quantity}, 0)`,
        })
        .where(eq(productVariants.id, item.variantId));
    }
  }

  // Send confirmation email (only if customer provided email)
  if (order.customerEmail) {
    await sendOrderConfirmation({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      items: order.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: formatPrice(item.price),
        size: item.size,
      })),
      total: formatPrice(order.total),
      shippingAddress: order.shippingAddress || "",
      city: order.city || "",
    });
  }
}

export async function GET(req: NextRequest) {
  try {
    // Rate limit: 20 checks per minute per IP (user polling)
    const rlKey = getRateLimitKey(req, "qpay-check");
    const rl = rateLimit(rlKey, { limit: 20, windowMs: 60_000 });
    if (!rl.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const orderNumber = req.nextUrl.searchParams.get("order");
    const invoiceId = req.nextUrl.searchParams.get("invoice");

    if (!orderNumber || !invoiceId) {
      return NextResponse.json(
        { error: "Missing order or invoice ID" },
        { status: 400 }
      );
    }

    // Check payment status via QPay
    const paymentResult = await checkQPayPayment(invoiceId);

    if (paymentResult.count > 0) {
      const paymentInfo = paymentResult.rows[0];
      await handlePaymentConfirmed(orderNumber, paymentInfo.payment_id);

      return NextResponse.json({
        paid: true,
        paymentId: paymentInfo.payment_id,
      });
    }

    return NextResponse.json({ paid: false });
  } catch (error) {
    console.error("Payment callback error:", error);
    return NextResponse.json(
      { error: "Payment check failed" },
      { status: 500 }
    );
  }
}

// QPay callback POST (QPay will call this when payment is made)
export async function POST(req: NextRequest) {
  try {
    // Rate limit: 10 callbacks per minute per IP
    const rlKey = getRateLimitKey(req, "qpay-callback");
    const rl = rateLimit(rlKey, { limit: 10, windowMs: 60_000 });
    if (!rl.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const orderNumber = req.nextUrl.searchParams.get("order");

    if (!orderNumber) {
      return NextResponse.json({ error: "Missing order" }, { status: 400 });
    }

    // Find order
    const order = await db.query.orders.findFirst({
      where: eq(orders.orderNumber, orderNumber),
    });

    if (!order || !order.qpayInvoiceId) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify payment with QPay
    const paymentResult = await checkQPayPayment(order.qpayInvoiceId);

    if (paymentResult.count > 0) {
      const paymentInfo = paymentResult.rows[0];
      await handlePaymentConfirmed(orderNumber, paymentInfo.payment_id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("QPay callback error:", error);
    return NextResponse.json(
      { error: "Callback processing failed" },
      { status: 500 }
    );
  }
}
