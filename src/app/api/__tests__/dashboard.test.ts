/**
 * @jest-environment node
 *
 * Unit tests for GET /api/dashboard
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
jest.mock("next/headers", () => ({ cookies: jest.fn(() => ({})) }));
jest.mock("@/lib/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("@/lib/api-auth", () => ({ requireAuth: jest.fn() }));

// Supabase chainable mock.
// The dashboard uses Promise.allSettled over several count queries, then
// awaits a priority-task query. All use the same mock chain.
const dbResult: { data: unknown; error: unknown; count: number } = {
  data: [],
  error: null,
  count: 0,
};
const mockChain: Record<string, jest.Mock> & { then?: unknown } = {};
for (const m of [
  "select", "insert", "update", "delete",
  "eq", "in", "lt", "gte", "lte", "order", "limit",
]) {
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
import { GET } from "@/app/api/dashboard/route";
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

beforeEach(() => {
  jest.clearAllMocks();
  dbResult.data = [];
  dbResult.error = null;
  dbResult.count = 0;
  for (const m of [
    "select", "insert", "update", "delete",
    "eq", "in", "lt", "gte", "lte", "order", "limit",
  ]) {
    mockChain[m].mockReturnValue(mockChain);
  }
  mockChain.single.mockImplementation(() => Promise.resolve(dbResult));
  mockChain.then = (res: (v: unknown) => unknown, rej?: (v: unknown) => unknown) =>
    Promise.resolve(dbResult).then(res, rej);
  mockSupabaseClient.from.mockReturnValue(mockChain);
});

// ---------------------------------------------------------------------------
// GET /api/dashboard
// ---------------------------------------------------------------------------
describe("GET /api/dashboard", () => {
  it("returns 401 when unauthenticated", async () => {
    authFail();
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 200 with stats and priorityTasks", async () => {
    authOk();
    dbResult.count = 5;
    dbResult.data = [{ id: "t1", text: "Priority task", is_pinned: true }];

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty("stats");
    expect(body).toHaveProperty("priorityTasks");

    const { stats } = body;
    expect(typeof stats.total).toBe("number");
    expect(typeof stats.completed).toBe("number");
    expect(typeof stats.pending).toBe("number");
    expect(typeof stats.overdue).toBe("number");
    expect(typeof stats.dueToday).toBe("number");
    expect(typeof stats.completionRate).toBe("number");
    expect(typeof stats.todayCompleted).toBe("number");
    expect(typeof stats.todayCreated).toBe("number");
  });

  it("returns 200 with completionRate=100 when all tasks completed", async () => {
    authOk();
    // total=10, completed=10 → rate=100%
    dbResult.count = 10;
    dbResult.data = [];
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    // completionRate is computed from count values; all counts are 10
    // completed(10) / total(10) = 100
    expect(body.stats.completionRate).toBe(100);
  });

  it("returns 200 with completionRate=0 when no tasks exist", async () => {
    authOk();
    dbResult.count = 0;
    dbResult.data = [];
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.stats.completionRate).toBe(0);
  });

  it("returns 200 and falls back to empty priorityTasks on partial db failure", async () => {
    authOk();
    // The dashboard uses Promise.allSettled so partial failures don't crash it
    dbResult.count = 0;
    dbResult.data = null;
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.priorityTasks)).toBe(true);
  });
});
