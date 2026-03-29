/** @jest-environment node */

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
for (const m of ["select", "eq", "order", "limit"]) {
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
import { GET } from "@/app/api/colors_retriever/route";
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

beforeEach(() => {
  jest.clearAllMocks();
  dbResult.data = null;
  dbResult.error = null;
  for (const m of ["select", "eq", "order", "limit"]) {
    mockChain[m].mockReturnValue(mockChain);
  }
  mockChain.single.mockImplementation(() => Promise.resolve(dbResult));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockChain.then = (res: any, rej?: any) =>
    Promise.resolve(dbResult).then(res, rej);
  mockSupabaseClient.from.mockReturnValue(mockChain);
});

// GET /api/colors_retriever
describe("GET /api/colors_retriever", () => {
  it("returns 401 when unauthenticated", async () => {
    authFail();
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 200 with color list when authenticated", async () => {
    authOk();
    dbResult.data = [
      { id: 1, color_hex: "#FF3B30", color_name: "Red" },
      { id: 2, color_hex: "#007AFF", color_name: "Blue" },
    ];
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(2);
    expect(body.data[0]).toMatchObject({
      color_hex: "#FF3B30",
      color_name: "Red",
    });
    expect(body.data[1]).toMatchObject({
      color_hex: "#007AFF",
      color_name: "Blue",
    });
  });

  it("returns 200 with an empty array when the table has no rows", async () => {
    authOk();
    dbResult.data = [];
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([]);
  });

  it("returns 500 when the database returns an error", async () => {
    authOk();
    dbResult.error = { message: "DB error" };
    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("DB error");
  });

  it("queries the app_settings table ordered by id ascending", async () => {
    authOk();
    dbResult.data = [];
    await GET();
    expect(mockSupabaseClient.from).toHaveBeenCalledWith("app_settings");
    expect(mockChain.select).toHaveBeenCalledWith("*");
    expect(mockChain.order).toHaveBeenCalledWith("id", { ascending: true });
  });
});
