/**
 * @jest-environment node
 *
 * Unit tests for GET | POST | PATCH | DELETE /api/collections
 */

import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Shared mocks
// ---------------------------------------------------------------------------
jest.mock("next/headers", () => ({ cookies: jest.fn(() => ({})) }));
jest.mock("@/lib/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("@/lib/api-auth", () => ({ requireAuth: jest.fn() }));

// Chainable Supabase mock
const dbResult: { data: unknown; error: unknown } = { data: null, error: null };
const mockChain: Record<string, jest.Mock> & { then?: unknown } = {};
for (const m of [
  "select", "insert", "update", "delete",
  "eq", "in", "lt", "gte", "lte", "order", "limit",
]) {
  mockChain[m] = jest.fn().mockReturnValue(mockChain);
}
mockChain.single = jest.fn(() => Promise.resolve(dbResult));
// Make the chain awaitable without .single()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockChain.then = (res: any, rej?: any) =>
  Promise.resolve(dbResult).then(res, rej);

const mockSupabaseClient = { from: jest.fn().mockReturnValue(mockChain) };
jest.mock("@supabase/auth-helpers-nextjs", () => ({
  createServerComponentClient: jest.fn(() => mockSupabaseClient),
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------
import { GET, POST, PATCH, DELETE } from "@/app/api/collections/route";
import { requireAuth } from "@/lib/api-auth";

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const fakeSession = (userId = "user-1") => ({
  user: { id: userId, email: "a@b.com" },
  access_token: "tok",
});

function authOk() {
  mockRequireAuth.mockResolvedValue({ session: fakeSession() as never, error: null });
}
function authFail() {
  const { NextResponse } = jest.requireActual<typeof import("next/server")>("next/server");
  mockRequireAuth.mockResolvedValue({
    session: null,
    error: NextResponse.json({ error: "Authentication required" }, { status: 401 }),
  });
}
function makeReq(method: string, url: string, body?: unknown) {
  return new NextRequest(`http://localhost${url}`, {
    method,
    ...(body
      ? { body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }
      : {}),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  dbResult.data = null;
  dbResult.error = null;
  for (const m of [
    "select", "insert", "update", "delete",
    "eq", "in", "lt", "gte", "lte", "order", "limit",
  ]) {
    mockChain[m].mockReturnValue(mockChain);
  }
  mockChain.single.mockImplementation(() => Promise.resolve(dbResult));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockChain.then = (res: any, rej?: any) =>
    Promise.resolve(dbResult).then(res, rej);
  mockSupabaseClient.from.mockReturnValue(mockChain);
});

// ---------------------------------------------------------------------------
// GET /api/collections
// ---------------------------------------------------------------------------
describe("GET /api/collections", () => {
  it("returns 401 when unauthenticated", async () => {
    authFail();
    const res = await GET(makeReq("GET", "/api/collections"));
    expect(res.status).toBe(401);
  });

  it("returns 200 with all collections", async () => {
    authOk();
    dbResult.data = [{ id: "c1", collection_name: "Work" }];
    const res = await GET(makeReq("GET", "/api/collections"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe("c1");
  });

  it("filters by list_id when provided", async () => {
    authOk();
    dbResult.data = [{ id: "c2", collection_name: "Home", list_id: "l1" }];
    const res = await GET(makeReq("GET", "/api/collections?list_id=l1"));
    expect(res.status).toBe(200);
    // eq() should have been called with list_id
    expect(mockChain.eq).toHaveBeenCalledWith("list_id", "l1");
  });

  it("returns 500 on database error", async () => {
    authOk();
    dbResult.data = null;
    dbResult.error = { message: "DB failure" };
    const res = await GET(makeReq("GET", "/api/collections"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// POST /api/collections
// ---------------------------------------------------------------------------
describe("POST /api/collections", () => {
  it("returns 401 when unauthenticated", async () => {
    authFail();
    const res = await POST(makeReq("POST", "/api/collections", { collection_name: "Work" }));
    expect(res.status).toBe(401);
  });

  it("returns 201 and the created collection", async () => {
    authOk();
    dbResult.data = { id: "c1", collection_name: "Work" };
    const res = await POST(makeReq("POST", "/api/collections", { collection_name: "Work" }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data).toEqual(dbResult.data);
  });

  it("returns 500 on database error", async () => {
    authOk();
    dbResult.data = null;
    dbResult.error = { message: "Insert failed" };
    const res = await POST(makeReq("POST", "/api/collections", { collection_name: "X" }));
    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/collections
// ---------------------------------------------------------------------------
describe("PATCH /api/collections", () => {
  it("returns 401 when unauthenticated", async () => {
    authFail();
    const res = await PATCH(makeReq("PATCH", "/api/collections", { id: "c1", collection_name: "New" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when id is missing", async () => {
    authOk();
    const res = await PATCH(makeReq("PATCH", "/api/collections", { collection_name: "New" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/id/i);
  });

  it("returns 200 with the updated collection", async () => {
    authOk();
    dbResult.data = { id: "c1", collection_name: "New" };
    const res = await PATCH(makeReq("PATCH", "/api/collections", { id: "c1", collection_name: "New" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual(dbResult.data);
  });

  it("returns 500 on database error", async () => {
    authOk();
    dbResult.data = null;
    dbResult.error = { message: "Update failed" };
    const res = await PATCH(makeReq("PATCH", "/api/collections", { id: "c1", collection_name: "New" }));
    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/collections
// ---------------------------------------------------------------------------
describe("DELETE /api/collections", () => {
  it("returns 401 when unauthenticated", async () => {
    authFail();
    const res = await DELETE(makeReq("DELETE", "/api/collections", { ids: ["c1"] }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when ids array is missing", async () => {
    authOk();
    const res = await DELETE(makeReq("DELETE", "/api/collections", {}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/id/i);
  });

  it("returns 400 when ids array is empty", async () => {
    authOk();
    const res = await DELETE(makeReq("DELETE", "/api/collections", { ids: [] }));
    expect(res.status).toBe(400);
  });

  it("returns 404 when no collections owned by user", async () => {
    authOk();
    dbResult.data = [];   // ownership check returns empty array
    dbResult.error = null;
    const res = await DELETE(makeReq("DELETE", "/api/collections", { ids: ["c1"] }));
    expect(res.status).toBe(404);
  });

  it("returns 200 on successful deletion", async () => {
    authOk();
    dbResult.data = [{ id: "c1" }];   // ownership check returns owned collection
    dbResult.error = null;
    const res = await DELETE(makeReq("DELETE", "/api/collections", { ids: ["c1"] }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("returns 500 on ownership check database error", async () => {
    authOk();
    dbResult.data = null;
    dbResult.error = { message: "DB error" };
    const res = await DELETE(makeReq("DELETE", "/api/collections", { ids: ["c1"] }));
    expect(res.status).toBe(500);
  });
});
