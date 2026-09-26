"use client";

// Back bar for pushed screens in the Android app.
//
// The app has no sidebar and no browser chrome, so once you leave the home screen
// the only way back is the system gesture — which is invisible and easy to miss.
// This is the equivalent of the chevron SwiftUI puts in a NavigationStack bar.
//
// Only rendered on screens below the home screen; the home screen has its own
// toolbar and nothing to go back to.

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

// The screen the app opens on. Nothing sits above it in the stack.
const ROOT_PATH = "/dashboard";

// Titles for the built-in screens, so the bar reads like the iOS one rather than
// showing a bare chevron.
const SCREEN_TITLES: Record<string, string> = {
  "/today": "Today",
  "/tomorrow": "Tomorrow",
  "/priority": "Priority",
  "/completed": "Completed",
  "/notcomplete": "Not Completed",
  "/overdue": "Overdue",
  "/setting": "Settings",
  "/List": "List",
};

function normalise(pathname: string): string {
  // The export uses trailing slashes, so /today/ and /today are the same screen.
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

export default function NativeBackBar() {
  const pathname = normalise(usePathname());
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  if (pathname === ROOT_PATH || pathname === "/") return null;

  const title = SCREEN_TITLES[pathname] ?? "";

  return (
    <div
      className={`sticky top-0 z-40 flex items-center gap-1 px-2 py-2 backdrop-blur-xl ${
        isDark ? "bg-gray-950/80 text-white" : "bg-white/80 text-gray-900"
      }`}
    >
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Back"
        className="touch-target flex items-center rounded-full pr-2 text-[17px] text-blue-500 active:opacity-50"
      >
        <ChevronLeft size={26} strokeWidth={2.5} />
        <span className="-ml-1">Back</span>
      </button>

      {title && (
        <span className="pointer-events-none absolute inset-x-0 text-center text-[17px] font-semibold">
          {title}
        </span>
      )}
    </div>
  );
}
