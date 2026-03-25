"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function DeleteProductButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`"${productName}" устгах уу? Энэ үйлдлийг буцаах боломжгүй.`)) return;

    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed");
      }
      const data = await res.json();
      if (data.softDeleted) {
        toast.success("Захиалгатай тул идэвхгүй болголоо");
      } else {
        toast.success("Бүтээгдэхүүн устгагдлаа");
      }
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Бүтээгдэхүүн устгахад алдаа гарлаа");
    }
  };

  return (
    <Button variant="ghost" size="icon" className="text-destructive" onClick={handleDelete}>
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
