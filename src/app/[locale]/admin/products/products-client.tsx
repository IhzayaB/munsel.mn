"use client";

import { useState, useMemo } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Search, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { DeleteProductButton } from "./delete-product-button";

interface Product {
  id: string;
  name: string;
  nameMn: string;
  price: string;
  active: boolean;
  category?: { nameMn: string } | null;
  variants?: { id: string }[] | null;
}

const PAGE_SIZE = 15;

export function ProductsClient({ products }: { products: Product[] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.nameMn.toLowerCase().includes(q) ||
        p.category?.nameMn?.toLowerCase().includes(q)
    );
  }, [products, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-2xl font-bold">Бүтээгдэхүүн ({filtered.length})</h1>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9 w-full sm:w-[200px] h-10"
              placeholder="Хайх..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Button render={<Link href="/admin/products/new" />} className="shrink-0">
            <Plus className="mr-1 sm:mr-2 h-4 w-4" /> <span className="hidden sm:inline">Нэмэх</span><span className="sm:hidden">+</span>
          </Button>
        </div>
      </div>

      {/* Desktop table */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Нэр</TableHead>
                <TableHead>Ангилал</TableHead>
                <TableHead>Үнэ</TableHead>
                <TableHead>Хэмжээ</TableHead>
                <TableHead>Төлөв</TableHead>
                <TableHead>Үйлдэл</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {search ? "Хайлтын илэрц олдсонгүй" : "Бүтээгдэхүүн байхгүй. Эхний бүтээгдэхүүнээ нэмнэ үү!"}
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <p className="font-medium">{product.nameMn}</p>
                      <p className="text-xs text-muted-foreground">{product.name}</p>
                    </TableCell>
                    <TableCell>{product.category?.nameMn || "—"}</TableCell>
                    <TableCell>{formatPrice(product.price)}</TableCell>
                    <TableCell>{product.variants?.length || 0} хэмжээ</TableCell>
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
                ))
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
              {search ? "Хайлтын илэрц олдсонгүй" : "Бүтээгдэхүүн байхгүй"}
            </CardContent>
          </Card>
        ) : (
          paginated.map((product) => (
            <Card key={product.id}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{product.nameMn}</p>
                    <p className="text-xs text-muted-foreground">{product.category?.nameMn || "—"} • {product.variants?.length || 0} хэмжээ</p>
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
          ))
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
