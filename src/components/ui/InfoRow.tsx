"use client";

// One of the text-first relationship rows at the foot of a detail sheet:
//
//   Collection             University
//   List                   Personal
//
// No icon. The brief says these need none, and it is right — a folder glyph next
// to the word "Collection" tells you nothing the word did not already, and two of
// them in a row start to look like controls you can press.

import React from "react";

export default function InfoRow({
  label,
  value,
  empty = "None",
  isDark,
}: {
  label: string;
  value: string | null | undefined;
  empty?: string;
  isDark: boolean;
}) {
  const text = value?.trim();

  return (
    <div className="flex min-h-[32px] items-baseline justify-between gap-4">
      <span className={`text-[13px] ${isDark ? "text-gray-500" : "text-gray-400"}`}>
        {label}
      </span>
      <span
        className={`min-w-0 truncate text-right text-[13px] ${
          text
            ? isDark
              ? "text-gray-200"
              : "text-gray-700"
            : isDark
              ? "text-gray-600"
              : "text-gray-400"
        }`}
      >
        {text || empty}
      </span>
    </div>
  );
}
