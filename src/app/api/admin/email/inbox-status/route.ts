import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  domain: z.string().min(1).default("pajama.mn"),
});

type ProviderKey = "google" | "zoho" | "cloudflare" | "microsoft" | "custom" | "none";

const PROVIDER_RULES: Record<
  Exclude<ProviderKey, "none">,
  {
    label: string;
    domains: string[];
    inboxUrl: string;
    note: string;
  }
> = {
  google: {
    label: "Google Workspace",
    domains: ["aspmx.l.google.com"],
    inboxUrl: "https://mail.google.com/",
    note: "MX records point to Google. Read mail in Gmail / Google Workspace.",
  },
  zoho: {
    label: "Zoho Mail",
    domains: ["mx.zoho.com", "mx2.zoho.com", "mx3.zoho.com", "mx.zoho.eu", "mx.zoho.in", "mx.zoho.com.au"],
    inboxUrl: "https://mail.zoho.com/",
    note: "MX records point to Zoho. Read mail in Zoho Mail.",
  },
  cloudflare: {
    label: "Cloudflare Email Routing",
    domains: ["route1.mx.cloudflare.net", "route2.mx.cloudflare.net", "route3.mx.cloudflare.net"],
    inboxUrl: "https://dash.cloudflare.com/",
    note: "MX records point to Cloudflare routing. Check the forwarding destination (usually Gmail).",
  },
  microsoft: {
    label: "Microsoft 365",
    domains: ["protection.outlook.com", "mail.protection.outlook.com"],
    inboxUrl: "https://outlook.office.com/",
    note: "MX records point to Microsoft 365. Read mail in Outlook / Microsoft 365.",
  },
  custom: {
    label: "Custom mail provider",
    domains: [],
    inboxUrl: "",
    note: "MX records point to a custom provider. Use that provider's mailbox or forwarding panel.",
  },
};

function normalizeHost(host: string) {
  return host.toLowerCase().replace(/\.$/, "");
}

function classifyMx(hosts: string[]) {
  const normalized = hosts.map(normalizeHost);
  const hasGoogle = normalized.some((host) => PROVIDER_RULES.google.domains.some((rule) => host.includes(rule)));
  if (hasGoogle) return { key: "google" as const, ...PROVIDER_RULES.google };

  const hasZoho = normalized.some((host) => PROVIDER_RULES.zoho.domains.some((rule) => host.includes(rule)));
  if (hasZoho) return { key: "zoho" as const, ...PROVIDER_RULES.zoho };

  const hasCloudflare = normalized.some((host) => PROVIDER_RULES.cloudflare.domains.some((rule) => host.includes(rule)));
  if (hasCloudflare) return { key: "cloudflare" as const, ...PROVIDER_RULES.cloudflare };

  const hasMicrosoft = normalized.some((host) => PROVIDER_RULES.microsoft.domains.some((rule) => host.includes(rule)));
  if (hasMicrosoft) return { key: "microsoft" as const, ...PROVIDER_RULES.microsoft };

  if (normalized.length > 0) {
    return {
      key: "custom" as const,
      ...PROVIDER_RULES.custom,
    };
  }

  return {
    key: "none" as const,
    label: "No MX records",
    domains: [],
    inboxUrl: "",
    note: "No MX records were found, so incoming mail will not be delivered anywhere yet.",
  };
}

async function fetchMxRecords(domain: string) {
  const url = new URL("https://dns.google/resolve");
  url.searchParams.set("name", domain);
  url.searchParams.set("type", "MX");

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`DNS lookup failed with status ${res.status}`);
  }

  const data = await res.json();
  const answers: Array<{ data?: string }> = Array.isArray(data.Answer) ? data.Answer : [];

  const mxRecords = answers
    .filter((record): record is { data: string } => typeof record.data === "string")
    .map((record) => {
      const value = record.data.trim();
      const parts = value.split(/\s+/);
      const preference = Number(parts[0]);
      const exchange = parts.slice(1).join(" ");
      return {
        preference: Number.isFinite(preference) ? preference : null,
        exchange: normalizeHost(exchange),
        raw: value,
      };
    });

  return mxRecords;
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const domain = querySchema.parse({
      domain: req.nextUrl.searchParams.get("domain") || "pajama.mn",
    }).domain;

    const mxRecords = await fetchMxRecords(domain);
    const provider = classifyMx(mxRecords.map((record) => record.exchange));
    const recommendedInbox = provider.key === "cloudflare" ? "Gmail (forwarded destination)" : provider.label;

    return NextResponse.json({
      domain,
      mxRecords,
      provider,
      receivedMailUi: provider.inboxUrl,
      recommendedInbox,
      canReceiveMail: provider.key !== "none",
      canReadMail: provider.key !== "none",
    });
  } catch (error) {
    console.error("Inbox status check error:", error);
    return NextResponse.json(
      { error: "Failed to check inbox status" },
      { status: 500 }
    );
  }
}
