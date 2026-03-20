import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || session.user?.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="min-h-[60vh]">
      <div className="border-b bg-gray-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <h2 className="font-bold text-lg">🛠️ Admin Panel</h2>
            <nav className="flex gap-4 text-sm">
              <Link
                href="/admin"
                className="text-muted-foreground hover:text-foreground"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/products"
                className="text-muted-foreground hover:text-foreground"
              >
                Products
              </Link>
              <Link
                href="/admin/orders"
                className="text-muted-foreground hover:text-foreground"
              >
                Orders
              </Link>
              <Link
                href="/admin/categories"
                className="text-muted-foreground hover:text-foreground"
              >
                Categories
              </Link>
            </nav>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
