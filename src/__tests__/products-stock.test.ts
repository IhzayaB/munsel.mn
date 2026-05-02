/**
 * Tests for Product CRUD API routes
 * Covers: POST (create), GET (list/single), PUT (update with variants/stock), DELETE
 * Focus: stock (нөөц) update bugs, variant FK constraint handling
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// --- Mocks ---

const mockAuth = vi.fn();
const mockFindFirst = vi.fn();
const mockOrderItemsFindFirst = vi.fn();
const mockVariantsFindMany = vi.fn();

const mockInsertReturning = vi.fn();
const mockInsertValues = vi.fn(() => ({ returning: mockInsertReturning }));
const mockUpdateWhere = vi.fn();
const mockUpdateSet = vi.fn(() => ({ where: mockUpdateWhere }));
const mockDeleteWhere = vi.fn();

vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

vi.mock("@/lib/db", () => ({
  db: {
    query: {
      products: { findFirst: (...args: unknown[]) => mockFindFirst(...args), findMany: vi.fn() },
      productVariants: { findMany: (...args: unknown[]) => mockVariantsFindMany(...args) },
      orderItems: { findFirst: (...args: unknown[]) => mockOrderItemsFindFirst(...args) },
    },
    insert: () => ({ values: mockInsertValues }),
    update: () => ({ set: mockUpdateSet }),
    delete: () => ({ where: mockDeleteWhere }),
    execute: vi.fn(),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  products: { id: "products.id", slug: "products.slug", categoryId: "products.categoryId", active: "products.active" },
  productVariants: { id: "productVariants.id", productId: "productVariants.productId" },
  orderItems: { productId: "orderItems.productId", variantId: "orderItems.variantId" },
}));

vi.mock("drizzle-orm", () => ({
  eq: (col: string, val: string) => ({ col, val, op: "eq" }),
  and: (...conditions: unknown[]) => ({ conditions, op: "and" }),
  ne: (col: string, val: string) => ({ col, val, op: "ne" }),
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values }),
}));

vi.mock("@/lib/utils", () => ({
  sanitizeSlug: (v: string) => {
    if (!v) return "";
    return v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  },
}));

// Helper to create NextRequest-like object
function makeReq(body: unknown): NextRequest {
  return { json: () => Promise.resolve(body) } as unknown as NextRequest;
}

// --- Tests for PUT (update product + variants/stock) ---

describe("PUT /api/admin/products/[id] - Update Product & Stock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { role: "admin" } });
  });

  it("returns 401 if not admin", async () => {
    mockAuth.mockResolvedValue(null);
    const { PUT } = await import("@/app/api/admin/products/[id]/route");
    const res = await PUT(makeReq({}), { params: Promise.resolve({ id: "x" }) });
    expect(res.status).toBe(401);
  });

  it("returns 404 if product not found", async () => {
    // No slug provided → only product existence check calls findFirst
    mockFindFirst.mockResolvedValue(null);
    const { PUT } = await import("@/app/api/admin/products/[id]/route");
    const res = await PUT(makeReq({ name: "Test" }), { params: Promise.resolve({ id: "no-exist" }) });
    expect(res.status).toBe(404);
  });

  it("returns 400 if price is invalid", async () => {
    mockFindFirst.mockResolvedValue({ id: "p1", slug: "existing" });
    const { PUT } = await import("@/app/api/admin/products/[id]/route");
    const res = await PUT(makeReq({ price: -100 }), { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(400);
  });

  it("returns 409 if slug conflicts with another product", async () => {
    // When slug provided: first findFirst = slug check
    mockFindFirst.mockResolvedValueOnce({ id: "other-id", slug: "taken" });
    const { PUT } = await import("@/app/api/admin/products/[id]/route");
    const res = await PUT(makeReq({ slug: "taken" }), { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(409);
  });

  it("updates product fields without wiping unset ones", async () => {
    // No slug in body → findFirst called once for product existence
    mockFindFirst.mockResolvedValue({ id: "p1", slug: "old-slug", name: "Old" });
    const { PUT } = await import("@/app/api/admin/products/[id]/route");
    const res = await PUT(
      makeReq({ nameMn: "Шинэ", name: "Шинэ", price: "29900" }),
      { params: Promise.resolve({ id: "p1" }) }
    );
    expect(res.status).toBe(200);

    expect(mockUpdateSet).toHaveBeenCalled();
    const setArg = mockUpdateSet.mock.calls[0][0];
    expect(setArg.name).toBe("Шинэ");
    expect(setArg.nameMn).toBe("Шинэ");
    expect(setArg.price).toBe("29900");
    // images NOT in body → must NOT appear in update
    expect(setArg).not.toHaveProperty("images");
  });

  it("updates existing variant stock in-place (preserves variant IDs)", async () => {
    mockFindFirst.mockResolvedValue({ id: "p1", slug: "test" });
    mockVariantsFindMany.mockResolvedValue([
      { id: "v1", productId: "p1", size: "NB", stock: 5 },
      { id: "v2", productId: "p1", size: "0-3M", stock: 10 },
    ]);

    const { PUT } = await import("@/app/api/admin/products/[id]/route");
    const res = await PUT(
      makeReq({
        variants: [
          { id: "v1", size: "NB", stock: 20 },
          { id: "v2", size: "0-3M", stock: 0 },
        ],
      }),
      { params: Promise.resolve({ id: "p1" }) }
    );
    expect(res.status).toBe(200);

    // Should NOT delete variants
    expect(mockDeleteWhere).not.toHaveBeenCalled();
    // 1 product update + 2 variant updates = 3 set() calls
    expect(mockUpdateSet).toHaveBeenCalledTimes(3);
  });

  it("handles variant with stock=0 correctly", async () => {
    mockFindFirst.mockResolvedValue({ id: "p1", slug: "test" });
    mockVariantsFindMany.mockResolvedValue([
      { id: "v1", productId: "p1", size: "NB", stock: 5 },
    ]);

    const { PUT } = await import("@/app/api/admin/products/[id]/route");
    const res = await PUT(
      makeReq({ variants: [{ id: "v1", size: "NB", stock: 0 }] }),
      { params: Promise.resolve({ id: "p1" }) }
    );
    expect(res.status).toBe(200);

    // Find the variant update call (has size field, unlike product update)
    const variantUpdate = mockUpdateSet.mock.calls.find(
      (c) => c[0]?.size !== undefined
    );
    expect(variantUpdate?.[0].stock).toBe(0);
  });

  it("inserts new variants (without id)", async () => {
    mockFindFirst.mockResolvedValue({ id: "p1", slug: "test" });
    mockVariantsFindMany.mockResolvedValue([
      { id: "v1", productId: "p1", size: "NB", stock: 5 },
    ]);

    const { PUT } = await import("@/app/api/admin/products/[id]/route");
    const res = await PUT(
      makeReq({
        variants: [
          { id: "v1", size: "NB", stock: 5 },
          { size: "3-6M", stock: 15, color: "Blue" }, // new - no id
        ],
      }),
      { params: Promise.resolve({ id: "p1" }) }
    );
    expect(res.status).toBe(200);

    // Should insert the new variant
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({ size: "3-6M", stock: 15, productId: "p1" })
    );
  });

  it("does NOT delete variants referenced by orders", async () => {
    mockFindFirst.mockResolvedValue({ id: "p1", slug: "test" });
    mockVariantsFindMany.mockResolvedValue([
      { id: "v1", productId: "p1", size: "NB", stock: 5 },
      { id: "v2", productId: "p1", size: "0-3M", stock: 10 },
    ]);
    // v2 is referenced by an order
    mockOrderItemsFindFirst.mockResolvedValue({ id: "oi1", variantId: "v2" });

    const { PUT } = await import("@/app/api/admin/products/[id]/route");
    const res = await PUT(
      makeReq({ variants: [{ id: "v1", size: "NB", stock: 5 }] }),
      { params: Promise.resolve({ id: "p1" }) }
    );
    expect(res.status).toBe(200);

    // v2 should NOT be hard-deleted
    expect(mockDeleteWhere).not.toHaveBeenCalled();
    // v2 should have stock set to 0 (the only call with just {stock:0})
    const stockZeroCall = mockUpdateSet.mock.calls.find(
      (c) => c[0]?.stock === 0 && Object.keys(c[0]).length === 1
    );
    expect(stockZeroCall).toBeDefined();
  });

  it("deletes unreferenced variants when removed", async () => {
    mockFindFirst.mockResolvedValue({ id: "p1", slug: "test" });
    mockVariantsFindMany.mockResolvedValue([
      { id: "v1", productId: "p1", size: "NB", stock: 5 },
      { id: "v2", productId: "p1", size: "0-3M", stock: 10 },
    ]);
    // v2 NOT referenced by any order
    mockOrderItemsFindFirst.mockResolvedValue(null);

    const { PUT } = await import("@/app/api/admin/products/[id]/route");
    const res = await PUT(
      makeReq({ variants: [{ id: "v1", size: "NB", stock: 5 }] }),
      { params: Promise.resolve({ id: "p1" }) }
    );
    expect(res.status).toBe(200);
    expect(mockDeleteWhere).toHaveBeenCalled();
  });

  it("floors negative/decimal stock values to valid range", async () => {
    mockFindFirst.mockResolvedValue({ id: "p1", slug: "test" });
    mockVariantsFindMany.mockResolvedValue([
      { id: "v1", productId: "p1", size: "NB", stock: 5 },
    ]);

    const { PUT } = await import("@/app/api/admin/products/[id]/route");
    const res = await PUT(
      makeReq({ variants: [{ id: "v1", size: "NB", stock: -5 }] }),
      { params: Promise.resolve({ id: "p1" }) }
    );
    expect(res.status).toBe(200);

    const variantUpdate = mockUpdateSet.mock.calls.find(
      (c) => c[0]?.size !== undefined
    );
    expect(variantUpdate?.[0].stock).toBe(0); // max(0, floor(-5)) = 0
  });
});

// --- Tests for PATCH /api/admin/stock ---

describe("PATCH /api/admin/stock - Bulk Stock Update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { role: "admin" } });
  });

  it("returns 401 if not admin", async () => {
    mockAuth.mockResolvedValue(null);
    const { PATCH } = await import("@/app/api/admin/stock/route");
    const res = await PATCH(makeReq({ updates: [] }));
    expect(res.status).toBe(401);
  });

  it("returns 400 if updates is empty", async () => {
    const { PATCH } = await import("@/app/api/admin/stock/route");
    const res = await PATCH(makeReq({ updates: [] }));
    expect(res.status).toBe(400);
  });

  it("returns 400 if updates is not an array", async () => {
    const { PATCH } = await import("@/app/api/admin/stock/route");
    const res = await PATCH(makeReq({ updates: "bad" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 if exceeds 500 limit", async () => {
    const { PATCH } = await import("@/app/api/admin/stock/route");
    const big = Array.from({ length: 501 }, (_, i) => ({ id: `v${i}`, stock: 1 }));
    const res = await PATCH(makeReq({ updates: big }));
    expect(res.status).toBe(400);
  });

  it("updates stock and returns count", async () => {
    const { PATCH } = await import("@/app/api/admin/stock/route");
    const res = await PATCH(makeReq({
      updates: [
        { id: "v1", stock: 20 },
        { id: "v2", stock: 5 },
      ],
    }));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.count).toBe(2);
  });

  it("handles stock=0 correctly (does not skip)", async () => {
    const { PATCH } = await import("@/app/api/admin/stock/route");
    const res = await PATCH(makeReq({ updates: [{ id: "v1", stock: 0 }] }));
    const data = await res.json();
    expect(data.count).toBe(1);
    expect(mockUpdateSet).toHaveBeenCalledWith({ stock: 0 });
  });

  it("skips invalid entries", async () => {
    const { PATCH } = await import("@/app/api/admin/stock/route");
    const res = await PATCH(makeReq({
      updates: [
        { id: "v1", stock: 5 },      // valid
        { id: "", stock: 10 },         // invalid: empty id
        { id: "v2", stock: -1 },       // invalid: negative
        { id: "v3", stock: "abc" },    // invalid: not number
      ],
    }));
    const data = await res.json();
    expect(data.count).toBe(1);
  });

  it("floors decimal stock values", async () => {
    const { PATCH } = await import("@/app/api/admin/stock/route");
    const res = await PATCH(makeReq({ updates: [{ id: "v1", stock: 7.9 }] }));
    const data = await res.json();
    expect(data.count).toBe(1);
    expect(mockUpdateSet).toHaveBeenCalledWith({ stock: 7 });
  });
});

// --- Tests for POST /api/admin/products ---

describe("POST /api/admin/products - Create Product", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { role: "admin" } });
  });

  it("returns 401 if not admin", async () => {
    mockAuth.mockResolvedValue(null);
    const { POST } = await import("@/app/api/admin/products/route");
    const res = await POST(makeReq({}));
    expect(res.status).toBe(401);
  });

  it("returns 400 if required fields missing", async () => {
    const { POST } = await import("@/app/api/admin/products/route");
    const res = await POST(makeReq({ name: "Test" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 if price is invalid", async () => {
    const { POST } = await import("@/app/api/admin/products/route");
    const res = await POST(makeReq({
      name: "Test", nameMn: "Тест", slug: "test", price: "-100",
    }));
    expect(res.status).toBe(400);
  });

  it("returns 409 if slug already exists", async () => {
    mockFindFirst.mockResolvedValue({ id: "existing", slug: "test" });
    const { POST } = await import("@/app/api/admin/products/route");
    const res = await POST(makeReq({
      name: "Test", nameMn: "Тест", slug: "test", price: "29900",
    }));
    expect(res.status).toBe(409);
  });

  it("creates product with variants preserving stock=0", async () => {
    mockFindFirst.mockResolvedValue(null); // no slug conflict
    mockInsertReturning.mockResolvedValue([{ id: "new-1", slug: "test-product" }]);

    const { POST } = await import("@/app/api/admin/products/route");
    const res = await POST(makeReq({
      name: "Test", nameMn: "Тест", slug: "test-product", price: "29900",
      variants: [
        { size: "NB", stock: 10 },
        { size: "0-3M", stock: 0 },
      ],
    }));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.id).toBe("new-1");

    // Verify variant insert includes stock=0
    const variantInsert = mockInsertValues.mock.calls.find((c) =>
      Array.isArray(c[0]) && c[0].some((v: Record<string, unknown>) => v.stock === 0)
    );
    expect(variantInsert).toBeDefined();
  });
});
