"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice } from "@/lib/utils";
import { Search, Users, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Loader2, ArrowUpDown, Mail } from "lucide-react";
import { EmailComposer } from "@/components/admin/email-composer";
import { toast } from "sonner";

interface CustomerOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: string;
  createdAt: string;
}

interface Customer {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
  orderCount: number;
  totalSpent: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Хүлээгдэж буй", color: "bg-yellow-100 text-yellow-700" },
  paid: { label: "Төлөгдсөн", color: "bg-green-100 text-green-700" },
  processing: { label: "Бэлтгэж буй", color: "bg-blue-100 text-blue-700" },
  shipped: { label: "Илгээсэн", color: "bg-indigo-100 text-indigo-700" },
  delivered: { label: "Хүргэсэн", color: "bg-purple-100 text-purple-700" },
  cancelled: { label: "Цуцлагдсан", color: "bg-red-100 text-red-700" },
};

const PAGE_SIZE = 20;

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<"newest" | "orders" | "spent">("newest");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Record<string, CustomerOrder[]>>({});
  const [loadingOrders, setLoadingOrders] = useState<string | null>(null);
  const [emailComposerOpen, setEmailComposerOpen] = useState(false);
  const [selectedCustomerEmail, setSelectedCustomerEmail] = useState<string | null>(null);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/admin/customers")
      .then((r) => r.json())
      .then((data) => {
        setCustomers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = customers;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          (c.name || "").toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.phone || "").includes(q)
      );
    }
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "orders": return b.orderCount - a.orderCount;
        case "spent": return Number(b.totalSpent) - Number(a.totalSpent);
        default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    return result;
  }, [customers, search, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const toggleExpand = async (customerId: string) => {
    if (expandedId === customerId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(customerId);
    if (!customerOrders[customerId]) {
      setLoadingOrders(customerId);
      try {
        const res = await fetch(`/api/admin/customers?userId=${customerId}`);
        if (res.ok) {
          const data = await res.json();
          setCustomerOrders((prev) => ({ ...prev, [customerId]: data.orders || [] }));
        }
      } catch { /* silent */ }
      setLoadingOrders(null);
    }
  };

  if (loading) {
    return <div className="py-16 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-2">
          <Users className="h-5 w-5 sm:h-6 sm:w-6" /> Хэрэглэгчид
          <Badge variant="secondary" className="text-xs">{customers.length}</Badge>
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Нэр, и-мэйл, утас..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 h-10 w-full sm:w-[220px]"
            />
          </div>
          <Select value={sortBy} onValueChange={(v) => { if (v) { setSortBy(v as typeof sortBy); setPage(1); } }}>
            <SelectTrigger className="w-[130px] h-10 text-xs">
              <ArrowUpDown className="h-3 w-3 mr-1" /> <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Шинэ эхлээд</SelectItem>
              <SelectItem value="orders">Захиалгаар</SelectItem>
              <SelectItem value="spent">Зарцуулсанаар</SelectItem>
            </SelectContent>
          </Select>
          {selectedEmails.size > 0 && (
            <Button
              size="sm"
              onClick={() => setEmailComposerOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Mail className="h-4 w-4 mr-2" />
              Илгээх ({selectedEmails.size})
            </Button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            Хэрэглэгч олдсонгүй
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {paginated.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between gap-3">
                  <input
                    type="checkbox"
                    checked={selectedEmails.has(c.email)}
                    onChange={(e) => {
                      const newSet = new Set(selectedEmails);
                      if (e.target.checked) {
                        newSet.add(c.email);
                      } else {
                        newSet.delete(c.email);
                      }
                      setSelectedEmails(newSet);
                    }}
                    className="w-4 h-4"
                  />
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => toggleExpand(c.id)}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{c.name || "—"}</p>
                      <Badge variant={c.role === "admin" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                        {c.role === "admin" ? "Админ" : "Хэрэглэгч"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.email} {c.phone ? `• ${c.phone}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-6 shrink-0 text-right">
                    <div className="hidden sm:block">
                      <p className="text-sm font-bold">{c.orderCount}</p>
                      <p className="text-[10px] text-muted-foreground">захиалга</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold">{formatPrice(c.totalSpent)}</p>
                      <p className="text-[10px] text-muted-foreground">зарцуулсан</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedCustomerEmail(c.email);
                        setEmailComposerOpen(true);
                      }}
                      className="h-8 w-8 p-0"
                      title="Имэйл илгээх"
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                    {expandedId === c.id ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {expandedId === c.id && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex gap-4 text-xs text-muted-foreground mb-3">
                      <span>Бүртгэсэн: {new Date(c.createdAt).toLocaleDateString("mn-MN")}</span>
                      <span>Захиалга: {c.orderCount}</span>
                      {c.phone && <span>Утас: {c.phone}</span>}
                    </div>
                    {loadingOrders === c.id ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : customerOrders[c.id]?.length ? (
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Захиалгын түүх</p>
                        {customerOrders[c.id].map((o) => {
                          const sc = STATUS_LABELS[o.status] || { label: o.status, color: "bg-gray-100 text-gray-700" };
                          return (
                            <div key={o.id} className="flex items-center justify-between text-sm py-1.5 px-2 bg-secondary/30 rounded">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs">#{o.orderNumber}</span>
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${sc.color}`}>{sc.label}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-medium text-xs">{formatPrice(o.total)}</span>
                                <span className="text-[10px] text-muted-foreground">{new Date(o.createdAt).toLocaleDateString("mn-MN")}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-3">Захиалга байхгүй</p>
                    )}
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

      <EmailComposer
        isOpen={emailComposerOpen}
        onClose={() => {
          setEmailComposerOpen(false);
          setSelectedCustomerEmail(null);
          setSelectedEmails(new Set());
        }}
        recipients={selectedCustomerEmail ? selectedCustomerEmail : Array.from(selectedEmails)}
        recipientLabel={
          selectedCustomerEmail 
            ? "Хүлээн авагч"
            : `${selectedEmails.size} хэрэглэгч сонгосон`
        }
      />
    </div>
  );
}
