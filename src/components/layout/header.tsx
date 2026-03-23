"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import {
  ShoppingBag,
  Menu,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { CartSheet } from "@/components/cart/cart-sheet";
import { useCartStore } from "@/store/cart";
import { useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";

export function Header() {
  const t = useTranslations("common");
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const totalItems = useCartStore((s) => s.getTotalItems());
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const navLinks = [
    { href: "/" as const, label: t("home") },
    { href: "/products" as const, label: t("products") },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--baby-cream)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--baby-cream)]/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
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

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === link.href
                  ? "text-primary font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-1">
          {isAdmin && (
            <Button variant="ghost" size="icon" className="h-10 w-10" render={<Link href="/admin" />}>
              <Settings className="h-5 w-5" />
            </Button>
          )}

          {/* Cart */}
          <CartSheet>
            <Button variant="ghost" size="icon" className="relative h-10 w-10">
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                  {totalItems}
                </Badge>
              )}
            </Button>
          </CartSheet>

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger className="md:hidden" render={<Button variant="ghost" size="icon" className="h-10 w-10" aria-label="Цэс нээх" />}>
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="flex flex-col h-full">
                <div className="px-6 pt-6 pb-4 border-b border-border">
                  <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                    <Image
                      src="/logo.png"
                      alt="Pajama.mn"
                      width={36}
                      height={36}
                      className="rounded-full"
                    />
                    <Image
                      src="/pajama-text.png"
                      alt="Pajama.mn"
                      width={110}
                      height={26}
                      className="h-6 w-auto"
                    />
                  </Link>
                </div>
                <nav className="flex flex-col px-6 py-4 gap-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`text-base font-medium py-3 px-3 rounded-lg transition-colors hover:bg-accent hover:text-primary ${
                        pathname === link.href
                          ? "text-primary bg-accent"
                          : "text-foreground"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="text-base font-medium py-3 px-3 rounded-lg transition-colors hover:bg-accent hover:text-primary text-foreground flex items-center gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      {t("admin")}
                    </Link>
                  )}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
