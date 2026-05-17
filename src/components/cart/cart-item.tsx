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
    <div className="flex gap-3 p-3 sm:p-3.5 bg-secondary/50 rounded-xl border border-border/50">
      {/* Product image */}
      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
        {item.image ? (
          <Image
            src={item.image}
            alt={displayName}
            width={80}
            height={80}
            className="rounded-lg object-cover w-full h-full"
            sizes="96px"
          />
        ) : (
          <ShoppingBagFallback />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm sm:text-[0.95rem] leading-snug line-clamp-2">{displayName}</h4>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
          {item.size && (
            <p className="text-xs text-muted-foreground">
              {t("size")}: {item.size}
            </p>
          )}
          {item.color && (
            <p className="text-xs text-muted-foreground">
              Өнгө: {item.color}
            </p>
          )}
        </div>
        <p className="font-semibold text-sm mt-1.5">
          {item.quantity > 1 ? (
            <>
              <span className="text-muted-foreground font-normal">{formatPrice(item.price)} × {item.quantity} = </span>
              {formatPrice(item.price * item.quantity)}
            </>
          ) : (
            formatPrice(item.price)
          )}
        </p>

        <div className="flex items-center gap-2 mt-2.5">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 sm:h-8 sm:w-8 rounded-full"
            aria-label="Тоо хэмжээ хасах"
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
            className="h-9 w-9 sm:h-8 sm:w-8 rounded-full"
            aria-label="Тоо хэмжээ нэмэх"
            disabled={!!(item.maxStock && item.quantity >= item.maxStock)}
            onClick={() =>
              updateQuantity(item.productId, item.quantity + 1, item.variantId)
            }
          >
            <Plus className="h-3 w-3" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 sm:h-8 sm:w-8 ml-auto text-destructive hover:text-destructive rounded-full"
            aria-label="Хасах"
            onClick={() => removeItem(item.productId, item.variantId)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ShoppingBagFallback() {
  return (
    <div className="h-full w-full bg-muted/60 flex items-center justify-center text-muted-foreground text-xs font-semibold">
      M
    </div>
  );
}
