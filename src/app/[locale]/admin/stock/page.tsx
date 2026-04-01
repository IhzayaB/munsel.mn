"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Search, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Variant {
  id: string;
  size: string;
  stock: number;
  color?: string | null;
}

interface Product {
  id: string;
  name: string;
  nameMn: string;
  variants: Variant[];
  category?: { nameMn: string } | null;
}

export default function AdminStockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [showLowOnly, setShowLowOnly] = useState(false);
  const [changes, setChanges] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.filter((p: Product) => p.variants?.length > 0));
      })
      .catch(() => toast.error("Ачаалахад алдаа гарлаа"))
      .finally(() => setLoading(false));
  }, []);

  const lowStockCount = useMemo(() => {
    let count = 0;
    for (const p of products) {
      for (const v of p.variants) {
        const stock = changes[v.id] ?? v.stock;
        if (stock <= 3) count++;
      }
    }
    return count;
  }, [products, changes]);

  const filtered = useMemo(() => {
    let result = products;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.nameMn.toLowerCase().includes(q)
      );
    }
    if (showLowOnly) {
      result = result.filter((p) =>
        p.variants.some((v) => {
          const stock = changes[v.id] ?? v.stock;
          return stock <= 3;
        })
      );
    }
    return result;
  }, [products, search, showLowOnly, changes]);

  const updateStock = (variantId: string, stock: number) => {
    setChanges({ ...changes, [variantId]: stock });
  };

  const getStock = (v: Variant) => changes[v.id] ?? v.stock;

  const handleSave = async () => {
    const updates = Object.entries(changes).map(([id, stock]) => ({ id, stock }));
    if (updates.length === 0) { toast.info("Өөрчлөлт байхгүй"); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/stock", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      if (!res.ok) throw new Error();
      // Apply changes locally
      setProducts(products.map((p) => ({
        ...p,
        variants: p.variants.map((v) => ({
          ...v,
          stock: changes[v.id] ?? v.stock,
        })),
      })));
      setChanges({});
      toast.success(`${updates.length} хэмжээний нөөц шинэчлэгдлээ`);
    } catch {
      toast.error("Хадгалахад алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  };

  const changedCount = Object.keys(changes).length;

  if (loading) return <div className="py-16 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Нөөцийн удирдлага</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 w-[200px]" placeholder="Хайх..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button
            variant={showLowOnly ? "default" : "outline"}
            size="sm"
            className="h-10 shrink-0"
            onClick={() => setShowLowOnly(!showLowOnly)}
          >
            <AlertTriangle className="mr-1 h-4 w-4" />
            Бага ({lowStockCount})
          </Button>
          <Button onClick={handleSave} disabled={saving || changedCount === 0}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Хадгалах {changedCount > 0 && `(${changedCount})`}
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="text-center py-12 text-muted-foreground">
          {showLowOnly ? "Бага үлдэгдэлтэй бүтээгдэхүүн байхгүй ✅" : "Бүтээгдэхүүн олдсонгүй"}
        </CardContent></Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((product) => (
            <Card key={product.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {product.nameMn}
                  {product.category && <span className="text-xs text-muted-foreground ml-2">({product.category.nameMn})</span>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {product.variants.map((v) => {
                    const stock = getStock(v);
                    const changed = changes[v.id] !== undefined;
                    const isLow = stock <= 3;
                    return (
                      <div key={v.id} className={`p-2 rounded-lg border text-center ${changed ? "border-primary bg-primary/5" : isLow ? "border-orange-300 bg-orange-50" : ""}`}>
                        <Badge variant="secondary" className="mb-1">{v.size}</Badge>
                        <Input
                          type="number"
                          min={0}
                          value={stock}
                          onChange={(e) => updateStock(v.id, parseInt(e.target.value) || 0)}
                          className={`text-center h-9 ${stock === 0 ? "text-destructive" : stock <= 3 ? "text-orange-500" : ""}`}
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
