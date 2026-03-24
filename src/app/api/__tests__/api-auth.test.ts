/**
 * @jest-environment node
 *
 * Unit tests for the API route helper: lib/api-auth.ts
 * and spot-checks for each route's auth guard.
 *
 * Supabase and Next.js internals are fully mocked so no real network calls
 * are made.
 */

import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Mock next/headers (cookies) — required by createServerComponentClient
// ---------------------------------------------------------------------------
jest.mock("next/headers", () => ({ cookies: jest.fn(() => ({})) }));

// ---------------------------------------------------------------------------
// Factory for a fake Supabase client returned by createServerComponentClient.
// Tests mutate `mockSession` to control what getSession returns.
// ---------------------------------------------------------------------------
const mockSession: { value: { session: unknown; error: unknown } } = {
  value: { session: null, error: null },
};

const mockSupabaseClient = {
  auth: {
    getSession: jest.fn(async () => ({ data: mockSession.value, error: null })),
  },
};

jest.mock("@supabase/auth-helpers-nextjs", () => ({
  createServerComponentClient: jest.fn(() => mockSupabaseClient),
}));

// ---------------------------------------------------------------------------
// Import SUT after mocks are registered
// ---------------------------------------------------------------------------
import { requireAuth } from "@/lib/api-auth";

// ---------------------------------------------------------------------------
// Helper: make a fake authenticated session
// ---------------------------------------------------------------------------
function fakeSession(userId = "user-123") {
  return { user: { id: userId }, access_token: "tok" };
}

// ---------------------------------------------------------------------------
// Tests: requireAuth
// ---------------------------------------------------------------------------
describe("requireAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns a 401 NextResponse when there is no session", async () => {
    mockSession.value = { session: null, error: null };
    mockSupabaseClient.auth.getSession.mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    const result = await requireAuth();

    expect(result.session).toBeNull();
    expect(result.error).toBeInstanceOf(NextResponse);
    const body = await (result.error as NextResponse).json();
    expect(body.error).toMatch(/authentication required/i);
    expect((result.error as NextResponse).status).toBe(401);
  });

  it("returns the session when authenticated", async () => {
    const session = fakeSession();
    mockSupabaseClient.auth.getSession.mockResolvedValueOnce({
      data: { session },
      error: null,
    });

    const result = await requireAuth();

    expect(result.error).toBeNull();
    expect(result.session).toEqual(session);
  });

  it("returns a 500 NextResponse when getSession throws", async () => {
    mockSupabaseClient.auth.getSession.mockRejectedValueOnce(
      new Error("network error")
    );

    const result = await requireAuth();

    expect(result.session).toBeNull();
    expect(result.error).toBeInstanceOf(NextResponse);
    expect((result.error as NextResponse).status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// Tests: logger (lib/logger.ts)
// ---------------------------------------------------------------------------
describe("logger", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    // Restore NODE_ENV
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
    // Re-import to pick up new env
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

  it("logs all levels in development", () => {
    Object.defineProperty(process.env, "NODE_ENV", {
      value: "development",
      writable: true,
    });
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { logger } = require("@/lib/logger");
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    logger.debug("d");
    logger.info("i");
    expect(logSpy).toHaveBeenCalledTimes(2);
  });
});
