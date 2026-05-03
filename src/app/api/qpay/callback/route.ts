import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, productVariants } from "@/lib/db/schema";
import { checkQPayPayment } from "@/lib/qpay";
import { and, eq, gte, sql } from "drizzle-orm";
import { sendOrderConfirmation } from "@/lib/email";
import { sendOrderSms } from "@/lib/sms";
import { formatPrice } from "@/lib/utils";
import { rateLimitAsync, getRateLimitKey } from "@/lib/rate-limit";

async function handlePaymentConfirmed(orderNumber: string, paymentId: string) {
  const order = await db.transaction(async (tx) => {
    // Claim pending order exactly once to keep callback idempotent.
    const [claimedOrder] = await tx
      .update(orders)
      .set({
        status: "processing",
        qpayPaymentId: paymentId,
        updatedAt: new Date(),
      })
      .where(and(eq(orders.orderNumber, orderNumber), eq(orders.status, "pending")))
      .returning({ id: orders.id, orderNumber: orders.orderNumber });

    if (!claimedOrder) {
      return null;
    }

    const claimedWithItems = await tx.query.orders.findFirst({
      where: eq(orders.id, claimedOrder.id),
      with: { items: true },
    });

    if (!claimedWithItems) {
      throw new Error("Claimed order not found during payment processing");
    }

    for (const item of claimedWithItems.items) {
      if (!item.variantId) continue;
      const updated = await tx
        .update(productVariants)
        .set({ stock: sql`${productVariants.stock} - ${item.quantity}` })
        .where(
          and(
            eq(productVariants.id, item.variantId),
            gte(productVariants.stock, item.quantity)
          )
        )
        .returning({ id: productVariants.id });

      if (updated.length === 0) {
        throw new Error(`Insufficient stock while confirming payment for variant ${item.variantId}`);
      }
    }

    await tx
      .update(orders)
      .set({
        status: "paid",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, claimedOrder.id));

    return claimedWithItems;
  });

  if (!order) return;

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

  // Send SMS confirmation
  if (order.customerPhone) {
    await sendOrderSms({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      total: formatPrice(order.total),
    });
  }
}

export async function GET(req: NextRequest) {
  try {
    // Rate limit: 20 checks per minute per IP (user polling)
    const rlKey = getRateLimitKey(req, "qpay-check");
    const rl = await rateLimitAsync(rlKey, { limit: 20, windowMs: 60_000 });
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

    // Verify the invoice belongs to this order to prevent payment bypass
    const order = await db.query.orders.findFirst({
      where: eq(orders.orderNumber, orderNumber),
    });

    if (!order || order.qpayInvoiceId !== invoiceId) {
      return NextResponse.json(
        { error: "Invalid order/invoice pair" },
        { status: 400 }
      );
    }

    // Check payment status via QPay using the verified invoice ID
    const paymentResult = await checkQPayPayment(order.qpayInvoiceId);

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
    const rl = await rateLimitAsync(rlKey, { limit: 10, windowMs: 60_000 });
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
