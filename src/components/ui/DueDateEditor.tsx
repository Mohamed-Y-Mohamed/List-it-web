"use client";

// The due-date editor: quick picks, a month grid, an optional time, Done/Cancel.
//
// It commits on Done rather than on every tap. A date picker that writes straight
// through is fine when it is the only field on screen, but this one sits inside a
// sheet that already has an unsaved-changes guard, and a stray tap on the grid
// while scrolling should not be a change the user then has to discard.
//
// Time is optional and stays optional. Without one the app stores the day as a
// UTC-noon marker and treats it as 09:00 local wherever a time of day is needed
// — that convention predates this editor and is relied on by the reminder
// offsets, so the helper text says so rather than quietly defaulting the field.

import React, { useState } from "react";
import { Clock } from "lucide-react";
import MiniCalendar, { dateKeyFromToday, toDateKey } from "./MiniCalendar";
import { INFO } from "./tokens";

export default function DueDateEditor({
  /** `YYYY-MM-DD`, or null when the task has no due date. */
  date,
  /** `HH:MM`, or null/empty when no time was picked. */
  time,
  onDone,
  onCancel,
  /** Whether to offer Clear. Hidden when there is nothing to clear. */
  canClear,
  isDark,
}: {
  date: string | null;
  time: string | null;
  onDone: (date: string | null, time: string | null) => void;
  onCancel: () => void;
  canClear: boolean;
  isDark: boolean;
}) {
  const [draftDate, setDraftDate] = useState<string | null>(date);
  const [draftTime, setDraftTime] = useState<string>(time ?? "");

  const todayKey = toDateKey(new Date());
  const tomorrowKey = dateKeyFromToday(1);

  const quick: { label: string; key: string | null }[] = [
    { label: "Today", key: todayKey },
    { label: "Tomorrow", key: tomorrowKey },
  ];

  const chipClass = (selected: boolean) =>
    `min-h-[36px] rounded-full px-3.5 text-[13px] font-medium transition-colors ${
      selected
        ? "text-white"
        : isDark
          ? "bg-white/[0.06] text-gray-300"
          : "bg-black/[0.04] text-gray-700"
    }`;

  const fieldClass = isDark
    ? "border-white/[0.08] bg-white/[0.04] text-gray-100"
    : "border-black/[0.08] bg-white text-gray-900";

  return (
    <div
      className={`space-y-4 rounded-2xl border p-3.5 ${
        isDark
          ? "border-white/[0.08] bg-white/[0.03]"
          : "border-black/[0.06] bg-black/[0.02]"
      }`}
    >
      <div className="flex flex-wrap gap-2">
        {quick.map((option) => {
          const selected = draftDate === option.key;
          return (
            <button
              key={option.label}
              type="button"
              onClick={() => setDraftDate(option.key)}
              className={chipClass(selected)}
              style={selected ? { backgroundColor: INFO } : undefined}
            >
              {option.label}
            </button>
          );
        })}
        {canClear && (
          <button
            type="button"
            onClick={() => {
              setDraftDate(null);
              setDraftTime("");
            }}
            className={`min-h-[36px] rounded-full px-3.5 text-[13px] font-medium transition-colors ${
              isDark
                ? "bg-white/[0.06] text-rose-300"
                : "bg-black/[0.04] text-rose-600"
            }`}
          >
            Clear date
          </button>
        )}
      </div>

      <MiniCalendar
        value={draftDate}
        onChange={setDraftDate}
        min={todayKey}
        isDark={isDark}
      />

      {/* Only once there is a day to attach it to. A time with no date is not
          something this app can store — `composeDue` returns null without a
          date — so offering the field first would be offering nothing. */}
      {draftDate && (
        <div>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
              <Clock
                className={`h-4 w-4 ${isDark ? "text-gray-500" : "text-gray-400"}`}
              />
            </span>
            <input
              type="time"
              value={draftTime}
              aria-label="Time, optional"
              onChange={(event) => setDraftTime(event.target.value)}
              className={`min-h-[44px] w-full rounded-xl border pl-10 pr-3 text-[14px] focus:outline-none focus:ring-1 ${fieldClass}`}
              style={{ ["--tw-ring-color" as string]: INFO }}
            />
          </div>
          {!draftTime && (
            <p
              className={`pt-1.5 text-[11px] ${isDark ? "text-gray-500" : "text-gray-400"}`}
            >
              Optional. With no time it is due any time that day.
            </p>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() =>
            onDone(draftDate, draftDate ? draftTime || null : null)
          }
          className="min-h-[44px] flex-1 rounded-xl text-[14px] font-semibold text-white transition-opacity active:opacity-80"
          style={{ backgroundColor: INFO }}
        >
          Done
        </button>
        <button
          type="button"
          onClick={onCancel}
          className={`min-h-[44px] flex-1 rounded-xl border text-[14px] font-medium transition-colors ${
            isDark
              ? "border-white/[0.08] text-gray-300 active:bg-white/10"
              : "border-black/[0.08] text-gray-700 active:bg-black/5"
          }`}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
