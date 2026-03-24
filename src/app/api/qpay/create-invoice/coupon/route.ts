import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { coupons } from "@/lib/db/schema";
import { eq, and, gt, or, isNull, sql } from "drizzle-orm";

// Check if any active coupons exist (no code param) or validate a specific coupon
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const subtotal = Number(req.nextUrl.searchParams.get("subtotal") || 0);

  // If no code provided, just check if any active coupons exist
  if (!code) {
    const activeCoupon = await db.query.coupons.findFirst({
      where: and(
        eq(coupons.active, true),
        or(isNull(coupons.expiresAt), gt(coupons.expiresAt, new Date())),
        or(isNull(coupons.maxUses), sql`${coupons.usedCount} < ${coupons.maxUses}`)
      ),
    });
    return NextResponse.json({ available: !!activeCoupon });
  }

  const coupon = await db.query.coupons.findFirst({
    where: eq(coupons.code, code.toUpperCase()),
  });

  if (!coupon || !coupon.active) {
    return NextResponse.json({ error: "Купон олдсонгүй эсвэл идэвхгүй байна" }, { status: 404 });
  }

  // Check expiry
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return NextResponse.json({ error: "Купоны хугацаа дууссан байна" }, { status: 400 });
  }

  // Check max uses
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    return NextResponse.json({ error: "Купон дууссан байна" }, { status: 400 });
  }

  // Check minimum order amount
  if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) {
    return NextResponse.json(
      { error: `Хамгийн багадаа ${Number(coupon.minOrderAmount).toLocaleString()}₮-ийн захиалга хийх шаардлагатай` },
      { status: 400 }
    );
  }

  // Calculate discount
  let discount = 0;
  if (coupon.type === "fixed") {
    discount = Number(coupon.value);
  } else if (coupon.type === "percent") {
    discount = Math.round(subtotal * Number(coupon.value) / 100);
  }

  // Don't let discount exceed subtotal
  discount = Math.min(discount, subtotal);

  return NextResponse.json({
    code: coupon.code,
    type: coupon.type,
    value: Number(coupon.value),
    discount,
  });
}
