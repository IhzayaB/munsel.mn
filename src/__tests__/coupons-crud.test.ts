/**
 * Tests for Coupon CRUD API routes
 * Covers: GET, POST, PATCH, DELETE /api/admin/coupons
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockAuth = vi.fn();
const mockCouponsFindFirst = vi.fn();

// select().from().orderBy()
const mockSelectOrderBy = vi.fn();
const mockSelectFrom = vi.fn(() => ({ orderBy: mockSelectOrderBy }));
const mockSelect = vi.fn(() => ({ from: mockSelectFrom }));

// insert().values().returning()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockInsertReturning = vi.fn() as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockInsertValues = vi.fn(() => ({ returning: mockInsertReturning })) as any;

// update().set().where()
const mockUpdateWhere = vi.fn();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUpdateSet = vi.fn(() => ({ where: mockUpdateWhere })) as any;

// delete().where()
const mockDeleteWhere = vi.fn();

vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

vi.mock("@/lib/db", () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    query: {
      coupons: {
        findFirst: (...args: unknown[]) => mockCouponsFindFirst(...args),
      },
    },
    insert: () => ({ values: mockInsertValues }),
    update: () => ({ set: mockUpdateSet }),
    delete: () => ({ where: mockDeleteWhere }),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  coupons: {
    id: "coupons.id",
    code: "coupons.code",
    createdAt: "coupons.createdAt",
    active: "coupons.active",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: (col: string, val: string) => ({ col, val, op: "eq" }),
}));

function makeReq(body: unknown): NextRequest {
  return { json: () => Promise.resolve(body) } as unknown as NextRequest;
}

describe("/api/admin/coupons CRUD", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { role: "admin" } });
  });

  describe("GET", () => {
    it("returns 401 when not admin", async () => {
      mockAuth.mockResolvedValue(null);
      const { GET } = await import("@/app/api/admin/coupons/route");
      const res = await GET();
      expect(res.status).toBe(401);
    });

    it("returns coupon list for admin", async () => {
      mockSelectOrderBy.mockResolvedValue([
        { id: "c1", code: "WELCOME10", type: "percent", value: "10" },
      ]);
      const { GET } = await import("@/app/api/admin/coupons/route");
      const res = await GET();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveLength(1);
      expect(data[0].code).toBe("WELCOME10");
    });
  });

  describe("POST", () => {
    it("returns 401 when not admin", async () => {
      mockAuth.mockResolvedValue({ user: { role: "user" } });
      const { POST } = await import("@/app/api/admin/coupons/route");
      const res = await POST(makeReq({ code: "x", type: "fixed", value: "1000" }));
      expect(res.status).toBe(401);
    });

    it("returns 400 on missing fields", async () => {
      const { POST } = await import("@/app/api/admin/coupons/route");
      const res = await POST(makeReq({ code: "x", type: "fixed" }));
      expect(res.status).toBe(400);
    });

    it("returns 400 on invalid type", async () => {
      const { POST } = await import("@/app/api/admin/coupons/route");
      const res = await POST(makeReq({ code: "x", type: "bad", value: "100" }));
      expect(res.status).toBe(400);
    });

    it("returns 400 when value is not positive", async () => {
      const { POST } = await import("@/app/api/admin/coupons/route");
      const res = await POST(makeReq({ code: "x", type: "fixed", value: "0" }));
      expect(res.status).toBe(400);
    });

    it("returns 400 when percent value is above 100", async () => {
      const { POST } = await import("@/app/api/admin/coupons/route");
      const res = await POST(makeReq({ code: "x", type: "percent", value: "101" }));
      expect(res.status).toBe(400);
    });

    it("returns 409 when duplicate code exists", async () => {
      mockCouponsFindFirst.mockResolvedValue({ id: "dup", code: "WELCOME10" });
      const { POST } = await import("@/app/api/admin/coupons/route");
      const res = await POST(makeReq({ code: "welcome10", type: "percent", value: "10" }));
      expect(res.status).toBe(409);
    });

    it("creates coupon and uppercases code", async () => {
      mockCouponsFindFirst.mockResolvedValue(null);
      mockInsertReturning.mockResolvedValue([
        { id: "new-1", code: "WELCOME10", type: "percent", value: "10" },
      ]);

      const { POST } = await import("@/app/api/admin/coupons/route");
      const res = await POST(makeReq({ code: "welcome10", type: "percent", value: "10" }));
      expect(res.status).toBe(200);

      expect(mockInsertValues).toHaveBeenCalledWith(
        expect.objectContaining({ code: "WELCOME10", type: "percent", value: "10" })
      );
    });
  });

  describe("PATCH", () => {
    it("returns 401 when not admin", async () => {
      mockAuth.mockResolvedValue(null);
      const { PATCH } = await import("@/app/api/admin/coupons/route");
      const res = await PATCH(makeReq({ id: "c1", active: false }));
      expect(res.status).toBe(401);
    });

    it("returns 400 when id is missing", async () => {
      const { PATCH } = await import("@/app/api/admin/coupons/route");
      const res = await PATCH(makeReq({ active: false }));
      expect(res.status).toBe(400);
    });

    it("toggles active with simple patch", async () => {
      const { PATCH } = await import("@/app/api/admin/coupons/route");
      const res = await PATCH(makeReq({ id: "c1", active: false }));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(mockUpdateSet).toHaveBeenCalledWith({ active: false });
    });

    it("returns 400 on full update invalid type", async () => {
      const { PATCH } = await import("@/app/api/admin/coupons/route");
      const res = await PATCH(makeReq({ id: "c1", code: "A", type: "bad", value: "100" }));
      expect(res.status).toBe(400);
    });

    it("returns 409 on full update duplicate code", async () => {
      mockCouponsFindFirst.mockResolvedValue({ id: "other", code: "SAVE10" });
      const { PATCH } = await import("@/app/api/admin/coupons/route");
      const res = await PATCH(makeReq({ id: "c1", code: "save10", type: "fixed", value: "1000" }));
      expect(res.status).toBe(409);
    });

    it("updates full coupon payload", async () => {
      mockCouponsFindFirst.mockResolvedValue(null);
      const { PATCH } = await import("@/app/api/admin/coupons/route");
      const res = await PATCH(
        makeReq({ id: "c1", code: "save10", type: "fixed", value: "1000", active: true })
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(mockUpdateSet).toHaveBeenCalledWith(
        expect.objectContaining({ code: "SAVE10", type: "fixed", value: "1000", active: true })
      );
    });

    it("returns 400 on invalid request shape", async () => {
      const { PATCH } = await import("@/app/api/admin/coupons/route");
      const res = await PATCH(makeReq({ id: "c1", code: "ONLY_CODE" }));
      expect(res.status).toBe(400);
    });
  });

  describe("DELETE", () => {
    it("returns 401 when not admin", async () => {
      mockAuth.mockResolvedValue({ user: { role: "user" } });
      const { DELETE } = await import("@/app/api/admin/coupons/route");
      const res = await DELETE(makeReq({ id: "c1" }));
      expect(res.status).toBe(401);
    });

    it("returns 400 when id is missing", async () => {
      const { DELETE } = await import("@/app/api/admin/coupons/route");
      const res = await DELETE(makeReq({}));
      expect(res.status).toBe(400);
    });

    it("deletes coupon by id", async () => {
      const { DELETE } = await import("@/app/api/admin/coupons/route");
      const res = await DELETE(makeReq({ id: "c1" }));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(mockDeleteWhere).toHaveBeenCalled();
    });
  });
});
