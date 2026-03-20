"use client";

import { useState, useMemo } from "react";
import { ProductCard } from "@/components/products/product-card";
import { ShoppingBag } from "lucide-react";

interface Category {
  id: string;
  name: string;
  nameMn: string;
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
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "all") return products;
    return products.filter((p) => p.categoryId === selectedCategory);
  }, [products, selectedCategory]);

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12">
      {/* Category pills */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              selectedCategory === "all"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            Бүгд
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
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
        <div className="text-center py-20">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">
            Энэ ангилалд бүтээгдэхүүн байхгүй байна
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
