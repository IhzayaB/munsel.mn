import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const allCategories = await db.query.categories.findMany();
  return NextResponse.json(allCategories);
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, nameMn, slug, description, descriptionMn, image } = body;

    if (!name || !nameMn || !slug) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const [category] = await db
      .insert(categories)
      .values({
        name, nameMn, slug,
        description: description || null,
        descriptionMn: descriptionMn || null,
        image: image || null,
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
    const { id, name, nameMn, slug, description, descriptionMn, image } = body;

    if (!id || !name || !nameMn || !slug) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const [updated] = await db
      .update(categories)
      .set({
        name, nameMn, slug,
        description: description || null,
        descriptionMn: descriptionMn || null,
        image: image || null,
      })
      .where(eq(categories.id, id))
      .returning();

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

    await db.delete(categories).where(eq(categories.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete category error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
