"use client";

// The two list card shapes from the iOS lists screen:
//
//   * grid   — 100pt tall, three to a row, icon above a centred name and counts
//   * pinned — 50pt tall, laid out horizontally, scrolls sideways
//
// Colour identifies a list through a faint wash and a hairline edge, with the
// icon chip carrying it at full strength. Both variants open their context menu
// on a long press.

import React from "react";
import { useTheme } from "@/context/ThemeContext";
import { useLongPress } from "@/hooks/useLongPress";
import type { List, Note, Task } from "@/types/schema";
import { ListIcon, ListInfo, listColor } from "./listVisuals";

interface NativeListCardProps {
  list: List;
  tasks: Task[];
  notes: Note[];
  variant: "grid" | "pinned";
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
          ? "h-[112px] w-full flex-col justify-center gap-2 px-2 py-3"
          : "h-[56px] shrink-0 gap-3 px-3.5"
      }`}
      style={cardStyle}
    >
      {isGrid ? (
        <>
          <ListIcon list={list} />
          <span className="w-full">
            <ListInfo
              list={list}
              tasks={tasks}
              notes={notes}
              isPinnedCard={false}
            />
          </span>
        </>
      ) : (
        <>
          <ListIcon list={list} size={30} />
          <ListInfo list={list} tasks={tasks} notes={notes} isPinnedCard />
        </>
      )}
    </button>
  );
}
