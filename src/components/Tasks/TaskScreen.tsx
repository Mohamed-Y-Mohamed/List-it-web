"use client";

// The frame every task screen sits in: tinted background, header with an icon,
// a title, a count line and a refresh button, then an optional row of figure
// tiles, then the body.
//
// All six screens had their own copy of this, differing only in the tint and
// the words. Keeping it here means a change to the header reaches all of them,
// and a new screen is a config rather than another 150 lines of chrome.
//
// The body is a child rather than a prop because the screens genuinely differ
// there: most render a flat list, Not Completed groups by due date, Completed
// groups by when it was finished. Forcing those into one prop would have been
// an abstraction pretending six things are one.

import React from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import EmptyState from "@/components/popupModels/emptystate";
import { TaskStatsCard } from "./TaskStatsCard";

// The `bg-*` fill matching each accent's `text-*` class, spelled out so Tailwind
// can see both halves. Covers every pair the six screens pass; add a row here
// alongside any new accent.
const ACCENT_HALOS: Record<string, string> = {
  "text-orange-400": "bg-orange-400",
  "text-orange-500": "bg-orange-500",
  "text-purple-400": "bg-purple-400",
  "text-purple-500": "bg-purple-500",
  "text-yellow-400": "bg-yellow-400",
  "text-yellow-500": "bg-yellow-500",
  "text-red-400": "bg-red-400",
  "text-red-500": "bg-red-500",
  "text-teal-400": "bg-teal-400",
  "text-teal-500": "bg-teal-500",
};

export interface TaskScreenStat {
  title: string;
  value: number;
  icon: React.ElementType;
  /** A Tailwind `bg-*-500` class. */
  color: string;
  suffix?: string;
  description?: string;
}

interface TaskScreenProps {
  isDark: boolean;
  /** The two full `[background:...]` arbitrary classes, dark and light. */
  gradient: { dark: string; light: string };
  icon: React.ElementType;
  /** Tailwind text classes for the header icon and the loading spinner. */
  accent: { dark: string; light: string };
  title: string;
  /** A node, not a string: Tomorrow emphasises the date inside its count line. */
  subtitle: React.ReactNode;
  onRefresh: () => void;
  isRefreshing: boolean;
  isLoading: boolean;
  loadingLabel: string;
  stats?: TaskScreenStat[];
  /** Passed when there is nothing to show; omitted when there is. */
  empty?: { title: string; message: string; icon?: "check" | "calendar" | "plus" };
  children: React.ReactNode;
}

export default function TaskScreen({
  isDark,
  gradient,
  icon: Icon,
  accent,
  title,
  subtitle,
  onRefresh,
  isRefreshing,
  isLoading,
  loadingLabel,
  stats,
  empty,
  children,
}: TaskScreenProps) {
  const accentText = isDark ? accent.dark : accent.light;

  // The matching fill for the halo behind the loading spinner.
  //
  // This was `accentText.replace("text-", "bg-")`, which Tailwind's scanner cannot
  // see — so `bg-purple-400`, `bg-yellow-400` and `bg-red-400` were never
  // generated and the halo simply did not render on Tomorrow, Priority or Overdue.
  // Ironic given the note at the grid below explaining exactly this hazard.
  const accentHalo = ACCENT_HALOS[accentText] ?? "bg-gray-400";

  // The right padding below is `pr-4 md:pr-16`, not the flat `pr-16` five of
  // the six screens had. Overdue had already been made responsive and the rest
  // had not, so on a narrow screen they threw away four rem down the side.
  return (
    <main
      className={`transition-all pt-16 pr-4 md:pr-16 min-h-screen duration-300 pb-20 w-full relative
      ${isDark ? "text-gray-200" : "text-gray-800"}`}
    >
      <div
        className={`absolute inset-0 -z-10 size-full ${
          isDark ? gradient.dark : gradient.light
        }`}
      />

      {/* `pl-4 md:pl-20`, not a flat `pl-20`.
          The 80px only exists to clear the desktop sidebar, which is not there
          below `md` — so on a phone it was 80px of dead space down the left with
          only the root's 16px on the right, and every one of these five screens sat
          visibly pushed to one side. Completed is a separate implementation and
          already had this responsive, which is why it was the only default view
          that looked centred.
          The same mistake was fixed for the right padding in the comment above;
          this is the other half of it. Matches Settings and Progress. */}
      <div className="max-w-7xl pl-4 md:pl-20 w-full mx-auto">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center mb-2">
                <Icon className={`h-7 w-7 mr-3 ${accentText}`} />
                <h1
                  className={`text-3xl md:text-4xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  {title}
                </h1>
              </div>
              <p
                className={`text-base ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                {subtitle}
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRefresh}
              disabled={isRefreshing}
              className={`p-3 rounded-xl transition-all duration-200 shadow-sm ${
                isDark
                  ? "bg-gray-800/50 hover:bg-gray-700/50 text-gray-300"
                  : "bg-white/50 hover:bg-gray-100/50 text-gray-700"
              } ${isRefreshing ? "animate-pulse" : ""}`}
              aria-label="Refresh tasks"
            >
              <RefreshCw
                className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </motion.button>
          </div>
        </motion.header>

        {stats && stats.length > 0 && (
          // Written out rather than interpolated: Tailwind scans source text
          // for class names, so a built-up `md:grid-cols-${n}` would never make
          // it into the stylesheet.
          <div
            className={`grid grid-cols-1 gap-4 mb-8 ${
              stats.length >= 4 ? "md:grid-cols-4" : "md:grid-cols-3"
            }`}
          >
            {stats.map((stat) => (
              <TaskStatsCard
                key={stat.title}
                {...stat}
                isDark={isDark}
                isLoading={isLoading}
              />
            ))}
          </div>
        )}

        {isLoading ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className={`text-center py-16 rounded-xl ${
              isDark ? "bg-gray-800/50 text-gray-300" : "bg-white/50 text-gray-500"
            } shadow-sm backdrop-blur-sm border ${isDark ? "border-gray-700/50" : "border-gray-300/50"}`}
          >
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <RefreshCw className={`h-10 w-10 animate-spin ${accentText}`} />
                <div
                  className={`absolute inset-0 animate-pulse ${accentHalo} rounded-full opacity-20`}
                />
              </div>
              <p className="text-lg font-medium">{loadingLabel}</p>
            </div>
          </motion.div>
        ) : empty ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <EmptyState
              title={empty.title}
              message={empty.message}
              icon={empty.icon ?? "check"}
            />
          </motion.div>
        ) : (
          children
        )}
      </div>
    </main>
  );
}
