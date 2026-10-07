"use client";

// The visual vocabulary of a list card, ported from the iOS app so the Android
// build reads as the same product.
//
// Measurements are taken directly from AllListsView.swift — SwiftUI points map 1:1
// to CSS pixels here, so a 100pt card is 100px and a 1.5pt border is 1.5px.

import React from "react";
import {
  AlertCircle,
  Calendar,
  CalendarClock,
  CalendarRange,
  CheckCircle2,
  Circle,
  ListChecks,
  Star,
  Sun,
  type LucideIcon,
} from "lucide-react";
import type { List, Note, Task } from "@/types/schema";
import { resolveColor } from "@/lib/colors";
import ScrollingText from "./ScrollingText";

// `list_icon` holds an SF Symbol name, written by the iOS app and by ListPopup.
// Only default lists use their stored icon; user lists always show the checklist,
// exactly as `list.isDefault ? list.listIcon : "checklist"` does on iOS.
const SF_SYMBOL_TO_ICON: Record<string, LucideIcon> = {
  checklist: ListChecks,
  calendar: Calendar,
  "calendar.badge.clock": CalendarClock,
  "star.fill": Star,
  "checkmark.circle": CheckCircle2,
  circle: Circle,
  "exclamationmark.circle": AlertCircle,
  "sun.max": Sun,
  "calendar.badge.exclamationmark": CalendarRange,
};

export function iconForList(list: List): LucideIcon {
  if (!list.is_default) return ListChecks;
  return SF_SYMBOL_TO_ICON[list.list_icon ?? ""] ?? ListChecks;
}

/**
 * Falls back to the system blue iOS uses when a list has no colour recorded.
 *
 * resolveColor rather than a bare `|| ` so a malformed stored value — not just an
 * empty one — also lands on the fallback. The fallback stays this screen's own blue
 * rather than the shared default, which is the same colour anyway.
 */
export function listColor(list: List): string {
  return resolveColor(list.bg_color_hex, "#007AFF");
}

/**
 * The orange count capsule beside each section heading.
 *
 * Stepped down from `px-2.5 py-1 text-[14px]`. At that size it was nearly as tall
 * as the 24px heading it annotates, which made a secondary number compete with the
 * section title. It is a count, not a control.
 */
export function CountBadge({ count }: { count: number }) {
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
      style={{ backgroundColor: "#FF9500" }}
    >
      {count}
    </span>
  );
}

/**
 * The list's colour, carried by a rounded-square icon chip rather than a circle.
 * The squircle reads as an app glyph rather than an avatar, and is the single
 * place colour appears at full strength — everything else on the card only tints.
 */
export function ListIcon({ list, size = 34 }: { list: List; size?: number }) {
  const color = listColor(list);
  const Icon = iconForList(list);

  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-[11px]"
      style={{
        width: size,
        height: size,
        backgroundImage: `linear-gradient(140deg, ${color} 0%, ${color}cc 100%)`,
        // A colour-matched lift, kept low so cards do not look like stickers.
        boxShadow: `0 2px 6px ${color}40`,
      }}
    >
      <Icon size={Math.round(size * 0.5)} className="text-white" strokeWidth={2.2} />
    </span>
  );
}

/** Counts shown under a list's name. Mirrors the iOS filter rules exactly. */
export function listCounts(list: List, tasks: Task[], notes: Note[]) {
  return {
    taskCount: tasks.filter(
      (task) =>
        task.list_id === list.id && !task.is_deleted && !task.is_completed
    ).length,
    noteCount: notes.filter((note) => note.list_id === list.id && !note.is_deleted)
      .length,
  };
}

/**
 * Which card the label is sitting in. Was a single `isPinnedCard` boolean, which
 * conflated two separate questions — how the text aligns, and whether the counts
 * show — and the row card needs the pinned card's alignment with the grid card's
 * counts.
 */
export type ListInfoShape = "grid" | "pinned" | "row";

export function ListInfo({
  list,
  tasks,
  notes,
  shape,
}: {
  list: List;
  tasks: Task[];
  notes: Note[];
  shape: ListInfoShape;
}) {
  const { taskCount, noteCount } = listCounts(list, tasks, notes);

  // iOS hides the counts on default lists, which are views rather than containers,
  // and on the pinned rail, where there is no room for a second line. A full-width
  // row has the room, so it keeps them.
  const showCounts = !list.is_default && shape !== "pinned";

  // Every shape is a single line now; the grid centres its name, the rail and the
  // row left-align theirs.
  const isGrid = shape === "grid";

  return (
    <span
      className={`flex min-w-0 flex-col ${isGrid ? "items-center" : "items-start"}`}
    >
      {/* One line, always, on the grid and the row alike.

          It used to be `line-clamp-2` inside a box held at two lines tall, so that
          "Today" and "Not Completed" put their icons at the same height. A name
          longer than two lines was still cut off with no way to read it, and
          wrapped text cannot scroll — a horizontal travel means nothing once the
          words are stacked. Single line plus ScrollingText reads any length, and
          one line is the same height on every card, so the two-line reserve that
          existed only to align the icons is no longer needed to do it. */}
      {shape === "pinned" ? (
        // The rail scrolls sideways and its cards are capped rather than sized by
        // their content, so there is no box to measure a name against.
        <span className="max-w-[9.5rem] truncate text-[13.5px] font-semibold leading-snug tracking-[-0.01em]">
          {list.list_name || "Untitled"}
        </span>
      ) : (
        <ScrollingText
          // `text-left` is not redundant. The card is a <button>, which centres its
          // text by default, and the name now sits in a full-width box rather than
          // a span sized by its own content — so on a row the inherited centring
          // became visible, with the name over the middle and the counts under it
          // on the left.
          className={`text-[13.5px] font-semibold leading-snug tracking-[-0.01em] ${
            isGrid ? "text-center" : "text-left"
          }`}
        >
          {list.list_name || "Untitled"}
        </ScrollingText>
      )}
      {/* No blank line is reserved when the counts are hidden.

          It used to be, so that a built-in card and a user card kept their icons
          at the same height. But a built-in card has nothing to put there, so the
          reservation was empty space under the name with none above it, and the
          card read as bottom-heavy. The two kinds live in separate grids, so the
          only thing the reserve bought was alignment between grids that are never
          in the same row. Without it each card is centred on what it actually
          holds, and a built-in one is simply shorter. */}
      {showCounts && (
        <span className="mt-1 text-[10.5px] font-medium tracking-[0.01em] text-gray-500 dark:text-gray-400">
          {taskCount} {taskCount === 1 ? "task" : "tasks"} · {noteCount}{" "}
          {noteCount === 1 ? "note" : "notes"}
        </span>
      )}
    </span>
  );
}
