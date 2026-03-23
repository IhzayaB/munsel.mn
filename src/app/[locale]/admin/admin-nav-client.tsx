"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, Tags } from "lucide-react";

const iconMap = {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tags,
} as const;

interface NavItem {
  href: string;
  label: string;
  icon: keyof typeof iconMap;
  exact?: boolean;
}

export function AdminNavClient({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  // Strip locale prefix if present
  const cleanPath = pathname.replace(/^\/mn/, "") || "/";

  return (
    <nav className="flex gap-1 sm:gap-2 overflow-x-auto scrollbar-hide">
      {items.map((item) => {
        const Icon = iconMap[item.icon];
        const isActive = item.exact
          ? cleanPath === item.href
          : cleanPath.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
