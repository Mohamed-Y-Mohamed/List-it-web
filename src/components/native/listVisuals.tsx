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
  CheckCircle2,
  Circle,
  ListChecks,
  Star,
  type LucideIcon,
} from "lucide-react";
import type { List, Note, Task } from "@/types/schema";
import { resolveColor } from "@/lib/colors";

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

export function ListInfo({
  list,
  tasks,
  notes,
  isPinnedCard,
}: {
  list: List;
  tasks: Task[];
  notes: Note[];
  isPinnedCard: boolean;
}) {
  const { taskCount, noteCount } = listCounts(list, tasks, notes);

  // iOS hides the counts on default lists and on pinned cards, where there is no
  // room for a second line.
  const showCounts = !list.is_default && !isPinnedCard;

  // The pinned rail lays out horizontally, so its label sits left-aligned on a
  // single line; the grid card centres a name that may wrap to two.
  return (
    <span
      className={`flex min-w-0 flex-col ${isPinnedCard ? "items-start" : "items-center"}`}
    >
      {/* On a grid card the name gets a box exactly two lines tall, whatever it
          holds, with the text centred inside it.

          Without that the row does not line up. `line-clamp-2` lets the box be one
          line or two, and the card centres its contents vertically — so "Today"
          (one line) and "Not Completed" (two) put their icons at different heights,
          and a row of three cards looked mis-set. Reserving the taller of the two
          makes every grid card the same height internally, so the icons align and
          each card is still centred in itself.

          2.75em is two lines of leading-snug (1.375), tied to the 13.5px name below
          rather than a magic pixel value, so it follows if that size changes. */}
      <span
        className={
          isPinnedCard ? undefined : "flex min-h-[2.75em] items-center"
        }
      >
        <span
          className={`text-[13.5px] font-semibold leading-snug tracking-[-0.01em] ${
            isPinnedCard
              ? "max-w-[9.5rem] truncate"
              : "line-clamp-2 text-center"
          }`}
        >
          {list.list_name || "Untitled"}
        </span>
      </span>
      {showCounts && (
        <span className="mt-1 text-[10.5px] font-medium tracking-[0.01em] text-gray-500 dark:text-gray-400">
          {taskCount} {taskCount === 1 ? "task" : "tasks"} · {noteCount}{" "}
          {noteCount === 1 ? "note" : "notes"}
        </span>
      )}
    </span>
  );
}
