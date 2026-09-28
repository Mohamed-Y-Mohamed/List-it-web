// lib/onboarding.ts
// Whether the intro has been shown, and where a launch should land.
//
// The intro is for the native app only. The website has a landing page that does
// the same job for visitors, and an installed PWA is an existing user by
// definition, so neither gets it.

import { IS_NATIVE_BUILD } from "@/lib/platform";

const SEEN_KEY = "listit.onboarding.seen";

/**
 * True once the intro has been shown, and always true off-native.
 *
 * Stored in localStorage rather than through a plugin: the WebView keeps it for
 * the life of the install, which is exactly the lifetime this flag needs, and a
 * value this small does not justify another Capacitor dependency.
 *
 * Reads defensively — a WebView with storage disabled throws rather than
 * returning null, and a launch must not die on a flag about a welcome screen.
 */
export function hasSeenOnboarding(): boolean {
  if (!IS_NATIVE_BUILD) return true;
  if (typeof window === "undefined") return true;

  try {
    return window.localStorage.getItem(SEEN_KEY) === "true";
  } catch {
    // Unreadable storage means the intro shows again. Mildly annoying, which is
    // the right way round: the alternative is blocking the launch.
    return false;
  }
}

/** Record that the intro has been shown, whether it was finished or skipped. */
export function markOnboardingSeen(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(SEEN_KEY, "true");
  } catch {
    // Nothing to do. The intro reappears next launch, which is survivable.
  }
}
