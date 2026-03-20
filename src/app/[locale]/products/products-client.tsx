"use client";

import { useTranslations } from "next-intl";
import { useState, useMemo } from "react";
import { ProductCard } from "@/components/products/product-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { Category } from "@/lib/db/schema";
import { Search, SlidersHorizontal } from "lucide-react";

interface ProductsClientProps {
  products: Array<{
    id: string;
    name: string;
    nameMn: string;
    slug: string;
    price: string;
    compareAtPrice?: string | null;
    images: string[];
    featured?: boolean;
    ageRange?: string | null;
    categoryId?: string | null;
    category?: { id: string; name: string; nameMn: string } | null;
  }>;
  categories: Category[];
}

export function ProductsClient({ products, categories }: ProductsClientProps) {
  const t = useTranslations("products");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Search
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.nameMn.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((p) => p.categoryId === categoryFilter);
    }

    // Sort
    switch (sortBy) {
      case "priceAsc":
        filtered.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case "priceDesc":
        filtered.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case "name":
        filtered.sort((a, b) =>
          a.nameMn.localeCompare(b.nameMn)
        );
        break;
      // newest is default (already sorted by createdAt desc)
    }

    return filtered;
  }, [products, search, categoryFilter, sortBy]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
        <p className="text-muted-foreground">
          {filteredProducts.length}{" "}
          {"бүтээгдэхүүн"}
        </p>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Бүтээгдэхүүн хайх..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={categoryFilter} onValueChange={(v) => v && setCategoryFilter(v)}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder={t("category")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allCategories")}</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.nameMn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v) => v && setSortBy(v)}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder={t("sort")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t("sortOptions.newest")}</SelectItem>
            <SelectItem value="priceAsc">
              {t("sortOptions.priceAsc")}
            </SelectItem>
            <SelectItem value="priceDesc">
              {t("sortOptions.priceDesc")}
            </SelectItem>
            <SelectItem value="name">{t("sortOptions.name")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Product grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-lg text-muted-foreground">{t("noProducts")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
