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
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  Trash2,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Package,
  CreditCard,
  Clock,
  Copy,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  StickyNote,
  Tag,
} from "lucide-react";
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
  qpayInvoiceId?: string | null;
  qpayPaymentId?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

const STATUSES = [
  { value: "pending", label: "Хүлээгдэж буй", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { value: "paid", label: "Төлөгдсөн", color: "bg-green-100 text-green-700 border-green-200" },
  { value: "processing", label: "Бэлтгэж буй", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "shipped", label: "Илгээсэн", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  { value: "delivered", label: "Хүргэсэн", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { value: "cancelled", label: "Цуцлагдсан", color: "bg-red-100 text-red-700 border-red-200" },
];

const PAGE_SIZE = 15;

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      title={`${label || text} хуулах`}
    >
      {copied ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("mn-MN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Дөнгөж сая";
  if (diffMins < 60) return `${diffMins} мин өмнө`;
  if (diffHours < 24) return `${diffHours} цагийн өмнө`;
  if (diffDays < 7) return `${diffDays} өдрийн өмнө`;
  return formatDateTime(iso);
}

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

  const statusLabel = (status: string) =>
    STATUSES.find((s) => s.value === status)?.label || status;

  // Stats
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter((o) => new Date(o.createdAt) >= today);
    const totalRevenue = orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + Number(o.total), 0);
    const pendingCount = orders.filter((o) => o.status === "pending").length;
    const paidCount = orders.filter((o) => o.status === "paid").length;
    const processingCount = orders.filter((o) => o.status === "processing").length;

    return { todayOrders: todayOrders.length, totalRevenue, pendingCount, paidCount, processingCount };
  }, [orders]);

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
          o.customerEmail.toLowerCase().includes(q) ||
          o.items.some((item) => item.name.toLowerCase().includes(q)) ||
          (o.notes && o.notes.toLowerCase().includes(q))
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

  const filteredTotal = useMemo(
    () => filtered.reduce((sum, o) => sum + Number(o.total), 0),
    [filtered]
  );

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
    const rows = [["Дугаар", "Нэр", "Утас", "И-мэйл", "Хаяг", "Хот", "Дүүрэг", "Төлөв", "Дүн", "Хүргэлт", "Хөнгөлөлт", "Купон", "Нийт", "Бараа", "QPay Invoice", "Тэмдэглэл", "Огноо"]];
    filtered.forEach((o) => {
      const itemsSummary = o.items.map((i) => `${i.name}${i.size ? `(${i.size})` : ""}×${i.quantity}`).join("; ");
      rows.push([
        o.orderNumber,
        o.customerName,
        o.customerPhone,
        o.customerEmail,
        o.shippingAddress || "",
        o.city || "",
        o.district || "",
        statusLabel(o.status),
        o.subtotal,
        o.shippingCost,
        o.discount || "0",
        o.couponCode || "",
        o.total,
        itemsSummary,
        o.qpayInvoiceId || "",
        o.notes || "",
        new Date(o.createdAt).toLocaleDateString("mn-MN"),
      ]);
    });
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
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
        <div className="bg-background border rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground">Өнөөдөр</p>
          <p className="text-lg font-bold">{stats.todayOrders}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
          <p className="text-xs text-yellow-700">Хүлээгдэж буй</p>
          <p className="text-lg font-bold text-yellow-700">{stats.pendingCount}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <p className="text-xs text-green-700">Төлөгдсөн</p>
          <p className="text-lg font-bold text-green-700">{stats.paidCount}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <p className="text-xs text-blue-700">Бэлтгэж буй</p>
          <p className="text-lg font-bold text-blue-700">{stats.processingCount}</p>
        </div>
        <div className="bg-background border rounded-lg p-3 text-center col-span-2 sm:col-span-1">
          <p className="text-xs text-muted-foreground">Нийт орлого</p>
          <p className="text-sm font-bold">{formatPrice(String(stats.totalRevenue))}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg sm:text-2xl font-bold">Захиалга ({filtered.length})</h1>
          {filtered.length > 0 && (
            <span className="text-sm text-muted-foreground">
              Нийт: <span className="font-semibold text-foreground">{formatPrice(String(filteredTotal))}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[140px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9 h-10 w-full"
              placeholder="Дугаар, нэр, утас, бараа..."
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

          {paginated.map((order) => {
            const isExpanded = expandedOrder === order.id;
            const totalItems = order.items.reduce((s, i) => s + i.quantity, 0);

            return (
              <Card key={order.id} className={`transition-shadow ${isExpanded ? "ring-1 ring-primary/20 shadow-md" : ""}`}>
                <CardContent className="p-3 sm:p-4">
                  {/* Row 1: Header - Order#, Status, Total, Time */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1.5 shrink-0"
                      checked={selectedIds.has(order.id)}
                      onChange={() => toggleSelect(order.id)}
                    />
                    <div className="flex-1 min-w-0">
                      {/* Top line: order number + date + status + total */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold">#{order.orderNumber}</span>
                          <CopyButton text={order.orderNumber} label="Дугаар" />
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor(order.status)}`}>
                            {statusLabel(order.status)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-base sm:text-lg">{formatPrice(order.total)}</span>
                          <Select value={order.status} onValueChange={(v) => v && handleStatusChange(order.id, v)}>
                            <SelectTrigger className="w-[110px] sm:w-[130px] h-8 text-xs">
                              <SelectValue placeholder="Төлөв..." />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUSES.map((s) => (
                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Row 2: Customer info */}
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1 text-sm">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-foreground">{order.customerName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          <a href={`tel:${order.customerPhone}`} className="hover:text-foreground hover:underline">
                            {order.customerPhone}
                          </a>
                          <CopyButton text={order.customerPhone} label="Утас" />
                        </div>
                        {order.customerEmail && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Mail className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate text-xs">{order.customerEmail}</span>
                            <CopyButton text={order.customerEmail} label="И-мэйл" />
                          </div>
                        )}
                      </div>

                      {/* Row 3: Address */}
                      <div className="mt-1.5 flex items-start gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span>
                          {order.city}{order.district ? `, ${order.district}` : ""}{order.shippingAddress ? ` — ${order.shippingAddress}` : ""}
                        </span>
                        {order.shippingAddress && (
                          <CopyButton text={`${order.city}${order.district ? `, ${order.district}` : ""}, ${order.shippingAddress}`} label="Хаяг" />
                        )}
                      </div>

                      {/* Row 4: Items summary + time */}
                      <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Package className="h-3.5 w-3.5" />
                          <span className="font-medium">{totalItems} ш, {order.items.length} төрөл:</span>
                          <span className="truncate max-w-[280px] sm:max-w-[400px]">
                            {order.items.map((i) => `${i.name}${i.size ? `(${i.size})` : ""}×${i.quantity}`).join(", ")}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                          <Clock className="h-3.5 w-3.5" />
                          <span title={formatDateTime(order.createdAt)}>{formatRelativeTime(order.createdAt)}</span>
                        </div>
                      </div>

                      {/* Row 5: Notes indicator + coupon + QPay */}
                      <div className="mt-1.5 flex items-center gap-3 flex-wrap text-xs">
                        {order.notes && (
                          <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                            <StickyNote className="h-3 w-3" />
                            Тэмдэглэлтэй
                          </span>
                        )}
                        {order.couponCode && (
                          <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded">
                            <Tag className="h-3 w-3" />
                            {order.couponCode} ({"\u2212"}{formatPrice(order.discount || "0")})
                          </span>
                        )}
                        {order.qpayPaymentId && (
                          <span className="inline-flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            <CreditCard className="h-3 w-3" />
                            QPay төлөгдсөн
                          </span>
                        )}
                        {!order.qpayPaymentId && order.qpayInvoiceId && (
                          <span className="inline-flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                            <CreditCard className="h-3 w-3" />
                            QPay нэхэмжлэл
                          </span>
                        )}
                      </div>

                      {/* Expand/Collapse toggle */}
                      <button
                        onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                        className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        {isExpanded ? "Хураах" : "Дэлгэрэнгүй"}
                      </button>

                      {/* Expanded details panel */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t space-y-4">
                          {/* Full datetime info */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Захиалсан:</span>{" "}
                              <span className="font-medium">{formatDateTime(order.createdAt)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Шинэчилсэн:</span>{" "}
                              <span className="font-medium">{formatDateTime(order.updatedAt)}</span>
                            </div>
                          </div>

                          {/* Notes */}
                          {order.notes && (
                            <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                              <p className="text-xs font-medium text-amber-800 mb-1 flex items-center gap-1">
                                <StickyNote className="h-3.5 w-3.5" /> Тэмдэглэл:
                              </p>
                              <p className="text-sm text-amber-900">{order.notes}</p>
                            </div>
                          )}

                          {/* Items table */}
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2">Барааны мэдээлэл:</p>
                            <div className="border rounded-md overflow-hidden">
                              <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                  <tr>
                                    <th className="text-left px-3 py-2 text-xs font-medium">Бараа</th>
                                    <th className="text-center px-2 py-2 text-xs font-medium">Хэмжээ</th>
                                    <th className="text-center px-2 py-2 text-xs font-medium">Өнгө</th>
                                    <th className="text-center px-2 py-2 text-xs font-medium">Тоо</th>
                                    <th className="text-right px-3 py-2 text-xs font-medium">Нэг үнэ</th>
                                    <th className="text-right px-3 py-2 text-xs font-medium">Нийт</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y">
                                  {order.items.map((item) => (
                                    <tr key={item.id} className="hover:bg-muted/30">
                                      <td className="px-3 py-2 font-medium">{item.name}</td>
                                      <td className="text-center px-2 py-2 text-muted-foreground">{item.size || "\u2014"}</td>
                                      <td className="text-center px-2 py-2 text-muted-foreground">{item.color || "\u2014"}</td>
                                      <td className="text-center px-2 py-2">{item.quantity}</td>
                                      <td className="text-right px-3 py-2">{formatPrice(item.price)}</td>
                                      <td className="text-right px-3 py-2 font-medium">
                                        {formatPrice(String(Number(item.price) * item.quantity))}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Financial breakdown */}
                          <div className="bg-muted/30 rounded-md p-3">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Төлбөрийн мэдээлэл:</p>
                            <div className="space-y-1.5 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Дүн (subtotal)</span>
                                <span>{formatPrice(order.subtotal)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Хүргэлтийн төлбөр</span>
                                <span>{formatPrice(order.shippingCost)}</span>
                              </div>
                              {order.discount && Number(order.discount) > 0 && (
                                <div className="flex justify-between text-green-600">
                                  <span>Хөнгөлөлт{order.couponCode ? ` (${order.couponCode})` : ""}</span>
                                  <span>{"\u2212"}{formatPrice(order.discount)}</span>
                                </div>
                              )}
                              <div className="flex justify-between font-bold text-base pt-1.5 border-t">
                                <span>Нийт төлбөр</span>
                                <span>{formatPrice(order.total)}</span>
                              </div>
                            </div>
                          </div>

                          {/* QPay details */}
                          {(order.qpayInvoiceId || order.qpayPaymentId) && (
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                              <p className="text-xs font-medium text-blue-800 mb-2 flex items-center gap-1">
                                <CreditCard className="h-3.5 w-3.5" /> QPay мэдээлэл:
                              </p>
                              <div className="space-y-1 text-xs">
                                {order.qpayInvoiceId && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-blue-700">Invoice ID:</span>
                                    <code className="bg-blue-100 px-1.5 py-0.5 rounded text-blue-900 font-mono text-xs">
                                      {order.qpayInvoiceId}
                                    </code>
                                    <CopyButton text={order.qpayInvoiceId} label="Invoice ID" />
                                  </div>
                                )}
                                {order.qpayPaymentId && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-blue-700">Payment ID:</span>
                                    <code className="bg-blue-100 px-1.5 py-0.5 rounded text-blue-900 font-mono text-xs">
                                      {order.qpayPaymentId}
                                    </code>
                                    <CopyButton text={order.qpayPaymentId} label="Payment ID" />
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Order ID */}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>ID:</span>
                            <code className="bg-muted px-1.5 py-0.5 rounded font-mono">{order.id}</code>
                            <CopyButton text={order.id} label="Order ID" />
                          </div>

                          {/* Delete for cancelled */}
                          {order.status === "cancelled" && (
                            <div className="pt-3 border-t">
                              <Button
                                variant="destructive"
                                size="sm"
                                className="text-xs"
                                onClick={(e) => { e.stopPropagation(); handleDeleteOrder(order.id); }}
                              >
                                <Trash2 className="mr-1 h-3 w-3" /> Захиалга устгах
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
