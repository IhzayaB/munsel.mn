import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, productVariants, orderItems } from "@/lib/db/schema";
import { eq, and, ne, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { sanitizeSlug } from "@/lib/utils";

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
      hasColorCategory, colorOptions,
    } = body;

    const normalizedColorOptions = Array.from(
      new Set(
        (Array.isArray(colorOptions) ? colorOptions : [])
          .map((c) => (typeof c === "string" ? c.trim() : ""))
          .filter((c) => c.length > 0)
      )
    );

    const resolvedHasColorCategory =
      hasColorCategory === true || normalizedColorOptions.length > 0;

    // Sanitize and check slug uniqueness (exclude current product)
    const cleanSlug = slug ? sanitizeSlug(slug) : undefined;
    if (cleanSlug) {
      const existingSlug = await db.query.products.findFirst({
        where: and(eq(products.slug, cleanSlug), ne(products.id, id)),
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

    // Build update object only with provided fields
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (nameMn !== undefined) updateData.nameMn = nameMn;
    if (cleanSlug) updateData.slug = cleanSlug;
    if (description !== undefined) updateData.description = description || null;
    if (descriptionMn !== undefined) updateData.descriptionMn = descriptionMn || null;
    if (price !== undefined) updateData.price = price;
    if (compareAtPrice !== undefined) updateData.compareAtPrice = compareAtPrice || null;
    if (material !== undefined) updateData.material = material || null;
    if (materialMn !== undefined) updateData.materialMn = materialMn || null;
    if (ageRange !== undefined) updateData.ageRange = ageRange || null;
    if (featured !== undefined) updateData.featured = !!featured;
    if (active !== undefined) updateData.active = !!active;
    if (images !== undefined) updateData.images = images || [];
    if (categoryId !== undefined) updateData.categoryId = categoryId || null;
    if (hasColorCategory !== undefined || colorOptions !== undefined) {
      updateData.hasColorCategory = resolvedHasColorCategory;
      updateData.colorOptions = resolvedHasColorCategory ? normalizedColorOptions : [];
    }

    await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id));

    // Update variants (safely handle FK constraints from order_items)
    if (variants) {
      // Get existing variants
      const existingVariants = await db.query.productVariants.findMany({
        where: eq(productVariants.productId, id),
      });

      const incomingIds = new Set(
        variants
          .filter((v: { id?: string }) => v.id)
          .map((v: { id?: string }) => v.id)
      );

      // Delete variants that are no longer present (only if not referenced by orders)
      for (const ev of existingVariants) {
        if (!incomingIds.has(ev.id)) {
          const referencedByOrder = await db.query.orderItems.findFirst({
            where: eq(orderItems.variantId, ev.id),
          });
          if (!referencedByOrder) {
            await db.delete(productVariants).where(eq(productVariants.id, ev.id));
          } else {
            // Set stock to 0 for discontinued variants still referenced by orders
            await db.update(productVariants).set({ stock: 0 }).where(eq(productVariants.id, ev.id));
          }
        }
      }

      // Upsert incoming variants
      for (const v of variants as Array<{ id?: string; size?: string; color?: string; colorMn?: string; stock: number; sku?: string }>) {
        const stock = typeof v.stock === "number" ? Math.max(0, Math.floor(v.stock)) : 0;
        if (v.id && existingVariants.some((ev) => ev.id === v.id)) {
          // Update existing variant
          await db.update(productVariants).set({
            size: v.size || null,
            color: v.color || null,
            colorMn: v.colorMn || null,
            stock,
            sku: v.sku || null,
          }).where(eq(productVariants.id, v.id));
        } else {
          // Insert new variant
          await db.insert(productVariants).values({
            productId: id,
            size: v.size || null,
            color: v.color || null,
            colorMn: v.colorMn || null,
            stock,
            sku: v.sku || null,
          });
        }
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
