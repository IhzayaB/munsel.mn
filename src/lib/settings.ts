import { db } from "@/lib/db";
import { storeSettings } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";
import { SHIPPING_COST } from "@/lib/utils";

export interface ShippingSettings {
  shippingCost: number;
}

/**
 * Read shipping settings from the DB, falling back to hardcoded defaults.
 */
export async function getShippingSettings(): Promise<ShippingSettings> {
  try {
    const rows = await db
      .select()
      .from(storeSettings)
      .where(inArray(storeSettings.key, ["SHIPPING_COST"]));

    const map = new Map(rows.map((r) => [r.key, r.value]));

    return {
      shippingCost: Number(map.get("SHIPPING_COST")) || SHIPPING_COST,
    };
  } catch {
    return {
      shippingCost: SHIPPING_COST,
    };
  }
}
