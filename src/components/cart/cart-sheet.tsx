"use client";

import { useTranslations } from "next-intl";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/store/cart";
import { CartItemRow } from "./cart-item";
import { Link } from "@/i18n/routing";
import { ShoppingBag } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface CartSheetProps {
  children: React.ReactNode;
}

export function CartSheet({ children }: CartSheetProps) {
  const t = useTranslations("cart");
  const { items, getTotalPrice, getShippingCost, getGrandTotal } =
    useCartStore();

  return (
    <Sheet>
      <SheetTrigger render={<span />}>{children}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            {t("title")} ({items.length})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground mb-4">
              {t("empty")}
            </p>
            <Button render={<Link href="/products" />}>
              {t("continueShopping")}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {items.map((item) => (
                <CartItemRow
                  key={`${item.productId}-${item.variantId}`}
                  item={item}
                  locale="mn"
                />
              ))}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t("subtotal")}</span>
                <span>{formatPrice(getTotalPrice())}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{t("shipping")}</span>
                <span>
                  {getShippingCost() === 0
                    ? t("freeShipping")
                    : formatPrice(getShippingCost())}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>{t("total")}</span>
                <span>{formatPrice(getGrandTotal())}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("shippingNote")}
              </p>
              <Button className="w-full mt-2" size="lg" render={<Link href="/checkout" />}>
                {t("checkout")}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
