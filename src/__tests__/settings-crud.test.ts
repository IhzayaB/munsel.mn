/**
 * Tests for Settings CRUD API routes
 * Covers: GET and PUT /api/admin/settings
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

const mockAuth = vi.fn();

// select().from()
const mockSelectFrom = vi.fn();
const mockSelect = vi.fn(() => ({ from: mockSelectFrom }));

// insert().values().onConflictDoUpdate()
const mockOnConflictDoUpdate = vi.fn();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockInsertValues = vi.fn(() => ({ onConflictDoUpdate: mockOnConflictDoUpdate })) as any;

const storeSettingsTable = {
  key: "storeSettings.key",
};
let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

vi.mock("@/lib/db", () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    insert: () => ({ values: mockInsertValues }),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  storeSettings: storeSettingsTable,
}));

function makeReq(body: unknown): NextRequest {
  return { json: () => Promise.resolve(body) } as unknown as NextRequest;
}

describe("/api/admin/settings CRUD", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { role: "admin" } });
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy?.mockRestore();
  });

  describe("GET", () => {
    it("returns 401 when not admin", async () => {
      mockAuth.mockResolvedValue(null);
      const { GET } = await import("@/app/api/admin/settings/route");
      const res = await GET();
      expect(res.status).toBe(401);
    });

    it("returns settings map and masks sensitive values", async () => {
      mockSelectFrom.mockResolvedValue([
        { key: "STORE_NAME", value: "Munsel" },
        { key: "QPAY_PASSWORD", value: "mysecret1234" },
        { key: "QPAY_SECRET", value: "abcd" },
      ]);

      const { GET } = await import("@/app/api/admin/settings/route");
      const res = await GET();
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.STORE_NAME).toBe("Munsel");
      expect(data.QPAY_PASSWORD).toBe("••••1234");
      expect(data.QPAY_SECRET).toBe("••••");
    });

    it("returns 500 on unexpected error", async () => {
      mockAuth.mockRejectedValue(new Error("auth failure"));
      const { GET } = await import("@/app/api/admin/settings/route");
      const res = await GET();
      expect(res.status).toBe(500);
    });
  });

  describe("PUT", () => {
    it("returns 401 when not admin", async () => {
      mockAuth.mockResolvedValue({ user: { role: "user" } });
      const { PUT } = await import("@/app/api/admin/settings/route");
      const res = await PUT(makeReq({ STORE_NAME: "Munsel" }));
      expect(res.status).toBe(401);
    });

    it("returns 400 for invalid payload (array)", async () => {
      const { PUT } = await import("@/app/api/admin/settings/route");
      const res = await PUT(makeReq(["bad"]));
      expect(res.status).toBe(400);
    });

    it("returns 400 when keys are invalid", async () => {
      const { PUT } = await import("@/app/api/admin/settings/route");
      const res = await PUT(makeReq({ INVALID_KEY: "x" }));
      expect(res.status).toBe(400);
    });

    it("upserts valid settings and trims key/value", async () => {
      const { PUT } = await import("@/app/api/admin/settings/route");
      const res = await PUT(
        makeReq({
          " STORE_NAME ": "  Munsel  ",
          SHIPPING_COST: " 5000 ",
        })
      );

      expect(res.status).toBe(200);
      expect(mockInsertValues).toHaveBeenCalledWith({
        key: "STORE_NAME",
        value: "Munsel",
      });
      expect(mockInsertValues).toHaveBeenCalledWith({
        key: "SHIPPING_COST",
        value: "5000",
      });
      expect(mockOnConflictDoUpdate).toHaveBeenCalled();
    });

    it("skips masked sensitive values", async () => {
      const { PUT } = await import("@/app/api/admin/settings/route");
      const res = await PUT(
        makeReq({
          STORE_NAME: "Munsel",
          QPAY_PASSWORD: "••••1234",
        })
      );

      expect(res.status).toBe(200);
      expect(mockInsertValues).toHaveBeenCalledTimes(1);
      expect(mockInsertValues).toHaveBeenCalledWith({
        key: "STORE_NAME",
        value: "Munsel",
      });
    });

    it("returns 500 on unexpected error", async () => {
      mockAuth.mockRejectedValue(new Error("db unavailable"));
      const { PUT } = await import("@/app/api/admin/settings/route");
      const res = await PUT(makeReq({ STORE_NAME: "Munsel" }));
      expect(res.status).toBe(500);
    });
  });
});
