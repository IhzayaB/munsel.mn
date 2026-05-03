import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { storeSettings } from "@/lib/db/schema";
import { auth } from "@/lib/auth";

// Sensitive keys that should be masked in responses
const SENSITIVE_KEYS = ["QPAY_PASSWORD", "QPAY_SECRET"];

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const all = await db.select().from(storeSettings);
    const map: Record<string, string> = {};
    all.forEach((s) => {
      if (SENSITIVE_KEYS.includes(s.key) && s.value) {
        // Mask sensitive values: show only last 4 chars
        map[s.key] = s.value.length > 4 ? "••••" + s.value.slice(-4) : "••••";
      } else {
        map[s.key] = s.value;
      }
    });
    return NextResponse.json(map);
  } catch (error) {
    console.error("Fetch settings error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: Record<string, string> = await req.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const entries = Object.entries(body).filter(
      ([key, value]) => key.trim() && typeof value === "string"
    );

    // Allowed settings keys whitelist
    const ALLOWED_KEYS = [
      "SHIPPING_COST",
      "QPAY_INVOICE_CODE", "QPAY_USERNAME", "QPAY_PASSWORD",
      "STORE_NAME", "STORE_PHONE", "STORE_EMAIL", "STORE_ADDRESS",
    ];

    const validEntries = entries.filter(([key]) => ALLOWED_KEYS.includes(key.trim()));
    if (validEntries.length === 0 && entries.length > 0) {
      return NextResponse.json({ error: "Invalid settings keys" }, { status: 400 });
    }

    for (const [key, value] of validEntries) {
      // Don't overwrite sensitive fields with masked placeholder values
      if (SENSITIVE_KEYS.includes(key.trim()) && value.startsWith("••••")) {
        continue;
      }
      await db
        .insert(storeSettings)
        .values({ key: key.trim(), value: value.trim() })
        .onConflictDoUpdate({
          target: storeSettings.key,
          set: { value: value.trim(), updatedAt: new Date() },
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
