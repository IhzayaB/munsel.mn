/**
 * Tests for Category CRUD API routes
 * Covers: GET, POST, PATCH, DELETE /api/admin/categories
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockAuth = vi.fn();
const mockCategoriesFindMany = vi.fn();
const mockCategoriesFindFirst = vi.fn();

// Insert chain
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockInsertReturning = vi.fn() as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockInsertValues = vi.fn(() => ({ returning: mockInsertReturning })) as any;

// Categories update chain
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockCategoriesUpdateReturning = vi.fn() as any;
const mockCategoriesUpdateWhere = vi.fn(() => ({ returning: mockCategoriesUpdateReturning }));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockCategoriesUpdateSet = vi.fn(() => ({ where: mockCategoriesUpdateWhere })) as any;

// Products update chain (used by DELETE)
const mockProductsUpdateWhere = vi.fn();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockProductsUpdateSet = vi.fn(() => ({ where: mockProductsUpdateWhere })) as any;

const mockDeleteWhere = vi.fn();

const categoriesTable = {
  __table: "categories",
  id: "categories.id",
  slug: "categories.slug",
  priority: "categories.priority",
};

const productsTable = {
  __table: "products",
  categoryId: "products.categoryId",
};

vi.mock("@/lib/auth", () => ({ auth: () => mockAuth() }));

vi.mock("@/lib/db", () => ({
  db: {
    query: {
      categories: {
        findMany: (...args: unknown[]) => mockCategoriesFindMany(...args),
        findFirst: (...args: unknown[]) => mockCategoriesFindFirst(...args),
      },
    },
    insert: () => ({ values: mockInsertValues }),
    update: (table: { __table?: string }) => {
      if (table?.__table === "categories") {
        return { set: mockCategoriesUpdateSet };
      }
      if (table?.__table === "products") {
        return { set: mockProductsUpdateSet };
      }
      return { set: vi.fn(() => ({ where: vi.fn() })) };
    },
    delete: () => ({ where: mockDeleteWhere }),
  },
}));

vi.mock("@/lib/db/schema", () => ({
  categories: categoriesTable,
  products: productsTable,
}));

vi.mock("drizzle-orm", () => ({
  eq: (col: string, val: string) => ({ col, val, op: "eq" }),
  and: (...conditions: unknown[]) => ({ conditions, op: "and" }),
  ne: (col: string, val: string) => ({ col, val, op: "ne" }),
  desc: (col: string) => ({ col, op: "desc" }),
}));

function makeReq(body: unknown): NextRequest {
  return { json: () => Promise.resolve(body) } as unknown as NextRequest;
}

describe("/api/admin/categories CRUD", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { role: "admin" } });
  });

  describe("GET", () => {
    it("returns 401 if not admin", async () => {
      mockAuth.mockResolvedValue(null);
      const { GET } = await import("@/app/api/admin/categories/route");
      const res = await GET();
      expect(res.status).toBe(401);
    });

    it("returns categories for admin", async () => {
      mockCategoriesFindMany.mockResolvedValue([
        { id: "c1", name: "Ring", priority: 10 },
        { id: "c2", name: "Chain", priority: 5 },
      ]);
      const { GET } = await import("@/app/api/admin/categories/route");
      const res = await GET();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveLength(2);
      expect(mockCategoriesFindMany).toHaveBeenCalled();
    });
  });

  describe("POST", () => {
    it("returns 401 if not admin", async () => {
      mockAuth.mockResolvedValue({ user: { role: "user" } });
      const { POST } = await import("@/app/api/admin/categories/route");
      const res = await POST(makeReq({ name: "A", nameMn: "Б", slug: "a" }));
      expect(res.status).toBe(401);
    });

    it("returns 400 when required fields are missing", async () => {
      const { POST } = await import("@/app/api/admin/categories/route");
      const res = await POST(makeReq({ name: "A", slug: "a" }));
      expect(res.status).toBe(400);
    });

    it("returns 409 when slug already exists", async () => {
      mockCategoriesFindFirst.mockResolvedValue({ id: "c1", slug: "gold" });
      const { POST } = await import("@/app/api/admin/categories/route");
      const res = await POST(
        makeReq({ name: "Gold", nameMn: "Алт", slug: "gold" })
      );
      expect(res.status).toBe(409);
    });

    it("creates category and defaults priority to 0", async () => {
      mockCategoriesFindFirst.mockResolvedValue(null);
      mockInsertReturning.mockResolvedValue([
        { id: "new-c", name: "Gold", nameMn: "Алт", slug: "gold", priority: 0 },
      ]);

      const { POST } = await import("@/app/api/admin/categories/route");
      const res = await POST(
        makeReq({ name: "Gold", nameMn: "Алт", slug: "gold", priority: "oops" })
      );

      expect(res.status).toBe(200);
      expect(mockInsertValues).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Gold",
          nameMn: "Алт",
          slug: "gold",
          priority: 0,
        })
      );
    });
  });

  describe("PATCH", () => {
    it("returns 400 on missing fields", async () => {
      const { PATCH } = await import("@/app/api/admin/categories/route");
      const res = await PATCH(makeReq({ id: "c1", name: "A" }));
      expect(res.status).toBe(400);
    });

    it("returns 409 on slug conflict", async () => {
      mockCategoriesFindFirst.mockResolvedValue({ id: "other", slug: "gold" });
      const { PATCH } = await import("@/app/api/admin/categories/route");
      const res = await PATCH(
        makeReq({ id: "c1", name: "Gold", nameMn: "Алт", slug: "gold" })
      );
      expect(res.status).toBe(409);
    });

    it("returns 404 if category not found", async () => {
      mockCategoriesFindFirst.mockResolvedValue(null);
      mockCategoriesUpdateReturning.mockResolvedValue([]);

      const { PATCH } = await import("@/app/api/admin/categories/route");
      const res = await PATCH(
        makeReq({ id: "missing", name: "Gold", nameMn: "Алт", slug: "gold" })
      );
      expect(res.status).toBe(404);
    });

    it("updates category and returns payload", async () => {
      mockCategoriesFindFirst.mockResolvedValue(null);
      mockCategoriesUpdateReturning.mockResolvedValue([
        { id: "c1", name: "Gold", nameMn: "Алт", slug: "gold" },
      ]);

      const { PATCH } = await import("@/app/api/admin/categories/route");
      const res = await PATCH(
        makeReq({ id: "c1", name: "Gold", nameMn: "Алт", slug: "gold" })
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.id).toBe("c1");
      expect(mockCategoriesUpdateSet).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Gold", nameMn: "Алт", slug: "gold" })
      );
    });
  });

  describe("DELETE", () => {
    it("returns 401 if not admin", async () => {
      mockAuth.mockResolvedValue(null);
      const { DELETE } = await import("@/app/api/admin/categories/route");
      const res = await DELETE(makeReq({ id: "c1" }));
      expect(res.status).toBe(401);
    });

    it("returns 400 when id is missing", async () => {
      const { DELETE } = await import("@/app/api/admin/categories/route");
      const res = await DELETE(makeReq({}));
      expect(res.status).toBe(400);
    });

    it("clears product category before deleting category", async () => {
      const { DELETE } = await import("@/app/api/admin/categories/route");
      const res = await DELETE(makeReq({ id: "c1" }));

      expect(res.status).toBe(200);
      expect(mockProductsUpdateSet).toHaveBeenCalledWith({ categoryId: null });
      expect(mockDeleteWhere).toHaveBeenCalled();
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });
});
