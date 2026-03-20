import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, productVariants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

// GET single product
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      ageRange, featured, active, images, variants,
    } = body;

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
    await db.delete(productVariants).where(eq(productVariants.productId, id));
    await db.delete(products).where(eq(products.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
