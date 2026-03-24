/** @jest-environment node */

import { NextRequest } from "next/server";

// Mocks
jest.mock("next/headers", () => ({ cookies: jest.fn(() => ({})) }));
jest.mock("@/lib/logger", () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));
jest.mock("@/lib/api-auth", () => ({ requireAuth: jest.fn() }));

const dbResult: { data: unknown; error: unknown } = { data: null, error: null };
const mockChain: Record<string, jest.Mock> & { then?: unknown } = {};
for (const m of [
  "select",
  "insert",
  "update",
  "delete",
  "eq",
  "in",
  "lt",
  "gte",
  "lte",
  "order",
  "limit",
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

// Imports
import { GET, POST, PATCH, DELETE } from "@/app/api/lists/route";
import { requireAuth } from "@/lib/api-auth";

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;

// Helpers
const fakeSession = (userId = "user-1") => ({
  user: { id: userId, email: "a@b.com" },
  access_token: "tok",
});

function authOk() {
  mockRequireAuth.mockResolvedValue({
    session: fakeSession() as never,
    error: null,
  });
}
function authFail() {
  const { NextResponse } =
    jest.requireActual<typeof import("next/server")>("next/server");
  mockRequireAuth.mockResolvedValue({
    session: null,
    error: NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    ),
  });
}
function makeReq(method: string, url: string, body?: unknown) {
  return new NextRequest(`http://localhost${url}`, {
    method,
    ...(body
      ? {
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
        }
      : {}),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  dbResult.data = null;
  dbResult.error = null;
  for (const m of [
    "select",
    "insert",
    "update",
    "delete",
    "eq",
    "in",
    "lt",
    "gte",
    "lte",
    "order",
    "limit",
  ]) {
    mockChain[m].mockReturnValue(mockChain);
  }
  mockChain.single.mockImplementation(() => Promise.resolve(dbResult));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockChain.then = (res: any, rej?: any) =>
    Promise.resolve(dbResult).then(res, rej);
  mockSupabaseClient.from.mockReturnValue(mockChain);
});

// GET /api/lists
describe("GET /api/lists", () => {
  it("returns 401 when unauthenticated", async () => {
    authFail();
    const res = await GET(makeReq("GET", "/api/lists"));
    expect(res.status).toBe(401);
  });

  it("returns 200 with all lists", async () => {
    authOk();
    dbResult.data = [{ id: "l1", name: "My List" }];
    const res = await GET(makeReq("GET", "/api/lists"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
  });

  it("returns a single list when id query param is given", async () => {
    authOk();
    dbResult.data = { id: "l1", name: "My List" };
    const res = await GET(makeReq("GET", "/api/lists?id=l1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual(dbResult.data);
    // single path used
    expect(mockChain.single).toHaveBeenCalled();
  });

  it("returns 500 on database error (all lists)", async () => {
    authOk();
    dbResult.error = { message: "DB error" };
    const res = await GET(makeReq("GET", "/api/lists"));
    expect(res.status).toBe(500);
  });

  it("returns 500 on database error (single list)", async () => {
    authOk();
    dbResult.error = { message: "DB error" };
    const res = await GET(makeReq("GET", "/api/lists?id=l1"));
    expect(res.status).toBe(500);
  });
});

// POST /api/lists
describe("POST /api/lists", () => {
  it("returns 401 when unauthenticated", async () => {
    authFail();
    const res = await POST(makeReq("POST", "/api/lists", { name: "Work" }));
    expect(res.status).toBe(401);
  });

  it("returns 201 with the new list", async () => {
    authOk();
    dbResult.data = { id: "l1", name: "Work" };
    const res = await POST(makeReq("POST", "/api/lists", { name: "Work" }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data).toEqual(dbResult.data);
  });

  it("injects user_id from session", async () => {
    authOk();
    dbResult.data = { id: "l1", name: "Work", user_id: "user-1" };
    await POST(makeReq("POST", "/api/lists", { name: "Work" }));
    expect(mockChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "user-1" }),
    );
  });

  it("returns 500 on database error", async () => {
    authOk();
    dbResult.error = { message: "Insert failed" };
    const res = await POST(makeReq("POST", "/api/lists", { name: "Work" }));
    expect(res.status).toBe(500);
  });
});

// PATCH /api/lists
describe("PATCH /api/lists", () => {
  it("returns 401 when unauthenticated", async () => {
    authFail();
    const res = await PATCH(
      makeReq("PATCH", "/api/lists", { id: "l1", name: "New" }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 when id is missing", async () => {
    authOk();
    const res = await PATCH(makeReq("PATCH", "/api/lists", { name: "New" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/id/i);
  });

  it("returns 200 with the updated list", async () => {
    authOk();
    dbResult.data = { id: "l1", name: "New" };
    const res = await PATCH(
      makeReq("PATCH", "/api/lists", { id: "l1", name: "New" }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual(dbResult.data);
  });

  it("returns 500 on database error", async () => {
    authOk();
    dbResult.error = { message: "Update failed" };
    const res = await PATCH(
      makeReq("PATCH", "/api/lists", { id: "l1", name: "New" }),
    );
    expect(res.status).toBe(500);
  });

  it("strips user_id from the update payload", async () => {
    authOk();
    dbResult.data = { id: "l1", name: "New" };
    await PATCH(
      makeReq("PATCH", "/api/lists", {
        id: "l1",
        name: "New",
        user_id: "hacked",
      }),
    );
    expect(mockChain.update).toHaveBeenCalledWith(
      expect.not.objectContaining({ user_id: "hacked" }),
    );
  });
});

// DELETE /api/lists
describe("DELETE /api/lists", () => {
  it("returns 401 when unauthenticated", async () => {
    authFail();
    const res = await DELETE(makeReq("DELETE", "/api/lists", { id: "l1" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when id is missing", async () => {
    authOk();
    const res = await DELETE(makeReq("DELETE", "/api/lists", {}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/id/i);
  });

  it("returns 404 when list is not found / not owned", async () => {
    authOk();
    // not owned or not found
    dbResult.data = null;
    dbResult.error = { message: "Not found" };
    const res = await DELETE(makeReq("DELETE", "/api/lists", { id: "l1" }));
    expect(res.status).toBe(404);
  });

  it("returns 200 on successful deletion (with cascaded children)", async () => {
    authOk();
    // works for both ownership and collection query
    dbResult.data = [{ id: "l1" }];
    dbResult.error = null;
    const res = await DELETE(makeReq("DELETE", "/api/lists", { id: "l1" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("returns 500 on delete database error", async () => {
    authOk();
    // ownership ok, delete fails
    let callCount = 0;
    mockChain.single.mockImplementation(() => {
      callCount++;
      if (callCount === 1)
        return Promise.resolve({ data: { id: "l1" }, error: null });
      return Promise.resolve({
        data: null,
        error: { message: "Delete failed" },
      });
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockChain.then = (res: any) =>
      Promise.resolve({ data: null, error: { message: "Delete failed" } }).then(
        res,
      );

    const response = await DELETE(
      makeReq("DELETE", "/api/lists", { id: "l1" }),
    );
    expect(response.status).toBe(500);
  });
});
