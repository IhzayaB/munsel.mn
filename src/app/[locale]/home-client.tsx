"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { ProductCard } from "@/components/products/product-card";
import { ShoppingBag } from "lucide-react";

interface Category {
  id: string;
  name: string;
  nameMn: string;
  priority?: number;
}

interface Product {
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
  category?: { name: string; nameMn: string } | null;
  variants?: Array<{ id: string; size?: string; stock: number }> | null;
}

interface HomeClientProps {
  products: Product[];
  categories: Category[];
}

export function HomeClient({ products, categories }: HomeClientProps) {
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "all") return products;
    return products.filter((p) => p.categoryId === selectedCategory);
  }, [products, selectedCategory]);

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-12">
      <div className="mb-5 sm:mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">{t("title")}</h1>
      </div>

      {/* Category pills */}
      {categories.length > 0 && (
        <div className="flex gap-2 mb-6 sm:mb-8 overflow-x-auto pb-2 -mx-3 px-3 sm:-mx-4 sm:px-4 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap shrink-0 ${
              selectedCategory === "all"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {tc("all")}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap shrink-0 ${
                selectedCategory === cat.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {cat.nameMn}
            </button>
          ))}
        </div>
      )}

      {/* Products grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 sm:py-20">
          <ShoppingBag className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-base sm:text-lg text-muted-foreground">
            {tc("noCategoryProducts")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 animate-fade-in-up">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
