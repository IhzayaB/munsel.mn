import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, productVariants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { sanitizeSlug } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      nameMn,
      slug,
      description,
      descriptionMn,
      price,
      compareAtPrice,
      material,
      materialMn,
      ageRange,
      featured,
      categoryId,
      images: productImages,
      variants,
    } = body;

    if (!name || !nameMn || !slug || !price) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Sanitize slug
    const cleanSlug = sanitizeSlug(slug);
    if (!cleanSlug) {
      return NextResponse.json(
        { error: "Slug буруу байна" },
        { status: 400 }
      );
    }

    if (isNaN(Number(price)) || Number(price) <= 0) {
      return NextResponse.json(
        { error: "Үнэ эерэг тоо байх ёстой" },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const existingSlug = await db.query.products.findFirst({
      where: eq(products.slug, cleanSlug),
    });
    if (existingSlug) {
      return NextResponse.json(
        { error: "Slug аль хэдийн бүртгэгдсэн байна. Өөр нэр оруулна уу." },
        { status: 409 }
      );
    }

    // Create product
    const [product] = await db
      .insert(products)
      .values({
        name,
        nameMn,
        slug: cleanSlug,
        description: description || null,
        descriptionMn: descriptionMn || null,
        price,
        compareAtPrice: compareAtPrice || null,
        material: material || null,
        materialMn: materialMn || null,
        ageRange: ageRange || null,
        featured: featured || false,
        active: true,
        categoryId: categoryId || null,
        images: productImages || [],
      })
      .returning();

    // Create variants
    if (variants && variants.length > 0) {
      await db.insert(productVariants).values(
        variants.map(
          (v: {
            size?: string;
            color?: string;
            colorMn?: string;
            stock: number;
            sku?: string;
          }) => ({
            productId: product.id,
            size: v.size || null,
            color: v.color || null,
            colorMn: v.colorMn || null,
            stock: v.stock || 0,
            sku: v.sku || null,
          })
        )
      );
    }

    return NextResponse.json({ id: product.id, slug: product.slug });
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const allProducts = await db.query.products.findMany({
      with: { category: true, variants: true },
      orderBy: (products, { desc }) => [desc(products.createdAt)],
    });
    return NextResponse.json(allProducts);
  } catch (error) {
    console.error("Fetch products error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
