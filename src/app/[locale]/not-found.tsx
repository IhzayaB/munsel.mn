import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
      <h2 className="text-2xl font-bold mb-2">Хуудас олдсонгүй</h2>
      <p className="text-muted-foreground mb-6">
        Уучлаарай, энэ хуудас олдсонгүй.
      </p>
      <Link
        href="/"
        className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:opacity-90"
      >
        Нүүр хуудас руу буцах
      </Link>
    </div>
  );
}
