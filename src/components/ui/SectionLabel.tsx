"use client";

// The small uppercase heading above a section of a detail sheet: DUE DATE,
// REMINDER, DESCRIPTION.
//
// A heading, not a card. The brief is explicit that a description should not be
// wrapped in a nested box, and the same applies to everything else here — the
// label and the spacing under it are what separate one section from the next, so
// a sheet reads as a document rather than a stack of panels.

import React from "react";

export default function SectionLabel({
  children,
  isDark,
  className = "",
}: {
  children: React.ReactNode;
  isDark: boolean;
  className?: string;
}) {
  return (
    <p
      className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${
        isDark ? "text-gray-500" : "text-gray-400"
      } ${className}`}
    >
      {children}
    </p>
  );
}
