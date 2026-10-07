/**
 * @jest-environment node
 */
// Per-task reminder scheduling.
//
// Most of this is ported rather than new. The due-today scheduler this replaces
// pinned four behaviours that are still right and still easy to lose: cancel
// before schedule, never schedule in the past, a refused permission still
// cancels, and no repeats.
//
// A fifth pinned behaviour was wrong and is now inverted. It asserted that
// allowWhileIdle was never sent, on the belief that it needed the exact-alarm
// permission the manifest strips. It does not, and going without it meant every
// reminder went out as a non-waking alarm that Doze was free to hold — so none
// of them arrived. The replacement test pins the opposite.
//
// What is genuinely new is reconciliation. The old code used one fixed id, so
// rescheduling replaced the pending notification for free and nothing could ever
// be orphaned. Ids vary per reminder now, so a task deleted on another device
// leaves its notification queued unless something goes and cancels it.

const schedule = jest.fn();
const cancel = jest.fn();
const getPending = jest.fn();
const createChannel = jest.fn();
const checkPermissions = jest.fn();
const requestPermissions = jest.fn();

jest.mock("@capacitor/local-notifications", () => ({
  LocalNotifications: {
    schedule: (...args: unknown[]) => schedule(...args),
    cancel: (...args: unknown[]) => cancel(...args),
    getPending: (...args: unknown[]) => getPending(...args),
    createChannel: (...args: unknown[]) => createChannel(...args),
    checkPermissions: (...args: unknown[]) => checkPermissions(...args),
    requestPermissions: (...args: unknown[]) => requestPermissions(...args),
  },
}));

jest.mock("@/lib/platform", () => ({
  isNativeApp: () => true,
  IS_NATIVE_BUILD: true,
}));

const readNotificationPrefs = jest.fn();
jest.mock("@/lib/notificationPrefs", () => ({
  readNotificationPrefs: () => readNotificationPrefs(),
}));

import { planReminders, syncTaskReminders } from "@/lib/notifications";
import { notificationId } from "@/lib/reminders";
import type { Task } from "@/types/schema";

const NOW = new Date(2026, 2, 6, 10, 0, 0);

