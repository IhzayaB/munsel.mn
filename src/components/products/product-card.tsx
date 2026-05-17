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
    materialMn?: string | null;
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
      <Card className="group cursor-pointer transition-all duration-300 overflow-hidden h-full border border-[var(--sand)]/55 hover:border-[var(--gold-light)] hover:shadow-[0_10px_30px_rgba(198,151,63,0.10)] active:scale-[0.995] bg-white/92 backdrop-blur-[2px] rounded-md sm:rounded-sm" onMouseEnter={enableHover}>
        <div className="relative bg-[var(--champagne)] aspect-[3/4] flex items-center justify-center overflow-hidden">
          {product.images && product.images.length > 0 ? (
            <>
              <Image
                src={product.images[0]}
                alt={displayName}
                fill
                priority={imagePriority}
                className={`object-cover transition-all duration-700 ${
                  hoverReady && product.images.length > 1
                    ? "group-hover:opacity-0 group-hover:scale-[1.04]"
                    : "group-hover:scale-[1.04]"
                }`}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
              {hoverReady && product.images.length > 1 && (
                <Image
                  src={product.images[1]}
                  alt={displayName}
                  fill
                  className="object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              )}
            </>
          ) : (
            <ShoppingBag className="h-12 w-12 text-muted-foreground/20 group-hover:scale-110 transition-transform" />
          )}

          {/* Wishlist heart */}
          {mounted && (
            <button
              onClick={handleWishlist}
              className="absolute top-2.5 right-2.5 z-10 h-10 w-10 sm:h-8 sm:w-8 rounded-full bg-white/88 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm"
              aria-label="Хадгалах"
            >
              <Heart
                className={`h-4 w-4 sm:h-3.5 sm:w-3.5 transition-colors ${
                  isWished ? "fill-red-500 text-red-500" : "text-[var(--charcoal)]/70"
                }`}
              />
            </button>
          )}

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
            {product.featured && (
              <Badge variant="outline" className="border-[var(--gold)]/60 text-[var(--gold)] bg-white/90 backdrop-blur-sm text-[9px] sm:text-[10px] px-2 py-0.5 font-medium tracking-wider rounded-sm">
                ОНЦЛОХ
              </Badge>
            )}
            {hasDiscount && (
              <Badge variant="destructive" className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-sm">
                −{Math.round(
                  ((Number(product.compareAtPrice) - Number(product.price)) /
                    Number(product.compareAtPrice)) *
                    100
                )}%
              </Badge>
            )}
          </div>

          {/* Quick add button */}
          {inStock && (
            <Button
              size="icon"
              className="absolute bottom-2.5 right-2.5 opacity-100 sm:opacity-0 sm:translate-y-2 sm:group-hover:opacity-100 sm:group-hover:translate-y-0 transition-all duration-300 h-10 w-10 sm:h-9 sm:w-9 rounded-full shadow-md bg-[var(--charcoal)] hover:bg-black text-white border-0"
              onClick={handleQuickAdd}
              aria-label="Сагсанд нэмэх"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>

        <CardContent className="p-2.5 sm:p-4">
          <div className="w-8 h-px bg-[var(--gold)]/70 mb-2.5 sm:mb-3" />
          {categoryName && (
            <p className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-muted-foreground/80 mb-1.5 truncate">
              {categoryName}
            </p>
          )}
          <h3 className="font-heading font-semibold text-foreground mb-2 line-clamp-2 text-[14px] leading-[1.16] sm:text-[1.08rem] uppercase tracking-[0.02em]">
            {displayName}
          </h3>
          <div className="flex items-baseline gap-2">
            <p className="text-sm sm:text-[15px] font-semibold text-primary tracking-[0.02em]">
              {formatPrice(product.price)}
            </p>
            {hasDiscount && (
              <p className="text-[11px] sm:text-xs text-muted-foreground line-through">
                {formatPrice(product.compareAtPrice!)}
              </p>
            )}
          </div>
          {product.materialMn && (
            <p className="text-[9px] sm:text-[10px] text-muted-foreground/60 mt-2 uppercase tracking-[0.28em]">
              {product.materialMn}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

