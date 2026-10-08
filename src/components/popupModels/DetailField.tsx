"use client";

// One labelled line in a detail sheet's read-only view.
//
// The sheets open like this and only become a form when Edit is pressed, so this
// is what a task or a note looks like most of the time it is on screen. Reading
// something should not mean looking at a page of input boxes.
//
// `empty` rather than hiding the row: "Not scheduled" tells you the field exists
// and is unset, which is the thing you opened the sheet to find out. A row that
// vanishes when blank makes you wonder whether the app forgot it.

import React from "react";

export default function DetailField({
  label,
  value,
  empty = "Not set",
  isDark,
  tone = "default",
}: {
  label: string;
  value: string | null | undefined;
  /** Shown, greyed, when there is no value. */
  empty?: string;
  isDark: boolean;
  tone?: "default" | "muted";
}) {
  const text = value?.trim();

  return (
    <div className="space-y-1">
      <p
        className={`text-xs font-medium uppercase tracking-wide ${
          isDark ? "text-gray-500" : "text-gray-400"
        }`}
      >
        {label}
      </p>
      <p
        className={`whitespace-pre-wrap break-words text-[15px] ${
          !text
            ? isDark
              ? "text-gray-600"
              : "text-gray-400"
            : tone === "muted"
              ? isDark
                ? "text-gray-400"
                : "text-gray-500"
              : isDark
                ? "text-gray-100"
                : "text-gray-900"
        }`}
      >
        {text || empty}
      </p>
    </div>
  );
}
