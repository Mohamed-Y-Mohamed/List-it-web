// components/native/navTabs.ts
// The app's top-level destinations, and the single source of truth for which
// paths are tab roots.
//
// Three things need to agree on that: the tab bar highlights the active one,
// NativeBackBar draws no chevron on a root, and NativeShell's hardware-back
// handler treats a root as the end of the stack rather than somewhere to rewind
// from. Keeping the list here means adding a tab updates all three.
//
// Routes are deliberately the ones the web already serves — /stats keeps its
// path and only the label reads "Progress", so nothing about the web app moves.

import { ChartColumn, LayoutGrid, Settings, type LucideIcon } from "lucide-react";

export interface NavTab {
  /** Canonical path, without the static-export trailing slash. */
  path: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_TABS: readonly NavTab[] = [
  { path: "/dashboard", label: "Lists", icon: LayoutGrid },
  { path: "/stats", label: "Progress", icon: ChartColumn },
  { path: "/setting", label: "Settings", icon: Settings },
] as const;

/** The tab the app opens on, and the one hardware back falls back to. */
export const HOME_TAB_PATH = "/dashboard";

/**
 * Strip the trailing slash the static export adds, so /stats/ and /stats are
 * recognised as the same screen.
 */
export function normalisePath(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

/** True when the given location is one of the three tab roots. */
export function isTabRoot(pathname: string): boolean {
  const path = normalisePath(pathname);
  return NAV_TABS.some((tab) => tab.path === path);
}
