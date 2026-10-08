"use client";

// The app's bottom tab bar.
//
// Three top-level destinations, always visible and within thumb reach. The screens
// they lead to were previously buried in a toolbar menu on the home screen, which
// meant the two most useful ones — progress and settings — were invisible until
// you went looking.
//
// Native only. Mounted from the `isNative` branch of (secure)/layout.tsx, so the
// web app never renders it and the sidebar it would duplicate stays untouched.

import React, { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { useTheme } from "@/context/ThemeContext";
import { appPath } from "@/lib/routes";
import { NAV_TABS, normalisePath } from "./navTabs";

// The row itself, excluding the gesture-pill inset added underneath it. Exported
// because screens need to clear exactly this much plus the inset; see the
// `pb-tab-bar` utility in globals.css.
export const TAB_BAR_HEIGHT_PX = 56;

export default function NativeTabBar() {
  const pathname = normalisePath(usePathname());
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const reduceMotion = useReducedMotion();

  const activeIndex = NAV_TABS.findIndex((tab) => tab.path === pathname);

  const select = useCallback(
    (path: string, isActive: boolean) => {
      // Already here — a haptic with no navigation still confirms the tap landed,
      // and re-pushing the same route would add a history entry that back would
      // then have to chew through.
      void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
      if (isActive) return;

      // `replace`, not `push`: tabs are peers, not a stack. Pushing would make
      // hardware back walk backwards through every tab the user had visited.
      router.replace(appPath(path));
    },
    [router],
  );

  // Hidden on screens pushed above a tab root — a list detail is not a
  // destination, and keeping the bar there would offer to navigate away from a
  // half-finished edit.
  if (activeIndex === -1) return null;

  return (
    <nav
      aria-label="Main"
      // Fixed, so it stays put while the screen behind it scrolls. `pb-safe-bottom`
      // is on the bar rather than the body because a fixed element is positioned
      // against the viewport, which on an edge-to-edge Android 15 device starts
      // behind the gesture pill.
      className={`fixed inset-x-0 bottom-0 z-40 pb-safe-bottom ${
        isDark
          ? "bg-gray-950/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
          : "bg-white/90 shadow-[inset_0_1px_0_rgba(16,24,40,0.07)]"
      } backdrop-blur-xl`}
    >
      <ul
        className="flex items-stretch"
        style={{ height: `${TAB_BAR_HEIGHT_PX}px` }}
      >
        {NAV_TABS.map((tab, index) => {
          const isActive = index === activeIndex;
          const Icon = tab.icon;

          return (
            <li key={tab.path} className="flex-1">
              <button
                type="button"
                onClick={() => select(tab.path, isActive)}
                aria-current={isActive ? "page" : undefined}
                className="touch-target relative flex h-full w-full flex-col items-center justify-center gap-0.5"
              >
                {/* The active indicator. One element shared across tabs via
                    `layoutId`, so framer-motion slides it between them instead of
                    fading one out and another in — the difference between a bar
                    that tracks your finger and one that blinks. */}
                {isActive && (
                  <motion.span
                    layoutId="tab-indicator"
                    className={`absolute inset-x-3 inset-y-1.5 -z-10 rounded-[14px] ${
                      isDark ? "bg-blue-500/15" : "bg-blue-500/10"
                    }`}
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 420, damping: 34 }
                    }
                  />
                )}

                {/* Scale, not colour, carries the press — colour already carries
                    selection and doubling up makes neither legible. */}
                <motion.span
                  className="flex flex-col items-center gap-0.5"
                  whileTap={reduceMotion ? undefined : { scale: 0.88 }}
                  transition={{ type: "spring", stiffness: 600, damping: 26 }}
                >
                  <Icon
                    size={22}
                    // Selection is never carried by colour alone: the active icon
                    // is drawn heavier and its label sits a weight above the rest.
                    strokeWidth={isActive ? 2.5 : 1.9}
                    className={
                      isActive
                        ? "text-blue-500"
                        : isDark
                          ? "text-gray-500"
                          : "text-gray-400"
                    }
                  />
                  <span
                    className={`text-[11px] leading-none tracking-[-0.01em] ${
                      isActive
                        ? "font-semibold text-blue-500"
                        : isDark
                          ? "font-medium text-gray-500"
                          : "font-medium text-gray-400"
                    }`}
                  >
                    {tab.label}
                  </span>
                </motion.span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
