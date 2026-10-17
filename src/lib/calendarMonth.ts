// lib/calendarMonth.ts
// The month-grid arithmetic behind the Scheduled calendar: which cells a month
// occupies, what the weekday strip reads, and the day comparisons the grid needs.
//
// Pure and free of React and of the Supabase client, for the same reason
// taskView.ts is: a wrong day-offset is the kind of bug that only shows up in
// one month of the year, and it should be provable in a test rather than by
// waiting for March.
//
// Everything here works in local time. The calendar is a thing the user reads
// against the clock on their wall, so UTC would be wrong by a day for half the
// planet half the year.

/** Midnight on the first of the month containing `date`. */
export function firstOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** Midnight on the given day, local time. */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** True when both fall on the same local day. */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** True when both fall in the same month of the same year. */
export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/**
 * The cells of a month grid, leading blanks included.
 *
 * `null` is a cell before the first of the month, which the grid renders as
 * empty space rather than as a day belonging to the month before — the iOS
 * calendar this mirrors does the same, and showing the tail of the previous
 * month would invite tapping a day this screen will not navigate to.
 *
 * `firstWeekday` is 0 for Sunday through 6 for Saturday, defaulting to Monday
 * for the UK convention the rest of the app assumes.
 */
export function monthGrid(month: Date, firstWeekday = 1): (Date | null)[] {
  const first = firstOfMonth(month);

  // How many blanks before the 1st. The `+ 7` keeps the result positive when
  // the month starts on a weekday earlier than the one the grid begins with.
  const offset = (first.getDay() - firstWeekday + 7) % 7;

  // Day 0 of the next month is the last day of this one, which is the shortest
  // correct way to ask and the only one that needs no leap-year special case.
  const daysInMonth = new Date(
    first.getFullYear(),
    first.getMonth() + 1,
    0,
  ).getDate();

  const cells: (Date | null)[] = Array(offset).fill(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(first.getFullYear(), first.getMonth(), day));
  }
  return cells;
}

/**
 * The weekday strip, rotated so it starts on `firstWeekday`.
 *
 * The labels are localised but the rotation is not inferred from the locale:
 * `Intl.Locale.weekInfo` is not reliably present in the Android WebView this
 * ships inside, and a strip that silently starts on the wrong day is worse than
 * one that always starts where the caller asked.
 */
export function weekdaySymbols(firstWeekday = 1, locale?: string): string[] {
  // 7 January 2024 was a Sunday, so it is the zero point for `getDay()`.
  const sunday = new Date(2024, 0, 7);

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(sunday);
    day.setDate(sunday.getDate() + ((firstWeekday + index) % 7));
    return day.toLocaleDateString(locale, { weekday: "narrow" });
  });
}
