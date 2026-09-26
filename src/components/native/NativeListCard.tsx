"use client";

// The two list card shapes from the iOS lists screen:
//
//   * grid   — 100pt tall, three to a row, icon above a centred name and counts
//   * pinned — 50pt tall, laid out horizontally, scrolls sideways
//
// Both carry a 1.5px border and a soft shadow in the list's own colour, and both
// open their context menu on a long press.

import React from "react";
import { useTheme } from "@/context/ThemeContext";
import { useLongPress } from "@/hooks/useLongPress";
import type { List, Note, Task } from "@/types/schema";
import { ListIcon, ListInfo, ListSideBar, listColor } from "./listVisuals";

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

  const gestureHandlers = useLongPress({
    onLongPress: onLongPress ?? (() => {}),
    onTap: onOpen,
  });

  // Without a menu to open there is nothing to hold for, so fall back to a plain
  // click rather than arming a long press that would buzz and do nothing.
  const pressHandlers = onLongPress
    ? gestureHandlers
    : { onClick: onOpen, onContextMenu: gestureHandlers.onContextMenu };

  // iOS: .shadow(color: bgColor.opacity(dark ? 0.5 : 0.3/0.2), radius: 3, y: 2)
  const shadowAlpha =
    variant === "grid" ? (isDark ? 0.5 : 0.3) : isDark ? 0.5 : 0.2;

  const isGrid = variant === "grid";

  return (
    <button
      type="button"
      {...pressHandlers}
      aria-label={`Open list ${list.list_name || "Untitled"}`}
      className={`relative flex touch-manipulation select-none items-center overflow-hidden rounded-[10px] border-[1.5px] transition-transform active:scale-[0.97] ${
        isDark ? "bg-black text-white" : "bg-white text-gray-900"
      } ${isGrid ? "h-[100px] w-full flex-col justify-between py-3" : "h-[50px] shrink-0 pr-3"}`}
      style={{
        borderColor: color,
        boxShadow: `0 2px 3px ${color}${Math.round(shadowAlpha * 255)
          .toString(16)
          .padStart(2, "0")}`,
      }}
    >
      <ListSideBar list={list} width={isGrid ? 5 : 4} inset={isGrid} />

      {isGrid ? (
        <>
          <ListIcon list={list} />
          <span className="w-full px-2">
            <ListInfo
              list={list}
              tasks={tasks}
              notes={notes}
              isPinnedCard={false}
            />
          </span>
        </>
      ) : (
        <span className="flex items-center gap-3 pl-[16px]">
          <ListIcon list={list} />
          <ListInfo list={list} tasks={tasks} notes={notes} isPinnedCard />
        </span>
      )}
    </button>
  );
}
