/**
 * @jest-environment node
 *
 * Unit tests for GET | PATCH /api/user/profile
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
for (const m of ["select", "update", "eq", "single"]) {
  mockChain[m] = jest.fn().mockReturnValue(mockChain);
}
mockChain.single = jest.fn(() => Promise.resolve(dbResult));
mockChain.then = (res: (v: unknown) => unknown, rej?: (v: unknown) => unknown) =>
  Promise.resolve(dbResult).then(res, rej);

const mockSupabaseClient = { from: jest.fn().mockReturnValue(mockChain) };
jest.mock("@supabase/auth-helpers-nextjs", () => ({
  createServerComponentClient: jest.fn(() => mockSupabaseClient),
}));

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------
import { GET, PATCH } from "@/app/api/user/profile/route";
import { requireAuth } from "@/lib/api-auth";

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const fakeSession = (userId = "user-1") => ({
  user: { id: userId, email: "user@example.com" },
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
function makeReq(method: string, body?: unknown) {
  return new NextRequest("http://localhost/api/user/profile", {
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
  for (const m of ["select", "update", "eq"]) {
    mockChain[m].mockReturnValue(mockChain);
  }
  mockChain.single.mockImplementation(() => Promise.resolve(dbResult));
  mockChain.then = (res: (v: unknown) => unknown, rej?: (v: unknown) => unknown) =>
    Promise.resolve(dbResult).then(res, rej);
  mockSupabaseClient.from.mockReturnValue(mockChain);
});

// ---------------------------------------------------------------------------
// GET /api/user/profile
// ---------------------------------------------------------------------------
describe("GET /api/user/profile", () => {
  it("returns 401 when unauthenticated", async () => {
    authFail();
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 200 with user profile data", async () => {
    authOk();
    dbResult.data = {
      id: "user-1",
      email: "user@example.com",
      full_name: "Test User",
    };
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual(dbResult.data);
  });

  it("scopes the query to the authenticated user's id", async () => {
    authOk();
    dbResult.data = { id: "user-1", full_name: "Test User" };
    await GET();
    expect(mockChain.eq).toHaveBeenCalledWith("id", "user-1");
  });

  it("returns 500 on database error", async () => {
    authOk();
    dbResult.error = { message: "DB error" };
    const res = await GET();
    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/user/profile
// ---------------------------------------------------------------------------
describe("PATCH /api/user/profile", () => {
  it("returns 401 when unauthenticated", async () => {
    authFail();
    const res = await PATCH(makeReq("PATCH", { full_name: "New Name" }));
    expect(res.status).toBe(401);
  });

  it("returns 200 with the updated profile", async () => {
    authOk();
    dbResult.data = { id: "user-1", full_name: "New Name" };
    const res = await PATCH(makeReq("PATCH", { full_name: "New Name" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual(dbResult.data);
  });

  it("strips the id field from the update payload", async () => {
    authOk();
    dbResult.data = { id: "user-1", full_name: "New Name" };
    await PATCH(makeReq("PATCH", { id: "injected-id", full_name: "New Name" }));
    // The update call should NOT include the id field
    expect(mockChain.update).toHaveBeenCalledWith(
      expect.not.objectContaining({ id: "injected-id" })
    );
  });

  it("returns 500 on database error", async () => {
    authOk();
    dbResult.error = { message: "Update failed" };
    const res = await PATCH(makeReq("PATCH", { full_name: "New Name" }));
    expect(res.status).toBe(500);
  });
});
