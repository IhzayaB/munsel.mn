import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { storeSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { sql } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const all = await db.select().from(storeSettings);
  const map: Record<string, string> = {};
  all.forEach((s) => { map[s.key] = s.value; });
  return NextResponse.json(map);
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: Record<string, string> = await req.json();

    for (const [key, value] of Object.entries(body)) {
      await db
        .insert(storeSettings)
        .values({ key, value })
        .onConflictDoUpdate({
          target: storeSettings.key,
          set: { value, updatedAt: new Date() },
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
