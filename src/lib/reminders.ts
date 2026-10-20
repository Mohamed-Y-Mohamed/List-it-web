// lib/reminders.ts
// Per-task reminders: what they are, when they fire, and what id they schedule
// under.
//
// This replaces the due-today reminder, which sent one notification a day
// covering everything due and which nobody chose per task. The reasoning behind
// that design still holds and is worth keeping in view: one notification per task
// per day is how an app gets uninstalled. The difference now is that every
// reminder here was asked for explicitly, on a particular task, by someone who
// decided it was worth a buzz.
//
// Pure: no React, no Capacitor. lib/notifications.ts does the scheduling.

/**
 * An offset counts back from the moment the task is due; an absolute reminder is
 * a wall-clock time the user picked and ignores the due date entirely — which is
 * the only kind that can be set on a task with no due date at all.
 */
export type Reminder =
  | { id: string; kind: "offset"; minutes: number }
  | { id: string; kind: "absolute"; at: string };

/** The hour a date-only due date is treated as. Was DEFAULT_REMINDER_HOUR. */
export const DEFAULT_DUE_HOUR = 9;

/**
 * Offsets are no longer offered.
 *
 * `OFFSET_PRESETS` used to list "1 hour before", "1 day before" and the rest, and
 * the reminder picker was a row of chips over them. The iOS app has never worked
 * that way — `TaskDetailView` is one `DatePicker` with `[.date, .hourAndMinute]`,
 * bounded to the due day — and the two had drifted into different features
 * wearing the same name. This file now describes the iOS one.
 *
 * `kind: "offset"` survives in the type and in `parseReminders` on purpose. The
 * `reminders` jsonb of every task saved under the old picker still holds them,
 * the arithmetic to fire one is just `minutes`, and silently dropping a reminder
 * someone is relying on is worse than keeping a shape nothing creates any more.
 * They read correctly, they fire correctly, and the first edit through the new
 * picker replaces them.
 */

/**
 * Reminders a single task may carry.
 *
 * One, matching iOS, where the notification request *is* identified by the task
 * id (`UNNotificationRequest(identifier: taskID)`) and so there is physically
 * room for exactly one. This was 5.
 *
 * A legacy row holding more collapses to its first on read. That is a real if
 * small loss, and it is the deliberate one: the alternative is a sheet that can
 * show four reminders and offer no way to reach three of them.
 */
export const MAX_REMINDERS_PER_TASK = 1;

/**
 * Narrows whatever came back from the `reminders` jsonb column.
 *
 * Same reasoning as parseRepeatRule: the value drives both date arithmetic and
 * notification ids, and a malformed entry should disappear rather than schedule
 * something at NaN.
 */
export function parseReminders(value: unknown): Reminder[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const out: Reminder[] = [];

  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const { id, kind } = raw as { id?: unknown; kind?: unknown };
    if (typeof id !== "string" || id.length === 0 || seen.has(id)) continue;

    if (kind === "offset") {
      const { minutes } = raw as { minutes?: unknown };
      if (
        typeof minutes !== "number" ||
        !Number.isFinite(minutes) ||
        minutes < 0
      )
        continue;
      seen.add(id);
      out.push({ id, kind: "offset", minutes });
      continue;
    }

    if (kind === "absolute") {
      const { at } = raw as { at?: unknown };
      if (typeof at !== "string" || Number.isNaN(new Date(at).getTime()))
        continue;
      seen.add(id);
      out.push({ id, kind: "absolute", at });
    }
  }

  // Capped here, not only in the picker. The picker stops at the limit, but the
  // API has no allowlist and nothing stops a direct PATCH storing thousands —
  // which every card then parses on every render.
  return out.slice(0, MAX_REMINDERS_PER_TASK);
}

export interface DueTask {
  due_date?: Date | string | null;
  due_has_time?: boolean | null;
}

/**
 * The moment a task is actually due, which is what offsets count back from.
 *
 * A due date with no time is stored at UTC noon as a marker rather than a
 * meaningful instant, so it is read as 09:00 local on that day — the same
 * convention the due-today reminder used, now carried over rather than reinvented.
 * Once someone sets a time, that time is the answer.
 */
export function dueMoment(task: DueTask): Date | null {
  if (!task.due_date) return null;

  const due = new Date(task.due_date);
  if (Number.isNaN(due.getTime())) return null;

  if (task.due_has_time) return due;

  // The day comes out of the marker in UTC; only the hour is local.
  //
  // `new Date(due)` then `setHours` reads the UTC-noon marker in local time
  // first, which is already the following day anywhere past UTC+12 — so the
  // reminder fired on a different day from the one the card showed, because
  // `formatTaskDue` reads the same value in UTC. Taking the date parts from the
  // UTC getters keeps the two in step.
  return new Date(
    due.getUTCFullYear(),
    due.getUTCMonth(),
    due.getUTCDate(),
    DEFAULT_DUE_HOUR,
    0,
    0,
    0,
  );
}

/**
 * Turn the due-date field into what gets stored.
 *
 * A due date is a day and nothing more, which is what the iOS picker has always
 * collected — `DatePicker(..., displayedComponents: [.date])`. The time half of
 * this function has gone with the field that fed it, so the result is always the
 * long-standing UTC-noon marker: not a meaningful time of day, but a date that
 * cannot slip either side of midnight when it crosses a timezone, which is why
 * it was chosen and why the iOS app can parse it.
 *
 * `hasTime` stays in the return, always false, because `due_has_time` is still a
 * column and every write has to send a consistent pair. Rows written before this
 * keep their stored time and `dueMoment` still reads it — see the note there.
 */
