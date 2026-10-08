// lib/notifications.ts
// Per-task reminders, on Android.
//
// Everything here is a no-op off-native: the web app gets no notifications and no
// permission prompt. Local notifications are scheduled by the OS, so they still
// fire when the app is closed — but they can only be *scheduled* while the app is
// open, which is why the whole set is recomputed on each launch and each resume.
//
// ---------------------------------------------------------------------------
// What this replaced, and what carried over
//
// There used to be exactly one notification: a daily summary of everything due
// that day, scheduled under a single hardcoded id. Nobody chose it per task, and
// it was the only thing a due date ever did.
//
// The reasoning behind that design has not gone away — one buzz per task per day
// is how an app gets uninstalled — but it is now the user's call rather than a
// decision taken for them. A reminder exists here only because someone added it
// to a particular task, and the cap below is what stops that becoming the same
// problem by accident.
//
// Three things survived the rewrite because they were right:
//   * cancel before schedule, so a resync replaces rather than stacks;
//   * never schedule in the past;
//   * a refused permission still cancels, so stale reminders do not outlive it.
//
// One thing had to be built that the old design got for free. With a single fixed
// id, rescheduling replaced the pending notification and nothing could ever be
// orphaned. Ids vary per reminder now, so a task deleted on another device would
// leave its notification pending forever — hence the reconciliation against
// getPending() below.
//
// ---------------------------------------------------------------------------
// Why allowWhileIdle is set, and why it is free
//
// Exact alarms stay off: SCHEDULE_EXACT_ALARM and USE_EXACT_ALARM are stripped in
// the manifest because Play restricts them to alarm clocks and calendars. That
// part was always right. What was wrong was the belief that allowWhileIdle needed
// one of them — it does not, and leaving it off is why reminders never arrived.
//
// The plugin picks the alarm type like this (LocalNotificationManager.kt,
// setExactIfPossible):
//
//   exact permitted + allowWhileIdle -> setExactAndAllowWhileIdle(RTC_WAKEUP)
//   exact permitted                  -> setExact(RTC)
//   no permission   + allowWhileIdle -> setAndAllowWhileIdle(RTC_WAKEUP)   <- us
//   no permission                    -> set(RTC)                          <- was us
//
// Only the first two consult canScheduleExactAlarms(). setAndAllowWhileIdle needs
// no permission at all, and it is the only no-permission branch that both wakes
// the device (RTC_WAKEUP) and is exempt from Doze deferral. The branch we were on
// did neither: AlarmManager.set is batched and held until the next Doze
// maintenance window, and plain RTC does not wake the device — so a reminder on a
// backgrounded app with the screen off simply never showed up.
//
// It is still an inexact alarm, which is the honest trade for keeping the
// permission off: Android rate-limits these to roughly one per nine minutes per
// app while the device is actually dozing. A device in use fires on time. The
// copy in the app says "around" rather than promising a minute.

import { LocalNotifications } from "@capacitor/local-notifications";
import { isNativeApp } from "@/lib/platform";
import { readNotificationPrefs } from "@/lib/notificationPrefs";
import {
  dueMoment,
  notificationId,
  parseReminders,
  reminderFireAt,
  type Reminder,
} from "@/lib/reminders";
import type { Task } from "@/types/schema";

// Android groups notifications by channel, and the channel fixes the importance,
// sound and whether it can interrupt. Created once; re-creating with the same id
// is harmless and Android ignores changes after first install.
const CHANNEL_ID = "task-reminders";

/** The one line under the task name in every reminder. */
const REMINDER_BODY =
  "This is your scheduled reminder - tap to view or complete this";

/**
 * How many reminders may be pending at once.
 *
 * Android tolerates a few hundred, but the limit worth respecting is the user's:
 * someone with two hundred dated tasks does not want two hundred alarms queued
 * from a single sync. The soonest are kept, which are the ones that matter, and
 * the rest are picked up on the next launch or resume as they come into range.
 */
const MAX_PENDING = 60;

async function ensureChannel(): Promise<void> {
  try {
    await LocalNotifications.createChannel({
      id: CHANNEL_ID,
      name: "Task reminders",
      description: "Reminders you have set on your tasks",
      importance: 4, // heads-up; the user asked for this one specifically
      visibility: 1,
    });
  } catch {
    // createChannel is Android-only and throws elsewhere; scheduling still works.
  }
}

/**
 * Ask for notification permission, returning whether it was granted.
 *
 * Android 13+ requires an explicit grant. Asked for lazily — only when there is
 * actually something to schedule — so a new user is not prompted before the app
 * has shown them anything worth being notified about.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (!isNativeApp()) return false;

  try {
    const current = await LocalNotifications.checkPermissions();
    if (current.display === "granted") return true;
    if (current.display === "denied") return false;

    const requested = await LocalNotifications.requestPermissions();
    return requested.display === "granted";
  } catch (error) {
    console.error("Notification permission check failed:", error);
    return false;
  }
}

/**
 * Whether we may post a notification. Asks the OS, never asks the user.
 *
 * This exists so that syncing can never prompt. Sync runs on launch and again on
 * every resume, and a prompt on that path is a trap: anyone who backs out of the
 * permission screen returns to the app, which immediately resyncs and sends them
 * straight back to it. Reminders are opt-in, so the only places allowed to ask are
 * the ones where somebody has just said they want them — the Reminders switch on a
 * task, and the master switch in Settings.
 */
