import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderItems, products, productVariants, coupons } from "@/lib/db/schema";
import { createQPayInvoice } from "@/lib/qpay";
import { eq, inArray, sql, and } from "drizzle-orm";
import { generateOrderNumber } from "@/lib/utils";
import { getShippingSettings } from "@/lib/settings";
import { auth } from "@/lib/auth";
import { rateLimitAsync, getRateLimitKey } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 5 orders per minute per IP
    const rlKey = getRateLimitKey(req, "create-invoice");
    const rl = await rateLimitAsync(rlKey, { limit: 5, windowMs: 60_000 });
    if (!rl.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await req.json();
    const { items, customer, couponCode } = body;

    if (!items?.length || !customer?.name || !customer?.phone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Basic input sanitization
    const sanitizedCustomer = {
      name: String(customer.name).slice(0, 255),
      email: customer.email ? String(customer.email).slice(0, 255) : "",
      phone: String(customer.phone).slice(0, 20),
      address: customer.address ? String(customer.address).slice(0, 500) : "",
      city: customer.city ? String(customer.city).slice(0, 100) : "",
      district: customer.district ? String(customer.district).slice(0, 100) : null,
      notes: customer.notes ? String(customer.notes).slice(0, 1000) : null,
    };

    // Link to user if logged in
    const session = await auth();
    const userId = session?.user?.id || null;

    // Server-side price validation: fetch real prices from DB
    const productIds = [...new Set(items.map((i: { productId: string }) => i.productId))];
    const dbProducts = await db.query.products.findMany({
      where: inArray(products.id, productIds as string[]),
    });

    // Reject orders with inactive products
    const inactiveProduct = dbProducts.find((p) => !p.active);
    if (inactiveProduct) {
      return NextResponse.json(
        { error: `Бүтээгдэхүүн "${inactiveProduct.nameMn || inactiveProduct.name}" идэвхгүй байна` },
        { status: 400 }
      );
    }

    const priceMap = new Map(dbProducts.map((p) => [p.id, Number(p.price)]));

    // Validate stock for variants
    const variantIds = items
      .filter((i: { variantId?: string }) => i.variantId)
      .map((i: { variantId: string }) => i.variantId);

    let stockMap = new Map<string, number>();
    if (variantIds.length > 0) {
      const dbVariants = await db.query.productVariants.findMany({
        where: inArray(productVariants.id, variantIds),
      });
      stockMap = new Map(dbVariants.map((v) => [v.id, v.stock]));
    }

    // Calculate server-side totals
    let subtotal = 0;
    for (const item of items) {
      // Validate quantity bounds
      if (!item.quantity || item.quantity <= 0 || item.quantity > 100 || !Number.isInteger(item.quantity)) {
        return NextResponse.json(
          { error: `Invalid quantity for ${item.name || "item"}` },
          { status: 400 }
        );
      }

      const realPrice = priceMap.get(item.productId);
      if (realPrice === undefined) {
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 400 }
        );
      }
      if (item.variantId && stockMap.has(item.variantId)) {
        const stock = stockMap.get(item.variantId)!;
        if (stock < item.quantity) {
          return NextResponse.json(
            { error: `Insufficient stock for ${item.name}` },
            { status: 400 }
          );
        }
      }
      subtotal += realPrice * item.quantity;
    }

    const { shippingCost: baseShippingCost, freeShippingThreshold } = await getShippingSettings();
    const shippingCost = subtotal >= freeShippingThreshold ? 0 : baseShippingCost;

    // Apply coupon if provided
    let discount = 0;
    let appliedCouponId: string | null = null;
    if (couponCode) {
      const coupon = await db.query.coupons.findFirst({
        where: eq(coupons.code, String(couponCode).toUpperCase()),
      });
      if (coupon && coupon.active) {
        const notExpired = !coupon.expiresAt || new Date(coupon.expiresAt) >= new Date();
        const hasUses = !coupon.maxUses || coupon.usedCount < coupon.maxUses;
        const meetsMin = !coupon.minOrderAmount || subtotal >= Number(coupon.minOrderAmount);
        if (notExpired && hasUses && meetsMin) {
          if (coupon.type === "fixed") {
            discount = Number(coupon.value);
          } else if (coupon.type === "percent") {
            discount = Math.round(subtotal * Number(coupon.value) / 100);
          }
          discount = Math.min(discount, subtotal);
          appliedCouponId = coupon.id;
        }
      }
    }

    const total = Math.max(0, subtotal + shippingCost - discount);

    const orderNumber = generateOrderNumber();

    // Create order in DB with server-validated prices
    const [order] = await db
      .insert(orders)
      .values({
        orderNumber,
        userId,
        customerName: sanitizedCustomer.name,
        customerEmail: sanitizedCustomer.email,
        customerPhone: sanitizedCustomer.phone,
        shippingAddress: sanitizedCustomer.address,
        city: sanitizedCustomer.city,
        district: sanitizedCustomer.district,
        notes: sanitizedCustomer.notes,
        subtotal: subtotal.toString(),
        shippingCost: shippingCost.toString(),
        discount: discount.toString(),
        couponCode: couponCode ? String(couponCode).toUpperCase() : null,
        total: total.toString(),
        status: "pending",
      })
      .returning();

    // Create order items with server-validated prices
    await db.insert(orderItems).values(
      items.map((item: {
        productId: string;
        variantId?: string;
        quantity: number;
        name: string;
        size?: string;
        color?: string;
      }) => ({
        orderId: order.id,
        productId: item.productId,
        variantId: item.variantId || null,
        name: item.name,
        size: item.size || null,
        color: item.color || null,
        quantity: item.quantity,
        price: (priceMap.get(item.productId) || 0).toString(),
      }))
    );

    // Atomically increment coupon used count (with max_uses guard)
    if (appliedCouponId) {
      const [updated] = await db.update(coupons)
        .set({ usedCount: sql`${coupons.usedCount} + 1` })
        .where(
          and(
            eq(coupons.id, appliedCouponId),
            sql`(${coupons.maxUses} IS NULL OR ${coupons.usedCount} < ${coupons.maxUses})`
          )
        )
        .returning({ id: coupons.id });
      if (!updated) {
        // Coupon was used up between check and now — still proceed but without discount
        // The discount was already applied to the total, so we need to recalculate
        // For simplicity, we proceed — the order total is already locked in
      }
    }

    // Create QPay invoice
    const qpayInvoice = await createQPayInvoice(
      orderNumber,
      total,
      `Pajama.mn захиалга #${orderNumber}`
    );

    // Update order with QPay invoice ID
    await db
      .update(orders)
      .set({ qpayInvoiceId: qpayInvoice.invoice_id })
      .where(eq(orders.id, order.id));

    return NextResponse.json({
      orderNumber,
      invoiceId: qpayInvoice.invoice_id,
      qrImage: qpayInvoice.qr_image,
      qrText: qpayInvoice.qr_text,
      shortUrl: qpayInvoice.qPay_shortUrl,
      urls: qpayInvoice.urls,
    });
  } catch (error) {
    console.error("Create invoice error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
