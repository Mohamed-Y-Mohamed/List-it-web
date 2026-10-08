"use client";

// Nothing here yet.
//
// Short title, one supporting sentence, one action if there is a sensible one.
// The old version was a 16rem-tall panel with a 40px glyph in a tinted circle,
// which made an empty screen the loudest screen in the app — and on a phone it
// pushed the one useful control below the fold.
//
// The icon survives at half the size and without the circle. It is a quiet mark
// saying which kind of empty this is, not an illustration.

import React from "react";
import { useTheme } from "@/context/ThemeContext";
import { CheckCircle2, CalendarClock, Plus } from "lucide-react";
import { PRIMARY } from "@/components/ui/tokens";

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: "check" | "calendar" | "plus";
  actionLabel?: string;
  onAction?: () => void;
}

const ICONS = {
  check: CheckCircle2,
  calendar: CalendarClock,
  plus: Plus,
} as const;

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  icon = "check",
  actionLabel,
  onAction,
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const Icon = ICONS[icon] ?? CheckCircle2;

  return (
    <div
      className={`rounded-2xl border px-5 py-8 text-center ${
        isDark
          ? "border-white/[0.08] bg-[#131A2B]"
          : "border-black/[0.06] bg-white"
      }`}
    >
      <Icon
        className={`mx-auto h-5 w-5 ${isDark ? "text-gray-600" : "text-gray-300"}`}
        aria-hidden="true"
      />
      <p
        className={`pt-2.5 text-[15px] font-semibold ${
          isDark ? "text-gray-100" : "text-gray-900"
        }`}
      >
        {title}
      </p>
      <p
        className={`mx-auto max-w-xs pt-1 text-[13px] leading-relaxed ${
          isDark ? "text-gray-400" : "text-gray-500"
        }`}
      >
        {message}
      </p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 min-h-[40px] rounded-xl px-4 text-[14px] font-semibold text-white transition-opacity active:opacity-85"
          style={{ backgroundColor: PRIMARY }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
