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
import { Search, ChevronLeft, ChevronRight, Download } from "lucide-react";
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
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const statusColor = (status: string) =>
    STATUSES.find((s) => s.value === status)?.color || "bg-gray-100 text-gray-700";

  const filtered = useMemo(() => {
    let result = orders;
    if (statusFilter !== "all") {
      result = result.filter((o) => o.status === statusFilter);
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
    return result;
  }, [orders, search, statusFilter]);

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
      if (!res.ok) throw new Error();
      setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
      toast.success("Төлөв шинэчлэгдлээ");
    } catch {
      toast.error("Төлөв шинэчлэхэд алдаа гарлаа");
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
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch("/api/admin/orders", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: id, status: newStatus }),
          })
        )
      );
      setOrders(orders.map((o) => (selectedIds.has(o.id) ? { ...o, status: newStatus } : o)));
      setSelectedIds(new Set());
      toast.success(`${selectedIds.size} захиалгын төлөв шинэчлэгдлээ`);
    } catch {
      toast.error("Алдаа гарлаа");
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
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
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
