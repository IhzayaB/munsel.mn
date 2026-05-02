import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { coupons } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const all = await db.select().from(coupons).orderBy(coupons.createdAt);
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { code, type, value, minOrderAmount, maxUses, expiresAt } = body;
    if (!code || !type || !value) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    if (type !== "fixed" && type !== "percent") {
      return NextResponse.json({ error: "Type must be 'fixed' or 'percent'" }, { status: 400 });
    }
    if (isNaN(Number(value)) || Number(value) <= 0) {
      return NextResponse.json({ error: "Утга эерэг тоо байх ёстой" }, { status: 400 });
    }
    if (type === "percent" && Number(value) > 100) {
      return NextResponse.json({ error: "Хувийн утга 0-100 байх ёстой" }, { status: 400 });
    }

    // Check for duplicate code
    const existing = await db.query.coupons.findFirst({
      where: eq(coupons.code, code.toUpperCase()),
    });
    if (existing) {
      return NextResponse.json({ error: "Энэ код аль хэдийн бүртгэгдсэн байна" }, { status: 409 });
    }

    const [coupon] = await db.insert(coupons).values({
      code: code.toUpperCase(),
      type,
      value,
      minOrderAmount: minOrderAmount || null,
      maxUses: maxUses || null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    }).returning();
    return NextResponse.json(coupon);
  } catch (error) {
    console.error("Create coupon error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { id, active, code, type, value, minOrderAmount, maxUses, expiresAt } = body;
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    // Simple toggle
    if (typeof active === "boolean" && !code) {
      await db.update(coupons).set({ active }).where(eq(coupons.id, id));
      return NextResponse.json({ success: true });
    }

    // Full update
    if (code && type && value) {
      if (type !== "fixed" && type !== "percent") {
        return NextResponse.json({ error: "Type must be 'fixed' or 'percent'" }, { status: 400 });
      }
      if (isNaN(Number(value)) || Number(value) <= 0) {
        return NextResponse.json({ error: "Утга эерэг тоо байх ёстой" }, { status: 400 });
      }
      if (type === "percent" && Number(value) > 100) {
        return NextResponse.json({ error: "Хувийн утга 0-100 байх ёстой" }, { status: 400 });
      }

      // Check duplicate code (excluding self)
      const existing = await db.query.coupons.findFirst({
        where: eq(coupons.code, code.toUpperCase()),
      });
      if (existing && existing.id !== id) {
        return NextResponse.json({ error: "Энэ код аль хэдийн бүртгэгдсэн байна" }, { status: 409 });
      }

      const couponUpdate: Record<string, unknown> = {
        code: code.toUpperCase(),
        type,
        value,
        minOrderAmount: minOrderAmount || null,
        maxUses: maxUses || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      };
      if (typeof active === "boolean") couponUpdate.active = active;

      await db.update(coupons).set(couponUpdate).where(eq(coupons.id, id));

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Update coupon error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
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
    await db.delete(coupons).where(eq(coupons.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete coupon error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
