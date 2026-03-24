import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getAnalyticsStats,
  getPageviews,
  getTopPages,
  getTopReferrers,
  getDevices,
  getCountries,
  getBrowsers,
  getActiveVisitors,
} from "@/lib/umami";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const period = req.nextUrl.searchParams.get("period") || "7d";

    const now = Date.now();
    let startAt: number;
    let unit: "hour" | "day" | "month" = "day";

    switch (period) {
      case "24h":
        startAt = now - 24 * 60 * 60 * 1000;
        unit = "hour";
        break;
      case "7d":
        startAt = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case "30d":
        startAt = now - 30 * 24 * 60 * 60 * 1000;
        break;
      case "90d":
        startAt = now - 90 * 24 * 60 * 60 * 1000;
        unit = "month";
        break;
      default:
        startAt = now - 7 * 24 * 60 * 60 * 1000;
    }

    const [stats, pageviews, pages, referrers, devices, countries, browsers, active] =
      await Promise.all([
        getAnalyticsStats(startAt, now),
        getPageviews(startAt, now, unit),
        getTopPages(startAt, now),
        getTopReferrers(startAt, now),
        getDevices(startAt, now),
        getCountries(startAt, now),
        getBrowsers(startAt, now),
        getActiveVisitors(),
      ]);

    return NextResponse.json({
      stats,
      pageviews,
      pages,
      referrers,
      devices,
      countries,
      browsers,
      active: active.x,
      period,
    });
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      {
        error: "Analytics unavailable",
        stats: null,
        pageviews: null,
        pages: [],
        referrers: [],
        devices: [],
        countries: [],
        browsers: [],
        active: 0,
        period: "7d",
      },
      { status: 200 } // Return 200 with empty data so the UI still renders
    );
  }
}
