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

/** Falls back to the system blue iOS uses when a list has no colour recorded. */
export function listColor(list: List): string {
  return list.bg_color_hex?.trim() || "#007AFF";
}

/** The orange count capsule beside each section heading. */
export function CountBadge({ count }: { count: number }) {
  return (
    <span
      className="rounded-full px-2.5 py-1 text-[14px] font-semibold text-white"
      style={{ backgroundColor: "#FF9500" }}
    >
      {count}
    </span>
  );
}

/** Circular icon with the list's colour as a diagonal gradient. 30pt on iOS. */
export function ListIcon({ list }: { list: List }) {
  const color = listColor(list);
  const Icon = iconForList(list);

  return (
    <span
      className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full"
      style={{
        backgroundImage: `linear-gradient(135deg, ${color} 0%, ${color}b3 100%)`,
      }}
    >
      <Icon size={16} className="text-white" strokeWidth={2.25} />
    </span>
  );
}

/** The coloured bar down the leading edge of a card. */
export function ListSideBar({
  list,
  width,
  inset,
}: {
  list: List;
  width: number;
  inset?: boolean;
}) {
  return (
    <span
      className="absolute left-0 rounded-l-[9px]"
      style={{
        width,
        backgroundColor: listColor(list),
        top: inset ? 10 : 0,
        bottom: inset ? 10 : 0,
      }}
      aria-hidden="true"
    />
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

  return (
    <span className="flex min-w-0 flex-col items-center">
      <span className="line-clamp-3 text-center text-[14px] font-semibold leading-tight">
        {list.list_name || "Untitled"}
      </span>
      {showCounts && (
        <span className="mt-0.5 text-[10px] text-gray-500">
          {taskCount} {taskCount === 1 ? "Task" : "Tasks"} • {noteCount}{" "}
          {noteCount === 1 ? "Note" : "Notes"}
        </span>
      )}
    </span>
  );
}
