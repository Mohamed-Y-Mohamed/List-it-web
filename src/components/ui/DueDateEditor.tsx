"use client";

// The due-date editor: quick picks, a month grid, Done/Cancel.
//
// It commits on Done rather than on every tap. A date picker that writes straight
// through is fine when it is the only field on screen, but this one sits inside a
// sheet that already has an unsaved-changes guard, and a stray tap on the grid
// while scrolling should not be a change the user then has to discard.
//
// There is no time field. A due date is a day, which is what the iOS picker
// collects — `DatePicker(..., displayedComponents: [.date])` — and the day is
// stored as a UTC-noon marker. The optional time this editor used to offer
// existed to anchor the reminder offsets; those have gone, and the reminder is
// now an instant the user picks outright, so nothing is left that needed it.

import React, { useState } from "react";
import MiniCalendar, { dateKeyFromToday, toDateKey } from "./MiniCalendar";
import { INFO } from "./tokens";

export default function DueDateEditor({
  /** `YYYY-MM-DD`, or null when the task has no due date. */
  date,
  onDone,
  onCancel,
  /** Whether to offer Clear. Hidden when there is nothing to clear. */
  canClear,
  isDark,
}: {
  date: string | null;
  onDone: (date: string | null) => void;
  onCancel: () => void;
  canClear: boolean;
  isDark: boolean;
}) {
  const [draftDate, setDraftDate] = useState<string | null>(date);

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
            onClick={() => setDraftDate(null)}
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

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onDone(draftDate)}
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
