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

// Ascending, because that is the order the chips render in and a list of offsets
// that jumps about has to be read rather than skimmed.
//
// `1 month before` is 30 days, not a calendar month. Offsets here are plain
// subtraction — see `reminderFireAt` — so a true calendar month would make the
// gap depend on which month the due date happened to fall in. Thirty days is what
// the label means in every other reminder UI and it needs no new arithmetic.
export const OFFSET_PRESETS: readonly { minutes: number; label: string }[] = [
  { minutes: 0, label: "When it's due" },
  { minutes: 60, label: "1 hour before" },
  { minutes: 60 * 24, label: "1 day before" },
  { minutes: 60 * 24 * 2, label: "2 days before" },
  { minutes: 60 * 24 * 7, label: "1 week before" },
  { minutes: 60 * 24 * 14, label: "2 weeks before" },
  { minutes: 60 * 24 * 30, label: "1 month before" },
] as const;

/** Reminders a single task may carry. Past this the sheet stops offering more. */
export const MAX_REMINDERS_PER_TASK = 5;

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
 * Turn the two form inputs into what gets stored.
 *
 * Both task sheets and the reminder validation all need this, and before it was
 * one function it was three copies of the same ternary — one of which had already
 * drifted into reading the date back in UTC.
 *
 * With a time, the result is a real local instant. Without one it is the
 * long-standing UTC-noon marker: not a meaningful time of day, but a date that
 * cannot slip either side of midnight when it crosses a timezone, which is why it
 * was chosen and why the iOS app can parse it.
 */
export function composeDue(
  dateInput: string,
  timeInput: string,
): { due: Date; hasTime: boolean } | null {
  if (!dateInput) return null;

  const [year, month, day] = dateInput.split("-").map(Number);
  if (!year || !month || !day) return null;

  if (timeInput) {
    const [hour, minute] = timeInput.split(":").map(Number);
    return {
      due: new Date(year, month - 1, day, hour || 0, minute || 0, 0, 0),
      hasTime: true,
    };
  }

  return {
    due: new Date(Date.UTC(year, month - 1, day, 12, 0, 0)),
    hasTime: false,
  };
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
  return (
    OFFSET_PRESETS.find((p) => p.minutes === reminder.minutes)?.label ??
    `${reminder.minutes} minutes before`
  );
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
