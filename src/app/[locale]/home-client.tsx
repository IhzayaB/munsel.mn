"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { ProductCard } from "@/components/products/product-card";
import { ShoppingBag } from "lucide-react";
import Image from "next/image";

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
  materialMn?: string | null;
  categoryId?: string | null;
  category?: { name: string; nameMn: string } | null;
  variants?: Array<{ id: string; size?: string; stock: number }> | null;
}

interface HomeClientProps {
  products: Product[];
  categories: Category[];
}

export function HomeClient({ products, categories }: HomeClientProps) {
  const tc = useTranslations("common");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "all") return products;
    return products.filter((p) => p.categoryId === selectedCategory);
  }, [products, selectedCategory]);

  return (
    <div className="container mx-auto px-3 sm:px-4 premium-shell">
      {/* Hero */}
      <section className="text-center pt-8 sm:pt-14 pb-8 sm:pb-12 mobile-section">
        <div className="flex justify-center mb-3 sm:mb-5">
          <Image
            src="/logo-black.png"
            alt="Munsel Fine Jewelry"
            width={680}
            height={260}
            priority
            className="w-full max-w-[280px] sm:max-w-[460px] lg:max-w-[560px] h-auto"
          />
        </div>
        <div className="flex items-center gap-3 sm:gap-5 justify-center">
          <div className="h-px flex-1 max-w-20 bg-[var(--sand)]" />
          <p className="font-brand text-[11px] sm:text-xs text-muted-foreground tracking-[0.32em] uppercase">
            Алт · Мөнгө · Үнэт Чулуу
          </p>
          <div className="h-px flex-1 max-w-20 bg-[var(--sand)]" />
        </div>
      </section>

      {/* Category tabs */}
      {categories.length > 0 && (
        <div className="flex snap-x-soft border-y border-[var(--border)]/80 mb-7 sm:mb-12 overflow-x-auto scrollbar-hide -mx-3 px-3 sm:-mx-4 sm:px-4 bg-white/55 backdrop-blur-[2px]">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3.5 sm:px-6 py-3.5 sm:py-4 text-[11px] sm:text-xs whitespace-nowrap relative shrink-0 transition-colors duration-200 tracking-[0.22em] uppercase ${
              selectedCategory === "all"
                ? "text-foreground font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1.5px] after:bg-[var(--gold)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tc("all")}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 sm:px-6 py-3.5 sm:py-4 text-[11px] sm:text-xs whitespace-nowrap relative shrink-0 transition-colors duration-200 tracking-[0.22em] uppercase ${
                selectedCategory === cat.id
                  ? "text-foreground font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1.5px] after:bg-[var(--gold)]"
                  : "text-muted-foreground hover:text-foreground"
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
          <ShoppingBag className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-base sm:text-lg text-muted-foreground font-heading italic">
            {tc("noCategoryProducts")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-5 md:gap-7 pb-14 animate-fade-in-up">
          {filteredProducts.map((product, i) => (
            <ProductCard key={product.id} product={product} imagePriority={i < 4} />
          ))}
        </div>
      )}
    </div>
  );
}
