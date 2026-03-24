/**
 * Umami Analytics API helper
 * Docs: https://umami.is/docs/api
 */

const UMAMI_API_URL = process.env.UMAMI_API_URL || "http://localhost:3001/api";
const UMAMI_USERNAME = process.env.UMAMI_USERNAME || "admin";
const UMAMI_PASSWORD = process.env.UMAMI_PASSWORD || "umami";
const UMAMI_WEBSITE_ID = process.env.UMAMI_WEBSITE_ID || "";

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const res = await fetch(`${UMAMI_API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: UMAMI_USERNAME,
      password: UMAMI_PASSWORD,
    }),
  });

  if (!res.ok) throw new Error(`Umami auth failed: ${res.status}`);

  const data = await res.json();
  cachedToken = data.token;
  tokenExpiry = Date.now() + 3500 * 1000; // ~1 hour
  return cachedToken!;
}

async function umamiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const token = await getToken();
  const url = new URL(`${UMAMI_API_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 300 }, // Cache for 5 min
  });

  if (!res.ok) throw new Error(`Umami API error: ${res.status}`);
  return res.json();
}

// ── Types ──────────────────────────────────────────

export interface UmamiStats {
  pageviews: { value: number; prev: number };
  visitors: { value: number; prev: number };
  visits: { value: number; prev: number };
  bounces: { value: number; prev: number };
  totaltime: { value: number; prev: number };
}

export interface UmamiPageview {
  x: string; // date
  y: number; // count
}

export interface UmamiPage {
  x: string; // URL path
  y: number; // views
}

export interface UmamiReferrer {
  x: string; // referrer domain
  y: number; // count
}

export interface UmamiDevice {
  x: string; // device type
  y: number; // count
}

export interface UmamiCountry {
  x: string; // country code
  y: number; // count
}

export interface UmamiBrowser {
  x: string; // browser name
  y: number; // count
}

// ── Data fetchers ──────────────────────────────────

export async function getAnalyticsStats(startAt: number, endAt: number): Promise<UmamiStats> {
  return umamiGet<UmamiStats>(`/websites/${UMAMI_WEBSITE_ID}/stats`, {
    startAt: startAt.toString(),
    endAt: endAt.toString(),
  });
}

export async function getPageviews(
  startAt: number,
  endAt: number,
  unit: "hour" | "day" | "month" = "day"
): Promise<{ pageviews: UmamiPageview[]; sessions: UmamiPageview[] }> {
  return umamiGet(`/websites/${UMAMI_WEBSITE_ID}/pageviews`, {
    startAt: startAt.toString(),
    endAt: endAt.toString(),
    unit,
  });
}

export async function getTopPages(startAt: number, endAt: number, limit = 10): Promise<UmamiPage[]> {
  return umamiGet<UmamiPage[]>(`/websites/${UMAMI_WEBSITE_ID}/metrics`, {
    startAt: startAt.toString(),
    endAt: endAt.toString(),
    type: "url",
    limit: limit.toString(),
  });
}

export async function getTopReferrers(startAt: number, endAt: number, limit = 10): Promise<UmamiReferrer[]> {
  return umamiGet<UmamiReferrer[]>(`/websites/${UMAMI_WEBSITE_ID}/metrics`, {
    startAt: startAt.toString(),
    endAt: endAt.toString(),
    type: "referrer",
    limit: limit.toString(),
  });
}

export async function getDevices(startAt: number, endAt: number): Promise<UmamiDevice[]> {
  return umamiGet<UmamiDevice[]>(`/websites/${UMAMI_WEBSITE_ID}/metrics`, {
    startAt: startAt.toString(),
    endAt: endAt.toString(),
    type: "device",
  });
}

export async function getCountries(startAt: number, endAt: number, limit = 10): Promise<UmamiCountry[]> {
  return umamiGet<UmamiCountry[]>(`/websites/${UMAMI_WEBSITE_ID}/metrics`, {
    startAt: startAt.toString(),
    endAt: endAt.toString(),
    type: "country",
    limit: limit.toString(),
  });
}

export async function getBrowsers(startAt: number, endAt: number): Promise<UmamiBrowser[]> {
  return umamiGet<UmamiBrowser[]>(`/websites/${UMAMI_WEBSITE_ID}/metrics`, {
    startAt: startAt.toString(),
    endAt: endAt.toString(),
    type: "browser",
  });
}

export async function getActiveVisitors(): Promise<{ x: number }> {
  return umamiGet(`/websites/${UMAMI_WEBSITE_ID}/active`);
}
