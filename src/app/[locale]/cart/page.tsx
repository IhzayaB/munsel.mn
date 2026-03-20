"use client";

import { useTranslations } from "next-intl";
import { useCartStore } from "@/store/cart";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/routing";
import { CartItemRow } from "@/components/cart/cart-item";
import { ShoppingBag } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const t = useTranslations("cart");
  const { items, getTotalPrice, getShippingCost, getGrandTotal, clearCart } =
    useCartStore();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
        <h1 className="text-2xl font-bold mb-4">{t("empty")}</h1>
        <Button size="lg" render={<Link href="/products" />}>
          {t("continueShopping")}
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <CartItemRow
              key={`${item.productId}-${item.variantId}`}
              item={item}
              locale="mn"
            />
          ))}
        </div>

        {/* Summary */}
        <div className="bg-gray-50 rounded-xl p-6 h-fit sticky top-24">
          <h2 className="font-bold text-lg mb-4">
            Захиалгын товчхон
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>{t("subtotal")}</span>
              <span>{formatPrice(getTotalPrice())}</span>
            </div>
            <div className="flex justify-between">
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
          </div>

          <p className="text-xs text-muted-foreground mt-2 mb-4">
            {t("shippingNote")}
          </p>

          <Button className="w-full" size="lg" render={<Link href="/checkout" />}>
            {t("checkout")}
          </Button>

          <Button
            variant="outline"
            className="w-full mt-2"
            size="sm"
            render={<Link href="/products" />}
          >
            {t("continueShopping")}
          </Button>
        </div>
      </div>
    </div>
  );
}
