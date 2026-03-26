import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, productVariants, orderItems } from "@/lib/db/schema";
import { eq, and, ne, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";

// GET single product (admin only)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const product = await db.query.products.findFirst({
    where: eq(products.id, id),
    with: { category: true, variants: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(product);
}

// UPDATE product
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const {
      name, nameMn, slug, description, descriptionMn,
      price, compareAtPrice, material, materialMn,
      ageRange, featured, active, images, categoryId, variants,
    } = body;

    // Check slug uniqueness (exclude current product)
    if (slug) {
      const existingSlug = await db.query.products.findFirst({
        where: and(eq(products.slug, slug), ne(products.id, id)),
      });
      if (existingSlug) {
        return NextResponse.json(
          { error: "Slug аль хэдийн бүртгэгдсэн байна. Өөр нэр оруулна уу." },
          { status: 409 }
        );
      }
    }

    // Verify product exists
    const existing = await db.query.products.findFirst({
      where: eq(products.id, id),
    });
    if (!existing) {
      return NextResponse.json({ error: "Бүтээгдэхүүн олдсонгүй" }, { status: 404 });
    }

    // Validate price
    if (price !== undefined && (isNaN(Number(price)) || Number(price) <= 0)) {
      return NextResponse.json({ error: "Үнэ эерэг тоо байх ёстой" }, { status: 400 });
    }

    await db
      .update(products)
      .set({
        name, nameMn, slug,
        description: description || null,
        descriptionMn: descriptionMn || null,
        price, compareAtPrice: compareAtPrice || null,
        material: material || null,
        materialMn: materialMn || null,
        ageRange: ageRange || null,
        featured: featured || false,
        active: active !== false,
        images: images || [],
        categoryId: categoryId || null,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));

    // Replace variants
    if (variants) {
      await db.delete(productVariants).where(eq(productVariants.productId, id));
      if (variants.length > 0) {
        await db.insert(productVariants).values(
          variants.map((v: { size: string; color?: string; colorMn?: string; stock: number; sku?: string }) => ({
            productId: id,
            size: v.size,
            color: v.color || null,
            colorMn: v.colorMn || null,
            stock: v.stock || 0,
            sku: v.sku || null,
          }))
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update product error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

// DELETE product
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if product exists
    const product = await db.query.products.findFirst({
      where: eq(products.id, id),
    });
    if (!product) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Check if any order items reference this product
    const existingOrderItem = await db.query.orderItems.findFirst({
      where: eq(orderItems.productId, id),
    });

    if (existingOrderItem && product.active) {
      // Soft delete: deactivate product to preserve order history
      await db
        .update(products)
        .set({ active: false, updatedAt: new Date() })
        .where(eq(products.id, id));
      return NextResponse.json({ success: true, softDeleted: true });
    }

    // Hard delete: either no orders reference this product, or it's already inactive
    // Remove order item references first (set productId to null via raw SQL since FK is NOT NULL)
    if (existingOrderItem) {
      await db.execute(
        sql`UPDATE order_items SET product_id = NULL, variant_id = NULL WHERE product_id = ${id}`
      );
    }
    await db.delete(productVariants).where(eq(productVariants.productId, id));
    await db.delete(products).where(eq(products.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
