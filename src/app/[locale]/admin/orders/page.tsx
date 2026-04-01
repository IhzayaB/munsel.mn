import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { desc, isNull } from "drizzle-orm";
import { OrdersClient } from "./orders-client";

export default async function AdminOrdersPage() {
  const allOrders = await db.query.orders.findMany({
    where: isNull(orders.deletedAt),
    with: { items: true },
    orderBy: [desc(orders.createdAt)],
  });

  return (
    <OrdersClient orders={JSON.parse(JSON.stringify(allOrders))} />
  );
}
