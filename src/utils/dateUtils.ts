// utils/dateUtils.ts
// Shared date formatting utilities used across task, note, and dashboard components.

import { isValid } from "date-fns";

/**
 * Safely convert a Date, ISO string, or null/undefined to a Date object.
 * Returns null if the input is falsy or invalid.
 */
export const toDateObject = (
  date: Date | string | null | undefined,
): Date | null => {
  if (!date) return null;
  try {
    const d = date instanceof Date ? date : new Date(date);
    return isValid(d) ? d : null;
  } catch {
    return null;
  }
};

/**
 * Format a date for short display: "Jan 15" or "Jan 15, 2023" when the year
 * differs from the current year.  Used on task cards and note cards.
 * Returns "No date" for falsy input, "Invalid date" for unparsable values.
 */
export const formatDisplayDate = (
  date: Date | string | null | undefined,
): string => {
  if (!date) return "No date";
  try {
    const d = date instanceof Date ? date : new Date(date);
    if (!isValid(d)) return "Invalid date";
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year:
        d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    });
  } catch {
    return "Invalid date";
  }
};

/**
 * Format a time portion for short display: "02:30 PM".
 * Returns an empty string for falsy or invalid input.
 * Used alongside `formatDisplayDate` on task cards.
 */
export const formatDisplayTime = (
  date: Date | string | null | undefined,
): string => {
  if (!date) return "";
  try {
    const d = date instanceof Date ? date : new Date(date);
    if (!isValid(d)) return "";
    return d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

/**
 * A task's due date and time as a card should show them.
 *
 * Which timezone to read it in depends on what kind of due date it is, and
 * getting that wrong is visible: a date-only task is stored at **UTC noon** as
 * a marker, so it has to be read back in UTC. Read locally, one stored late in
 * the evening renders as the following day — and the cards also printed the
 * stored midnight as if it were a deadline the user had set.
 *
 * `TasksDetails` already made this distinction in `formatDateForInput`, which
 * is why the card and the detail sheet disagreed about the same task: the card
 * said "Oct 4 · 12:37 AM" where the sheet said "Sat, Oct 3". One rule, used by
 * both cards, so they cannot drift again.
 */
export const formatTaskDue = (
  date: Date | string | null | undefined,
  hasTime: boolean | null | undefined,
): { date: string | null; time: string | null } => {
  if (!date) return { date: null, time: null };

  try {
    const d = date instanceof Date ? date : new Date(date);
    if (!isValid(d)) return { date: null, time: null };

    // Any falsy value counts as date-only, null included. That is not a guess:
    // the detail sheet decides with `Boolean(task.due_has_time)`, and a card
    // that treated null as "unknown, read it locally" would disagree with the
    // sheet for every row where the column was never written.
    if (!hasTime) {
      return {
        date: d.toLocaleDateString(undefined, {
          timeZone: "UTC",
          month: "short",
          day: "numeric",
          year:
            d.getUTCFullYear() !== new Date().getUTCFullYear()
              ? "numeric"
              : undefined,
        }),
        time: null,
      };
    }

    return { date: formatDisplayDate(d), time: formatDisplayTime(d) };
  } catch {
    return { date: null, time: null };
  }
};

/**
 * Format a date with full detail: "Jan 15, 2024, 02:30 PM".
 * Used in the task sidebar detail view.
 * Returns "Unknown date" for falsy input, "Invalid date" for unparsable values.
 */
export const formatDetailDate = (
  date: Date | string | null | undefined,
): string => {
  if (!date) return "Unknown date";
  try {
    const d = date instanceof Date ? date : new Date(date);
    if (!isValid(d)) return "Invalid date";
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Invalid date";
  }
};

/**
 * Format a date string as a human-readable relative time ("Just now", "2h ago",
 * "Yesterday", "3 days ago").  Falls back to `formatDisplayDate` for dates
 * older than 6 days.  Used in the dashboard activity feed.
 */
export const formatTimeAgo = (dateString: string): string => {
  try {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    if (!isValid(date)) return "Invalid date";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 6) return formatDisplayDate(dateString);
    if (diffDay > 0) return diffDay === 1 ? "Yesterday" : `${diffDay} days ago`;
    if (diffHour > 0) return `${diffHour}h ago`;
    if (diffMin > 0) return `${diffMin}m ago`;
    return "Just now";
  } catch {
    return "Unknown";
  }
};
