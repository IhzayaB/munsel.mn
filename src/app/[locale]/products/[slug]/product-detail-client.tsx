"use client";

import { useTranslations } from "next-intl";
import { useState, useRef, useCallback, useEffect } from "react";
import { useCartStore } from "@/store/cart";
import { useWishlistStore } from "@/store/wishlist";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProductCard } from "@/components/products/product-card";
import {
  ShoppingBag,
  Check,
  Minus,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  Ruler,
  ZoomIn,
  Heart,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { toast } from "sonner";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

// Size guide data
const SIZE_GUIDE = [
  { size: "NB", age: "0 сар", weight: "2.5-3.5 кг", height: "45-55 см" },
  { size: "0-3M", age: "0-3 сар", weight: "3-6 кг", height: "55-62 см" },
  { size: "3-6M", age: "3-6 сар", weight: "6-8 кг", height: "62-68 см" },
  { size: "6-9M", age: "6-9 сар", weight: "8-9.5 кг", height: "68-74 см" },
  { size: "9-12M", age: "9-12 сар", weight: "9.5-11 кг", height: "74-80 см" },
  { size: "12-18M", age: "12-18 сар", weight: "11-12.5 кг", height: "80-86 см" },
  { size: "18-24M", age: "18-24 сар", weight: "12.5-14 кг", height: "86-92 см" },
];

interface ProductDetailClientProps {
  product: {
    id: string;
    name: string;
    nameMn: string;
    slug: string;
    descriptionMn?: string | null;
    price: string;
    compareAtPrice?: string | null;
    images: string[];
    ageRange?: string | null;
    materialMn?: string | null;
    category?: { id: string; nameMn: string } | null;
    variants: Array<{ id: string; size?: string | null; color?: string | null; stock: number }>;
  };
  relatedProducts: Array<{
    id: string;
    name: string;
    nameMn: string;
    slug: string;
    price: string;
    compareAtPrice?: string | null;
    images: string[];
    featured?: boolean;
    ageRange?: string | null;
    category?: { name: string; nameMn: string } | null;
    variants?: Array<{ id: string; size?: string | null; stock: number }> | null;
  }>;
}

export function ProductDetailClient({
  product,
  relatedProducts,
}: ProductDetailClientProps) {
  const t = useTranslations("products");
  const tc = useTranslations("common");
  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const isWished = useWishlistStore((s) => s.has(product.id));
  const [wishMounted, setWishMounted] = useState(false);

  const colorOptions = Array.from(
    new Set(
      (product.variants || [])
        .map((v) => (v.color || "").trim())
        .filter((c): c is string => c.length > 0)
    )
  );
  const [selectedColor, setSelectedColor] = useState<string | null>(
    colorOptions[0] || null
  );

  const filteredVariants = (product.variants || []).filter((v) => {
    if (!selectedColor) return true;
    return (v.color || "").trim() === selectedColor;
  });

  const [selectedVariant, setSelectedVariant] = useState(
    product.variants?.[0] || null
  );
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  // Swipe handling
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const imageCount = product.images?.length || 0;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && selectedImage < imageCount - 1) {
        setSelectedImage(selectedImage + 1);
      } else if (diff < 0 && selectedImage > 0) {
        setSelectedImage(selectedImage - 1);
      }
    }
  };

  // Lightbox keyboard nav
  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight" && selectedImage < imageCount - 1) setSelectedImage((i) => i + 1);
      if (e.key === "ArrowLeft" && selectedImage > 0) setSelectedImage((i) => i - 1);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [lightboxOpen, selectedImage, imageCount]);

  // Save to recently viewed
  useEffect(() => {
    try {
      const key = "pajama-recently-viewed";
      const stored = JSON.parse(localStorage.getItem(key) || "[]");
      const item = {
        id: product.id,
        slug: product.slug,
        nameMn: product.nameMn,
        price: product.price,
        image: product.images?.[0],
      };
      const filtered = stored.filter((s: { id: string }) => s.id !== product.id);
      const updated = [item, ...filtered].slice(0, 8);
      localStorage.setItem(key, JSON.stringify(updated));
    } catch {}
  }, [product]);

  useEffect(() => {
    setWishMounted(true);
  }, []);

  useEffect(() => {
    if (!selectedColor) return;
    const variantsByColor = (product.variants || []).filter(
      (v) => (v.color || "").trim() === selectedColor
    );
    if (variantsByColor.length === 0) return;

    if (
      !selectedVariant ||
      (selectedVariant.color || "").trim() !== selectedColor
    ) {
      setSelectedVariant(
        variantsByColor.find((v) => v.stock > 0) || variantsByColor[0]
      );
      setQuantity(1);
    }
  }, [selectedColor, product.variants, selectedVariant]);

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
      size: selectedVariant?.size || undefined,
      color: selectedVariant?.color || undefined,
      quantity,
      image: product.images?.[0],
      maxStock: selectedVariant?.stock,
    });
    toast.success(tc("addedToCart"));
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-24 lg:pb-8">
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
        {/* Images — swipeable on mobile */}
        <div>
          <div
            className="aspect-square bg-secondary rounded-lg sm:rounded-xl flex items-center justify-center overflow-hidden mb-3 sm:mb-4 relative cursor-zoom-in"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={() => imageCount > 0 && setLightboxOpen(true)}
          >
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
            {/* Image counter dots */}
            {imageCount > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 lg:hidden">
                {product.images!.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      selectedImage === i ? "w-4 bg-primary" : "w-1.5 bg-white/60"
                    }`}
                  />
                ))}
              </div>
            )}
            {/* Zoom hint */}
            <div className="absolute top-3 right-3 bg-black/40 text-white p-1.5 rounded-full backdrop-blur-sm hidden sm:flex">
              <ZoomIn className="h-4 w-4" />
            </div>
          </div>
          {/* Thumbnails — desktop */}
          {product.images && product.images.length > 1 && (
            <div className="hidden lg:flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
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

          <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">{displayName}</h1>
            {wishMounted && (
              <button
                onClick={() => toggleWishlist(product.id)}
                className="shrink-0 mt-1 h-10 w-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                aria-label="Хадгалах"
              >
                <Heart
                  className={`h-5 w-5 transition-colors ${
                    isWished ? "fill-red-500 text-red-500" : "text-muted-foreground"
                  }`}
                />
              </button>
            )}
          </div>

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
          {colorOptions.length > 0 && (
            <div className="mb-4 sm:mb-6">
              <p className="font-medium mb-2">Өнгө сонгох</p>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => {
                  const anyInStock = (product.variants || []).some(
                    (v) => (v.color || "").trim() === color && v.stock > 0
                  );
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      disabled={!anyInStock}
                      className={`px-3.5 py-2.5 sm:px-4 sm:py-2.5 rounded-lg border text-sm font-medium transition-colors min-w-[44px] min-h-[44px] ${
                        selectedColor === color
                          ? "border-primary bg-primary text-primary-foreground"
                          : !anyInStock
                          ? "border-muted text-muted-foreground cursor-not-allowed line-through"
                          : "border-border hover:border-primary active:bg-accent"
                      }`}
                    >
                      {color}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size selection */}
          {filteredVariants.length > 0 && filteredVariants.some(v => v.size) && (
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium">{t("selectSize")}</p>
                <button
                  type="button"
                  onClick={() => setSizeGuideOpen(true)}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <Ruler className="h-3.5 w-3.5" />
                  Хэмжээний заавар
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {filteredVariants.map((variant) => (
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

          {/* Quantity + Add to cart — hidden on mobile (sticky bar below) */}
          <div className="hidden lg:flex items-center gap-3 mb-6 sm:mb-8">
            <div className="flex items-center border rounded-lg">
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11"
                aria-label="Тоо хэмжээ хасах"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center font-medium text-base">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11"
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
              className="flex-1 h-12 text-base"
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

      {/* Recently Viewed */}
      <RecentlyViewed currentProductId={product.id} />

      {/* Sticky add-to-cart bar — mobile only */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border p-3 z-40 safe-bottom">
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center text-sm font-medium">{quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
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
            className="flex-1 h-12 text-base"
            disabled={!inStock}
            onClick={handleAddToCart}
          >
            <ShoppingBag className="mr-2 h-5 w-5" />
            {formatPrice(Number(product.price) * quantity)}
          </Button>
        </div>
      </div>

      {/* Image Lightbox */}
      {lightboxOpen && product.images && product.images.length > 0 && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white z-10 p-2"
            aria-label="Хаах"
          >
            <X className="h-6 w-6" />
          </button>
          {selectedImage > 0 && (
            <button
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 z-10"
              onClick={(e) => { e.stopPropagation(); setSelectedImage(selectedImage - 1); }}
              aria-label="Өмнөх зураг"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
          )}
          {selectedImage < imageCount - 1 && (
            <button
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 z-10"
              onClick={(e) => { e.stopPropagation(); setSelectedImage(selectedImage + 1); }}
              aria-label="Дараагийн зураг"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          )}
          <div className="relative w-full h-full max-w-4xl max-h-[80vh] m-4" onClick={(e) => e.stopPropagation()}>
            <Image
              src={product.images[selectedImage]}
              alt={displayName}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>
          {imageCount > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {product.images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setSelectedImage(i); }}
                  className={`h-2 rounded-full transition-all ${
                    selectedImage === i ? "w-6 bg-white" : "w-2 bg-white/40"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Size Guide Modal */}
      {sizeGuideOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center"
          onClick={() => setSizeGuideOpen(false)}
        >
          <div
            className="bg-background rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[80vh] overflow-y-auto p-5 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Ruler className="h-5 w-5" />
                Хэмжээний заавар
              </h3>
              <button onClick={() => setSizeGuideOpen(false)} className="p-1 hover:bg-accent rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-semibold">Хэмжээ</th>
                    <th className="text-left py-2 pr-4 font-semibold">Нас</th>
                    <th className="text-left py-2 pr-4 font-semibold">Жин</th>
                    <th className="text-left py-2 font-semibold">Өндөр</th>
                  </tr>
                </thead>
                <tbody>
                  {SIZE_GUIDE.map((row) => (
                    <tr
                      key={row.size}
                      className={`border-b last:border-0 ${
                        selectedVariant?.size === row.size
                          ? "bg-primary/10 font-medium"
                          : ""
                      }`}
                    >
                      <td className="py-2.5 pr-4">{row.size}</td>
                      <td className="py-2.5 pr-4 text-muted-foreground">{row.age}</td>
                      <td className="py-2.5 pr-4 text-muted-foreground">{row.weight}</td>
                      <td className="py-2.5 text-muted-foreground">{row.height}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              * Хэмжээ нь ойролцоо утга бөгөөд хүүхэд бүрийн биеийн хэмжээнээс хамаарч өөрчлөгдөж болно.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Recently Viewed Products component
function RecentlyViewed({ currentProductId }: { currentProductId: string }) {
  const [items, setItems] = useState<Array<{
    id: string;
    slug: string;
    nameMn: string;
    price: string;
    image?: string;
  }>>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("pajama-recently-viewed") || "[]");
      setItems(stored.filter((s: { id: string }) => s.id !== currentProductId).slice(0, 6));
    } catch {}
  }, [currentProductId]);

  if (items.length === 0) return null;

  return (
    <div className="mt-8 sm:mt-12">
      <h2 className="text-lg sm:text-xl font-bold mb-4">Саяхан үзсэн</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-3 px-3">
        {items.map((item) => (
          <Link key={item.id} href={`/products/${item.slug}` as "/products"} className="shrink-0 w-32 sm:w-40">
            <div className="aspect-[3/4] bg-secondary rounded-lg overflow-hidden relative mb-2">
              {item.image && (
                <Image src={item.image} alt={item.nameMn} fill className="object-cover" sizes="160px" />
              )}
            </div>
            <p className="text-xs sm:text-sm font-medium line-clamp-1">{item.nameMn}</p>
            <p className="text-xs sm:text-sm font-bold text-primary">{formatPrice(item.price)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
