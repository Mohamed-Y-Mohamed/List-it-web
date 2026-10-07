"use client";

// The compact due-date chip: `Mon 5 Oct`, or `Mon 5 Oct · 17:00`.
//
// Sky/info treatment normally, rose once the date has passed and the task is
// still open. Restrained on purpose — the brief asks for the due information to
// carry the emphasis, not the whole card, so this tints its own background at low
// strength rather than filling.

import React from "react";
import { DANGER, INFO } from "./tokens";

export default function DateChip({
  label,
  overdue = false,
  isDark,
  className = "",
}: {
  label: string;
  overdue?: boolean;
  isDark: boolean;
  className?: string;
}) {
  const tone = overdue ? DANGER : INFO;

  return (
    <span
      className={`inline-flex min-h-[28px] items-center rounded-full px-2.5 text-[12px] font-medium ${className}`}
      style={{
        // 16% in dark, 12% on white: the same mix reads heavier on a light ground.
        backgroundColor: `color-mix(in srgb, ${tone} ${isDark ? 16 : 12}%, transparent)`,
        color: tone,
      }}
    >
      {label}
    </span>
  );
}
