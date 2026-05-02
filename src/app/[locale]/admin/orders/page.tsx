import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { desc, isNull } from "drizzle-orm";
import { OrdersClient } from "./orders-client";

export default async function AdminOrdersPage() {
  // Fetch with a reasonable server-side limit to prevent memory issues
  const allOrders = await db.query.orders.findMany({
    where: isNull(orders.deletedAt),
    with: { items: true },
    orderBy: [desc(orders.createdAt)],
    limit: 500,
  });

  return (
    <OrdersClient orders={JSON.parse(JSON.stringify(allOrders))} />
  );
}
