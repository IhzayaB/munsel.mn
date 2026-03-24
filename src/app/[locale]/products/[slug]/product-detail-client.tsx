"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useCartStore } from "@/store/cart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProductCard } from "@/components/products/product-card";
import {
  ShoppingBag,
  Check,
  Minus,
  Plus,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { toast } from "sonner";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import type { ProductWithVariants } from "@/types";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

interface ProductDetailClientProps {
  product: ProductWithVariants;
  relatedProducts: ProductWithVariants[];
}

export function ProductDetailClient({
  product,
  relatedProducts,
}: ProductDetailClientProps) {
  const t = useTranslations("products");
  const tc = useTranslations("common");
  const addItem = useCartStore((s) => s.addItem);

  const [selectedVariant, setSelectedVariant] = useState(
    product.variants?.[0] || null
  );
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const handleVariantChange = (variant: typeof selectedVariant) => {
    setSelectedVariant(variant);
    setQuantity(1);
  };

  const displayName = product.nameMn;
  const description = product.descriptionMn;
  const material = product.materialMn;

  const hasDiscount =
    product.compareAtPrice &&
    Number(product.compareAtPrice) > Number(product.price);

  const inStock = selectedVariant ? selectedVariant.stock > 0 : true;

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      variantId: selectedVariant?.id,
      name: product.name,
      nameMn: product.nameMn,
      price: Number(product.price),
      size: selectedVariant?.size,
      color: selectedVariant?.color || undefined,
      quantity,
      image: product.images?.[0],
      maxStock: selectedVariant?.stock,
    });
    toast.success(tc("addedToCart"));
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Бүтээгдэхүүн", href: "/products" },
          ...(product.category
            ? [{ label: product.category.nameMn }]
            : []),
          { label: displayName },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
        {/* Images */}
        <div>
          <div className="aspect-square bg-secondary rounded-lg sm:rounded-xl flex items-center justify-center overflow-hidden mb-3 sm:mb-4 relative">
            {product.images && product.images.length > 0 ? (
              <Image
                src={product.images[selectedImage]}
                alt={displayName}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <ShoppingBag className="h-24 w-24 text-muted-foreground/40" />
            )}
          </div>
          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  aria-label={`Зураг ${i + 1}`}
                  className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 shrink-0 ${
                    selectedImage === i
                      ? "border-primary"
                      : "border-transparent"
                  }`}
                >
                  <Image
                    src={img}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          {product.category && (
            <p className="text-sm text-muted-foreground mb-2">
              {product.category.nameMn}
            </p>
          )}

          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">{displayName}</h1>

          {/* Price */}
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <span className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">
              {formatPrice(product.price)}
            </span>
            {hasDiscount && (
            <span className="text-lg sm:text-xl text-muted-foreground line-through">
                {formatPrice(product.compareAtPrice!)}
              </span>
            )}
            {hasDiscount && (
              <Badge variant="destructive" className="text-sm">
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

          {/* Size selection */}
          {product.variants && product.variants.length > 0 && (
            <div className="mb-4 sm:mb-6">
              <p className="font-medium mb-2">{t("selectSize")}</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => handleVariantChange(variant)}
                    disabled={variant.stock <= 0}
                    aria-label={variant.stock <= 0 ? `${variant.size} - дууссан` : variant.size || undefined}
                    aria-pressed={selectedVariant?.id === variant.id}
                    className={`px-3.5 py-2.5 sm:px-4 sm:py-2.5 rounded-lg border text-sm font-medium transition-colors min-w-[44px] min-h-[44px] ${
                      selectedVariant?.id === variant.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : variant.stock <= 0
                        ? "border-muted text-muted-foreground cursor-not-allowed line-through"
                        : "border-border hover:border-primary active:bg-accent"
                    }`}
                  >
                    {variant.size}
                    {variant.color && ` - ${variant.colorMn}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock status */}
          <div className="mb-4 sm:mb-6">
            {inStock ? (
              <p className="text-green-600 flex items-center gap-1 text-sm">
                <Check className="h-4 w-4" />
                {t("inStock")}
                {selectedVariant &&
                  ` (${selectedVariant.stock} ширхэг)`}
              </p>
            ) : (
              <p className="text-red-500 text-sm">{t("outOfStock")}</p>
            )}
          </div>

          {/* Quantity + Add to cart */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6 sm:mb-8">
            <div className="flex items-center border rounded-lg self-start">
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 sm:h-11 sm:w-11"
                aria-label="Тоо хэмжээ хасах"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center font-medium text-base">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 sm:h-11 sm:w-11"
                aria-label="Тоо хэмжээ нэмэх"
                onClick={() => {
                  const maxQty = selectedVariant ? selectedVariant.stock : 99;
                  setQuantity(Math.min(quantity + 1, maxQty));
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <Button
              size="lg"
              className="flex-1 h-14 sm:h-12 text-base"
              disabled={!inStock}
              onClick={handleAddToCart}
            >
              <ShoppingBag className="mr-2 h-5 w-5" />
              {t("addToCart")}
            </Button>
          </div>

          <Separator className="mb-6" />

          {/* Description */}
          {description && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">{t("description")}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {description}
              </p>
            </div>
          )}

          {/* Material */}
          {material && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">{t("material")}</h3>
              <p className="text-muted-foreground">{material}</p>
            </div>
          )}

          {/* Age range */}
          {product.ageRange && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">{t("ageRange")}</h3>
              <p className="text-muted-foreground">{product.ageRange}</p>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-8 sm:mt-12 lg:mt-16">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6">{t("relatedProducts")}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
