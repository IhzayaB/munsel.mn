import { db } from "@/lib/db";
import { products, orders, orderItems, users, productVariants } from "@/lib/db/schema";
import { count, eq, sql, desc, and, gte } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBag,
  Package,
  Users,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Truck,
  Ban,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { AnalyticsPanel } from "./analytics-panel";

export default async function AdminDashboardPage() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Core stats
  const [productCount] = await db.select({ count: count() }).from(products);
  const [orderCount] = await db.select({ count: count() }).from(orders);
  const [userCount] = await db.select({ count: count() }).from(users);
  const [revenue] = await db
    .select({ total: sql<string>`COALESCE(SUM(${orders.total}::numeric), 0)` })
    .from(orders)
    .where(eq(orders.status, "paid"));

  // Orders this week
  const [weekOrders] = await db
    .select({ count: count() })
    .from(orders)
    .where(gte(orders.createdAt, sevenDaysAgo));

  // Revenue this month
  const [monthRevenue] = await db
    .select({ total: sql<string>`COALESCE(SUM(${orders.total}::numeric), 0)` })
    .from(orders)
    .where(and(eq(orders.status, "paid"), gte(orders.createdAt, thirtyDaysAgo)));

  // Order status breakdown
  const statusBreakdown = await db
    .select({
      status: orders.status,
      count: count(),
    })
    .from(orders)
    .groupBy(orders.status);

  const statusMap = Object.fromEntries(
    statusBreakdown.map((s) => [s.status, s.count])
  );

  // Top 5 selling products (by quantity sold)
  const topProducts = await db
    .select({
      name: orderItems.name,
      productId: orderItems.productId,
      totalQty: sql<number>`SUM(${orderItems.quantity})`.as("total_qty"),
      totalRevenue: sql<string>`SUM(${orderItems.price}::numeric * ${orderItems.quantity})`.as("total_revenue"),
    })
    .from(orderItems)
    .groupBy(orderItems.productId, orderItems.name)
    .orderBy(sql`total_qty DESC`)
    .limit(5);

  // Low stock variants (stock <= 3)
  const lowStockItems = await db
    .select({
      variantId: productVariants.id,
      size: productVariants.size,
      stock: productVariants.stock,
      productName: products.nameMn,
      productId: products.id,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(sql`${productVariants.stock} <= 3`)
    .orderBy(productVariants.stock)
    .limit(10);

  // Recent orders
  const recentOrders = await db.query.orders.findMany({
    orderBy: (orders, { desc }) => [desc(orders.createdAt)],
    limit: 8,
    with: { items: true },
  });

  // Daily revenue for last 7 days
  const dailyRevenue = await db
    .select({
      day: sql<string>`TO_CHAR(${orders.createdAt}, 'MM/DD')`.as("day"),
      revenue: sql<string>`COALESCE(SUM(${orders.total}::numeric), 0)`.as("revenue"),
      count: count(),
    })
    .from(orders)
    .where(and(gte(orders.createdAt, sevenDaysAgo), eq(orders.status, "paid")))
    .groupBy(sql`TO_CHAR(${orders.createdAt}, 'MM/DD')`)
    .orderBy(sql`TO_CHAR(${orders.createdAt}, 'MM/DD')`);

  const maxDailyRevenue = Math.max(
    ...dailyRevenue.map((d) => Number(d.revenue)),
    1
  );

  const statusConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    pending: { icon: <Clock className="h-3.5 w-3.5" />, label: "Хүлээгдэж буй", color: "bg-yellow-100 text-yellow-700" },
    paid: { icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: "Төлөгдсөн", color: "bg-green-100 text-green-700" },
    processing: { icon: <Package className="h-3.5 w-3.5" />, label: "Бэлтгэж буй", color: "bg-blue-100 text-blue-700" },
    shipped: { icon: <Truck className="h-3.5 w-3.5" />, label: "Илгээсэн", color: "bg-indigo-100 text-indigo-700" },
    delivered: { icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: "Хүргэсэн", color: "bg-purple-100 text-purple-700" },
    cancelled: { icon: <Ban className="h-3.5 w-3.5" />, label: "Цуцлагдсан", color: "bg-red-100 text-red-700" },
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-muted-foreground">Нийт орлого</span>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-xl sm:text-2xl font-bold">{formatPrice(revenue.total)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Сар: {formatPrice(monthRevenue.total)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-muted-foreground">Захиалга</span>
              <Package className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-xl sm:text-2xl font-bold">{orderCount.count}</p>
            <p className="text-xs text-muted-foreground mt-1">
              7 хоног: +{weekOrders.count}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-muted-foreground">Бүтээгдэхүүн</span>
              <ShoppingBag className="h-4 w-4 text-purple-500" />
            </div>
            <p className="text-xl sm:text-2xl font-bold">{productCount.count}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {lowStockItems.length > 0 ? (
                <span className="text-orange-500">{lowStockItems.length} бага үлдэгдэл</span>
              ) : (
                "Нөөц хангалттай"
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm text-muted-foreground">Хэрэглэгч</span>
              <Users className="h-4 w-4 text-orange-500" />
            </div>
            <p className="text-xl sm:text-2xl font-bold">{userCount.count}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Бүртгэлтэй
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart (bar chart with CSS) */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">7 хоногийн орлого</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyRevenue.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Сүүлийн 7 хоногт төлөгдсөн захиалга байхгүй
              </p>
            ) : (
              <div className="flex items-end gap-2 h-40">
                {dailyRevenue.map((d) => {
                  const height = Math.max(
                    (Number(d.revenue) / maxDailyRevenue) * 100,
                    4
                  );
                  return (
                    <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">
                        {formatPrice(d.revenue)}
                      </span>
                      <div
                        className="w-full bg-primary/80 rounded-t-md transition-all hover:bg-primary"
                        style={{ height: `${height}%` }}
                        title={`${d.day}: ${formatPrice(d.revenue)} (${d.count} захиалга)`}
                      />
                      <span className="text-[10px] text-muted-foreground">{d.day}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Status Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Захиалгын төлөв</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(statusConfig).map(([status, config]) => {
              const cnt = statusMap[status] || 0;
              if (cnt === 0) return null;
              return (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                      {config.icon}
                      {config.label}
                    </span>
                  </div>
                  <span className="font-semibold text-sm">{cnt}</span>
                </div>
              );
            })}
            {statusBreakdown.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Захиалга байхгүй
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Шилдэг бүтээгдэхүүн</CardTitle>
              <Link href="/admin/products" className="text-xs text-primary hover:underline">
                Бүгдийг харах →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Борлуулалтын мэдээлэл байхгүй
              </p>
            ) : (
              <div className="space-y-3">
                {topProducts.map((p, i) => (
                  <div key={p.productId} className="flex items-center gap-3">
                    <span className="text-sm font-bold text-muted-foreground w-5">
                      {i + 1}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.totalQty} ширхэг • {formatPrice(p.totalRevenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                {lowStockItems.length > 0 && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                Бага үлдэгдэлтэй
              </CardTitle>
              <Link href="/admin/products" className="text-xs text-primary hover:underline">
                Бүтээгдэхүүн →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {lowStockItems.length === 0 ? (
              <p className="text-sm text-green-600 text-center py-4">
                ✅ Бүх бүтээгдэхүүний нөөц хангалттай
              </p>
            ) : (
              <div className="space-y-2">
                {lowStockItems.map((item) => (
                  <div key={item.variantId} className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">{item.size}</p>
                    </div>
                    <Badge variant={item.stock === 0 ? "destructive" : "secondary"} className="shrink-0">
                      {item.stock === 0 ? "Дууссан" : `${item.stock} ширхэг`}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Сүүлийн захиалгууд</CardTitle>
            <Link href="/admin/orders" className="text-xs text-primary hover:underline flex items-center gap-1">
              Бүгдийг харах <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8 text-sm">
              Захиалга байхгүй
            </p>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2.5 px-6 font-medium">Дугаар</th>
                    <th className="text-left py-2.5 px-2 font-medium">Захиалагч</th>
                    <th className="text-left py-2.5 px-2 font-medium">Төлөв</th>
                    <th className="text-right py-2.5 px-2 font-medium">Дүн</th>
                    <th className="text-right py-2.5 px-6 font-medium">Огноо</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => {
                    const sc = statusConfig[order.status] || statusConfig.pending;
                    return (
                      <tr key={order.id} className="border-b last:border-0 hover:bg-secondary/50">
                        <td className="py-2.5 px-6 font-mono text-xs">
                          {order.orderNumber}
                        </td>
                        <td className="py-2.5 px-2">
                          <p className="font-medium text-sm">{order.customerName}</p>
                          <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                        </td>
                        <td className="py-2.5 px-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.color}`}>
                            {sc.icon}
                            {sc.label}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right font-medium">
                          {formatPrice(order.total)}
                        </td>
                        <td className="py-2.5 px-6 text-right text-muted-foreground text-xs">
                          {new Date(order.createdAt).toLocaleDateString("mn-MN")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Website Analytics */}
      <AnalyticsPanel />
    </div>
  );
}
