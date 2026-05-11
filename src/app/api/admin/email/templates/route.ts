import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { storeSettings } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";

const TEMPLATE_KEYS = [
  "EMAIL_TEMPLATE_GENERAL_SUBJECT",
  "EMAIL_TEMPLATE_GENERAL_HTML",
  "EMAIL_TEMPLATE_PROMO_SUBJECT",
  "EMAIL_TEMPLATE_PROMO_HTML",
] as const;

const defaults: Record<(typeof TEMPLATE_KEYS)[number], string> = {
  EMAIL_TEMPLATE_GENERAL_SUBJECT: "Pajama.mn мэдэгдэл",
  EMAIL_TEMPLATE_GENERAL_HTML:
    "<p>Сайн байна уу,</p><p>Танд энэ өдрийн мэнд хүргэе.</p><p>Хүндэтгэсэн,<br/>Pajama.mn</p>",
  EMAIL_TEMPLATE_PROMO_SUBJECT: "Pajama.mn урамшуулал",
  EMAIL_TEMPLATE_PROMO_HTML:
    "<h3>Онцгой санал</h3><p>Манай шинэ урамшууллыг ашиглаарай.</p><p>Хүндэтгэсэн,<br/>Pajama.mn</p>",
};

const updateSchema = z.object({
  EMAIL_TEMPLATE_GENERAL_SUBJECT: z.string().min(1),
  EMAIL_TEMPLATE_GENERAL_HTML: z.string().min(1),
  EMAIL_TEMPLATE_PROMO_SUBJECT: z.string().min(1),
  EMAIL_TEMPLATE_PROMO_HTML: z.string().min(1),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await db
      .select({ key: storeSettings.key, value: storeSettings.value })
      .from(storeSettings)
      .where(inArray(storeSettings.key, [...TEMPLATE_KEYS]));

    const map = { ...defaults };
    for (const row of rows) {
      if (row.key in map) {
        map[row.key as keyof typeof map] = row.value;
      }
    }

    return Response.json(map);
  } catch (error) {
    console.error("Fetch email templates error:", error);
    return Response.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = updateSchema.parse(body);

    for (const key of TEMPLATE_KEYS) {
      const value = data[key].trim();
      const [existing] = await db
        .select({ id: storeSettings.id })
        .from(storeSettings)
        .where(eq(storeSettings.key, key))
        .limit(1);

      if (existing) {
        await db
          .update(storeSettings)
          .set({ value, updatedAt: new Date() })
          .where(eq(storeSettings.key, key));
      } else {
        await db.insert(storeSettings).values({ key, value });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Save email templates error:", error);
    return Response.json({ error: "Failed to save templates" }, { status: 500 });
  }
}
