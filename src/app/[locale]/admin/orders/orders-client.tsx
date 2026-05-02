"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ChevronLeft, ChevronRight, Download, Trash2, Calendar } from "lucide-react";
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
  discount?: string | null;
  couponCode?: string | null;
  notes?: string | null;
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

const PAGE_SIZE = 15;

export function OrdersClient({ orders: initialOrders }: { orders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const statusColor = (status: string) =>
    STATUSES.find((s) => s.value === status)?.color || "bg-gray-100 text-gray-700";

  const filtered = useMemo(() => {
    let result = orders;
    if (statusFilter !== "all") {
      result = result.filter((o) => o.status === statusFilter);
    }
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      result = result.filter((o) => new Date(o.createdAt) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter((o) => new Date(o.createdAt) <= to);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerPhone.includes(q) ||
          o.customerEmail.toLowerCase().includes(q)
      );
    }
    // Sort
    result = [...result].sort((a, b) => {
      switch (sortOrder) {
        case "oldest": return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "highest": return Number(b.total) - Number(a.total);
        case "lowest": return Number(a.total) - Number(b.total);
        default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    return result;
  }, [orders, search, statusFilter, dateFrom, dateTo, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed");
      }
      setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
      toast.success("Төлөв шинэчлэгдлээ");
    } catch (err) {
      toast.error(err instanceof Error && err.message !== "Failed" ? err.message : "Төлөв шинэчлэхэд алдаа гарлаа");
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map((o) => o.id)));
    }
  };

  const handleBulkStatus = async (newStatus: string) => {
    if (selectedIds.size === 0) return;
    // Prevent accidentally cancelling many orders at once
    if (newStatus === "cancelled" && selectedIds.size > 5) {
      toast.error(`${selectedIds.size} захиалгыг нэг дор цуцлах боломжгүй. 5-аас бага сонгоно уу`);
      return;
    }
    try {
      const results = await Promise.allSettled(
        Array.from(selectedIds).map(async (id) => {
          const res = await fetch("/api/admin/orders", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: id, status: newStatus }),
          });
          if (!res.ok) throw new Error(id);
          return id;
        })
      );
      const succeeded = results
        .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
        .map((r) => r.value);
      const failedCount = results.filter((r) => r.status === "rejected").length;
      const succeededSet = new Set(succeeded);
      setOrders(orders.map((o) => (succeededSet.has(o.id) ? { ...o, status: newStatus } : o)));
      setSelectedIds(new Set());
      if (failedCount > 0) {
        toast.warning(`${succeeded.length} амжилттай, ${failedCount} алдаатай`);
      } else {
        toast.success(`${succeeded.length} захиалгын төлөв шинэчлэгдлээ`);
      }
    } catch {
      toast.error("Алдаа гарлаа");
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("Энэ захиалгыг бүрмөсөн устгах уу?")) return;
    try {
      const res = await fetch("/api/admin/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: [orderId] }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed");
      }
      setOrders(orders.filter((o) => o.id !== orderId));
      setSelectedIds((prev) => { const n = new Set(prev); n.delete(orderId); return n; });
      toast.success("Захиалга устгагдлаа");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Устгахад алдаа гарлаа");
    }
  };

  const handleBulkDelete = async () => {
    const cancelledIds = Array.from(selectedIds).filter(
      (id) => orders.find((o) => o.id === id)?.status === "cancelled"
    );
    if (cancelledIds.length === 0) {
      toast.error("Зөвхөн цуцлагдсан захиалгыг устгах боломжтой");
      return;
    }
    const confirmText = `${cancelledIds.length} цуцлагдсан захиалгыг устгахдаа итгэлтэй байна уу?\n\nУстгахын тулд "УСТГАХ" гэж бичнэ үү:`;
    const userInput = prompt(confirmText);
    if (userInput !== "УСТГАХ") {
      if (userInput !== null) toast.error('"УСТГАХ" гэж бичээгүй тул цуцлагдлаа');
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: cancelledIds }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed");
      }
      const deletedSet = new Set(cancelledIds);
      setOrders(orders.filter((o) => !deletedSet.has(o.id)));
      setSelectedIds(new Set());
      toast.success(`${cancelledIds.length} захиалга устгагдлаа`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Устгахад алдаа гарлаа");
    } finally {
      setDeleting(false);
    }
  };

  const exportCSV = () => {
    const rows = [["Дугаар", "Нэр", "Утас", "И-мэйл", "Хаяг", "Хот", "Төлөв", "Нийт", "Огноо"]];
    filtered.forEach((o) => {
      rows.push([
        o.orderNumber,
        o.customerName,
        o.customerPhone,
        o.customerEmail,
        o.shippingAddress || "",
        o.city || "",
        STATUSES.find((s) => s.value === o.status)?.label || o.status,
        o.total,
        new Date(o.createdAt).toLocaleDateString("mn-MN"),
      ]);
    });
    // Escape CSV: double-quote internal quotes, prefix formula chars with tab
    const escapeCSV = (val: string) => {
      let escaped = val.replace(/"/g, '""');
      if (/^[=+\-@\t\r]/.test(escaped)) escaped = "\t" + escaped;
      return escaped;
    };
    const csv = rows.map((r) => r.map((c) => `"${escapeCSV(c)}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-2xl font-bold">Захиалга ({filtered.length})</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[140px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9 h-10 w-full"
              placeholder="Хайх..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { if (v) { setStatusFilter(v); setPage(1); } }}>
            <SelectTrigger className="w-[120px] sm:w-[140px] h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Бүгд</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportCSV} className="h-10 shrink-0">
            <Download className="mr-1 h-4 w-4" /> <span className="hidden sm:inline">CSV</span>
          </Button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="h-9 w-[130px] text-xs"
            />
            <span className="text-xs text-muted-foreground">–</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="h-9 w-[130px] text-xs"
            />
            {(dateFrom || dateTo) && (
              <Button variant="ghost" size="sm" className="h-9 text-xs px-2" onClick={() => { setDateFrom(""); setDateTo(""); setPage(1); }}>
                Цэвэрлэх
              </Button>
            )}
          </div>
          <Select value={sortOrder} onValueChange={(v) => { if (v) setSortOrder(v as typeof sortOrder); }}>
            <SelectTrigger className="w-[130px] h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Сүүлийнх эхлээд</SelectItem>
              <SelectItem value="oldest">Эртнийх эхлээд</SelectItem>
              <SelectItem value="highest">Үнэ буурах</SelectItem>
              <SelectItem value="lowest">Үнэ өсөх</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-1.5 sm:gap-2 mb-4 p-2 sm:p-3 bg-secondary/50 rounded-lg overflow-x-auto scrollbar-hide">
          <span className="text-xs sm:text-sm font-medium whitespace-nowrap">{selectedIds.size} сонгогдсон:</span>
          {STATUSES.map((s) => (
            <Button key={s.value} variant="outline" size="sm" className="text-xs h-7" onClick={() => handleBulkStatus(s.value)}>
              {s.label}
            </Button>
          ))}
          <Button
            variant="destructive"
            size="sm"
            className="text-xs h-7 ml-1"
            onClick={handleBulkDelete}
            disabled={deleting}
          >
            <Trash2 className="mr-1 h-3 w-3" /> Устгах
          </Button>
        </div>
      )}

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">{search || statusFilter !== "all" ? "Хайлтын илэрц олдсонгүй" : "Захиалга байхгүй"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Select all */}
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={selectedIds.size === paginated.length && paginated.length > 0} onChange={toggleSelectAll} />
            Бүгдийг сонгох
          </label>

          {paginated.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1.5 shrink-0"
                    checked={selectedIds.has(order.id)}
                    onChange={() => toggleSelect(order.id)}
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 flex-1 min-w-0">
                    <div
                      className="cursor-pointer flex-1 min-w-0"
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    >
                      <p className="font-mono text-sm font-bold">#{order.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">{order.customerName} • {order.customerPhone}</p>
                      <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {order.shippingAddress}, {order.city}{order.district ? `, ${order.district}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                      <div className="text-right">
                        <p className="font-bold text-base sm:text-lg">{formatPrice(order.total)}</p>
                        <p className="text-xs text-muted-foreground">{order.items?.length || 0} бараа</p>
                      </div>
                      <Select value={order.status} onValueChange={(v) => v && handleStatusChange(order.id, v)}>
                        <SelectTrigger className="w-[110px] sm:w-[140px] h-9">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(order.status)}`}>
                            {STATUSES.find((s) => s.value === order.status)?.label || order.status}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {expandedOrder === order.id && (
                  <div className="mt-4 pt-4 border-t ml-7">
                    <p className="text-xs text-muted-foreground mb-2">
                      {new Date(order.createdAt).toLocaleString("mn-MN")}
                    </p>
                    {order.notes && (
                      <p className="text-sm bg-secondary/50 p-2 rounded mb-3">
                        <span className="font-medium">Тэмдэглэл:</span> {order.notes}
                      </p>
                    )}
                    <div className="space-y-2">
                      {order.items?.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>
                            {item.name}{item.size ? ` (${item.size})` : ""}{item.color ? ` - ${item.color}` : ""} × {item.quantity}
                          </span>
                          <span className="font-medium">{formatPrice(item.price)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm pt-2 border-t">
                        <span>Хүргэлт</span>
                        <span>{formatPrice(order.shippingCost)}</span>
                      </div>
                      {order.discount && Number(order.discount) > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Хөнгөлөлт{order.couponCode ? ` (${order.couponCode})` : ""}</span>
                          <span>-{formatPrice(order.discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold">
                        <span>Нийт</span>
                        <span>{formatPrice(order.total)}</span>
                      </div>
                      {order.status === "cancelled" && (
                        <div className="pt-3 border-t mt-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="w-full sm:w-auto text-xs"
                            onClick={(e) => { e.stopPropagation(); handleDeleteOrder(order.id); }}
                          >
                            <Trash2 className="mr-1 h-3 w-3" /> Захиалга устгах
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} / {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm px-3">{safePage} / {totalPages}</span>
            <Button variant="outline" size="icon" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
