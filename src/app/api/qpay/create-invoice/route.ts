import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderItems, products, productVariants } from "@/lib/db/schema";
import { createQPayInvoice } from "@/lib/qpay";
import { eq, inArray } from "drizzle-orm";
import { generateOrderNumber, FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, customer } = body;

    if (!items?.length || !customer?.name || !customer?.email || !customer?.phone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Server-side price validation: fetch real prices from DB
    const productIds = [...new Set(items.map((i: { productId: string }) => i.productId))];
    const dbProducts = await db.query.products.findMany({
      where: inArray(products.id, productIds as string[]),
    });

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

    const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    const total = subtotal + shippingCost;

    const orderNumber = generateOrderNumber();

    // Create order in DB with server-validated prices
    const [order] = await db
      .insert(orders)
      .values({
        orderNumber,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        shippingAddress: customer.address,
        city: customer.city,
        district: customer.district || null,
        notes: customer.notes || null,
        subtotal: subtotal.toString(),
        shippingCost: shippingCost.toString(),
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
