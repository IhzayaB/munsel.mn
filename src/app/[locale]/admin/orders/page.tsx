import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { desc, isNull } from "drizzle-orm";
import { OrdersClient } from "./orders-client";

export default async function AdminOrdersPage() {
  // Fetch with a reasonable server-side limit to prevent memory issues
  const allOrders = await db.query.orders.findMany({
    where: isNull(orders.deletedAt),
    columns: {
      id: true,
      orderNumber: true,
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      shippingAddress: true,
      city: true,
      district: true,
      status: true,
      total: true,
      subtotal: true,
      shippingCost: true,
      discount: true,
      couponCode: true,
      qpayInvoiceId: true,
      qpayPaymentId: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
    },
    with: {
      items: {
        columns: {
          id: true,
          name: true,
          size: true,
          color: true,
          quantity: true,
          price: true,
        },
      },
    },
    orderBy: [desc(orders.createdAt)],
    limit: 500,
  });

  const serializedOrders = allOrders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.customerName,
    customerEmail: o.customerEmail || "",
    customerPhone: o.customerPhone,
    shippingAddress: o.shippingAddress,
    city: o.city,
    district: o.district,
    status: o.status,
    total: o.total || "0",
    subtotal: o.subtotal || "0",
    shippingCost: o.shippingCost || "0",
    discount: o.discount,
    couponCode: o.couponCode,
    qpayInvoiceId: o.qpayInvoiceId,
    qpayPaymentId: o.qpayPaymentId,
    notes: o.notes,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    items: o.items.map((item) => ({
      id: item.id,
      name: item.name,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      price: item.price,
    })),
  }));

  return (
    <OrdersClient orders={serializedOrders} />
  );
}
