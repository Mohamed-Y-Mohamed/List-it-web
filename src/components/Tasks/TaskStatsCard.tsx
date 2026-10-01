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
    return (
      <div
        className={`p-4 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} shadow-sm animate-pulse backdrop-blur-sm`}
      >
        <div className="flex items-center justify-between mb-3">
          <div
            className={`h-10 w-10 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
          />
        </div>
        <div
          className={`h-4 w-16 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"} mb-2`}
        />
        <div
          className={`h-6 w-12 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`p-4 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"}
        shadow-sm relative overflow-hidden group hover:shadow-lg transition-all duration-300 backdrop-blur-sm border ${isDark ? "border-gray-700/50" : "border-gray-300/50"}`}
    >
      <div
        className={`absolute -bottom-2 -right-2 h-16 w-16 rounded-full blur-xl opacity-20 ${color}
        group-hover:opacity-40 transition-opacity duration-300`}
      />

      <div className="flex items-center justify-between mb-3 relative z-10">
        <div
          className={`p-2 rounded-lg ${tints.chip} ${isDark ? "bg-opacity-20" : ""}`}
        >
          <Icon className={`h-5 w-5 ${tints.icon}`} />
        </div>
      </div>

      <div className="relative z-10">
        <h3
          className={`text-xs font-medium ${isDark ? "text-gray-400" : "text-gray-500"} mb-1`}
        >
          {title}
        </h3>
        <div className="text-2xl font-bold mb-1">
          <AnimatedCounter value={value} suffix={suffix} />
        </div>
        {description && (
          <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>
            {description}
          </p>
        )}
      </div>
    </motion.div>
  );
}

interface TaskSectionHeaderProps {
  title: string;
  count: number;
  /** Tailwind `text-*` class for the title and the count pill. */
  color: string;
  /** Tailwind `bg-*` class behind the icon and the count pill. */
  bgColor: string;
  icon: React.ElementType;
  isDark: boolean;
  /** Reads "{count} task(s) {subject}". */
  subject?: string;
}

export function TaskSectionHeader({
  title,
  count,
  color,
  bgColor,
  icon: Icon,
  isDark,
  subject = "to complete",
}: TaskSectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className={`flex items-center justify-between p-4 rounded-lg mb-4 backdrop-blur-sm ${
        isDark ? "bg-gray-800/40" : "bg-white/40"
      } border ${isDark ? "border-gray-700/50" : "border-gray-300/50"}`}
    >
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${bgColor} mr-3`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div>
          <h2 className={`text-lg font-semibold ${color}`}>{title}</h2>
          <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            {count} task{count !== 1 ? "s" : ""} {subject}
          </p>
        </div>
      </div>

      <div
        className={`px-3 py-1 rounded-full ${bgColor} ${color} font-medium text-sm`}
      >
        {count}
      </div>
    </motion.div>
  );
}
