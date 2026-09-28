/** @jest-environment node */

import {
  DEFAULT_REMINDER_HOUR,
  DUE_TODAY_NOTIFICATION_ID,
  selectDueTodayReminders,
  summariseDueToday,
} from "@/lib/dueToday";
import type { Task } from "@/types/schema";

// Fixed reference point: 26 Sep 2026, 10:00 local time.
const NOW = new Date(2026, 8, 26, 10, 0, 0);

function task(overrides: Partial<Task> & { id: string }): Task {
  return {
    text: "A task",
    description: null,
    created_at: new Date(2026, 8, 1),
    due_date: null,
    is_completed: false,
    date_completed: null,
    is_deleted: false,
    collection_id: null,
    list_id: "list-1",
    is_pinned: false,
    user_id: "user-1",
    ...overrides,
  } as Task;
}

describe("selectDueTodayReminders — what qualifies", () => {
  it("includes a task due later today", () => {
    const t = task({ id: "a", due_date: new Date(2026, 8, 26, 13, 0) });
    const result = selectDueTodayReminders([t], NOW);

    expect(result).toHaveLength(1);
    expect(result[0].task.id).toBe("a");
    expect(result[0].fireAt).toEqual(new Date(2026, 8, 26, 13, 0));
  });

  it("excludes a task with no due date", () => {
    expect(
      selectDueTodayReminders([task({ id: "a", due_date: null })], NOW)
    ).toHaveLength(0);
  });

  it("excludes tomorrow", () => {
    const t = task({ id: "a", due_date: new Date(2026, 8, 27, 9, 0) });
    expect(selectDueTodayReminders([t], NOW)).toHaveLength(0);
  });

  it("excludes overdue tasks from previous days", () => {
    const t = task({ id: "a", due_date: new Date(2026, 8, 25, 13, 0) });
    expect(selectDueTodayReminders([t], NOW)).toHaveLength(0);
  });

  it("excludes a time earlier today that has already passed", () => {
    const t = task({ id: "a", due_date: new Date(2026, 8, 26, 8, 0) });
    expect(selectDueTodayReminders([t], NOW)).toHaveLength(0);
  });

  it("excludes completed tasks", () => {
    const t = task({
      id: "a",
      due_date: new Date(2026, 8, 26, 13, 0),
      is_completed: true,
    });
    expect(selectDueTodayReminders([t], NOW)).toHaveLength(0);
  });

  it("excludes deleted tasks", () => {
    const t = task({
      id: "a",
      due_date: new Date(2026, 8, 26, 13, 0),
      is_deleted: true,
    });
    expect(selectDueTodayReminders([t], NOW)).toHaveLength(0);
  });

  it("ignores an unparseable due date rather than throwing", () => {
    const t = task({ id: "a", due_date: new Date("nonsense") });
    expect(selectDueTodayReminders([t], NOW)).toHaveLength(0);
  });
});

describe("selectDueTodayReminders — when it fires", () => {
  it("moves a date-only due date to the default reminder hour", () => {
    const t = task({ id: "a", due_date: new Date(2026, 8, 26, 0, 0) });
    const result = selectDueTodayReminders([t], new Date(2026, 8, 26, 7, 0));

    expect(result).toHaveLength(1);
    expect(result[0].fireAt.getHours()).toBe(DEFAULT_REMINDER_HOUR);
  });

  it("drops a date-only task once the default hour has passed", () => {
    const t = task({ id: "a", due_date: new Date(2026, 8, 26, 0, 0) });
    // 10:00 is past the 09:00 default.
    expect(selectDueTodayReminders([t], NOW)).toHaveLength(0);
  });

  it("returns reminders in chronological order", () => {
    const later = task({ id: "later", due_date: new Date(2026, 8, 26, 18, 0) });
    const sooner = task({ id: "sooner", due_date: new Date(2026, 8, 26, 12, 0) });

    const result = selectDueTodayReminders([later, sooner], NOW);
    expect(result.map((r) => r.task.id)).toEqual(["sooner", "later"]);
  });

  it("never schedules in the past", () => {
    const tasks = [
      task({ id: "a", due_date: new Date(2026, 8, 26, 9, 59) }),
      task({ id: "b", due_date: new Date(2026, 8, 26, 10, 1) }),
    ];
    const result = selectDueTodayReminders(tasks, NOW);

    expect(result.map((r) => r.task.id)).toEqual(["b"]);
    expect(result.every((r) => r.fireAt > NOW)).toBe(true);
  });
});

describe("summariseDueToday — one notification, never one per task", () => {
  const at = (h: number, m = 0) => new Date(2026, 8, 26, h, m);

  it("returns null when nothing is due, so nothing is scheduled", () => {
    expect(summariseDueToday([])).toBeNull();
  });

  it("names the task when exactly one is due", () => {
    const reminders = selectDueTodayReminders(
      [task({ id: "a", text: "Pay the invoice", due_date: at(13) })],
      NOW
    );
    const summary = summariseDueToday(reminders);

    expect(summary).not.toBeNull();
    expect(summary!.count).toBe(1);
    expect(summary!.title).toBe("Pay the invoice");
  });

  it("collapses many tasks into a single counted notification", () => {
    const reminders = selectDueTodayReminders(
      [
        task({ id: "a", text: "One", due_date: at(13) }),
        task({ id: "b", text: "Two", due_date: at(15) }),
        task({ id: "c", text: "Three", due_date: at(17) }),
      ],
      NOW
    );
    const summary = summariseDueToday(reminders);

    expect(summary!.count).toBe(3);
    expect(summary!.title).toBe("3 tasks due today");
    // No task name leaks into a summary of several.
    expect(summary!.title).not.toMatch(/One|Two|Three/);
  });

  it("fires at the earliest thing due, not the latest", () => {
    const reminders = selectDueTodayReminders(
      [
        task({ id: "late", due_date: at(18) }),
        task({ id: "early", due_date: at(12) }),
      ],
      NOW
    );

    expect(summariseDueToday(reminders)!.fireAt).toEqual(at(12));
  });

  it("falls back to a usable title when the task has no text", () => {
    const reminders = selectDueTodayReminders(
      [task({ id: "a", text: null, due_date: at(13) })],
      NOW
    );

    expect(summariseDueToday(reminders)!.title).toBe("Task due today");
  });
});

describe("DUE_TODAY_NOTIFICATION_ID", () => {
  it("is a single fixed id, so rescheduling replaces rather than stacks", () => {
    expect(Number.isInteger(DUE_TODAY_NOTIFICATION_ID)).toBe(true);
    expect(DUE_TODAY_NOTIFICATION_ID).toBeGreaterThan(0);
    expect(DUE_TODAY_NOTIFICATION_ID).toBeLessThan(2_147_483_647);
  });
});
