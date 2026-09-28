// lib/notifications.ts
// Local reminders for tasks due today, on Android.
//
// Everything here is a no-op off-native: the web app gets no notifications and no
// permission prompt. Local notifications are scheduled by the OS, so they still
// fire when the app is closed — but they can only be *scheduled* while the app is
// open, which is why the whole set is recomputed on each launch.

import { LocalNotifications } from "@capacitor/local-notifications";
import { isNativeApp } from "@/lib/platform";
import {
  DUE_TODAY_NOTIFICATION_ID,
  selectDueTodayReminders,
  summariseDueToday,
} from "@/lib/dueToday";
import type { Task } from "@/types/schema";

// Android groups notifications by channel, and the channel fixes the importance,
// sound and whether it can interrupt. Created once; re-creating with the same id
// is harmless and Android ignores changes after first install.
const CHANNEL_ID = "due-today";

async function ensureChannel(): Promise<void> {
  try {
    await LocalNotifications.createChannel({
      id: CHANNEL_ID,
      name: "Tasks due today",
      description: "Reminders for tasks that are due today",
      importance: 4, // heads-up; a deadline is worth surfacing
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
 * Recompute today's reminder and replace whatever is scheduled.
 *
 * Exactly one notification is ever pending. It is cleared first, so a task that
 * was completed, deleted, rescheduled or moved off today stops reminding — and
 * if nothing qualifies any more, nothing is scheduled in its place.
 *
 * Returns how many tasks the scheduled notification covers, or 0 if none.
 */
export async function syncDueTodayNotifications(
  tasks: Task[],
  now: Date = new Date()
): Promise<number> {
  if (!isNativeApp()) return 0;

  const summary = summariseDueToday(selectDueTodayReminders(tasks, now));

  try {
    // Clear first, unconditionally, and by the one id this feature owns.
    await LocalNotifications.cancel({
      notifications: [{ id: DUE_TODAY_NOTIFICATION_ID }],
    });

    if (!summary) return 0;

    // Only ask for permission once there is something worth showing.
    const granted = await ensureNotificationPermission();
    if (!granted) return 0;

    await ensureChannel();
    await LocalNotifications.schedule({
      notifications: [
        {
          id: DUE_TODAY_NOTIFICATION_ID,
          title: summary.title,
          body: summary.body,
          // No `repeats` — this fires once, on the day, and is done.
          //
          // `allowWhileIdle` is deliberately off. It asks Android for an *exact*
          // alarm, which since Android 13 needs SCHEDULE_EXACT_ALARM — a
          // permission the user has to grant in system Settings, and which Play
          // restricts to alarm clocks and calendars. A reminder that a task is
          // due does not need to land on the second, and inexact delivery keeps
          // the app clear of that permission and the policy review that comes
          // with it.
          schedule: { at: summary.fireAt },
          channelId: CHANNEL_ID,
        },
      ],
    });

    return summary.count;
  } catch (error) {
    console.error("Could not sync due-today notifications:", error);
    return 0;
  }
}
