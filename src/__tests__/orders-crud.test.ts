/**
 * Tests for Order CRUD API routes
 * Covers:
 *   - PATCH /api/admin/orders (status transitions)
 *   - DELETE /api/admin/orders (soft-delete)
 *   - GET /api/orders (user order listing)
 * Focus: state machine enforcement, auth, edge cases, soft-delete logic
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// --- Mocks ---

const mockAuth = vi.fn();
const mockOrdersFindFirst = vi.fn();
const mockOrdersFindMany = vi.fn();

const mockUpdateWhere = vi.fn();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUpdateSet = vi.fn(() => ({ where: mockUpdateWhere })) as any;

vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

vi.mock("@/lib/db", () => ({
  db: {
    query: {
      orders: {
        findFirst: (...args: unknown[]) => mockOrdersFindFirst(...args),
        findMany: (...args: unknown[]) => mockOrdersFindMany(...args),
      },
    },
    update: () => ({ set: mockUpdateSet }),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  orders: {
    id: "orders.id",
    userId: "orders.userId",
    status: "orders.status",
    deletedAt: "orders.deletedAt",
    updatedAt: "orders.updatedAt",
  },
  orderItems: {
    id: "orderItems.id",
    orderId: "orderItems.orderId",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: (col: string, val: string) => ({ col, val, op: "eq" }),
  and: (...conditions: unknown[]) => ({ conditions, op: "and" }),
  isNull: (col: string) => ({ col, op: "isNull" }),
  inArray: (col: string, vals: string[]) => ({ col, vals, op: "inArray" }),
  desc: (col: string) => ({ col, op: "desc" }),
}));

// Helper to create NextRequest-like object
function makeReq(body: unknown): NextRequest {
  return { json: () => Promise.resolve(body) } as unknown as NextRequest;
}

// =============================================================================
// PATCH /api/admin/orders — Update Order Status
// =============================================================================

describe("PATCH /api/admin/orders - Update Order Status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { role: "admin" } });
  });

  // --- Auth ---

  it("returns 401 if not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const { PATCH } = await import("@/app/api/admin/orders/route");
    const res = await PATCH(makeReq({ orderId: "abc", status: "paid" }));
    expect(res.status).toBe(401);
  });

  it("returns 401 if user is not admin", async () => {
    mockAuth.mockResolvedValue({ user: { role: "user" } });
    const { PATCH } = await import("@/app/api/admin/orders/route");
    const res = await PATCH(makeReq({ orderId: "abc", status: "paid" }));
    expect(res.status).toBe(401);
  });

  // --- Validation ---

  it("returns 400 if orderId is missing", async () => {
    const { PATCH } = await import("@/app/api/admin/orders/route");
    const res = await PATCH(makeReq({ status: "paid" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid request");
  });

  it("returns 400 if status is missing", async () => {
    const { PATCH } = await import("@/app/api/admin/orders/route");
    const res = await PATCH(makeReq({ orderId: "abc" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 if status is invalid", async () => {
    const { PATCH } = await import("@/app/api/admin/orders/route");
    const res = await PATCH(makeReq({ orderId: "abc", status: "unknown_status" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 if status is empty string", async () => {
    const { PATCH } = await import("@/app/api/admin/orders/route");
    const res = await PATCH(makeReq({ orderId: "abc", status: "" }));
    expect(res.status).toBe(400);
  });

  // --- Order Not Found ---

  it("returns 404 if order does not exist", async () => {
    mockOrdersFindFirst.mockResolvedValue(null);
    const { PATCH } = await import("@/app/api/admin/orders/route");
    const res = await PATCH(makeReq({ orderId: "nonexistent", status: "paid" }));
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toContain("олдсонгүй");
  });

  it("returns 404 for soft-deleted order (findFirst returns null)", async () => {
    mockOrdersFindFirst.mockResolvedValue(null);
    const { PATCH } = await import("@/app/api/admin/orders/route");
    const res = await PATCH(makeReq({ orderId: "deleted-order", status: "paid" }));
    expect(res.status).toBe(404);
  });

  // --- Same Status (no-op success) ---

  it("returns success without DB update if status is unchanged", async () => {
    mockOrdersFindFirst.mockResolvedValue({ id: "o1", status: "pending" });
    const { PATCH } = await import("@/app/api/admin/orders/route");
    const res = await PATCH(makeReq({ orderId: "o1", status: "pending" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    // No DB update should have been called
    expect(mockUpdateSet).not.toHaveBeenCalled();
  });

  // --- Any Status Transition Allowed ---

  describe("allows any status transition", () => {
    const allStatuses = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"];

    const allTransitions: [string, string][] = [];
    for (const from of allStatuses) {
      for (const to of allStatuses) {
        if (from !== to) allTransitions.push([from, to]);
      }
    }

    for (const [from, to] of allTransitions) {
      it(`allows transition: ${from} → ${to}`, async () => {
        mockOrdersFindFirst.mockResolvedValue({ id: "o1", status: from });
        const { PATCH } = await import("@/app/api/admin/orders/route");
        const res = await PATCH(makeReq({ orderId: "o1", status: to }));
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(mockUpdateSet).toHaveBeenCalledWith(
          expect.objectContaining({ status: to })
        );
      });
    }
  });

  // --- DB update details ---

  it("sets updatedAt in the DB update call", async () => {
    mockOrdersFindFirst.mockResolvedValue({ id: "o1", status: "pending" });
    const { PATCH } = await import("@/app/api/admin/orders/route");
    const before = new Date();
    await PATCH(makeReq({ orderId: "o1", status: "paid" }));
    const setArg = mockUpdateSet.mock.calls[0][0];
    expect(setArg.updatedAt).toBeInstanceOf(Date);
    expect(setArg.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it("calls where with the correct orderId", async () => {
    mockOrdersFindFirst.mockResolvedValue({ id: "order-123", status: "paid" });
    const { PATCH } = await import("@/app/api/admin/orders/route");
    await PATCH(makeReq({ orderId: "order-123", status: "processing" }));
    expect(mockUpdateWhere).toHaveBeenCalledWith(
      expect.objectContaining({ val: "order-123", op: "eq" })
    );
  });

  // --- Error handling ---

  it("returns 500 on unexpected error", async () => {
    mockAuth.mockRejectedValue(new Error("DB connection lost"));
    const { PATCH } = await import("@/app/api/admin/orders/route");
    const res = await PATCH(makeReq({ orderId: "o1", status: "paid" }));
    expect(res.status).toBe(500);
  });
});

// =============================================================================
// DELETE /api/admin/orders — Soft-Delete Orders
// =============================================================================

describe("DELETE /api/admin/orders - Soft-Delete Orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { role: "admin" } });
  });

  // --- Auth ---

  it("returns 401 if not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const { DELETE } = await import("@/app/api/admin/orders/route");
    const res = await DELETE(makeReq({ orderIds: ["o1"] }));
    expect(res.status).toBe(401);
  });

  it("returns 401 if user is not admin", async () => {
    mockAuth.mockResolvedValue({ user: { role: "user" } });
    const { DELETE } = await import("@/app/api/admin/orders/route");
    const res = await DELETE(makeReq({ orderIds: ["o1"] }));
    expect(res.status).toBe(401);
  });

  // --- Validation ---

  it("returns 400 if orderIds is missing", async () => {
    const { DELETE } = await import("@/app/api/admin/orders/route");
    const res = await DELETE(makeReq({}));
    expect(res.status).toBe(400);
  });

  it("returns 400 if orderIds is empty array", async () => {
    const { DELETE } = await import("@/app/api/admin/orders/route");
    const res = await DELETE(makeReq({ orderIds: [] }));
    expect(res.status).toBe(400);
  });

  it("returns 400 if orderIds is not an array", async () => {
    const { DELETE } = await import("@/app/api/admin/orders/route");
    const res = await DELETE(makeReq({ orderIds: "o1" }));
    expect(res.status).toBe(400);
  });

  // --- Only cancelled orders can be deleted ---

  it("returns 400 if any order is not cancelled", async () => {
    mockOrdersFindMany.mockResolvedValue([
      { id: "o1", status: "cancelled" },
      { id: "o2", status: "pending" },
    ]);
    const { DELETE } = await import("@/app/api/admin/orders/route");
    const res = await DELETE(makeReq({ orderIds: ["o1", "o2"] }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("цуцлагдсан");
  });

  it("returns 400 if order is in processing status", async () => {
    mockOrdersFindMany.mockResolvedValue([{ id: "o1", status: "processing" }]);
    const { DELETE } = await import("@/app/api/admin/orders/route");
    const res = await DELETE(makeReq({ orderIds: ["o1"] }));
    expect(res.status).toBe(400);
  });

  it("returns 400 if order is in delivered status", async () => {
    mockOrdersFindMany.mockResolvedValue([{ id: "o1", status: "delivered" }]);
    const { DELETE } = await import("@/app/api/admin/orders/route");
    const res = await DELETE(makeReq({ orderIds: ["o1"] }));
    expect(res.status).toBe(400);
  });

  // --- Successful soft-delete ---

  it("soft-deletes a single cancelled order", async () => {
    mockOrdersFindMany.mockResolvedValue([{ id: "o1", status: "cancelled" }]);
    const { DELETE } = await import("@/app/api/admin/orders/route");
    const res = await DELETE(makeReq({ orderIds: ["o1"] }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.deleted).toBe(1);
    // Verify soft-delete sets deletedAt
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        deletedAt: expect.any(Date),
        updatedAt: expect.any(Date),
      })
    );
  });

  it("soft-deletes multiple cancelled orders", async () => {
    mockOrdersFindMany.mockResolvedValue([
      { id: "o1", status: "cancelled" },
      { id: "o2", status: "cancelled" },
      { id: "o3", status: "cancelled" },
    ]);
    const { DELETE } = await import("@/app/api/admin/orders/route");
    const res = await DELETE(makeReq({ orderIds: ["o1", "o2", "o3"] }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.deleted).toBe(3);
  });

  it("only deletes orders that exist (ignores unknown IDs)", async () => {
    // If requested IDs include one that doesn't exist, findMany returns less
    mockOrdersFindMany.mockResolvedValue([{ id: "o1", status: "cancelled" }]);
    const { DELETE } = await import("@/app/api/admin/orders/route");
    const res = await DELETE(makeReq({ orderIds: ["o1", "nonexistent"] }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.deleted).toBe(1);
  });

  // --- Error handling ---

  it("returns 500 on unexpected error", async () => {
    mockAuth.mockRejectedValue(new Error("Server error"));
    const { DELETE } = await import("@/app/api/admin/orders/route");
    const res = await DELETE(makeReq({ orderIds: ["o1"] }));
    expect(res.status).toBe(500);
  });
});

// =============================================================================
// GET /api/orders — User Order Listing
// =============================================================================

describe("GET /api/orders - User Order Listing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const { GET } = await import("@/app/api/orders/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 401 if session has no user id", async () => {
    mockAuth.mockResolvedValue({ user: {} });
    const { GET } = await import("@/app/api/orders/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns orders for authenticated user", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    const mockOrders = [
      {
        id: "o1",
        orderNumber: "ORD-001",
        status: "pending",
        total: "50000",
        items: [{ id: "i1", name: "Gold Ring", quantity: 1, price: "50000" }],
      },
      {
        id: "o2",
        orderNumber: "ORD-002",
        status: "delivered",
        total: "75000",
        items: [{ id: "i2", name: "Blanket", quantity: 2, price: "37500" }],
      },
    ];
    mockOrdersFindMany.mockResolvedValue(mockOrders);
    const { GET } = await import("@/app/api/orders/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(2);
    expect(data[0].orderNumber).toBe("ORD-001");
    expect(data[1].items).toHaveLength(1);
  });

  it("returns empty array when user has no orders", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockOrdersFindMany.mockResolvedValue([]);
    const { GET } = await import("@/app/api/orders/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual([]);
  });

  it("returns 500 on unexpected error", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockOrdersFindMany.mockRejectedValue(new Error("DB timeout"));
    const { GET } = await import("@/app/api/orders/route");
    const res = await GET();
    expect(res.status).toBe(500);
  });
});
