"use client";

import { Link } from "@/i18n/routing";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Plus } from "lucide-react";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    nameMn: string;
    slug: string;
    price: string;
    compareAtPrice?: string | null;
    images: string[] | null;
    featured?: boolean | null;
    ageRange?: string | null;
    category?: { name: string; nameMn: string } | null;
    variants?: Array<{ id: string; size?: string; stock: number }> | null;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const tc = useTranslations("common");
  const displayName = product.nameMn;
  const categoryName = product.category?.nameMn;
  const addItem = useCartStore((s) => s.addItem);

  const hasDiscount =
    product.compareAtPrice &&
    Number(product.compareAtPrice) > Number(product.price);

  const firstVariant = product.variants?.[0];
  const inStock = firstVariant ? firstVariant.stock > 0 : true;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!inStock) return;

    addItem({
      productId: product.id,
      variantId: firstVariant?.id,
      name: product.name,
      nameMn: product.nameMn,
      price: Number(product.price),
      size: firstVariant?.size,
      quantity: 1,
      image: product.images?.[0] ?? undefined,
      maxStock: firstVariant?.stock,
    });
    toast.success(tc("addedToCart"));
  };

  return (
    <Link href={`/products/${product.slug}`}>
      <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden h-full">
        <div className="relative bg-secondary aspect-[3/4] flex items-center justify-center overflow-hidden">
          {product.images && product.images.length > 0 ? (
            <>
              <Image
                src={product.images[0]}
                alt={displayName}
                fill
                className={`object-cover transition-all duration-500 ${
                  product.images.length > 1
                    ? "group-hover:opacity-0 group-hover:scale-105"
                    : "group-hover:scale-105"
                }`}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
              {product.images.length > 1 && (
                <Image
                  src={product.images[1]}
                  alt={displayName}
                  fill
                  className="object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              )}
            </>
          ) : (
            <ShoppingBag className="h-16 w-16 text-muted-foreground/30 group-hover:scale-110 transition-transform" />
          )}

          {/* Image count indicator */}
          {product.images && product.images.length > 1 && (
            <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-full backdrop-blur-sm">
              1/{product.images.length}
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.featured && (
              <Badge className="bg-[var(--baby-peach)] hover:bg-[var(--baby-peach-dark)] text-white">⭐ Онцлох</Badge>
            )}
            {hasDiscount && (
              <Badge variant="destructive">
                -
                {Math.round(
                  ((Number(product.compareAtPrice) - Number(product.price)) /
                    Number(product.compareAtPrice)) *
                    100
                )}
                %
              </Badge>
            )}
          </div>

          {/* Quick add button - always visible on mobile, hover on desktop */}
          {inStock && (
            <Button
              size="icon"
              className="absolute bottom-2 right-2 opacity-100 sm:opacity-0 sm:translate-y-2 sm:group-hover:opacity-100 sm:group-hover:translate-y-0 transition-all duration-300 h-10 w-10 sm:h-9 sm:w-9 rounded-full shadow-md"
              onClick={handleQuickAdd}
              aria-label="Сагсанд нэмэх"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>

        <CardContent className="p-2.5 sm:p-4">
          {categoryName && (
            <p className="text-[11px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">
              {categoryName}
            </p>
          )}
          <h3 className="font-semibold text-foreground mb-0.5 sm:mb-1 line-clamp-2 text-[13px] leading-tight sm:text-base">
            {displayName}
          </h3>
          {product.ageRange && (
            <p className="text-[11px] sm:text-xs text-muted-foreground mb-1 sm:mb-2">
              {product.ageRange}
            </p>
          )}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <p className="text-sm sm:text-lg font-bold text-primary">
              {formatPrice(product.price)}
            </p>
            {hasDiscount && (
              <p className="text-[11px] sm:text-sm text-muted-foreground line-through">
                {formatPrice(product.compareAtPrice!)}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
