"use client";

// The figure tiles across the top of the task screens, and the section heading
// used where tasks are grouped.
//
// Both were copy-pasted per screen and had drifted: the tiles on Today and
// Priority were missing the backdrop blur and the border that Tomorrow, Overdue
// and Not Completed had grown. The richer treatment is the one kept here, so the
// screens that were behind gain the border rather than the others losing it.

import React from "react";
import { motion } from "framer-motion";
import AnimatedCounter from "./AnimatedCounter";
import { SkeletonStatTile } from "@/components/ui/Skeleton";

// The tints each tile colour maps to, written out as whole class names.
//
// The tile used to derive these itself — `color.replace("-500", "-100")` for the
// icon chip and `color.replace("bg-", "text-")` for the glyph. Tailwind v4
// generates utilities by scanning source text and cannot see a name assembled at
// runtime, so neither derived class reached the stylesheet. `bg-indigo-100`
// existed nowhere else in the app, which is why Tomorrow's tile had no chip
// behind its icon at all.
//
// Keyed by the exact string the screens already pass, so those files need no
// changes.
const TILE_TINTS: Record<string, { chip: string; icon: string }> = {
  "bg-blue-500": { chip: "bg-blue-100", icon: "text-blue-500" },
  "bg-indigo-500": { chip: "bg-indigo-100", icon: "text-indigo-500" },
  "bg-purple-500": { chip: "bg-purple-100", icon: "text-purple-500" },
  "bg-teal-500": { chip: "bg-teal-100", icon: "text-teal-500" },
  "bg-green-500": { chip: "bg-green-100", icon: "text-green-500" },
  "bg-orange-500": { chip: "bg-orange-100", icon: "text-orange-500" },
  "bg-yellow-500": { chip: "bg-yellow-100", icon: "text-yellow-500" },
  "bg-red-500": { chip: "bg-red-100", icon: "text-red-500" },
  // Overdue's second tile. `.replace("-500", "-100")` found nothing to replace
  // here, so this chip rendered at full strength while every other tile got a pale
  // tint. It now matches the rest.
  "bg-red-600": { chip: "bg-red-100", icon: "text-red-600" },
};

const FALLBACK_TINTS = { chip: "bg-gray-100", icon: "text-gray-500" };

interface TaskStatsCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  /**
   * A Tailwind `bg-*` class, used as-is for the blurred blob behind the tile. Its
   * chip and glyph tints come from TILE_TINTS above — add an entry there before
   * passing a colour that is not already listed, or the tile falls back to grey.
   */
  color: string;
  isDark: boolean;
  suffix?: string;
  description?: string;
  isLoading?: boolean;
}

export function TaskStatsCard({
  title,
  value,
  icon: Icon,
  color,
  isDark,
  suffix = "",
  description,
  isLoading = false,
}: TaskStatsCardProps) {
  const tints = TILE_TINTS[color] ?? FALLBACK_TINTS;

  if (isLoading) {
    return <SkeletonStatTile isDark={isDark} />;
  }

  // The number is the thing. It used to sit third in the reading order behind a
  // tinted icon tile and a blurred colour blob, both of which were decoration on
  // a tile whose entire job is to show one figure. The glyph stays as a small
  // tint beside the label; the blob is gone.
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`rounded-2xl border p-4 ${
        isDark
          ? "border-white/[0.08] bg-[#131A2B]"
          : "border-black/[0.06] bg-white"
      }`}
    >
      <div className="flex items-center gap-1.5">
        <Icon
          className={`h-3.5 w-3.5 shrink-0 ${tints.icon}`}
          aria-hidden="true"
        />
        <h3
          className={`truncate text-[11px] font-medium uppercase tracking-[0.06em] ${
            isDark ? "text-gray-500" : "text-gray-400"
          }`}
        >
          {title}
        </h3>
      </div>

      <div
        className={`pt-1.5 text-[26px] font-bold leading-none ${
          isDark ? "text-white" : "text-gray-900"
        }`}
      >
        <AnimatedCounter value={value} suffix={suffix} />
      </div>

      {description && (
        <p
          className={`pt-1 text-[11px] ${isDark ? "text-gray-500" : "text-gray-400"}`}
        >
          {description}
        </p>
      )}
    </motion.div>
  );
}

interface TaskSectionHeaderProps {
  title: string;
  count: number;
  /** Tailwind `text-*` class tinting the icon to the band's colour. */
  color: string;
  icon: React.ElementType;
  isDark: boolean;
}

/**
 * The heading above one band of tasks.
 *
 * A rule across the row with the name at the front, which is the divider the
 * Lists tab uses between its sections and the one `TaskGroups` uses between
 * one-offs and routines. It was a bordered card with a tinted icon tile, a title,
 * a restatement of the count as a sentence and then the count again as a pill —
 * four pieces of chrome introducing as little as one task, stacked three or four
 * deep down a screen until the bands outweighed the tasks in them.
 *
 * A divider separates without announcing itself, which is the whole job here.
 */
export function TaskSectionHeader({
  title,
  count,
  color,
  icon: Icon,
  isDark,
}: TaskSectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-3 flex items-center gap-2.5"
    >
      <Icon className={`h-4 w-4 shrink-0 ${color}`} />
      <h2
        className={`shrink-0 text-[13px] font-semibold uppercase tracking-[0.06em] ${
          isDark ? "text-gray-400" : "text-gray-500"
        }`}
      >
        {title}
      </h2>
      <span
        className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
        style={{ backgroundColor: "#FF9500" }}
      >
        {count}
      </span>
      {/* Takes the rest of the row, so the rule starts where the label ends
          however long the label is. */}
      <span
        className={`h-px flex-1 ${isDark ? "bg-white/10" : "bg-black/10"}`}
      />
    </motion.div>
  );
}
