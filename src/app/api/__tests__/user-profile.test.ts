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
jest.mock("@/lib/api-auth", () => ({
  requireAuth: jest.fn(),
  getRouteClient: jest.fn(),
}));

const dbResult: { data: unknown; error: unknown } = { data: null, error: null };
const mockChain: Record<string, jest.Mock> & { then?: unknown } = {};
for (const m of ["select", "update", "eq", "single"]) {
  mockChain[m] = jest.fn().mockReturnValue(mockChain);
}
mockChain.single = jest.fn(() => Promise.resolve(dbResult));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
mockChain.then = (res: any, rej?: any) =>
  Promise.resolve(dbResult).then(res, rej);

/**
 * The auth half of the client.
 *
 * PATCH writes the name twice — the `users` row, then the mirror on the sign-in
 * metadata — so the mock has to answer both. Its result is settable per test so
 * the half-done case can be exercised.
 */
const authResult: { error: unknown } = { error: null };
const mockUpdateUser = jest.fn(() => Promise.resolve(authResult));

const mockSupabaseClient = {
  from: jest.fn().mockReturnValue(mockChain),
  auth: { updateUser: mockUpdateUser },
};
jest.mock("@/utils/server", () => ({
  createClient: jest.fn(async () => mockSupabaseClient),
}));

// Imports
import { GET, PATCH } from "@/app/api/user/profile/route";
import { requireAuth, getRouteClient } from "@/lib/api-auth";

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockGetRouteClient = getRouteClient as jest.MockedFunction<
  typeof getRouteClient
>;

// Helpers
const fakeSession = (userId = "user-1") => ({
  user: { id: userId, email: "user@example.com" },
  access_token: "tok",
});

function authOk() {
  mockRequireAuth.mockResolvedValue({
    user: fakeSession().user as never,
    error: null,
  });
}
function authFail() {
  const { NextResponse } =
    jest.requireActual<typeof import("next/server")>("next/server");
  mockRequireAuth.mockResolvedValue({
    user: null,
    error: NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    ),
  });
}
function makeReq(method: string, body?: unknown) {
  return new NextRequest("http://localhost/api/user/profile", {
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
  mockGetRouteClient.mockResolvedValue(mockSupabaseClient as never);
  dbResult.data = null;
  dbResult.error = null;
  for (const m of ["select", "update", "eq"]) {
    mockChain[m].mockReturnValue(mockChain);
  }
  authResult.error = null;
  mockUpdateUser.mockImplementation(() => Promise.resolve(authResult));
  mockChain.single.mockImplementation(() => Promise.resolve(dbResult));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockChain.then = (res: any, rej?: any) =>
    Promise.resolve(dbResult).then(res, rej);
  mockSupabaseClient.from.mockReturnValue(mockChain);
});

// GET /api/user/profile
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

// PATCH /api/user/profile
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
    // id should not be updated
    expect(mockChain.update).toHaveBeenCalledWith(
      expect.not.objectContaining({ id: "injected-id" }),
    );
  });

  it("returns 500 on database error", async () => {
    authOk();
    dbResult.error = { message: "Update failed" };
    const res = await PATCH(makeReq("PATCH", { full_name: "New Name" }));
    expect(res.status).toBe(500);
  });

  // The name is held in two places: `users.full_name`, which every screen reads,
  // and `auth.user_metadata.full_name`, which the public top nav reads. Only the
  // first was ever written here, so renaming yourself left the two disagreeing.
  it("mirrors the name onto the sign-in metadata", async () => {
    authOk();
    dbResult.data = { id: "user-1", full_name: "New Name" };

    await PATCH(makeReq("PATCH", { full_name: "New Name" }));

    expect(mockUpdateUser).toHaveBeenCalledWith({
      data: { full_name: "New Name" },
    });
  });

  it("does not touch the metadata when the name is not being changed", async () => {
    authOk();
    dbResult.data = { id: "user-1", avatar_url: "/a.png" };

    await PATCH(makeReq("PATCH", { avatar_url: "/a.png" }));

    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  // The row is the source of truth and it saved, so the request succeeds. The
  // warning is what says the mirror is briefly behind — reporting this as a
  // failure would tell the user their rename did not happen when it did.
  it("still succeeds, with a warning, when only the mirror fails", async () => {
    authOk();
    dbResult.data = { id: "user-1", full_name: "New Name" };
    authResult.error = { message: "auth unavailable" };

    const res = await PATCH(makeReq("PATCH", { full_name: "New Name" }));

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data).toEqual(dbResult.data);
    expect(body.warning).toEqual(expect.any(String));
  });

  it("sends no warning when both writes land", async () => {
    authOk();
    dbResult.data = { id: "user-1", full_name: "New Name" };

    const body = await (
      await PATCH(makeReq("PATCH", { full_name: "New Name" }))
    ).json();

    expect(body.warning).toBeUndefined();
  });
});
