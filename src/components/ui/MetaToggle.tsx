"use client";

// A compact on/off pill for the meta controls near the top of a detail sheet.
//
// Deliberately not a card. The brief asks for these to stay small, and the
// previous version of this row was three 56px-tall tiles that took more vertical
// space than the task's own description.
//
// 44px minimum height even so — it is the smallest target worth shipping on a
// touchscreen, and a pill that reads as compact can still be comfortably tappable
// because the padding does the work rather than the font size.

import React from "react";

export default function MetaToggle({
  icon,
  label,
  activeLabel,
  active,
  /** Hex for the on-state fill. Amber for pin, green for completion. */
  tone,
  onClick,
  disabled,
  isDark,
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  /** Shown instead of `label` when on. Falls back to `label`. */
  activeLabel?: string;
  active: boolean;
  tone: string;
  onClick: () => void;
  disabled?: boolean;
  isDark: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border px-3 text-[13px] font-medium transition-colors disabled:opacity-50 ${
        active
          ? "border-transparent text-white"
          : isDark
            ? "border-white/[0.08] bg-white/[0.04] text-gray-300"
            : "border-black/[0.06] bg-black/[0.03] text-gray-600"
      } ${className}`}
      style={active ? { backgroundColor: tone } : undefined}
    >
      {icon}
      <span className="truncate">{active ? (activeLabel ?? label) : label}</span>
    </button>
  );
}
