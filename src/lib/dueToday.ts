// lib/dueToday.ts
// Which tasks count as "due today", and when to remind about each.
//
// The rule is deliberately narrow: a task qualifies only if it *has* a due date
// and that date falls on today. Overdue tasks, tomorrow's tasks and undated tasks
// are all out of scope — widening this is a change of requirement, not a fix.
//
// Kept free of Capacitor and React so it can be tested directly.

import type { Task } from "@/types/schema";

/**
 * Tasks with no time of day — a date-only due date lands at midnight — are
 * reminded at this hour instead, since a notification at 00:00 is useless.
 */
export const DEFAULT_REMINDER_HOUR = 9;

/** Treat a due date within this many minutes of midnight as date-only. */
const MIDNIGHT_TOLERANCE_MINUTES = 1;

export interface DueTodayReminder {
  task: Task;
  /** When the notification should fire. Always in the future. */
  fireAt: Date;
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isDateOnly(due: Date): boolean {
  return (
    due.getHours() === 0 && due.getMinutes() <= MIDNIGHT_TOLERANCE_MINUTES
  );
}

/**
 * The reminders to schedule, given the user's open tasks and the current time.
 *
 * Excluded: tasks without a due date, tasks not due today, completed or deleted
 * tasks, and tasks whose reminder time has already passed — re-notifying about a
 * deadline the user has already sailed past is noise, not help.
 */
export function selectDueTodayReminders(
  tasks: Task[],
  now: Date = new Date()
): DueTodayReminder[] {
  const reminders: DueTodayReminder[] = [];

  for (const task of tasks) {
    if (!task.due_date) continue;
    if (task.is_completed || task.is_deleted) continue;

    const due = new Date(task.due_date);
    if (Number.isNaN(due.getTime())) continue;
    if (!isSameCalendarDay(due, now)) continue;

    // A date-only due date would otherwise fire at midnight, so move it to a
    // sensible hour on the same day.
    const fireAt = isDateOnly(due)
      ? new Date(
          due.getFullYear(),
          due.getMonth(),
          due.getDate(),
          DEFAULT_REMINDER_HOUR,
          0,
          0,
          0
        )
      : due;

    if (fireAt.getTime() <= now.getTime()) continue;

    reminders.push({ task, fireAt });
  }

  return reminders.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime());
}

/**
 * The single notification id this feature ever uses.
 *
 * One fixed id, deliberately: rescheduling then replaces the pending reminder
 * instead of stacking another beside it, and there is no way to end up with a
 * backlog of notifications the user has to swipe away.
 */
export const DUE_TODAY_NOTIFICATION_ID = 1_000_001;

export interface DueTodaySummary {
  /** When the single notification should fire. */
  fireAt: Date;
  title: string;
  body: string;
  count: number;
}

/**
 * Collapse the day's reminders into one notification.
 *
 * One notification per task would mean a phone buzzing all day for anyone who
 * plans properly — the fastest route to the app being uninstalled. Instead the
 * user gets a single nudge, timed to the first thing due that day, saying how
 * much is due. With exactly one task there is room to name it, which is more
 * useful than a count of one.
 *
 * Returns null when nothing qualifies, which is the signal to cancel and
 * schedule nothing.
 */
export function summariseDueToday(
  reminders: DueTodayReminder[]
): DueTodaySummary | null {
  if (reminders.length === 0) return null;

  // Reminders arrive sorted, so the first is the earliest thing due today.
  const first = reminders[0];
  const count = reminders.length;

  if (count === 1) {
    const name = first.task.text?.trim();
    return {
      fireAt: first.fireAt,
      title: name || "Task due today",
      body: name ? "Due today" : "You have a task due today.",
      count,
    };
  }

  return {
    fireAt: first.fireAt,
    title: `${count} tasks due today`,
    body: "Open List It to see what's due.",
    count,
  };
}
