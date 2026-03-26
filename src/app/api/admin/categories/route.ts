import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";
import { eq, and, ne, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const allCategories = await db.query.categories.findMany({
    orderBy: [desc(categories.priority)],
  });
  return NextResponse.json(allCategories);
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, nameMn, slug, description, descriptionMn, image, priority } = body;

    if (!name || !nameMn || !slug) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check slug uniqueness
    const existing = await db.query.categories.findFirst({
      where: eq(categories.slug, slug),
    });
    if (existing) {
      return NextResponse.json({ error: "Slug аль хэдийн бүртгэгдсэн байна" }, { status: 409 });
    }

    const [category] = await db
      .insert(categories)
      .values({
        name, nameMn, slug,
        description: description || null,
        descriptionMn: descriptionMn || null,
        image: image || null,
        priority: typeof priority === "number" ? priority : 0,
      })
      .returning();

    return NextResponse.json(category);
  } catch (error) {
    console.error("Create category error:", error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, nameMn, slug, description, descriptionMn, image, priority } = body;

    if (!id || !name || !nameMn || !slug) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check slug uniqueness (exclude current category)
    const existing = await db.query.categories.findFirst({
      where: and(eq(categories.slug, slug), ne(categories.id, id)),
    });
    if (existing) {
      return NextResponse.json({ error: "Slug аль хэдийн бүртгэгдсэн байна" }, { status: 409 });
    }

    const [updated] = await db
      .update(categories)
      .set({
        name, nameMn, slug,
        description: description || null,
        descriptionMn: descriptionMn || null,
        image: image || null,
        priority: typeof priority === "number" ? priority : 0,
      })
      .where(eq(categories.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update category error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    // Set categoryId to null on products referencing this category
    await db
      .update(products)
      .set({ categoryId: null })
      .where(eq(products.categoryId, id));

    await db.delete(categories).where(eq(categories.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete category error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
