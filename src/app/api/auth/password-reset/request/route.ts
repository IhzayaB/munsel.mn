import { randomBytes } from "crypto";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";
import {
  ADMIN_LOGIN_EMAIL,
  buildPasswordResetUrl,
  getPasswordResetIdentifier,
  PASSWORD_RESET_TOKEN_TTL_MS,
} from "@/lib/password-reset";
import { sendAdminPasswordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body?.email || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (email !== ADMIN_LOGIN_EMAIL) {
      return NextResponse.json({ success: true });
    }

    const user = await db.query.users.findFirst({
      where: and(eq(users.email, email), eq(users.role, "admin")),
    });

    if (!user?.password) {
      return NextResponse.json({ success: true });
    }

    const identifier = getPasswordResetIdentifier(email);
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);

    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.identifier, identifier));

    await db.insert(verificationTokens).values({
      identifier,
      token,
      expires,
    });

    await sendAdminPasswordResetEmail({
      resetUrl: buildPasswordResetUrl(token, email),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Password reset request error:", error);
    return NextResponse.json(
      { error: "Failed to process password reset request" },
      { status: 500 }
    );
  }
}