export function composeDue(
  dateInput: string,
): { due: Date; hasTime: false } | null {
  if (!dateInput) return null;

  const [year, month, day] = dateInput.split("-").map(Number);
  if (!year || !month || !day) return null;

  return {
    due: new Date(Date.UTC(year, month - 1, day, 12, 0, 0)),
    hasTime: false,
  };
}

/**
 * The last instant of a task's due day, local time — iOS `reminderLimit`.
 *
 * Null when there is no due date, and null when that day has already finished,
 * which is the same thing `TaskDetailView` means by returning nil: there is no
 * window left to put a reminder in.
 */
export function reminderLimit(dueDateKey: string | null): Date | null {
  if (!dueDateKey) return null;

  const [year, month, day] = dueDateKey.split("-").map(Number);
  if (!year || !month || !day) return null;

  const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 0);
  return endOfDay > new Date() ? endOfDay : null;
}

/**
 * Whether the due day has already finished — iOS `isOverdue`.
 *
 * A task is past reminding when the end of its due day has gone, not when the
 * due *moment* has: a task due today at 09:00 can still be reminded about this
 * afternoon, which is the behaviour the iOS caption describes.
 */
export function isDueDayPast(dueDateKey: string | null): boolean {
  if (!dueDateKey) return false;

  const [year, month, day] = dueDateKey.split("-").map(Number);
  if (!year || !month || !day) return false;

  return new Date(year, month - 1, day, 23, 59, 59, 0) <= new Date();
}

/**
 * The range the reminder picker may offer — iOS `reminderRange`.
 *
 * From now to the end of the due day. With no due date there is no upper bound:
 * an absolute reminder is the only kind that can be set on an undated task, and
 * it has nothing to be capped against.
 */
export function reminderBounds(dueDateKey: string | null): {
  min: Date;
  max: Date | null;
} {
  return { min: new Date(), max: reminderLimit(dueDateKey) };
}

/**
 * Pull a reminder back inside the due day — iOS `keepReminderWithinDueDay`.
 *
 * Called when the due date moves. It keeps the time of day the user picked and
 * re-anchors it to the due day, then clamps that into the allowed window, so
 * moving a due date earlier drags its reminder along rather than silently
 * invalidating it.
 *
 * Returns the reminder unchanged when it already fits.
 */
export function clampReminderToDueDay(
  at: Date,
  dueDateKey: string | null,
): Date {
  const limit = reminderLimit(dueDateKey);
  if (!limit || at <= limit) return at;

  const [year, month, day] = (dueDateKey as string).split("-").map(Number);
  const sameTimeOnDueDay = new Date(
    year,
    month - 1,
    day,
    at.getHours(),
    at.getMinutes(),
    0,
    0,
  );

  const now = new Date();
  return new Date(
    Math.min(Math.max(sameTimeOnDueDay.getTime(), now.getTime()), limit.getTime()),
  );
}

/** When a reminder should fire, or null if it has nothing to anchor to. */
export function reminderFireAt(
  reminder: Reminder,
  dueAt: Date | null,
): Date | null {
  if (reminder.kind === "absolute") {
    const at = new Date(reminder.at);
    return Number.isNaN(at.getTime()) ? null : at;
  }

  if (!dueAt) return null;
  return new Date(dueAt.getTime() - reminder.minutes * 60_000);
}

/** The collapsed Reminders row's summary. */
export function describeReminders(reminders: Reminder[]): string {
  if (reminders.length === 0) return "None";
  if (reminders.length === 1) return describeReminder(reminders[0]);
  return `${reminders.length} reminders`;
}

export function describeReminder(reminder: Reminder): string {
  if (reminder.kind === "absolute") {
    return new Date(reminder.at).toLocaleString(undefined, {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return describeOffset(reminder.minutes);
}

/**
 * A legacy offset, in words.
 *
 * Nothing creates offsets any more, but tasks saved under the old picker still
 * carry them and they still fire, so they still have to read as something. This
 * is derived rather than looked up in a table: the table only covered the
 * presets that happened to have been offered, and an offset stored by a build in
 * between would have rendered as "20160 minutes before".
 */
function describeOffset(minutes: number): string {
  if (minutes === 0) return "When it's due";

  const plural = (value: number, unit: string) =>
    `${value} ${unit}${value === 1 ? "" : "s"} before`;

  if (minutes % (60 * 24 * 7) === 0)
    return plural(minutes / (60 * 24 * 7), "week");
  if (minutes % (60 * 24) === 0) return plural(minutes / (60 * 24), "day");
  if (minutes % 60 === 0) return plural(minutes / 60, "hour");
  return plural(minutes, "minute");
}

/**
 * A stable 32-bit id for one reminder on one task.
 *
 * The plugin needs a signed 32-bit integer and task ids are UUIDs, so the pair has
 * to be hashed. Stability is the point: the same reminder must land on the same id
 * every time it is scheduled, or rescheduling stacks duplicates instead of
 * replacing them. The old code dodged this entirely with one fixed id, which is
 * also why it never needed to reconcile anything.
 *
 * FNV-1a, folded into the positive half of the range. Collisions are possible in
 * principle; `syncTaskReminders` checks for them when it builds its schedule
 * rather than pretending they cannot happen.
 */
export function notificationId(taskId: string, reminderId: string): number {
  const input = `${taskId}:${reminderId}`;
  let hash = 0x811c9dc5;

  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    // The FNV prime, as shifts, so this stays in 32-bit integer maths.
    hash =
      (hash +
        ((hash << 1) +
          (hash << 4) +
          (hash << 7) +
          (hash << 8) +
          (hash << 24))) >>>
      0;
  }

  // Positive only: the plugin accepts negatives but they read badly in logs, and
  // halving the space costs nothing at the number of reminders one phone holds.
  return hash % 2_147_483_647;
}

/** Reasonably unique id for a newly added reminder. Not a security boundary. */
export function newReminderId(): string {
  return `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}
