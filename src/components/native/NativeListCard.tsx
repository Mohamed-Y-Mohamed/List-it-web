"use client";

// The list shapes on the Lists screen.
//
//   * overview — a built-in view. Compact, name and a colour accent, nothing else.
//   * pinned   — the horizontal rail. Smaller than a normal card.
//   * grid     — the user's own lists in Cards layout, two to a row.
//   * row      — the same lists in List layout, each its own full-width container.
//
// No decorative icons on any of them. A list is identified by its name, its
// colour and the space around it; a generic checklist glyph repeated eight times
// down a screen identifies nothing and was the loudest thing on the page. The
// colour survives as a small accent — a dot, or a hairline bar — which is enough
// to tell two lists apart without competing with their names.
//
// Surfaces come from the product palette: #131A2B for a card on the #0B1222
// field, with borders at 6–10% white. Light mode keeps a white card and a
// hairline grey, since the palette is specified for the dark interface.

import React from "react";
import { ChevronRight, Pin } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useLongPress } from "@/hooks/useLongPress";
import type { List, Note, Task } from "@/types/schema";
import { listColor } from "./listVisuals";

export type ListCardVariant = "overview" | "pinned" | "grid" | "row";

interface NativeListCardProps {
  list: List;
  tasks: Task[];
  notes: Note[];
  variant: ListCardVariant;
  onOpen: () => void;
  /** Omitted for the built-in views, which have nothing to pin or delete. */
  onLongPress?: (position: { x: number; y: number }) => void;
}

/**
 * `4 tasks · 2 notes`, counted from the user's real rows.
 *
 * Never an open count: the spec drops "2 open" from every card, and a second
 * number next to the first invites the reader to work out the difference.
 */
function countsLabel(list: List, tasks: Task[], notes: Note[]): string {
  const taskCount = tasks.filter((task) => task.list_id === list.id).length;
  const noteCount = notes.filter((note) => note.list_id === list.id).length;
  return `${taskCount} task${taskCount === 1 ? "" : "s"} · ${noteCount} note${
    noteCount === 1 ? "" : "s"
  }`;
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

  // Nothing to hold for without a menu, so fall back to a plain click rather
  // than arming a long press that would buzz and do nothing.
  const pressHandlers = onLongPress
    ? gestureHandlers
    : { onClick: onOpen, onContextMenu: gestureHandlers.onContextMenu };

  const surface = isDark ? "bg-[#131A2B]" : "bg-white";
  const edge = isDark ? "border-white/[0.08]" : "border-black/[0.06]";
  const nameText = isDark ? "text-white" : "text-gray-900";
  const metaText = isDark ? "text-gray-400" : "text-gray-500";

  const base = `relative flex touch-manipulation select-none overflow-hidden rounded-2xl border ${surface} ${edge} transition-transform duration-100 active:scale-[0.98]`;

  // A built-in view: a fixed destination with a name. No counts — those come
  // from the screen's own filter, not from a list_id, and a wrong number is
  // worse than none.
  if (variant === "overview") {
    return (
      <button
        type="button"
        {...pressHandlers}
        className={`${base} min-h-[52px] w-full items-center justify-between gap-2 px-3.5 py-3`}
      >
        <span className={`truncate text-[14px] font-medium ${nameText}`}>
          {list.list_name}
        </span>
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
      </button>
    );
  }

  // The pinned rail. Deliberately smaller than a normal card — it is a shortcut
  // to something already in the list below, not a second copy of it.
  if (variant === "pinned") {
    return (
      <button
        type="button"
        {...pressHandlers}
        aria-label={`Open list ${list.list_name || "Untitled"}`}
        className={`${base} h-[58px] w-[160px] shrink-0 flex-col items-start justify-center gap-0.5 px-3.5`}
      >
        <span className="flex w-full items-center gap-2">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
            aria-hidden="true"
          />
          <span className={`truncate text-[14px] font-medium ${nameText}`}>
            {list.list_name || "Untitled"}
          </span>
        </span>
        <span className={`w-full truncate pl-4 text-left text-[11px] ${metaText}`}>
          {countsLabel(list, tasks, notes)}
        </span>
      </button>
    );
  }

  // List layout: each list its own full-width container, never all of them
  // inside one shared bordered parent.
  if (variant === "row") {
    return (
      <button
        type="button"
        {...pressHandlers}
        aria-label={`Open list ${list.list_name || "Untitled"}`}
        className={`${base} min-h-[64px] w-full items-center gap-3 px-4 py-3`}
      >
        <span
          className="h-7 w-1 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
        {/* min-w-0 is what lets the name truncate instead of pushing the
            chevron off the end of the row. */}
        <span className="min-w-0 flex-1 text-left">
          <span
            className={`flex items-center gap-1.5 truncate text-[15px] font-medium ${nameText}`}
          >
            {list.list_name || "Untitled"}
            {list.is_pinned && (
              <Pin className="h-3 w-3 shrink-0 fill-current text-orange-400" />
            )}
          </span>
          <span className={`block truncate text-[12px] ${metaText}`}>
            {countsLabel(list, tasks, notes)}
          </span>
        </span>
        <ChevronRight
          size={18}
          className="shrink-0 text-gray-400 dark:text-gray-500"
        />
      </button>
    );
  }

  // Cards layout: two to a row, each about half the available width.
  return (
    <button
      type="button"
      {...pressHandlers}
      aria-label={`Open list ${list.list_name || "Untitled"}`}
      className={`${base} min-h-[84px] w-full flex-col items-start justify-between gap-2 p-3.5 text-left`}
    >
      <span className="flex w-full items-start gap-2">
        <span
          className="mt-[5px] h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
        <span
          className={`line-clamp-2 flex-1 text-[14px] font-medium leading-snug ${nameText}`}
        >
          {list.list_name || "Untitled"}
        </span>
        {list.is_pinned && (
          <Pin className="mt-[3px] h-3 w-3 shrink-0 fill-current text-orange-400" />
        )}
      </span>
      <span className={`truncate text-[11px] ${metaText}`}>
        {countsLabel(list, tasks, notes)}
      </span>
    </button>
  );
}
