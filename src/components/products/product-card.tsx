"use client";

import { Link } from "@/i18n/routing";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag } from "lucide-react";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";

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
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const displayName = product.nameMn;
  const categoryName = product.category?.nameMn;

  const hasDiscount =
    product.compareAtPrice &&
    Number(product.compareAtPrice) > Number(product.price);

  return (
    <Link href={`/products/${product.slug}`}>
      <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden h-full">
        <div className="relative bg-gray-100 h-64 flex items-center justify-center overflow-hidden">
          {product.images && product.images.length > 0 ? (
            <Image
              src={product.images[0]}
              alt={displayName}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <ShoppingBag className="h-16 w-16 text-gray-300 group-hover:scale-110 transition-transform" />
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.featured && (
              <Badge className="bg-pink-500 hover:bg-pink-600">⭐ Онцлох</Badge>
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
        </div>

        <CardContent className="p-4">
          {categoryName && (
            <p className="text-xs text-muted-foreground mb-1">
              {categoryName}
            </p>
          )}
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
            {displayName}
          </h3>
          {product.ageRange && (
            <p className="text-xs text-muted-foreground mb-2">
              {product.ageRange}
            </p>
          )}
          <div className="flex items-center gap-2">
            <p className="text-lg font-bold text-primary">
              {formatPrice(product.price)}
            </p>
            {hasDiscount && (
              <p className="text-sm text-muted-foreground line-through">
                {formatPrice(product.compareAtPrice!)}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
