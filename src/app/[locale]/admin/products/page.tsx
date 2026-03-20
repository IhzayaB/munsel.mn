import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil } from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { DeleteProductButton } from "./delete-product-button";

export default async function AdminProductsPage() {
  const allProducts = await db.query.products.findMany({
    with: { category: true, variants: true },
    orderBy: [desc(products.createdAt)],
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Бүтээгдэхүүн</h1>
        <Button render={<Link href="/admin/products/new" />}>
          <Plus className="mr-2 h-4 w-4" />
          Нэмэх
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Нэр</TableHead>
                <TableHead>Ангилал</TableHead>
                <TableHead>Үнэ</TableHead>
                <TableHead>Хэмжээ</TableHead>
                <TableHead>Төлөв</TableHead>
                <TableHead>Үйлдэл</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Бүтээгдэхүүн байхгүй байна. Эхний бүтээгдэхүүнээ нэмнэ үү!
                  </TableCell>
                </TableRow>
              ) : (
                allProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.nameMn}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.category?.nameMn || "—"}
                    </TableCell>
                    <TableCell>{formatPrice(product.price)}</TableCell>
                    <TableCell>
                      {product.variants?.length || 0} хэмжээ
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={product.active ? "default" : "secondary"}
                      >
                        {product.active ? "Идэвхтэй" : "Идэвхгүй"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" render={<Link href={`/admin/products/${product.id}/edit`} />}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <DeleteProductButton productId={product.id} productName={product.name} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
