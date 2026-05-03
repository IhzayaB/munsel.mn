"use client";

import { Link } from "@/i18n/routing";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Plus, Heart } from "lucide-react";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";

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
    variants?: Array<{ id: string; size?: string | null; stock: number }> | null;
  };
  imagePriority?: boolean;
}

export function ProductCard({ product, imagePriority = false }: ProductCardProps) {
  const tc = useTranslations("common");
  const displayName = product.nameMn;
  const categoryName = product.category?.nameMn;
  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const isWished = useWishlistStore((s) => s.has(product.id));
  const [mounted, setMounted] = useState(false);
  // Defer hover image loading until actual mouse interaction.
  // Mobile: never loads (no mouseenter) → saves ~50% of product image requests.
  // Desktop: loads on first hover, cached for subsequent hovers.
  const [hoverReady, setHoverReady] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const enableHover = useCallback(() => {
    if (!hoverReady) setHoverReady(true);
  }, [hoverReady]);

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
      size: firstVariant?.size || undefined,
      quantity: 1,
      image: product.images?.[0] ?? undefined,
      maxStock: firstVariant?.stock,
    });
    toast.success(tc("addedToCart"));
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <Link href={`/products/${product.slug}`}>
      <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden h-full border-transparent hover:border-primary/10" onMouseEnter={enableHover}>
        <div className="relative bg-secondary aspect-[3/4] flex items-center justify-center overflow-hidden">
          {product.images && product.images.length > 0 ? (
            <>
              <Image
                src={product.images[0]}
                alt={displayName}
                fill
                priority={imagePriority}
                className={`object-cover transition-all duration-500 ${
                  hoverReady && product.images.length > 1
                    ? "group-hover:opacity-0 group-hover:scale-105"
                    : "group-hover:scale-105"
                }`}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
              {hoverReady && product.images.length > 1 && (
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
            <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-full backdrop-blur-sm">
              1/{product.images.length}
            </div>
          )}

          {/* Wishlist heart */}
          {mounted && (
            <button
              onClick={handleWishlist}
              className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm"
              aria-label="Хадгалах"
            >
              <Heart
                className={`h-4 w-4 transition-colors ${
                  isWished ? "fill-red-500 text-red-500" : "text-gray-600"
                }`}
              />
            </button>
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
            <p className="text-[11px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1 truncate">
              {categoryName}
            </p>
          )}
          <h3 className="font-semibold text-foreground mb-0.5 sm:mb-1 line-clamp-2 text-[13px] leading-tight sm:text-sm sm:leading-snug">
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
