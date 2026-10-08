"use client";

// What the four task colours mean, on demand.
//
// This used to be a legend strip rendered inside every collection, under the
// Tasks/Notes switch. With more than one collection open it repeated down the
// screen, and it cost four lines of chrome on every list whether or not anyone
// still needed reminding — a legend is something you read once.
//
// So it moves behind an info button next to the list's name, and says more than
// four words could: the strip could name the states but had no room to explain
// why a pinned task sometimes reads as Flagged, which is the only part anyone
// actually asks about.
//
// Colours come from `STATUS_META`, the same map the cards read, so this cannot
// drift from what is on screen. The order is the ranking order used by
// `taskStatus()` rather than the old legend's, because the ranking is the thing
// being explained.
//
// Shared by both platforms: ModalShell renders a bottom sheet on native and a
// centred dialog on the web, and it portals to the body — which matters here,
// since this opens from inside list and collection views that carry their own
// transforms and overflow clipping.

import React from "react";
import ModalShell from "./ModalShell";
import { STATUS_META } from "./tokens";

const STATUS_HELP: { label: string; colour: string; meaning: string }[] = [
  {
    label: "Normal",
    colour: STATUS_META.normal.colour,
    meaning: "An ordinary task. Not pinned, and nothing is late.",
  },
  {
    label: STATUS_META.pinned.label,
    colour: STATUS_META.pinned.colour,
    meaning: "You marked it important. Pinned tasks sort above the rest.",
  },
  {
    label: STATUS_META.flagged.label,
    colour: STATUS_META.flagged.colour,
    meaning:
      "Pinned and carrying a due date, so it is important and it is coming up.",
  },
  {
    label: STATUS_META.overdue.label,
    colour: STATUS_META.overdue.colour,
    meaning:
      "Past its due date. Overdue beats the others: a pinned task you have missed is still missed.",
  },
];

export default function TaskStatusInfo({
  isOpen,
  onClose,
  isDark,
}: {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}) {
  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="What the colours mean"
      isDark={isDark}
    >
      <p
        className={`mb-4 text-[13px] ${isDark ? "text-gray-400" : "text-gray-600"}`}
      >
        Every task carries one of four states. The stripe down the left of a card
        and the label on its right are the same colour.
      </p>

      <ul className="space-y-3.5">
        {STATUS_HELP.map((status) => (
          <li key={status.label} className="flex gap-3">
            {/* `mt-[5px]` sits the dot on the first line's optical centre rather
                than the top of its box, which `items-start` alone does not do. */}
            <span
              className="mt-[5px] h-2.5 w-2.5 shrink-0 rounded-full"
              style={{
                backgroundColor: status.colour,
                boxShadow: `0 0 0 3px ${status.colour}1F`,
              }}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1">
              <span
                className={`block text-[14px] font-semibold ${
                  isDark ? "text-gray-100" : "text-gray-900"
                }`}
              >
                {status.label}
              </span>
              <span
                className={`block text-[13px] leading-snug ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {status.meaning}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </ModalShell>
  );
}
