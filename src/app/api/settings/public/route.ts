import { NextResponse } from "next/server";
import { getShippingSettings } from "@/lib/settings";

/**
 * Public endpoint – returns only non-sensitive store settings
 * (shipping cost & free-shipping threshold) so the client-side
 * cart can calculate totals dynamically.
 */
export async function GET() {
  const settings = await getShippingSettings();
  return NextResponse.json(settings, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
