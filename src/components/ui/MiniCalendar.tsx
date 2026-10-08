"use client";

// A month grid. One component behind every date decision in the app: the due
// date on a task, a custom reminder, and the quick picks that sit above them.
//
//   ‹      October 2026      ›
//   M  T  W  T  F  S  S
//
// Monday-first, because the brief writes the header row as `M T W T F S S` and
// the app's users are in the UK. It is a deliberate choice rather than a locale
// lookup: a calendar that silently reorders itself between devices is harder to
// read than one that is always the same shape.
//
// Dates are handled as `YYYY-MM-DD` strings throughout, never as Date objects.
// That is the form the rest of the app stores a date-only value in — see
// `composeDue` in lib/reminders.ts — and it sidesteps the whole class of bug
// where a Date built at local midnight lands on the previous day once it is read
// back in UTC.

import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PRIMARY } from "./tokens";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"] as const;

/** `YYYY-MM-DD` for a local date, with no timezone round trip. */
export function toDateKey(date: Date): string {
  const pad = (n: number) => `${n}`.padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Today, tomorrow, and so on as a key the calendar can select. */
export function dateKeyFromToday(dayOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  return toDateKey(date);
}

/**
 * How a chosen date reads on a chip: `Mon 5 Oct`, or `Mon 5 Oct · 17:00`.
 *
 * Built from the key rather than a Date so it cannot disagree with the grid about
 * which day is selected.
 */
export function formatDateKey(key: string, time?: string | null): string {
  const [year, month, day] = key.split("-").map(Number);
  if (!year || !month || !day) return "";
  const date = new Date(year, month - 1, day);
  const label = date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return time ? `${label} · ${time}` : label;
}

/** Which weekday index (0 = Monday) the 1st of this month falls on. */
function leadingBlanks(year: number, month: number): number {
  // getDay() is Sunday-first; shift it so Monday is 0.
  return (new Date(year, month, 1).getDay() + 6) % 7;
}

export default function MiniCalendar({
  /** The selected day as `YYYY-MM-DD`, or null for nothing selected. */
  value,
  onChange,
  /** Days before this key are not selectable. Pass today's key to block the past. */
  min,
  /** Days after this key are not selectable. Used to cap a reminder at its due date. */
  max,
  isDark,
}: {
  value: string | null;
  onChange: (key: string) => void;
  min?: string;
  max?: string;
  isDark: boolean;
}) {
  const todayKey = toDateKey(new Date());

  // The month on screen. Starts on the selected day's month so opening the editor
  // for a task due in December does not begin in October.
  const [cursor, setCursor] = useState(() => {
    const seed = value ?? todayKey;
    const [year, month] = seed.split("-").map(Number);
    return { year: year || new Date().getFullYear(), month: (month || 1) - 1 };
  });

  const days = useMemo(() => {
    const count = new Date(cursor.year, cursor.month + 1, 0).getDate();
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [cursor]);

  const blanks = leadingBlanks(cursor.year, cursor.month);

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(
    undefined,
    { month: "long", year: "numeric" },
  );

  const step = (delta: number) => {
    setCursor((c) => {
      const next = new Date(c.year, c.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  };

  const keyFor = (day: number) =>
    `${cursor.year}-${`${cursor.month + 1}`.padStart(2, "0")}-${`${day}`.padStart(2, "0")}`;

  const navClass = `flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
    isDark
      ? "text-gray-300 active:bg-white/10"
      : "text-gray-600 active:bg-black/5"
  }`;

  return (
    <div>
      <div className="flex items-center justify-between pb-2">
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label="Previous month"
          className={navClass}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span
          className={`text-[14px] font-semibold ${isDark ? "text-gray-100" : "text-gray-900"}`}
          aria-live="polite"
        >
          {monthLabel}
        </span>
        <button
          type="button"
          onClick={() => step(1)}
          aria-label="Next month"
          className={navClass}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1 pb-1">
        {WEEKDAYS.map((day, i) => (
          <span
            key={`${day}${i}`}
            aria-hidden="true"
            className={`text-center text-[11px] font-medium ${
              isDark ? "text-gray-600" : "text-gray-400"
            }`}
          >
            {day}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells, not an offset on the first button: a grid whose first item
            starts in column four needs the three before it to exist, or the row
            heights stop lining up once a month begins on a Sunday. */}
        {Array.from({ length: blanks }, (_, i) => (
          <span key={`blank-${i}`} aria-hidden="true" />
        ))}

        {days.map((day) => {
          const key = keyFor(day);
          const selected = key === value;
          const isToday = key === todayKey;
          const blocked = Boolean((min && key < min) || (max && key > max));

          return (
            <button
              key={key}
              type="button"
              disabled={blocked}
              aria-pressed={selected}
              aria-label={formatDateKey(key)}
              onClick={() => onChange(key)}
              className={`flex h-9 items-center justify-center rounded-full text-[13px] transition-colors disabled:opacity-25 ${
                selected
                  ? "font-semibold text-white"
                  : isToday
                    ? isDark
                      ? "border border-white/25 text-gray-100"
                      : "border border-black/20 text-gray-900"
                    : isDark
                      ? "text-gray-300 active:bg-white/10"
                      : "text-gray-700 active:bg-black/5"
              }`}
              style={selected ? { backgroundColor: PRIMARY } : undefined}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
