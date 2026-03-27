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

// Imports
import { DELETE } from "@/app/api/delete-account/route";
import { requireAuth } from "@/lib/api-auth";

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;

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

const fakeSession = (userId = "user-1") => ({
  user: { id: userId, email: "a@b.com" },
  access_token: "tok",
});

function authOk(userId = "user-1") {
  mockRequireAuth.mockResolvedValue({
    session: fakeSession(userId) as never,
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
  it("returns 401 when there is no active session", async () => {
    authFail();
    const res = await DELETE(makeReq());
    expect(res.status).toBe(401);
  });

  it("returns 500 when environment variables are missing", async () => {
    authOk("user-1");
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const res = await DELETE(makeReq());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/configuration/i);
  });

  it("returns 500 when auth admin deleteUser fails", async () => {
    authOk("user-1");
    mockAdminDeleteUser.mockResolvedValue({
      error: { message: "Auth deletion error" },
    });
    const res = await DELETE(makeReq());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("returns 200 on successful account deletion", async () => {
    authOk("user-1");
    mockAdminDeleteUser.mockResolvedValue({ error: null });
    const res = await DELETE(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("deletes database records before deleting the auth user", async () => {
    authOk("user-1");
    const callOrder: string[] = [];
    mockAdminClient.from.mockImplementation(() => {
      callOrder.push("db");
      return mockAdminChain;
    });
    mockAdminDeleteUser.mockImplementation(async () => {
      callOrder.push("auth");
      return { error: null };
    });
    await DELETE(makeReq());
    // DB deletions (5 tables via Promise.all) should all appear before auth deletion
    expect(callOrder.indexOf("db")).toBeLessThan(callOrder.indexOf("auth"));
  });
});
