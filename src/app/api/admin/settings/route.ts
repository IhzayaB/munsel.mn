import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { storeSettings } from "@/lib/db/schema";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const all = await db.select().from(storeSettings);
    const map: Record<string, string> = {};
    all.forEach((s) => { map[s.key] = s.value; });
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

    for (const [key, value] of entries) {
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
