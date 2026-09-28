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

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { isTabRoot, normalisePath } from "./navTabs";
import { useScreenTitle } from "./ScreenTitleContext";

// Titles for the built-in screens, so the bar reads like the iOS one rather than
// showing a bare chevron. The tab roots are absent deliberately: they draw their
// own headers and never get a back bar.
const SCREEN_TITLES: Record<string, string> = {
  "/today": "Today",
  "/tomorrow": "Tomorrow",
  "/priority": "Priority",
  "/completed": "Completed",
  "/notcomplete": "Not Completed",
  "/overdue": "Overdue",
  "/List": "List",
};

export default function NativeBackBar() {
  const pathname = normalisePath(usePathname());
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const reportedTitle = useScreenTitle();

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
      className={`sticky top-0 z-40 pt-safe-top backdrop-blur-xl ${
        isDark
          ? "bg-gray-950/85 text-white shadow-[inset_0_-1px_0_rgba(255,255,255,0.08)]"
          : "bg-white/85 text-gray-900 shadow-[inset_0_-1px_0_rgba(16,24,40,0.07)]"
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
      </div>
    </div>
  );
}