function task(overrides: Partial<Task> & { id: string }): Task {
  return {
    text: "A task",
    description: null,
    created_at: NOW,
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

/** Due 17:00 today with a reminder an hour before, so it fires at 16:00. */
const hourBefore = (id: string) =>
  task({
    id,
    due_date: new Date(2026, 2, 6, 17, 0, 0),
    due_has_time: true,
    reminders: [{ id: "r1", kind: "offset", minutes: 60 }],
  });

beforeEach(() => {
  schedule.mockReset().mockResolvedValue(undefined);
  cancel.mockReset().mockResolvedValue(undefined);
  getPending.mockReset().mockResolvedValue({ notifications: [] });
  createChannel.mockReset().mockResolvedValue(undefined);
  checkPermissions.mockReset().mockResolvedValue({ display: "granted" });
  requestPermissions.mockReset().mockResolvedValue({ display: "granted" });
  readNotificationPrefs.mockReset().mockReturnValue({ remindersEnabled: true });
});

describe("planReminders", () => {
  it("expands a task into one entry per reminder", () => {
    const planned = planReminders(
      [
        task({
          id: "t1",
          due_date: new Date(2026, 2, 6, 17, 0, 0),
          due_has_time: true,
          reminders: [
            { id: "r1", kind: "offset", minutes: 60 },
            { id: "r2", kind: "offset", minutes: 120 },
          ],
        }),
      ],
      NOW
    );
    expect(planned).toHaveLength(2);
    expect(new Set(planned.map((p) => p.id)).size).toBe(2);
  });

  it("never plans anything already past", () => {
    // Due in an hour, reminder set two hours before. That moment has gone.
    const planned = planReminders(
      [
        task({
          id: "t1",
          due_date: new Date(2026, 2, 6, 11, 0, 0),
          due_has_time: true,
          reminders: [{ id: "r1", kind: "offset", minutes: 120 }],
        }),
      ],
      NOW
    );
    expect(planned).toEqual([]);
  });

  it("skips completed and deleted tasks", () => {
    const planned = planReminders(
      [
        { ...hourBefore("t1"), is_completed: true },
        { ...hourBefore("t2"), is_deleted: true },
      ],
      NOW
    );
    expect(planned).toEqual([]);
  });

  it("orders soonest first and caps the queue", () => {
    const many = Array.from({ length: 200 }, (_, i) =>
      task({
        id: `t${i}`,
        due_date: new Date(2026, 2, 7 + i, 17, 0, 0),
        due_has_time: true,
        reminders: [{ id: "r1", kind: "offset", minutes: 60 }],
      })
    );
    const planned = planReminders(many, NOW);

    expect(planned.length).toBeLessThanOrEqual(60);
    const times = planned.map((p) => p.fireAt.getTime());
    expect([...times].sort((a, b) => a - b)).toEqual(times);
  });

  it("carries the task and list on each entry, for the tap handler", () => {
    const [planned] = planReminders([hourBefore("t1")], NOW);
    expect(planned.taskId).toBe("t1");
    expect(planned.listId).toBe("list-1");
  });

  it("uses a stable id so a resync replaces rather than stacks", () => {
    const [first] = planReminders([hourBefore("t1")], NOW);
    expect(first.id).toBe(notificationId("t1", "r1"));
  });
});

describe("syncTaskReminders", () => {
  it("schedules what is planned, on the reminder channel", async () => {
    const count = await syncTaskReminders([hourBefore("t1")], NOW);

    expect(count).toBe(1);
    const [[payload]] = schedule.mock.calls;
    expect(payload.notifications).toHaveLength(1);
    expect(payload.notifications[0].schedule.at).toEqual(
      new Date(2026, 2, 6, 16, 0, 0)
    );
    expect(payload.notifications[0].extra).toEqual({
      taskId: "t1",
      listId: "list-1",
    });
  });

  it("schedules a waking alarm that survives Doze, without needing exact alarms", async () => {
    // This pair is the whole reason a reminder arrives at all, and both halves
    // are load-bearing. See the note at the top of lib/notifications.ts.
    //
    // allowWhileIdle lives on `schedule`, not on the notification — the plugin
    // reads it via schedule.getBoolean("allowWhileIdle"). Setting it one level
    // up type-checks, does nothing, and is exactly the bug this guards: the
    // alarm then goes out as AlarmManager.set(RTC), which neither wakes the
    // device nor runs during Doze, so a backgrounded reminder never fired.
    //
    // isExactNotification defaults to TRUE in the plugin, so leaving it off
    // makes the alarm type depend on a permission the manifest strips. Pinning
    // it false takes the inexact branch deliberately and needs no permission.
    await syncTaskReminders([hourBefore("t1")], NOW);
    const [[payload]] = schedule.mock.calls;
    const [notification] = payload.notifications;

    expect(notification.schedule.allowWhileIdle).toBe(true);
    expect(notification.isExactNotification).toBe(false);
    // Would make the plugin reject the whole call when exact alarms are denied.
    expect(notification.isExactMandatory).toBeUndefined();
    // Still no repeats: a reminder fires once, and the recurrence engine is
    // what moves a repeating task forward.
    expect(notification.schedule.repeats).toBeUndefined();
  });

  it("says the app name, the task, and one fixed line", async () => {
    // Android draws the icon and "List It" in the header, so the notification
    // reads: List It / task name / this. The body was tried as the task's
    // description and as its due date; both repeat something the reader already
    // knows and neither says the notification can be acted on.
    await syncTaskReminders([hourBefore("t1")], NOW);
    const [[payload]] = schedule.mock.calls;
    const [notification] = payload.notifications;

    expect(notification.title).toBe("A task");
    expect(notification.body).toBe(
      "This is your scheduled reminder - tap to view or complete this"
    );
  });

  it("cancels an orphan the tasks no longer justify", async () => {
    // A notification pending for a task since deleted. With one fixed id this
    // could not happen; with per-reminder ids it is the common case.
    getPending.mockResolvedValue({ notifications: [{ id: 999 }] });

    await syncTaskReminders([hourBefore("t1")], NOW);

    expect(cancel).toHaveBeenCalledWith({ notifications: [{ id: 999 }] });
  });

  it("leaves a pending notification alone when it is still wanted", async () => {
    const wanted = notificationId("t1", "r1");
    getPending.mockResolvedValue({ notifications: [{ id: wanted }] });

    await syncTaskReminders([hourBefore("t1")], NOW);

    expect(cancel).not.toHaveBeenCalled();
  });

  it("cancels everything and schedules nothing when reminders are switched off", async () => {
    // The master switch in Settings. The reminders stay on their tasks; only
    // delivery stops, so turning it back on restores the lot.
    readNotificationPrefs.mockReturnValue({ remindersEnabled: false });
    getPending.mockResolvedValue({ notifications: [{ id: 123 }] });

    const count = await syncTaskReminders([hourBefore("t1")], NOW);

    expect(count).toBe(0);
    expect(cancel).toHaveBeenCalledWith({ notifications: [{ id: 123 }] });
    expect(schedule).not.toHaveBeenCalled();
  });

  it("still cancels when permission is refused", async () => {
    // Otherwise a reminder set before the user said no outlives the refusal.
    checkPermissions.mockResolvedValue({ display: "denied" });
    getPending.mockResolvedValue({ notifications: [{ id: 999 }] });

    const count = await syncTaskReminders([hourBefore("t1")], NOW);

    expect(count).toBe(0);
    expect(cancel).toHaveBeenCalled();
    expect(schedule).not.toHaveBeenCalled();
  });

  it("does not ask for permission when there is nothing to deliver", async () => {
    await syncTaskReminders([task({ id: "t1" })], NOW);

    expect(checkPermissions).not.toHaveBeenCalled();
    expect(requestPermissions).not.toHaveBeenCalled();
    expect(schedule).not.toHaveBeenCalled();
  });

  it("survives the platform refusing getPending", async () => {
    // Older platforms can throw here. Scheduling still replaces by id, so the
    // worst case is an orphan lasting until the task list changes again.
    getPending.mockRejectedValue(new Error("not supported"));

    const count = await syncTaskReminders([hourBefore("t1")], NOW);

    expect(count).toBe(1);
    expect(schedule).toHaveBeenCalled();
  });

  it("resolves rather than throwing when scheduling fails", async () => {
    // This runs off the back of a data refresh; a failure must not take a screen
    // down with it.
    schedule.mockRejectedValue(new Error("no"));
    await expect(syncTaskReminders([hourBefore("t1")], NOW)).resolves.toBe(0);
  });
});
