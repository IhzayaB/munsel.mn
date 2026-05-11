import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/routing";
import { ArrowLeft } from "lucide-react";
import { AdminNavClient } from "./admin-nav-client";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || session.user?.role !== "admin") {
    redirect("/login");
  }

  const navItems = [
    { href: "/admin", label: "Хяналт", icon: "LayoutDashboard" as const, exact: true },
    { href: "/admin/products", label: "Бүтээгдэхүүн", icon: "Package" as const },
    { href: "/admin/orders", label: "Захиалга", icon: "ShoppingCart" as const },
    { href: "/admin/categories", label: "Ангилал", icon: "Tags" as const },
    { href: "/admin/coupons", label: "Купон", icon: "Ticket" as const },
    { href: "/admin/stock", label: "Нөөц", icon: "Warehouse" as const },
    { href: "/admin/customers", label: "Хэрэглэгч", icon: "Users" as const },
    { href: "/admin/email", label: "Имэйл", icon: "Mail" as const },
    { href: "/admin/settings", label: "Тохиргоо", icon: "Settings" as const },
  ];

  const isProduction = process.env.NEXT_PUBLIC_SITE_URL?.includes("pajama.mn");

  return (
    <div className="min-h-[60vh]">
      {!isProduction && (
        <div className="bg-yellow-500 text-yellow-950 text-center text-xs font-bold py-1 px-2">
          ⚠️ ХӨГЖҮҮЛЭЛТИЙН ОРЧИН — Энэ бол production биш!
        </div>
      )}
      <div className="border-b bg-secondary/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-3 sm:px-4 py-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <Link
                href="/"
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Нүүр хуудас"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <h2 className="font-bold text-sm">Админ</h2>
            </div>
            <AdminNavClient items={navItems} />
          </div>
        </div>
      </div>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {children}
      </div>
    </div>
  );
}
