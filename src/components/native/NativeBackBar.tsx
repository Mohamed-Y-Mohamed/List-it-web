"use client";

// Back bar for pushed screens in the Android app.
//
// The app has no sidebar and no browser chrome, so once you leave the home screen
// the only way back is the system gesture — which is invisible and easy to miss.
// This is the equivalent of the chevron SwiftUI puts in a NavigationStack bar.
//
// Only rendered on screens pushed above a tab root. The three tab roots are
// destinations reached from the bar at the bottom, so there is nothing above them
// to go back to.

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, Info } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { isTabRoot, normalisePath } from "./navTabs";
import { useScreenTitle } from "./ScreenTitleContext";
import TaskStatusInfo from "@/components/ui/TaskStatusInfo";

// Titles for the built-in screens, so the bar reads like the iOS one rather than
// showing a bare chevron. The tab roots are absent deliberately: they draw their
// own headers and never get a back bar.
const SCREEN_TITLES: Record<string, string> = {
  "/today": "Today",
  "/tomorrow": "Tomorrow",
  "/priority": "Priority",
  "/completed": "Completed",
  "/notcomplete": "Not Completed",
  "/scheduled": "Scheduled",
  "/overdue": "Overdue",
  "/List": "List",
};

export default function NativeBackBar() {
  const pathname = normalisePath(usePathname());
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const reportedTitle = useScreenTitle();
  const [statusInfoOpen, setStatusInfoOpen] = useState(false);

  // Previously only /dashboard qualified. Now Progress and Settings are peers of
  // it rather than screens pushed from it, and a chevron on either would
  // contradict the tab bar underneath.
  if (isTabRoot(pathname) || pathname === "/") return null;

  // A screen that knows its own name wins — a list shows the list's name
  // rather than the generic "List".
  const title = reportedTitle ?? SCREEN_TITLES[pathname] ?? "";

  return (
    <div
      // Pinned and opaque: `pt-safe-top` clears the status bar, and content
      // scrolling past goes behind this rather than into the system UI. The
      // hairline underneath separates it without drawing a heavy rule.
      //
      // The fill is the page's own field in both themes, at full strength.
      //
      // Dark already read the ramp; light was a hardcoded `bg-white/85`, which is
      // only the right colour on the White background — on Cream, Ice blue and
      // Warm paper it drew a white band across the top of every pushed screen,
      // which is the same complaint the dark half had before it moved onto the
      // variable. One declaration now covers both themes and all four grounds.
      //
      // Solid rather than 85%: the bar is meant to be the same colour as the page
      // behind it, and a translucent fill over a scrolling list is a different
      // colour on every frame. `backdrop-blur` goes with it — there is nothing
      // left to see through. What separates the bar from the page is the hairline
      // under it and nothing else.
      className={`sticky top-0 z-40 bg-[var(--surface-field)] pt-safe-top ${
        isDark
          ? "text-white shadow-[inset_0_-1px_0_rgba(255,255,255,0.08)]"
          : "text-gray-900 shadow-[inset_0_-1px_0_rgba(16,24,40,0.07)]"
      }`}
    >
      <div className="relative flex h-11 items-center px-1.5">
        {/* Icon only. The word "Back" repeated the chevron and pushed the title
            off centre; a circular tap target keeps the 44px minimum. */}
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Back"
          className={`touch-target flex items-center justify-center rounded-full transition-colors ${
            isDark ? "active:bg-white/10" : "active:bg-black/5"
          }`}
        >
          <ChevronLeft size={24} strokeWidth={2.4} />
        </button>

        {title && (
          <span className="pointer-events-none absolute inset-x-0 truncate px-14 text-center text-[16px] font-semibold tracking-[-0.01em]">
            {title}
          </span>
        )}

        {/* What the task colours mean. It sits here rather than in the list body
            because the legend it replaces was repeated inside every collection;
            one button beside the screen's name is read once and then ignored,
            which is what a legend should be. `ml-auto` pushes it right without a
            spacer, and the title's `px-14` already keeps clear of both ends. */}
        <button
          type="button"
          onClick={() => setStatusInfoOpen(true)}
          aria-label="What the task colours mean"
          className={`touch-target ml-auto flex items-center justify-center rounded-full transition-colors ${
            isDark
              ? "text-gray-400 active:bg-white/10"
              : "text-gray-500 active:bg-black/5"
          }`}
        >
          <Info size={20} strokeWidth={2} />
        </button>
      </div>

      <TaskStatusInfo
        isOpen={statusInfoOpen}
        onClose={() => setStatusInfoOpen(false)}
        isDark={isDark}
      />
    </div>
  );
}
