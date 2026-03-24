/**
 * @jest-environment node
 *
 * Unit tests for GET | POST | PATCH | DELETE /api/notes
 */

import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
jest.mock("next/headers", () => ({ cookies: jest.fn(() => ({})) }));
jest.mock("@/lib/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("@/lib/api-auth", () => ({ requireAuth: jest.fn() }));

const dbResult: { data: unknown; error: unknown } = { data: null, error: null };
const mockChain: Record<string, jest.Mock> & { then?: unknown } = {};
for (const m of [
  "select", "insert", "update", "delete",
  "eq", "in", "lt", "gte", "lte", "order", "limit",
]) {
  mockChain[m] = jest.fn().mockReturnValue(mockChain);
}
mockChain.single = jest.fn(() => Promise.resolve(dbResult));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockChain.then = (res: any, rej?: any) =>
  Promise.resolve(dbResult).then(res, rej);

const mockSupabaseClient = { from: jest.fn().mockReturnValue(mockChain) };
jest.mock("@supabase/auth-helpers-nextjs", () => ({
  createServerComponentClient: jest.fn(() => mockSupabaseClient),
}));

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------
import { GET, POST, PATCH, DELETE } from "@/app/api/notes/route";
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
// GET /api/notes
// ---------------------------------------------------------------------------
describe("GET /api/notes", () => {
  it("returns 401 when unauthenticated", async () => {
    authFail();
    const res = await GET(makeReq("GET", "/api/notes"));
    expect(res.status).toBe(401);
  });

  it("returns 200 with notes list", async () => {
    authOk();
    dbResult.data = [{ id: "n1", title: "Meeting notes" }];
    const res = await GET(makeReq("GET", "/api/notes"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
  });

  it("filters by list_id", async () => {
    authOk();
    dbResult.data = [];
    const res = await GET(makeReq("GET", "/api/notes?list_id=l1"));
    expect(res.status).toBe(200);
    expect(mockChain.eq).toHaveBeenCalledWith("list_id", "l1");
  });

  it("filters by collection_id", async () => {
    authOk();
    dbResult.data = [];
    const res = await GET(makeReq("GET", "/api/notes?collection_id=c1"));
    expect(res.status).toBe(200);
    expect(mockChain.eq).toHaveBeenCalledWith("collection_id", "c1");
  });

  it("filters by is_pinned", async () => {
    authOk();
    dbResult.data = [];
    const res = await GET(makeReq("GET", "/api/notes?is_pinned=true"));
    expect(res.status).toBe(200);
    expect(mockChain.eq).toHaveBeenCalledWith("is_pinned", true);
  });

  it("returns 500 on database error", async () => {
    authOk();
    dbResult.error = { message: "DB failure" };
    const res = await GET(makeReq("GET", "/api/notes"));
    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// POST /api/notes
// ---------------------------------------------------------------------------
describe("POST /api/notes", () => {
  it("returns 401 when unauthenticated", async () => {
    authFail();
    const res = await POST(makeReq("POST", "/api/notes", { title: "Note 1" }));
    expect(res.status).toBe(401);
  });

  it("returns 201 with the new note", async () => {
    authOk();
    dbResult.data = { id: "n1", title: "Note 1" };
    const res = await POST(makeReq("POST", "/api/notes", { title: "Note 1" }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data).toEqual(dbResult.data);
  });

  it("injects user_id from session", async () => {
    authOk();
    dbResult.data = { id: "n1", title: "Note 1", user_id: "user-1" };
    await POST(makeReq("POST", "/api/notes", { title: "Note 1" }));
    expect(mockChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "user-1" })
    );
  });

  it("returns 500 on database error", async () => {
    authOk();
    dbResult.error = { message: "Insert failed" };
    const res = await POST(makeReq("POST", "/api/notes", { title: "X" }));
    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/notes
// ---------------------------------------------------------------------------
describe("PATCH /api/notes", () => {
  it("returns 401 when unauthenticated", async () => {
    authFail();
    const res = await PATCH(makeReq("PATCH", "/api/notes", { id: "n1", title: "New" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when id is missing", async () => {
    authOk();
    const res = await PATCH(makeReq("PATCH", "/api/notes", { title: "New" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/id/i);
  });

  it("returns 200 with the updated note", async () => {
    authOk();
    dbResult.data = { id: "n1", title: "New" };
    const res = await PATCH(makeReq("PATCH", "/api/notes", { id: "n1", title: "New" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual(dbResult.data);
  });

  it("returns 500 on database error", async () => {
    authOk();
    dbResult.error = { message: "Update failed" };
    const res = await PATCH(makeReq("PATCH", "/api/notes", { id: "n1", title: "New" }));
    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/notes
// ---------------------------------------------------------------------------
describe("DELETE /api/notes", () => {
  it("returns 401 when unauthenticated", async () => {
    authFail();
    const res = await DELETE(makeReq("DELETE", "/api/notes", { id: "n1" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when id is missing", async () => {
    authOk();
    const res = await DELETE(makeReq("DELETE", "/api/notes", {}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/id/i);
  });

  it("soft-deletes a note (sets is_deleted=true)", async () => {
    authOk();
    dbResult.error = null;
    const res = await DELETE(makeReq("DELETE", "/api/notes", { id: "n1" }));
    expect(res.status).toBe(200);
    expect(mockChain.update).toHaveBeenCalledWith({ is_deleted: true });
  });

  it("hard-deletes a note when hard=true", async () => {
    authOk();
    dbResult.error = null;
    const res = await DELETE(makeReq("DELETE", "/api/notes", { id: "n1", hard: true }));
    expect(res.status).toBe(200);
    expect(mockChain.delete).toHaveBeenCalled();
    expect(mockChain.update).not.toHaveBeenCalled();
  });

  it("returns 500 on database error", async () => {
    authOk();
    dbResult.error = { message: "Delete failed" };
    const res = await DELETE(makeReq("DELETE", "/api/notes", { id: "n1" }));
    expect(res.status).toBe(500);
  });
});
