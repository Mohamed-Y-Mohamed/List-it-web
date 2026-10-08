"use client";

// The frame every default view sits in: Today, Tomorrow, Priority, Completed,
// Not Completed, Overdue.
//
// All six screens had their own copy of this, differing only in the tint and the
// words. Keeping it here means a change to the header reaches all of them, and a
// new screen is a config rather than another 150 lines of chrome.
//
// These six are the only things in the app that keep an icon. User lists are
// identified by name, colour and spacing — a generic checklist glyph repeated
// down a screen identifies nothing. A built-in view is different: it is a fixed
// destination with a fixed meaning, and the icon is the quickest way to tell
// Overdue from Completed at a glance.
//
// Back sits above the title rather than beside it. These screens are reached
// from the Lists home, the bottom navigation is hidden while inside one, and it
// stays reachable when the list is scrolled because it is above the scroll
// rather than in it.
//
// The body is a child rather than a prop because the screens genuinely differ
// there: most render a flat list, Not Completed groups by due date, Completed
// groups by when it was finished. Forcing those into one prop would have been an
// abstraction pretending six things are one.

import React from "react";
import { motion } from "framer-motion";
import { ChevronLeft, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import EmptyState from "@/components/popupModels/emptystate";
import { TaskStatsCard } from "./TaskStatsCard";
import AppSurface from "@/components/AppSurface";
import { SkeletonStatTile, SkeletonTaskList } from "@/components/ui/Skeleton";
import { appPath } from "@/lib/routes";

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
  icon: React.ElementType;
  /** Tailwind text classes for the header icon. */
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
  empty?: {
    title: string;
    message: string;
    icon?: "check" | "calendar" | "plus";
  };
  children: React.ReactNode;
}

export default function TaskScreen({
  isDark,
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
  const router = useRouter();
  const accentText = isDark ? accent.dark : accent.light;

  // The left padding is `pl-4 md:pl-20`, not a flat `pl-20`.
  //
  // The 80px only exists to clear the desktop sidebar, which is not there below
  // `md` — so on a phone it was 80px of dead space down the left with only 16px
  // on the right, and five of these six screens sat visibly pushed to one side.
  // Completed is a separate implementation and already had this responsive,
  // which is why it was the only default view that looked centred.
  return (
    <main
      className={`relative min-h-screen w-full pb-20 pr-4 pt-6 transition-all duration-300 md:pr-16 md:pt-10 ${
        isDark ? "text-gray-200" : "text-gray-800"
      }`}
    >
      <AppSurface />

      <div className="mx-auto w-full max-w-7xl pl-4 md:pl-20">
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mb-6"
        >
          <button
            type="button"
            onClick={() => router.push(appPath("/List"))}
            className={`-ml-2 mb-2 flex min-h-[44px] items-center gap-1 rounded-full px-2 pr-3 text-[14px] font-medium ${
              isDark
                ? "text-gray-300 active:bg-white/10"
                : "text-gray-600 active:bg-black/5"
            }`}
            aria-label="Back to lists"
          >
            <ChevronLeft className="h-5 w-5" />
            Lists
          </button>

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <Icon className={`h-6 w-6 shrink-0 ${accentText}`} />
                <h1
                  className={`truncate text-[26px] font-bold leading-tight md:text-[32px] ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {title}
                </h1>
              </div>
              <p
                className={`pt-1 text-[13px] ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {subtitle}
              </p>
            </div>

            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                isDark
                  ? "border-white/[0.08] bg-[#131A2B] text-gray-300 active:bg-white/10"
                  : "border-black/[0.06] bg-white text-gray-700 active:bg-black/5"
              }`}
              aria-label="Refresh tasks"
            >
              <RefreshCw
                className={`h-[18px] w-[18px] ${isRefreshing ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </motion.header>

        {/* Written out rather than interpolated: Tailwind scans source text for
            class names, so a built-up `md:grid-cols-${n}` would never make it
            into the stylesheet. */}
        {stats && stats.length > 0 && (
          <div
            className={`mb-6 grid grid-cols-2 gap-2.5 ${
              stats.length >= 4 ? "md:grid-cols-4" : "md:grid-cols-3"
            }`}
          >
            {isLoading
              ? stats.map((stat) => (
                  <SkeletonStatTile key={stat.title} isDark={isDark} />
                ))
              : stats.map((stat) => (
                  <TaskStatsCard
                    key={stat.title}
                    {...stat}
                    isDark={isDark}
                    isLoading={false}
                  />
                ))}
          </div>
        )}

        {isLoading ? (
          // A skeleton the same height as a task card, not a spinner. The layout
          // does not jump when the rows land, and the shape says "a list is
          // coming" before the first one exists. `loadingLabel` lives on as the
          // accessible name so a screen reader still hears which screen is busy.
          <div aria-label={loadingLabel}>
            <SkeletonTaskList isDark={isDark} />
          </div>
        ) : empty ? (
          <EmptyState
            title={empty.title}
            message={empty.message}
            icon={empty.icon ?? "check"}
          />
        ) : (
          children
        )}
      </div>
    </main>
  );
}
