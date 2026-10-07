/**
 * @jest-environment node
 */
// Per-task reminders: when they fire and what id they schedule under.
//
// The id cases carry the most weight. The code this replaces used one fixed
// notification id, so rescheduling replaced the pending reminder for free and no
// two reminders could ever collide. Neither is true now: an id that is not stable
// stacks duplicates on every resync, and one that is not unique silently
// overwrites another task's reminder.

import {
  DEFAULT_DUE_HOUR,
  MAX_REMINDERS_PER_TASK,
  describeReminders,
  dueMoment,
  newReminderId,
  notificationId,
  parseReminders,
  reminderFireAt,
} from "@/lib/reminders";

const at = (y: number, m: number, d: number, h = 12, min = 0) =>
  new Date(y, m - 1, d, h, min, 0, 0);

describe("parseReminders", () => {
  it("keeps well-formed entries of both kinds", () => {
    expect(
      parseReminders([
        { id: "a", kind: "offset", minutes: 60 },
        { id: "b", kind: "absolute", at: "2026-03-06T09:00:00.000Z" },
      ])
    ).toHaveLength(2);
  });

  it("drops entries it cannot schedule", () => {
    expect(
      parseReminders([
        null,
        "nope",
        { kind: "offset", minutes: 60 },           // no id
        { id: "", kind: "offset", minutes: 60 },   // empty id
        { id: "c", kind: "offset" },               // no minutes
        { id: "d", kind: "offset", minutes: -5 },  // negative
        { id: "e", kind: "offset", minutes: NaN },
        { id: "f", kind: "absolute", at: "not a date" },
        { id: "g", kind: "weekly" },               // unknown kind
      ])
    ).toEqual([]);
  });

  it("drops a duplicate id rather than scheduling it twice", () => {
    // Two entries sharing an id hash to the same notification, so the second
    // would silently replace the first.
    const parsed = parseReminders([
      { id: "a", kind: "offset", minutes: 60 },
      { id: "a", kind: "offset", minutes: 120 },
    ]);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toEqual({ id: "a", kind: "offset", minutes: 60 });
  });

  it("is empty for anything that is not an array", () => {
    expect(parseReminders(null)).toEqual([]);
    expect(parseReminders(undefined)).toEqual([]);
    expect(parseReminders({ id: "a" })).toEqual([]);
  });
});

describe("dueMoment", () => {
  it("reads a date-only due date as 9am local", () => {
    // Stored at UTC noon as a marker rather than a real instant, so the hour has
    // to come from somewhere — this is the convention the due-today reminder used.
    const due = dueMoment({ due_date: "2026-03-06T12:00:00.000Z", due_has_time: false });
    expect(due?.getHours()).toBe(DEFAULT_DUE_HOUR);
    expect(due?.getMinutes()).toBe(0);
  });

  it("uses the real time once one is set", () => {
    const stamp = at(2026, 3, 6, 17, 30);
    const due = dueMoment({ due_date: stamp, due_has_time: true });
    expect(due).toEqual(stamp);
  });

  it("is null without a due date, or with an unparseable one", () => {
    expect(dueMoment({ due_date: null })).toBeNull();
    expect(dueMoment({ due_date: "whenever" })).toBeNull();
  });
});

describe("reminderFireAt", () => {
  it("counts an offset back from the due moment", () => {
    const due = at(2026, 3, 6, 17);
    expect(reminderFireAt({ id: "a", kind: "offset", minutes: 60 }, due)).toEqual(
      at(2026, 3, 6, 16)
    );
    expect(reminderFireAt({ id: "a", kind: "offset", minutes: 60 * 24 }, due)).toEqual(
      at(2026, 3, 5, 17)
    );
  });

  it("fires at the due moment itself for a zero offset", () => {
    const due = at(2026, 3, 6, 17);
    expect(reminderFireAt({ id: "a", kind: "offset", minutes: 0 }, due)).toEqual(due);
  });

  it("has nothing to count back from without a due date", () => {
    expect(reminderFireAt({ id: "a", kind: "offset", minutes: 60 }, null)).toBeNull();
  });

  it("ignores the due date entirely for an absolute reminder", () => {
    // Which is what makes it the only kind settable on an undated task.
    const fire = reminderFireAt(
      { id: "a", kind: "absolute", at: at(2026, 3, 1, 8).toISOString() },
      null
    );
    expect(fire).toEqual(at(2026, 3, 1, 8));
  });
});

describe("notificationId", () => {
  it("is stable for the same task and reminder", () => {
    // If this drifted, every resync would stack a duplicate instead of replacing.
    expect(notificationId("task-1", "r1")).toBe(notificationId("task-1", "r1"));
  });

  it("differs across reminders on one task and across tasks", () => {
    expect(notificationId("task-1", "r1")).not.toBe(notificationId("task-1", "r2"));
    expect(notificationId("task-1", "r1")).not.toBe(notificationId("task-2", "r1"));
  });

  it("stays inside the 32-bit range the plugin accepts", () => {
    const ids = [
      notificationId("8f14e45f-ceea-467a-9575-0b4b3ba7a5f1", "r1"),
      notificationId("", ""),
      notificationId("z".repeat(200), "r".repeat(50)),
    ];
    for (const id of ids) {
      expect(Number.isInteger(id)).toBe(true);
      expect(id).toBeGreaterThanOrEqual(0);
      expect(id).toBeLessThan(2_147_483_647);
    }
  });

  it("does not collide across a realistic number of reminders", () => {
    // 200 tasks with the cap each. A collision here is one reminder silently
    // replacing another, which is invisible until someone misses something.
    const ids = new Set<number>();
    for (let t = 0; t < 200; t++) {
      for (let r = 0; r < MAX_REMINDERS_PER_TASK; r++) {
        ids.add(notificationId(`task-${t}`, `r${r}`));
      }
    }
    expect(ids.size).toBe(200 * MAX_REMINDERS_PER_TASK);
  });
});

describe("newReminderId", () => {
  it("does not repeat itself in a burst", () => {
    const ids = new Set(Array.from({ length: 500 }, newReminderId));
    expect(ids.size).toBe(500);
  });
});

describe("describeReminders", () => {
  it("summarises the collapsed row", () => {
    expect(describeReminders([])).toBe("None");
    expect(describeReminders([{ id: "a", kind: "offset", minutes: 60 }])).toBe("1 hour before");
    expect(
      describeReminders([
        { id: "a", kind: "offset", minutes: 60 },
        { id: "b", kind: "offset", minutes: 120 },
      ])
    ).toBe("2 reminders");
  });
});
