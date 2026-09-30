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
 * The order every task screen puts its tasks in: pinned first, then those with
 * a due date, soonest first, then the rest oldest first.
 *
 * Returns a new array; the caller's is left alone.
 */
export function sortTasks(tasks: TaskRow[]): TaskRow[] {
  return [...tasks].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;

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