async function hasNotificationPermission(): Promise<boolean> {
  if (!isNativeApp()) return false;

  try {
    const current = await LocalNotifications.checkPermissions();
    return current.display === "granted";
  } catch {
    return false;
  }
}

export interface PlannedReminder {
  id: number;
  taskId: string;
  listId: string | null;
  title: string;
  body: string;
  fireAt: Date;
}

/**
 * Every reminder that should be pending right now, soonest first.
 *
 * Pure, so the selection rules are testable without a device. Completed and
 * deleted tasks drop out, anything already past drops out, and the result is
 * capped.
 *
 * Colliding ids are dropped rather than scheduled. Two reminders hashing to the
 * same 32-bit id would mean one silently replacing the other, and a reminder that
 * never arrives is worse than one that was never offered.
 */
export function planReminders(
  tasks: Task[],
  now: Date = new Date(),
): PlannedReminder[] {
  const planned: PlannedReminder[] = [];
  const seenIds = new Set<number>();

  for (const task of tasks) {
    if (task.is_completed || task.is_deleted) continue;

    const reminders: Reminder[] = parseReminders(task.reminders);
    if (reminders.length === 0) continue;

    const dueAt = dueMoment(task);

    for (const reminder of reminders) {
      const fireAt = reminderFireAt(reminder, dueAt);
      if (!fireAt || fireAt <= now) continue;

      const id = notificationId(task.id, reminder.id);
      if (seenIds.has(id)) continue;
      seenIds.add(id);

      planned.push({
        id,
        taskId: task.id,
        listId: task.list_id ?? null,
        title: task.text?.trim() || "Task reminder",
        // Android draws the app icon and "List It" in the header, so the
        // notification reads: List It / task name / this line.
        //
        // Fixed copy rather than the task's own description or due date. Both
        // were tried; both tell you something you already know, and neither says
        // what the notification is *for* or that it can be acted on.
        body: REMINDER_BODY,
        fireAt,
      });
    }
  }

  planned.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime());
  return planned.slice(0, MAX_PENDING);
}

/**
 * Bring the OS's pending notifications in line with the tasks as they stand.
 *
 * Returns how many are pending afterwards. Resolves rather than throwing: this
 * runs off the back of a data refresh, and a failure to schedule must not take a
 * screen down with it.
 */
export async function syncTaskReminders(
  tasks: Task[],
  now: Date = new Date(),
): Promise<number> {
  if (!isNativeApp()) return 0;

  try {
    // The master switch in Settings. Off means nothing is delivered, but the
    // reminders themselves stay on their tasks — so this cancels what is pending
    // and schedules nothing, and turning it back on restores the lot.
    const { remindersEnabled } = readNotificationPrefs();
    const wanted = remindersEnabled ? planReminders(tasks, now) : [];
    const wantedById = new Map(wanted.map((item) => [item.id, item]));

    // Reconcile against what is actually pending rather than cancelling blindly.
    // Anything the OS is holding that we no longer want is an orphan: a deleted
    // task, an edited reminder, a task completed on another device.
    let pending: { id: number }[] = [];
    try {
      pending = (await LocalNotifications.getPending()).notifications ?? [];
    } catch {
      // Older platforms can refuse this. Scheduling still replaces by id, so the
      // worst case is an orphan surviving until the task list changes again.
    }

    const stale = pending.filter((item) => !wantedById.has(item.id));
    if (stale.length > 0) {
      await LocalNotifications.cancel({
        notifications: stale.map((item) => ({ id: item.id })),
      });
    }

    if (wanted.length === 0) return 0;

    // Checked, never requested. Syncing runs on launch and on every resume, so a
    // prompt here would re-fire each time the user came back from dismissing it.
    // If permission was never granted the reminders simply stay unscheduled, and
    // the switch that would ask for it is the one the user chose to turn on.
    const granted = await hasNotificationPermission();
    if (!granted) return 0;

    await ensureChannel();

    await LocalNotifications.schedule({
      notifications: wanted.map((item) => ({
        id: item.id,
        title: item.title,
        body: item.body,
        schedule: {
          at: item.fireAt,
          // Doze will otherwise hold this until the next maintenance window,
          // and the alarm is not a waking one. Both are fixed by this flag;
          // see the header note for why it costs no permission.
          allowWhileIdle: true,
        },
        // Pinned false on purpose rather than left to default true, so the
        // alarm type stops depending on a permission the manifest removes.
        isExactNotification: false,
        channelId: CHANNEL_ID,
        // What the tap handler in NativeShell reads to open the right list
        // rather than dumping everyone on Today.
        extra: { taskId: item.taskId, listId: item.listId },
      })),
    });

    return wanted.length;
  } catch (error) {
    console.error("Could not sync task reminders:", error);
    return 0;
  }
}

/** Cancel everything this app has pending. Used when signing out. */
export async function cancelAllReminders(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { notifications } = await LocalNotifications.getPending();
    if (notifications.length === 0) return;
    await LocalNotifications.cancel({
      notifications: notifications.map(({ id }) => ({ id })),
    });
  } catch (error) {
    console.error("Could not cancel reminders:", error);
  }
}
