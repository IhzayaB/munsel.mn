"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useCartStore, CartItem } from "@/store/cart";
import { Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";

interface CartItemRowProps {
  item: CartItem;
  locale: string;
}

export function CartItemRow({ item, locale }: CartItemRowProps) {
  const t = useTranslations("cart");
  const { updateQuantity, removeItem } = useCartStore();

  const displayName = item.nameMn;

  return (
    <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
      {/* Product image placeholder */}
      <div className="w-20 h-20 bg-gray-200 rounded-md flex items-center justify-center flex-shrink-0">
        {item.image ? (
          <Image
            src={item.image}
            alt={displayName}
            width={80}
            height={80}
            className="rounded-md object-cover"
          />
        ) : (
          <span className="text-2xl">👶</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate">{displayName}</h4>
        {item.size && (
          <p className="text-xs text-muted-foreground">
            {t("quantity")}: {item.size}
          </p>
        )}
        <p className="font-semibold text-sm mt-1">
          {formatPrice(item.price)}
        </p>

        <div className="flex items-center gap-2 mt-2">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() =>
              updateQuantity(item.productId, item.quantity - 1, item.variantId)
            }
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="text-sm font-medium w-6 text-center">
            {item.quantity}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() =>
              updateQuantity(item.productId, item.quantity + 1, item.variantId)
            }
          >
            <Plus className="h-3 w-3" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 ml-auto text-destructive hover:text-destructive"
            onClick={() => removeItem(item.productId, item.variantId)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
