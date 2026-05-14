"use client";

import { useState, useMemo } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Search, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { DeleteProductButton } from "./delete-product-button";

interface Product {
  id: string;
  name: string;
  nameMn: string;
  price: string;
  active: boolean;
  images?: string[] | null;
  createdAt?: string;
  category?: { nameMn: string } | null;
  variants?: { id: string; stock?: number }[] | null;
  hasColorCategory?: boolean;
  colorOptions?: string[];
}

interface Category {
  id: string;
  nameMn: string;
}

const PAGE_SIZE = 15;

export function ProductsClient({ products, categories }: { products: Product[]; categories: Category[] }) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "price_high" | "price_low" | "name">("newest");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = products;
    if (categoryFilter !== "all") {
      result = result.filter((p) => {
        const catName = p.category?.nameMn;
        return catName === categories.find((c) => c.id === categoryFilter)?.nameMn;
      });
    }
    if (activeFilter !== "all") {
      result = result.filter((p) => activeFilter === "active" ? p.active : !p.active);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.nameMn.toLowerCase().includes(q)
      );
    }
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "oldest": return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case "price_high": return Number(b.price) - Number(a.price);
        case "price_low": return Number(a.price) - Number(b.price);
        case "name": return a.nameMn.localeCompare(b.nameMn);
        default: return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
    });
    return result;
  }, [products, search, categoryFilter, activeFilter, sortBy, categories]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const totalStock = (variants?: { stock?: number }[] | null) =>
    variants?.reduce((s, v) => s + (v.stock || 0), 0) ?? 0;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-2xl font-bold">Бүтээгдэхүүн ({filtered.length})</h1>
        <Button render={<Link href="/admin/products/new" />} className="shrink-0 self-end sm:self-auto">
          <Plus className="mr-1 sm:mr-2 h-4 w-4" /> Нэмэх
        </Button>
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-4">
        <div className="relative flex-1 min-w-[140px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 w-full h-10"
            placeholder="Хайх..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => { if (v) { setCategoryFilter(v); setPage(1); } }}>
          <SelectTrigger className="w-[130px] sm:w-[160px] h-10 text-xs">
            <SelectValue placeholder="Ангилал" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Бүх ангилал</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.nameMn}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={activeFilter} onValueChange={(v) => { if (v) { setActiveFilter(v); setPage(1); } }}>
          <SelectTrigger className="w-[110px] h-10 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Бүгд</SelectItem>
            <SelectItem value="active">Идэвхтэй</SelectItem>
            <SelectItem value="inactive">Идэвхгүй</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => { if (v) { setSortBy(v as typeof sortBy); setPage(1); } }}>
          <SelectTrigger className="w-[130px] h-10 text-xs">
            <ArrowUpDown className="h-3 w-3 mr-1" /> <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Шинэ эхлээд</SelectItem>
            <SelectItem value="oldest">Хуучин эхлээд</SelectItem>
            <SelectItem value="price_high">Үнэ буурах</SelectItem>
            <SelectItem value="price_low">Үнэ өсөх</SelectItem>
            <SelectItem value="name">Нэрээр</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Desktop table */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[56px]"></TableHead>
                <TableHead>Нэр</TableHead>
                <TableHead>Ангилал</TableHead>
                <TableHead>Үнэ</TableHead>
                <TableHead>Нөөц</TableHead>
                <TableHead>Төлөв</TableHead>
                <TableHead>Үйлдэл</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {search || categoryFilter !== "all" ? "Хайлтын илэрц олдсонгүй" : "Бүтээгдэхүүн байхгүй. Эхний бүтээгдэхүүнээ нэмнэ үү!"}
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((product) => {
                  const stock = totalStock(product.variants);
                  return (
                    <TableRow key={product.id} className={!product.active ? "opacity-50" : ""}>
                      <TableCell className="pr-0">
                        <div className="relative w-10 h-10 rounded overflow-hidden bg-secondary shrink-0">
                          {product.images?.[0] ? (
                            <Image src={product.images[0]} alt="" fill className="object-cover" sizes="40px" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">📷</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{product.nameMn}</p>
                        <p className="text-xs text-muted-foreground">{product.name}</p>
                        {product.hasColorCategory && <p className="text-xs text-muted-foreground">Өнгө: {product.colorOptions?.join(", ") || "—"}</p>}
                      </TableCell>
                      <TableCell>{product.category?.nameMn || "—"}</TableCell>
                      <TableCell>{formatPrice(product.price)}</TableCell>
                      <TableCell>
                        <span className={stock === 0 ? "text-destructive font-medium" : stock <= 5 ? "text-orange-500 font-medium" : ""}>
                          {stock}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.active ? "default" : "secondary"}>
                          {product.active ? "Идэвхтэй" : "Идэвхгүй"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" render={<Link href={`/admin/products/${product.id}/edit`} />}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <DeleteProductButton productId={product.id} productName={product.name} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile card list */}
      <div className="md:hidden space-y-2">
        {paginated.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8 text-muted-foreground">
              {search || categoryFilter !== "all" ? "Хайлтын илэрц олдсонгүй" : "Бүтээгдэхүүн байхгүй"}
            </CardContent>
          </Card>
        ) : (
          paginated.map((product) => {
            const stock = totalStock(product.variants);
            return (
              <Card key={product.id} className={!product.active ? "opacity-50" : ""}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded overflow-hidden bg-secondary shrink-0">
                      {product.images?.[0] ? (
                        <Image src={product.images[0]} alt="" fill className="object-cover" sizes="48px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">📷</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{product.nameMn}</p>
                      <p className="text-xs text-muted-foreground">{product.category?.nameMn || "—"} • Нөөц: {stock}</p>
                      {product.hasColorCategory && (
                        <p className="text-xs text-muted-foreground truncate">Өнгө: {product.colorOptions?.join(", ") || "—"}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-bold text-sm">{formatPrice(product.price)}</span>
                        <Badge variant={product.active ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                          {product.active ? "Идэвхтэй" : "Идэвхгүй"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-9 w-9" render={<Link href={`/admin/products/${product.id}/edit`} />}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <DeleteProductButton productId={product.id} productName={product.name} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

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
