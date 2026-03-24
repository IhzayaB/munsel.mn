"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Link } from "@/i18n/routing";

interface OrderItem {
  id: string;
  name: string;
  size?: string | null;
  quantity: number;
  price: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: string;
  createdAt: string;
  items: OrderItem[];
}

const statusColor = (status: string) => {
  switch (status) {
    case "paid": return "bg-green-100 text-green-700";
    case "shipped": return "bg-indigo-100 text-indigo-700";
    case "delivered": return "bg-purple-100 text-purple-700";
    case "cancelled": return "bg-red-100 text-red-700";
    default: return "bg-yellow-100 text-yellow-700";
  }
};

export default function AccountOrdersPage() {
  const t = useTranslations("common");
  const to = useTranslations("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => {
        if (r.status === 401) {
          setNeedsLogin(true);
          return [];
        }
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setOrders(data);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
    pending: to("statusPending"),
    paid: to("statusPaid"),
    processing: to("statusProcessing"),
    shipped: to("statusShipped"),
    delivered: to("statusDelivered"),
    cancelled: to("statusCancelled"),
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">
        {to("title")}
      </h1>

      {error ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              {t("fetchError")}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="text-primary hover:underline font-medium"
            >
              {t("retry")}
            </button>
          </CardContent>
        </Card>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              {needsLogin ? to("loginRequired") : to("empty")}
            </p>
            <Link
              href={needsLogin ? "/login" : "/products"}
              className="text-primary hover:underline font-medium"
            >
              {needsLogin ? t("login") : to("viewProducts")}
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-mono text-sm font-bold">
                      #{order.orderNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("mn-MN")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold">
                      {formatPrice(order.total)}
                    </span>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusColor(
                        order.status
                      )}`}
                    >
                    {statusLabels[order.status] ||
                        order.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  {order.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between text-sm text-muted-foreground"
                    >
                      <span>
                        {item.name}
                        {item.size ? ` (${item.size})` : ""} × {item.quantity}
                      </span>
                      <span>{formatPrice(item.price)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
