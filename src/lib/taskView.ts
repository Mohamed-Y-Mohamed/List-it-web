// lib/taskView.ts
// The pure rules the six task screens share: what order tasks appear in, and
// how a due date is compared against a day.
//
// Kept apart from useTaskView so they carry no dependency on the Supabase
// client. That is not tidiness for its own sake — importing the hook to test the
// sort drags a database client into the test run, which is how a rule this
// simple ends up with no tests at all.

import type { TaskRow } from "@/types/taskView";

/** Midnight on the given day, as yyyy-mm-dd in local time rather than UTC. */
export function toPostgresDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** True when an ISO timestamp falls on the same local day as `day`. */
export function isSameLocalDay(iso: string | null, day: Date): boolean {
  if (!iso) return false;

  const taskDate = new Date(iso);
  if (Number.isNaN(taskDate.getTime())) {
    console.error("Error parsing date:", iso);
    return false;
  }

  taskDate.setHours(0, 0, 0, 0);
  return taskDate.getTime() === day.getTime();
}

/** True when a task has no due date, or one that has not passed yet. */
export function isUndatedOrAhead(task: TaskRow, day: Date): boolean {
  if (!task.due_date) return true;

  const taskDate = new Date(task.due_date);
  if (Number.isNaN(taskDate.getTime())) {
    console.error("Error parsing date:", task.due_date);
    return false;
  }

  taskDate.setHours(0, 0, 0, 0);
  return taskDate.getTime() >= day.getTime();
}

/**
 * Whether this task comes back after it is ticked.
 *
 * The screens split on this rather than filtering it out: a repeating task is a
 * routine, a one-off is an errand, and mixing fifteen daily habits in with three
 * real jobs buries the three. Today and Tomorrow drop them entirely because the
 * Recurring screen is where the routine lives; the rest group them under their
 * own heading.
 */
// The parameter is kept so every call site stays untouched for the rebuild; the
// repo's eslint has no argsIgnorePattern, so the underscore alone is not enough.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function isRecurring(_task: { repeat_rule?: unknown }): boolean {
  // Repeat was removed on 2026-10-03; the design is archived in memory under
  // `listit-repeat-feature-archive` and the `repeat_rule` column is untouched.
  // Kept as a named concept, and keeping the parameter, so the screens that
  // split on this read the same way when the feature comes back.
  return false;
}

/**
 * What the Recurring screen holds: the routine for today, and nothing else.
 *
 * Repeating and due today. There is no stored flag and nothing to reset — a task
 * is here because of when it is next due, so the screen empties itself at midnight
 * and fills again from whatever has come round, without a job to run and without
 * ever touching the task.
 */
export function isRecurringToday(task: TaskRow, day: Date): boolean {
  if (!isRecurring(task)) return false;

  // A repeat with no schedule still belongs here. Repeat and Schedule are
  // independent — turning on Repeat without picking a date is allowed — and such
  // a task has no next date to compare, so it is simply due, today and every day,
  // until it is ticked. Ticking stamps its next occurrence into `due_date`
  // (`applyCompletion`), after which the comparison below takes over.
  if (!task.due_date) return true;

  return isSameLocalDay(task.due_date, day);
}

export interface DueDateBands {
  overdue: TaskRow[];
  today: TaskRow[];
  tomorrow: TaskRow[];
  upcoming: TaskRow[];
}

/**
 * The Scheduled screen's four bands, by when each task is next due.
 *
 * Recurring tasks are banded alongside everything else rather than hived off
 * into a group of their own. They used to be filtered out first, on the argument
 * that "three days overdue" says nothing useful about a habit — which is true,
 * but the cost was that a habit due today never appeared under Today beside the
 * errands due with it, and Scheduled is the screen you open to see what today
 * holds. Seeing them as a set is what the Recurring screen is for.
 *
 * Undated tasks have no band and drop out. Order within a band is the order
 * given, so the caller sorts once rather than each band re-sorting.
 */
export function bandByDueDate(tasks: TaskRow[], today: Date): DueDateBands {
  const bands: DueDateBands = {
    overdue: [],
    today: [],
    tomorrow: [],
    upcoming: [],
  };

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  for (const task of tasks) {
    if (!task.due_date) continue;

    if (isSameLocalDay(task.due_date, today)) bands.today.push(task);
    else if (isSameLocalDay(task.due_date, tomorrow)) bands.tomorrow.push(task);
    else if (daysBetween(task.due_date, today) > 0) bands.overdue.push(task);
    else bands.upcoming.push(task);
  }

  return bands;
}

/** Whole days `today` is past `dueDate`. Negative when the date is still ahead. */
export function daysBetween(dueDate: string, today: Date): number {
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * The order every task screen puts its tasks in: pinned first, then those with
 * a due date, soonest first, then the rest oldest first.
 *
 * Returns a new array; the caller's is left alone.
 */
export function sortTasks(tasks: TaskRow[]): TaskRow[] {
  return [...tasks].sort((a, b) => {
    // Booleans, not the raw values. `is_pinned` is nullable and `null !== false`
    // is true, so a null-against-false pair took this branch and returned 1 in
    // both directions — an inconsistent comparator, and rows with a NULL column
    // reordered between renders for no reason the user could see.
    const aPinned = Boolean(a.is_pinned);
    const bPinned = Boolean(b.is_pinned);
    if (aPinned !== bPinned) return aPinned ? -1 : 1;

    const aHasDue = !!a.due_date;
    const bHasDue = !!b.due_date;
    if (aHasDue !== bHasDue) return aHasDue ? -1 : 1;

    if (aHasDue && bHasDue) {
      return (
        new Date(a.due_date as string).getTime() -
        new Date(b.due_date as string).getTime()
      );
    }

    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}
