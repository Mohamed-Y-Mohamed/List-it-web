// utils/dateUtils.ts
// Shared date formatting utilities used across task, note, and dashboard components.

import { isValid } from "date-fns";

/**
 * Safely convert a Date, ISO string, or null/undefined to a Date object.
 * Returns null if the input is falsy or invalid.
 */
export const toDateObject = (
  date: Date | string | null | undefined
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
  date: Date | string | null | undefined
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
  date: Date | string | null | undefined
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
 * Format a date with full detail: "Jan 15, 2024, 02:30 PM".
 * Used in the task sidebar detail view.
 * Returns "Unknown date" for falsy input, "Invalid date" for unparsable values.
 */
export const formatDetailDate = (
  date: Date | string | null | undefined
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
