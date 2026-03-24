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

// Anon client mock
const mockSignIn = jest.fn();
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    auth: { signInWithPassword: mockSignIn },
  })),
}));

// Session client mock
const mockUpdateUser = jest.fn();
jest.mock("@supabase/auth-helpers-nextjs", () => ({
  createServerComponentClient: jest.fn(() => ({
    auth: { updateUser: mockUpdateUser },
  })),
}));

// Imports
import { POST } from "@/app/api/user/password/route";
import { requireAuth } from "@/lib/api-auth";

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;

// Helpers
const fakeSession = () => ({
  user: { id: "user-1", email: "user@example.com" },
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
function makeReq(body?: unknown) {
  return new NextRequest("http://localhost/api/user/password", {
    method: "POST",
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
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
});

// POST /api/user/password
describe("POST /api/user/password", () => {
  it("returns 401 when unauthenticated", async () => {
    authFail();
    const res = await POST(
      makeReq({ currentPassword: "old", newPassword: "new" }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 when currentPassword is missing", async () => {
    authOk();
    const res = await POST(makeReq({ newPassword: "new123" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/required/i);
  });

  it("returns 400 when newPassword is missing", async () => {
    authOk();
    const res = await POST(makeReq({ currentPassword: "old123" }));
    expect(res.status).toBe(400);
  });

  it("returns 401 when current password is incorrect", async () => {
    authOk();
    mockSignIn.mockResolvedValue({ error: { message: "Invalid credentials" } });
    const res = await POST(
      makeReq({ currentPassword: "wrong", newPassword: "new123" }),
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/incorrect/i);
  });

  it("returns 500 when updateUser fails", async () => {
    authOk();
    mockSignIn.mockResolvedValue({ error: null });
    mockUpdateUser.mockResolvedValue({ error: { message: "Update failed" } });
    const res = await POST(
      makeReq({ currentPassword: "old123", newPassword: "new123" }),
    );
    expect(res.status).toBe(500);
  });

  it("returns 200 on successful password change", async () => {
    authOk();
    mockSignIn.mockResolvedValue({ error: null });
    mockUpdateUser.mockResolvedValue({ error: null });
    const res = await POST(
      makeReq({ currentPassword: "old123", newPassword: "new123" }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("returns 500 when Supabase env vars are missing", async () => {
    authOk();
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const res = await POST(
      makeReq({ currentPassword: "old123", newPassword: "new123" }),
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/configuration/i);
  });

  it("returns 500 when session email is missing", async () => {
    mockRequireAuth.mockResolvedValue({
      session: {
        user: { id: "user-1", email: undefined },
        access_token: "tok",
      } as never,
      error: null,
    });
    const res = await POST(
      makeReq({ currentPassword: "old123", newPassword: "new123" }),
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/email/i);
  });
});
