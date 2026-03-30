"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import {
  ShoppingBag,
  Settings,
  Search,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/store/cart";
import { useEffect, useState, useRef, lazy, Suspense } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";

const CartSheet = lazy(() => import("@/components/cart/cart-sheet").then(m => ({ default: m.CartSheet })));
const SearchOverlay = lazy(() => import("@/components/search-overlay").then(m => ({ default: m.SearchOverlay })));

export function Header() {
  const t = useTranslations("common");
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [badgeBounce, setBadgeBounce] = useState(false);
  const totalItems = useCartStore((s) => s.getTotalItems());
  const prevItems = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Bounce animation when cart items change
  useEffect(() => {
    if (mounted && totalItems > prevItems.current) {
      setBadgeBounce(true);
      const timer = setTimeout(() => setBadgeBounce(false), 400);
      return () => clearTimeout(timer);
    }
    prevItems.current = totalItems;
  }, [totalItems, mounted]);

  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--baby-cream)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--baby-cream)]/60 safe-top">
      <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Pajama.mn"
            width={36}
            height={36}
            className="rounded-full"
            priority
          />
          <Image
            src="/pajama-text.png"
            alt="Pajama.mn"
            width={120}
            height={28}
            className="hidden sm:block h-7 w-auto"
            priority
          />
        </Link>

        {/* Right side actions */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          {/* Search */}
          <Button variant="ghost" size="icon" className="h-11 w-11 sm:h-10 sm:w-10" aria-label={t("search")} onClick={() => setSearchOpen(true)}>
            <Search className="h-5 w-5" />
          </Button>

          {/* User account / Admin */}
          {isAdmin ? (
            <Button variant="ghost" size="icon" className="h-11 w-11 sm:h-10 sm:w-10" aria-label={t("admin")} render={<Link href="/admin" />}>
              <Settings className="h-5 w-5" />
            </Button>
          ) : session ? (
            <Button variant="ghost" size="icon" className="h-11 w-11 sm:h-10 sm:w-10" aria-label={t("account")} render={<Link href="/account/orders" />}>
              <User className="h-5 w-5" />
            </Button>
          ) : null}

          {/* Cart */}
          <Suspense fallback={
            <Button variant="ghost" size="icon" className="relative h-11 w-11 sm:h-10 sm:w-10" aria-label={t("cart")}>
              <ShoppingBag className="h-5 w-5" />
            </Button>
          }>
            <CartSheet>
              <Button variant="ghost" size="icon" className="relative h-11 w-11 sm:h-10 sm:w-10" aria-label={t("cart")}>
                <ShoppingBag className="h-5 w-5" />
                {mounted && totalItems > 0 && (
                  <Badge className={`absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] ${badgeBounce ? "cart-badge-bounce" : ""}`}>
                    {totalItems}
                  </Badge>
                )}
              </Button>
            </CartSheet>
          </Suspense>
        </div>
      </div>
      <Suspense fallback={null}>
        <SearchOverlay open={searchOpen} onOpenChange={setSearchOpen} />
      </Suspense>
    </header>
  );
}
