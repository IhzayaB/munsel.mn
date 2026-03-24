import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { coupons } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const subtotal = Number(req.nextUrl.searchParams.get("subtotal") || 0);

  if (!code) {
    return NextResponse.json({ error: "Купон код оруулна уу" }, { status: 400 });
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
