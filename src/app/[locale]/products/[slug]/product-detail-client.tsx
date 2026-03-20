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
    toast.success("Сагсанд нэмэгдлээ!");
  };

  return (
    <div className="container mx-auto px-4 py-8">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Images */}
        <div>
          <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden mb-4 relative">
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
              <ShoppingBag className="h-24 w-24 text-gray-300" />
            )}
          </div>
          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 ${
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

          <h1 className="text-3xl font-bold mb-4">{displayName}</h1>

          {/* Price */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl font-bold text-primary">
              {formatPrice(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-xl text-muted-foreground line-through">
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
            <div className="mb-6">
              <p className="font-medium mb-2">{t("selectSize")}</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    disabled={variant.stock <= 0}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      selectedVariant?.id === variant.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : variant.stock <= 0
                        ? "border-gray-200 text-gray-400 cursor-not-allowed"
                        : "border-gray-300 hover:border-primary"
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
          <div className="mb-6">
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
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center border rounded-lg">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
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
              className="flex-1"
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
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">{t("relatedProducts")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
