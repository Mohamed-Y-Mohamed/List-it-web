// The pure rules the six task screens share: what order tasks come out in, and
// how "today" is decided.
//
// These were copy-pasted per screen, so nothing guaranteed they agreed. The
// ordering in particular is easy to get subtly wrong — the original compared
// `is_pinned` with two separate branches, and a screen that dropped one of them
// would sort almost right, which is the hardest kind of wrong to spot.

import { isSameLocalDay, sortTasks, toPostgresDate } from "../taskView";
import type { TaskRow } from "@/types/taskView";

function task(overrides: Partial<TaskRow> & { id: string }): TaskRow {
  return {
    text: "A task",
    description: null,
    created_at: "2026-09-01T09:00:00.000Z",
    due_date: null,
    is_completed: false,
    date_completed: null,
    is_pinned: false,
    collection_id: null,
    list_id: null,
    user_id: "u1",
    ...overrides,
  };
}

describe("sortTasks", () => {
  it("puts pinned tasks first", () => {
    const order = sortTasks([
      task({ id: "plain" }),
      task({ id: "pinned", is_pinned: true }),
    ]).map((t) => t.id);

    expect(order).toEqual(["pinned", "plain"]);
  });

  it("puts tasks with a due date above those without", () => {
    const order = sortTasks([
      task({ id: "undated" }),
      task({ id: "dated", due_date: "2026-12-01T00:00:00.000Z" }),
    ]).map((t) => t.id);

    expect(order).toEqual(["dated", "undated"]);
  });

  it("orders dated tasks soonest first", () => {
    const order = sortTasks([
      task({ id: "later", due_date: "2026-12-01T00:00:00.000Z" }),
      task({ id: "sooner", due_date: "2026-10-01T00:00:00.000Z" }),
    ]).map((t) => t.id);

    expect(order).toEqual(["sooner", "later"]);
  });

  it("falls back to oldest-created for undated tasks", () => {
    const order = sortTasks([
      task({ id: "new", created_at: "2026-09-20T09:00:00.000Z" }),
      task({ id: "old", created_at: "2026-09-02T09:00:00.000Z" }),
    ]).map((t) => t.id);

    expect(order).toEqual(["old", "new"]);
  });

  it("ranks pinned above due date", () => {
    // A pinned task with no date still beats an unpinned one due tomorrow.
    const order = sortTasks([
      task({ id: "due-soon", due_date: "2026-09-30T00:00:00.000Z" }),
      task({ id: "pinned-undated", is_pinned: true }),
    ]).map((t) => t.id);

    expect(order).toEqual(["pinned-undated", "due-soon"]);
  });

  it("does not mutate the array it is given", () => {
    const input = [task({ id: "a" }), task({ id: "b", is_pinned: true })];
    sortTasks(input);
    expect(input.map((t) => t.id)).toEqual(["a", "b"]);
  });
});

describe("isSameLocalDay", () => {
  const day = new Date(2026, 8, 29); // 29 Sep 2026, local midnight

  it("matches a timestamp on that day", () => {
    expect(isSameLocalDay(new Date(2026, 8, 29, 17, 30).toISOString(), day)).toBe(
      true
    );
  });

  it("rejects the day before", () => {
    expect(isSameLocalDay(new Date(2026, 8, 28, 23, 59).toISOString(), day)).toBe(
      false
    );
  });

  it("treats a missing due date as no match", () => {
    expect(isSameLocalDay(null, day)).toBe(false);
  });

  it("survives an unparseable date instead of throwing", () => {
    // A screen must not die on one bad row.
    expect(isSameLocalDay("not a date", day)).toBe(false);
  });
});

describe("toPostgresDate", () => {
  it("formats as yyyy-mm-dd with padding", () => {
    expect(toPostgresDate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("uses local date parts, not UTC", () => {
    // Late evening local time can already be tomorrow in UTC. Overdue compares
    // against this string, so using UTC here would hide or reveal a day's tasks.
    const lateEvening = new Date(2026, 8, 29, 23, 30);
    expect(toPostgresDate(lateEvening)).toBe("2026-09-29");
  });
});
