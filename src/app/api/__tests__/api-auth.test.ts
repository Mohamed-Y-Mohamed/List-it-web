/** @jest-environment node */

import { NextResponse } from "next/server";

const mockHeaderStore: { authorization: string | null } = { authorization: null };

jest.mock("next/headers", () => ({
  cookies: jest.fn(() => ({})),
  headers: jest.fn(async () => ({
    get: (name: string) =>
      name.toLowerCase() === "authorization" ? mockHeaderStore.authorization : null,
  })),
}));

/**
 * `getUser`, not `getSession`. A session is handed back out of the cookie
 * unverified, so the server would be trusting whatever the browser sent.
 */
const mockCookieClient = {
  auth: {
    getUser: jest.fn(async () => ({ data: { user: null }, error: null })),
  },
};

jest.mock("@/utils/server", () => ({
  createClient: jest.fn(async () => mockCookieClient),
}));

const mockGetUser = jest.fn();
const mockCreateClient = jest.fn(() => ({ auth: { getUser: mockGetUser } }));

jest.mock("@supabase/supabase-js", () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...(args as [])),
}));

// Import after mocks
import { requireAuth, getRouteClient } from "@/lib/api-auth";

const BEARER_USER = { id: "user-bearer", email: "native@example.com" };
const COOKIE_USER = { id: "user-cookie", email: "web@example.com" };

beforeEach(() => {
  jest.clearAllMocks();
  mockHeaderStore.authorization = null;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  mockCookieClient.auth.getUser.mockResolvedValue({
    data: { user: null },
    error: null,
  });
});

describe("requireAuth — cookie path (web)", () => {
  it("returns the user when a cookie session exists", async () => {
    mockCookieClient.auth.getUser.mockResolvedValueOnce({
      data: { user: COOKIE_USER },
      error: null,
    } as never);

    const result = await requireAuth();

    expect(result.error).toBeNull();
    expect(result.user).toEqual(COOKIE_USER);
    // A cookie session must never trigger a bearer verification round-trip.
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("falls through to the bearer path when no cookie session exists", async () => {
    // `getUser` reports a missing session as an error rather than an empty
    // result. Treating that as a failure would 500 every native request, which
    // never carries a cookie — it has to fall through to the token instead.
    mockCookieClient.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: Object.assign(new Error("Auth session missing!"), {
        name: "AuthSessionMissingError",
        status: 400,
      }),
    } as never);

    mockHeaderStore.authorization = "Bearer valid-token";
    mockGetUser.mockResolvedValueOnce({
      data: { user: BEARER_USER },
      error: null,
    });

    const result = await requireAuth();

    expect(result.error).toBeNull();
    expect(result.user).toEqual(BEARER_USER);
  });

  it("returns 500 when the auth server itself fails", async () => {
    mockCookieClient.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: Object.assign(new Error("boom"), { status: 503 }),
    } as never);

    const result = await requireAuth();

    expect(result.user).toBeNull();
    expect((result.error as NextResponse).status).toBe(500);
  });

  it("returns 500 when getUser throws", async () => {
    mockCookieClient.auth.getUser.mockRejectedValueOnce(
      new Error("network error")
    );

    const result = await requireAuth();

    expect(result.user).toBeNull();
    expect((result.error as NextResponse).status).toBe(500);
  });
});

describe("requireAuth — bearer path (native)", () => {
  it("returns 401 when there is neither a cookie session nor a bearer token", async () => {
    const result = await requireAuth();

    expect(result.user).toBeNull();
    expect(result.error).toBeInstanceOf(NextResponse);
    const body = await (result.error as NextResponse).json();
    expect(body.error).toMatch(/authentication required/i);
    expect((result.error as NextResponse).status).toBe(401);
  });

  it("returns the user for a valid bearer token", async () => {
    mockHeaderStore.authorization = "Bearer valid-token";
    mockGetUser.mockResolvedValueOnce({ data: { user: BEARER_USER }, error: null });

    const result = await requireAuth();

    expect(result.error).toBeNull();
    expect(result.user).toEqual(BEARER_USER);
    // The token must be verified against Supabase, not merely decoded.
    expect(mockGetUser).toHaveBeenCalledWith("valid-token");
  });

  it("accepts a lowercase bearer scheme", async () => {
    mockHeaderStore.authorization = "bearer valid-token";
    mockGetUser.mockResolvedValueOnce({ data: { user: BEARER_USER }, error: null });

    const result = await requireAuth();

    expect(result.user).toEqual(BEARER_USER);
  });

  it("returns 401 when the bearer token is rejected by Supabase", async () => {
    mockHeaderStore.authorization = "Bearer expired-token";
    mockGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error("jwt expired"),
    });

    const result = await requireAuth();

    expect(result.user).toBeNull();
    expect((result.error as NextResponse).status).toBe(401);
  });

  it("returns 401 for a non-bearer authorization scheme", async () => {
    mockHeaderStore.authorization = "Basic dXNlcjpwYXNz";

    const result = await requireAuth();

    expect(result.user).toBeNull();
    expect((result.error as NextResponse).status).toBe(401);
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("returns 401 when the bearer scheme carries no token", async () => {
    mockHeaderStore.authorization = "Bearer ";

    const result = await requireAuth();

    expect(result.user).toBeNull();
    expect((result.error as NextResponse).status).toBe(401);
    expect(mockGetUser).not.toHaveBeenCalled();
  });
});

describe("getRouteClient", () => {
  it("returns the cookie-scoped client when no bearer token is present", async () => {
    const client = await getRouteClient();

    expect(client).toBe(mockCookieClient);
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it("forwards the bearer token so row-level security sees the real user", async () => {
    mockHeaderStore.authorization = "Bearer valid-token";

    await getRouteClient();

    expect(mockCreateClient).toHaveBeenCalledWith(
      "https://project.supabase.co",
      "anon-key",
      expect.objectContaining({
        global: { headers: { Authorization: "Bearer valid-token" } },
      })
    );
  });
});

// logger tests
describe("logger", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    // Reset env
    Object.defineProperty(process.env, "NODE_ENV", {
      value: originalEnv,
      writable: true,
    });
    jest.restoreAllMocks();
  });

  it("calls console.error in production", () => {
    Object.defineProperty(process.env, "NODE_ENV", {
      value: "production",
      writable: true,
    });
    // Load with prod env
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { logger } = require("@/lib/logger");
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    logger.error("boom");
    expect(spy).toHaveBeenCalled();
  });

  it("suppresses debug/info/warn in production", () => {
    Object.defineProperty(process.env, "NODE_ENV", {
      value: "production",
      writable: true,
    });
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { logger } = require("@/lib/logger");
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    logger.debug("debug msg");
    logger.info("info msg");
    logger.warn("warn msg");
    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
