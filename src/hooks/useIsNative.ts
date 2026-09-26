"use client";

import { IS_NATIVE_BUILD } from "@/lib/platform";

/**
 * Whether this is the native app, safe to branch layout on.
 *
 * Resolved at build time, so the prerendered HTML and the first client render
 * agree and there is no hydration mismatch or flash of the wrong shell. Kept as a
 * hook so call sites read naturally alongside the other hooks and so the
 * implementation can change without touching them.
 */
export function useIsNative(): boolean {
  return IS_NATIVE_BUILD;
}
