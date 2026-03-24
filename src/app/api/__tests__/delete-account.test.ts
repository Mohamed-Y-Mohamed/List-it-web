/** @jest-environment node */

import { NextRequest } from "next/server";

// Mocks
jest.mock("next/headers", () => ({ cookies: jest.fn(() => ({})) }));

// Admin client mock
const mockAdminDeleteUser = jest.fn();
const mockAdminChain: Record<string, jest.Mock> & { then?: unknown } = {};
for (const m of ["delete", "eq"]) {
  mockAdminChain[m] = jest.fn().mockReturnValue(mockAdminChain);
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
mockAdminChain.then = (res: any, rej?: any) =>
  Promise.resolve({ error: null }).then(res, rej);

const mockAdminClient = {
  auth: { admin: { deleteUser: mockAdminDeleteUser } },
  from: jest.fn().mockReturnValue(mockAdminChain),
};

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => mockAdminClient),
}));

// Session client mock
const mockGetSession = jest.fn();
const mockSessionClient = {
  auth: { getSession: mockGetSession },
  from: jest.fn(),
};

jest.mock("@supabase/auth-helpers-nextjs", () => ({
  createServerComponentClient: jest.fn(() => mockSessionClient),
}));

// Imports
import { DELETE } from "@/app/api/delete-account/route";

// Helpers
function makeReq(body?: unknown) {
  return new NextRequest("http://localhost/api/delete-account", {
    method: "DELETE",
    ...(body
      ? {
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
        }
      : {}),
  });
}

function setSession(userId: string) {
  mockGetSession.mockResolvedValue({
    data: { session: { user: { id: userId }, access_token: "tok" } },
    error: null,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
  for (const m of ["delete", "eq"]) {
    mockAdminChain[m].mockReturnValue(mockAdminChain);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockAdminChain.then = (res: any, rej?: any) =>
    Promise.resolve({ error: null }).then(res, rej);
  mockAdminClient.from.mockReturnValue(mockAdminChain);
});

// Tests
describe("DELETE /api/delete-account", () => {
  it("returns 400 when userId is missing", async () => {
    const res = await DELETE(makeReq({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/user id/i);
  });

  it("returns 401 when there is no active session", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    const res = await DELETE(makeReq({ userId: "user-1" }));
    expect(res.status).toBe(401);
  });

  it("returns 403 when the session user does not match the userId", async () => {
    setSession("other-user");
    const res = await DELETE(makeReq({ userId: "user-1" }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/not authorized/i);
  });

  it("returns 500 when environment variables are missing", async () => {
    setSession("user-1");
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const res = await DELETE(makeReq({ userId: "user-1" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/configuration/i);
  });

  it("returns 500 when auth admin deleteUser fails", async () => {
    setSession("user-1");
    mockAdminDeleteUser.mockResolvedValue({
      error: { message: "Auth deletion error" },
    });
    const res = await DELETE(makeReq({ userId: "user-1" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("returns 200 on successful account deletion", async () => {
    setSession("user-1");
    mockAdminDeleteUser.mockResolvedValue({ error: null });
    const res = await DELETE(makeReq({ userId: "user-1" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
