"use client";

// A switch with a body that only exists when the switch is on.
//
// Repeat and Reminders both hang off one of these, in both task sheets, on both
// platforms. The point is that a task using neither looks exactly as it did before
// either feature existed: two rows of chrome, no pickers, no calendars, nothing to
// read past. Untouched means off and collapsed, and the row says what it is set to
// without being opened.
//
// The header is the switch's label as well as its summary, so the whole row is the
// target rather than a 28px pill at the end of it.

import React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export default function ToggleSection({
  icon,
  title,
  summary,
  enabled,
  onToggle,
  isDark,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  /** What it is currently set to, shown whether open or shut. */
  summary: string;
  enabled: boolean;
  onToggle: (next: boolean) => void;
  isDark: boolean;
  children: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className={`rounded-2xl border ${
        isDark ? "border-gray-700 bg-gray-800/40" : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-center gap-3 p-4">
        <span className={isDark ? "text-gray-400" : "text-gray-500"}>
          {icon}
        </span>

        <span className="min-w-0 flex-1">
          <span
            className={`block text-sm font-medium ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            {title}
          </span>
          <span
            className={`block truncate text-xs ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {summary}
          </span>
        </span>

        {/* Lifted from the dark-mode switch in Settings, including its `left-0`
            anchor — without it the knob takes its static position at the end of
            the button and the translate pushes it clean outside the pill. */}
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={title}
          onClick={() => onToggle(!enabled)}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ${
            enabled ? "bg-orange-500" : isDark ? "bg-gray-600" : "bg-gray-300"
          }`}
        >
          <span
            className={`absolute left-0 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
              enabled ? "translate-x-[26px]" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* height:auto is the one layout property worth animating here — there is no
          transform that opens a box whose height nobody knows yet. It is confined
          to this element and runs on an interaction, not on scroll. */}
      <AnimatePresence initial={false}>
        {enabled && (
          <motion.div
            key="body"
            initial={reduceMotion ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{
              duration: reduceMotion ? 0 : 0.2,
              ease: [0.23, 1, 0.32, 1],
            }}
            className="overflow-hidden"
          >
            <div
              className={`border-t px-4 py-4 ${
                isDark ? "border-gray-700" : "border-gray-200"
              }`}
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
