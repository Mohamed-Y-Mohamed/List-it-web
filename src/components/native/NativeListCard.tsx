"use client";

// The list card shapes on the Lists screen:
//
//   * grid   — 100pt tall, three to a row, icon above a centred name and counts
//   * pinned — 50pt tall, laid out horizontally, scrolls sideways
//   * row    — full width, one per line, icon beside a left-aligned name and counts
//
// The first two are ports of the iOS lists screen. `row` is what the List layout
// setting switches the user's own lists to, and is the shape the swipe actions need:
// a full-width row has somewhere for a panel to come from, where a card one third of
// the screen wide does not.
//
// Colour identifies a list through a faint wash and a hairline edge, with the
// icon chip carrying it at full strength. Every variant opens its context menu
// on a long press.

import React from "react";
import { ChevronRight } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useLongPress } from "@/hooks/useLongPress";
import type { List, Note, Task } from "@/types/schema";
import { ListIcon, ListInfo, listColor } from "./listVisuals";

interface NativeListCardProps {
  list: List;
  tasks: Task[];
  notes: Note[];
  variant: "grid" | "pinned" | "row";
  onOpen: () => void;
  /** Omitted for the built-in default lists, which have nothing to pin or edit. */
  onLongPress?: (position: { x: number; y: number }) => void;
}

export default function NativeListCard({
  list,
  tasks,
  notes,
  variant,
  onOpen,
  onLongPress,
}: NativeListCardProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const color = listColor(list);
  const isGrid = variant === "grid";
  const isRow = variant === "row";

  // Colour identifies the list without shouting: a faint wash over the surface
  // and a hairline edge, with the icon carrying it at full strength. The earlier
  // treatment stacked a 1.5px solid border, a solid side bar and a coloured
  // shadow on every card, which read as clutter once six of them shared a screen.
  const surface = isDark ? "#0b0f17" : "#ffffff";
  const cardStyle: React.CSSProperties = {
    backgroundImage: `linear-gradient(${surface}, ${surface}), linear-gradient(160deg, ${color}${isDark ? "26" : "14"}, ${color}00 65%)`,
    backgroundOrigin: "border-box",
    backgroundClip: "padding-box, border-box",
    borderColor: `${color}${isDark ? "3d" : "2e"}`,
    boxShadow: isDark
      ? "0 1px 2px rgba(0,0,0,0.5)"
      : "0 1px 2px rgba(16,24,40,0.05), 0 4px 10px -4px rgba(16,24,40,0.08)",
  };

  const gestureHandlers = useLongPress({
    onLongPress: onLongPress ?? (() => {}),
    onTap: onOpen,
  });

  // Without a menu to open there is nothing to hold for, so fall back to a plain
  // click rather than arming a long press that would buzz and do nothing.
  const pressHandlers = onLongPress
    ? gestureHandlers
    : { onClick: onOpen, onContextMenu: gestureHandlers.onContextMenu };

  return (
    <button
      type="button"
      {...pressHandlers}
      aria-label={`Open list ${list.list_name || "Untitled"}`}
      className={`relative flex touch-manipulation select-none items-center overflow-hidden rounded-2xl border transition-transform duration-100 active:scale-[0.97] ${
        isDark ? "text-white" : "text-gray-900"
      } ${
        isGrid
          ? // Trimmed from 112. Both grids keep the same height on purpose — in
            // the Cards layout the built-in views and the user's own lists sit in
            // stacked grids and a different height each would read as a mistake —
            // so this comes off both, and it is a trim rather than a cut because
            // the name still has to clear two lines inside it.
            "h-[104px] w-full flex-col justify-center gap-2 px-2 py-3"
          : isRow
            ? // Taller than the pinned card: this one carries two lines of text
              // rather than one, and is the whole target for a row in a list.
              "h-[64px] w-full gap-3 px-3.5"
            : "h-[56px] shrink-0 gap-3 px-3.5"
      }`}
      style={cardStyle}
    >
      {isGrid ? (
        <>
          <ListIcon list={list} />
          <span className="w-full">
            <ListInfo list={list} tasks={tasks} notes={notes} shape="grid" />
          </span>
        </>
      ) : isRow ? (
        <>
          <ListIcon list={list} size={34} />
          {/* min-w-0 is what lets the name truncate instead of pushing the
              chevron off the end of the row. */}
          <span className="min-w-0 flex-1">
            <ListInfo list={list} tasks={tasks} notes={notes} shape="row" />
          </span>
          {/* The row is as wide as the screen, so nothing about its shape says
              "this opens something" the way a tappable card does. */}
          <ChevronRight
            size={18}
            className="shrink-0 text-gray-400 dark:text-gray-500"
          />
        </>
      ) : (
        <>
          <ListIcon list={list} size={30} />
          <ListInfo list={list} tasks={tasks} notes={notes} shape="pinned" />
        </>
      )}
    </button>
  );
}
