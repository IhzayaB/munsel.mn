"use client";

import { useTranslations } from "next-intl";
import { useState, useMemo, useDeferredValue } from "react";
import { ProductCard } from "@/components/products/product-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Search, PackageOpen } from "lucide-react";

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
  categories: Array<{
    id: string;
    nameMn: string;
  }>;
}

export function ProductsClient({ products, categories }: ProductsClientProps) {
  const t = useTranslations("products");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const deferredSearch = useDeferredValue(search);

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    if (deferredSearch) {
      const q = deferredSearch.toLowerCase();
      filtered = filtered.filter(
        (p) => p.name.toLowerCase().includes(q) || p.nameMn.toLowerCase().includes(q)
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((p) => p.categoryId === categoryFilter);
    }

    switch (sortBy) {
      case "priceAsc":
        filtered.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case "priceDesc":
        filtered.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case "name":
        filtered.sort((a, b) => a.nameMn.localeCompare(b.nameMn));
        break;
      default:
        break;
    }

    return filtered;
  }, [products, deferredSearch, categoryFilter, sortBy]);

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
      <Breadcrumbs items={[{ label: t("title") }]} />

      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">{t("title")}</h1>
        <p className="text-muted-foreground">{filteredProducts.length} бүтээгдэхүүн</p>
      </div>

      <div className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Бүтээгдэхүүн хайх..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>

        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={(v) => v && setCategoryFilter(v)}>
            <SelectTrigger className="flex-1 h-11 sm:h-10 sm:w-48 sm:flex-none">
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
            <SelectTrigger className="flex-1 h-11 sm:h-10 sm:w-48 sm:flex-none">
              <SelectValue placeholder={t("sort")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t("sortOptions.newest")}</SelectItem>
              <SelectItem value="priceAsc">{t("sortOptions.priceAsc")}</SelectItem>
              <SelectItem value="priceDesc">{t("sortOptions.priceDesc")}</SelectItem>
              <SelectItem value="name">{t("sortOptions.name")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-20">
          <PackageOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground mb-1">{t("noProducts")}</p>
          <p className="text-sm text-muted-foreground">Өөр ангилал эсвэл хайлтын үг оруулж үзнэ үү</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 animate-fade-in-up">
          {filteredProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} imagePriority={index < 4} />
          ))}
        </div>
      )}
    </div>
  );
}
