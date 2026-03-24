"use client";

import { useTranslations } from "next-intl";
import { useCartStore } from "@/store/cart";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/routing";
import { CartItemRow } from "@/components/cart/cart-item";
import { ShoppingBag } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import Image from "next/image";

export default function CartPage() {
  const t = useTranslations("cart");
  const { items, getTotalPrice, getShippingCost, getGrandTotal, clearCart } =
    useCartStore();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-16 text-center">
        <Image
          src="/logo.png"
          alt="Pajama.mn"
          width={80}
          height={80}
          className="mx-auto mb-6 rounded-full opacity-40"
        />
        <h1 className="text-2xl font-bold mb-2">{t("empty")}</h1>
        <p className="text-muted-foreground mb-6">{t("emptySubtitle")}</p>
        <Button size="lg" render={<Link href="/products" />}>
          {t("continueShopping")}
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-28 sm:pb-8">
      <Breadcrumbs items={[{ label: t("title") }]} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
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

        {/* Summary — sticky bottom bar on mobile, sidebar on desktop */}
        <div className="hidden lg:block bg-secondary rounded-xl p-5 sm:p-6 h-fit lg:sticky lg:top-24">
          <h2 className="font-bold text-lg mb-4">
            {t("checkout") === "Төлбөр төлөх" ? "Захиалгын товчхон" : t("checkout")}
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

          <Button className="w-full h-12 text-base" size="lg" render={<Link href="/checkout" />}>
            {t("checkout")}
          </Button>

          <Button
            variant="outline"
            className="w-full mt-2 h-10"
            size="sm"
            render={<Link href="/products" />}
          >
            {t("continueShopping")}
          </Button>
        </div>

        {/* Mobile sticky bottom bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border p-3 z-40 safe-bottom">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">{t("total")}</span>
            <span className="text-lg font-bold">{formatPrice(getGrandTotal())}</span>
          </div>
          <Button className="w-full h-12 text-base" size="lg" render={<Link href="/checkout" />}>
            {t("checkout")}
          </Button>
        </div>
      </div>
    </div>
  );
}
