"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { Search, Users } from "lucide-react";

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

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/customers")
      .then((r) => r.json())
      .then((data) => {
        setCustomers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.name || "").toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone || "").includes(q)
    );
  });

  if (loading) {
    return <div className="p-6">Ачааллаж байна...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" /> Хэрэглэгчид
        </h1>
        <Badge variant="secondary">{customers.length} хэрэглэгч</Badge>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Нэр, и-мэйл, утсаар хайх..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-3 px-4 font-medium">Нэр</th>
                  <th className="text-left py-3 px-4 font-medium">И-мэйл</th>
                  <th className="text-left py-3 px-4 font-medium">Утас</th>
                  <th className="text-left py-3 px-4 font-medium">Үүрэг</th>
                  <th className="text-center py-3 px-4 font-medium">Захиалга</th>
                  <th className="text-right py-3 px-4 font-medium">Нийт зарцуулсан</th>
                  <th className="text-right py-3 px-4 font-medium">Бүртгэсэн</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      Хэрэглэгч олдсонгүй
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-secondary/50">
                      <td className="py-3 px-4 font-medium">{c.name || "—"}</td>
                      <td className="py-3 px-4 text-muted-foreground">{c.email}</td>
                      <td className="py-3 px-4">{c.phone || "—"}</td>
                      <td className="py-3 px-4">
                        <Badge variant={c.role === "admin" ? "default" : "secondary"}>
                          {c.role === "admin" ? "Админ" : "Хэрэглэгч"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">{c.orderCount}</td>
                      <td className="py-3 px-4 text-right font-medium">
                        {formatPrice(c.totalSpent)}
                      </td>
                      <td className="py-3 px-4 text-right text-muted-foreground text-xs">
                        {new Date(c.createdAt).toLocaleDateString("mn-MN")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
