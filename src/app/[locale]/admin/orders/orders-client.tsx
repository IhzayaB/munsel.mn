"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

interface OrderItem {
  id: string;
  name: string;
  size?: string | null;
  color?: string | null;
  quantity: number;
  price: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress?: string | null;
  city?: string | null;
  district?: string | null;
  status: string;
  total: string;
  subtotal: string;
  shippingCost: string;
  createdAt: string;
  items: OrderItem[];
}

const STATUSES = [
  { value: "pending", label: "Хүлээгдэж буй", color: "bg-yellow-100 text-yellow-700" },
  { value: "paid", label: "Төлөгдсөн", color: "bg-green-100 text-green-700" },
  { value: "processing", label: "Бэлтгэж буй", color: "bg-blue-100 text-blue-700" },
  { value: "shipped", label: "Илгээсэн", color: "bg-indigo-100 text-indigo-700" },
  { value: "delivered", label: "Хүргэсэн", color: "bg-purple-100 text-purple-700" },
  { value: "cancelled", label: "Цуцлагдсан", color: "bg-red-100 text-red-700" },
];

export function OrdersClient({ orders: initialOrders }: { orders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const statusColor = (status: string) =>
    STATUSES.find((s) => s.value === status)?.color || "bg-gray-100 text-gray-700";

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed");

      setOrders(
        orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      toast.success("Төлөв шинэчлэгдлээ");
    } catch {
      toast.error("Төлөв шинэчлэхэд алдаа гарлаа");
    }
  };

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold mb-6">Захиалга ({orders.length})</h1>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">Захиалга байхгүй</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div
                    className="cursor-pointer flex-1"
                    onClick={() =>
                      setExpandedOrder(
                        expandedOrder === order.id ? null : order.id
                      )
                    }
                  >
                    <p className="font-mono text-sm font-bold">
                      #{order.orderNumber}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.customerName} • {order.customerPhone}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {order.customerEmail}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {order.shippingAddress}, {order.city}
                      {order.district ? `, ${order.district}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        {formatPrice(order.total)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.items?.length || 0} бараа
                      </p>
                    </div>

                    <Select
                      value={order.status}
                      onValueChange={(v) =>
                        v && handleStatusChange(order.id, v)
                      }
                    >
                      <SelectTrigger className="w-[140px]">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(
                            order.status
                          )}`}
                        >
                          {STATUSES.find(s => s.value === order.status)?.label || order.status}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Expanded order details */}
                {expandedOrder === order.id && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-muted-foreground mb-2">
                      {new Date(order.createdAt).toLocaleString("mn-MN")}
                    </p>
                    <div className="space-y-2">
                      {order.items?.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between text-sm"
                        >
                          <span>
                            {item.name}
                            {item.size ? ` (${item.size})` : ""}
                            {item.color ? ` - ${item.color}` : ""} ×{" "}
                            {item.quantity}
                          </span>
                          <span className="font-medium">
                            {formatPrice(item.price)}
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm pt-2 border-t">
                        <span>Хүргэлт</span>
                        <span>{formatPrice(order.shippingCost)}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Нийт</span>
                        <span>{formatPrice(order.total)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
