/** @jest-environment node */

// What syncDueTodayNotifications actually does to the pending notification.
//
// dueToday.test.ts covers which tasks qualify. This covers the consequence of
// that decision reaching the scheduler — in particular that an empty task list
// cancels the pending reminder rather than leaving it to fire. A task ticked off
// is exactly what an empty list looks like, and the reminder surviving it was a
// real defect: useDueTodayNotifications used to return early on
// `tasks.length === 0`, so the cancel below never ran.

import type { Task } from "@/types/schema";

const schedule = jest.fn().mockResolvedValue(undefined);
const cancel = jest.fn().mockResolvedValue(undefined);
const createChannel = jest.fn().mockResolvedValue(undefined);
const checkPermissions = jest.fn().mockResolvedValue({ display: "granted" });
const requestPermissions = jest.fn().mockResolvedValue({ display: "granted" });

jest.mock("@capacitor/local-notifications", () => ({
  LocalNotifications: {
    schedule: (...args: unknown[]) => schedule(...args),
    cancel: (...args: unknown[]) => cancel(...args),
    createChannel: (...args: unknown[]) => createChannel(...args),
    checkPermissions: () => checkPermissions(),
    requestPermissions: () => requestPermissions(),
  },
}));

// Everything in notifications.ts is a no-op off-native, so the tests have to
// claim to be running inside the shell.
jest.mock("@/lib/platform", () => ({
  isNativeApp: () => true,
}));

import { DUE_TODAY_NOTIFICATION_ID } from "@/lib/dueToday";
import { syncDueTodayNotifications } from "@/lib/notifications";

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

beforeEach(() => {
  jest.clearAllMocks();
  checkPermissions.mockResolvedValue({ display: "granted" });
});

describe("syncDueTodayNotifications — an empty list still cancels", () => {
  it("cancels the pending reminder and schedules nothing when there are no tasks", async () => {
    const count = await syncDueTodayNotifications([], NOW);

    expect(count).toBe(0);
    expect(cancel).toHaveBeenCalledWith({
      notifications: [{ id: DUE_TODAY_NOTIFICATION_ID }],
    });
    expect(schedule).not.toHaveBeenCalled();
  });

  it("cancels without ever asking for permission when there is nothing to show", async () => {
    await syncDueTodayNotifications([], NOW);

    // The permission prompt is reserved for the intro and for a real reminder.
    // Firing it just to clear a notification would be asking for nothing.
    expect(checkPermissions).not.toHaveBeenCalled();
    expect(requestPermissions).not.toHaveBeenCalled();
  });

  it("cancels when the only task due today has been completed", async () => {
    const done = task({
      id: "a",
      due_date: new Date(2026, 8, 26, 13, 0),
      is_completed: true,
    });

    const count = await syncDueTodayNotifications([done], NOW);

    expect(count).toBe(0);
    expect(cancel).toHaveBeenCalled();
    expect(schedule).not.toHaveBeenCalled();
  });
});

describe("syncDueTodayNotifications — scheduling", () => {
  it("cancels before scheduling, so a re-sync replaces rather than stacks", async () => {
    const soon = task({ id: "a", due_date: new Date(2026, 8, 26, 13, 0) });

    await syncDueTodayNotifications([soon], NOW);

    expect(cancel).toHaveBeenCalledTimes(1);
    expect(schedule).toHaveBeenCalledTimes(1);
    expect(cancel.mock.invocationCallOrder[0]).toBeLessThan(
      schedule.mock.invocationCallOrder[0]
    );
  });

  it("schedules exactly one notification, at the earliest thing due", async () => {
    const later = task({ id: "b", due_date: new Date(2026, 8, 26, 17, 0) });
    const earlier = task({ id: "a", due_date: new Date(2026, 8, 26, 13, 0) });

    const count = await syncDueTodayNotifications([later, earlier], NOW);

    expect(count).toBe(2);
    const [[payload]] = schedule.mock.calls as [[{ notifications: unknown[] }]];
    expect(payload.notifications).toHaveLength(1);

    const notification = payload.notifications[0] as {
      id: number;
      schedule: { at: Date };
      title: string;
    };
    expect(notification.id).toBe(DUE_TODAY_NOTIFICATION_ID);
    expect(notification.schedule.at).toEqual(new Date(2026, 8, 26, 13, 0));
    expect(notification.title).toContain("2");
  });

  it("never asks Android for an exact alarm", async () => {
    const soon = task({ id: "a", due_date: new Date(2026, 8, 26, 13, 0) });

    await syncDueTodayNotifications([soon], NOW);

    // allowWhileIdle would require SCHEDULE_EXACT_ALARM, which Play restricts to
    // alarm clocks and calendars and which is stripped from the manifest.
    const [[payload]] = schedule.mock.calls as [
      [{ notifications: Record<string, unknown>[] }],
    ];
    expect(payload.notifications[0].allowWhileIdle).toBeUndefined();
    expect(payload.notifications[0].repeats).toBeUndefined();
  });

  it("schedules nothing when permission is refused", async () => {
    checkPermissions.mockResolvedValue({ display: "denied" });
    const soon = task({ id: "a", due_date: new Date(2026, 8, 26, 13, 0) });

    const count = await syncDueTodayNotifications([soon], NOW);

    expect(count).toBe(0);
    // Still cancelled: a stale reminder must not outlive a withdrawn permission.
    expect(cancel).toHaveBeenCalled();
    expect(schedule).not.toHaveBeenCalled();
  });
});
