// lib/tutorial.ts
// Whether the in-app tutorial has been shown to this account.
//
// Unlike the first-run intro in lib/onboarding.ts, this one is per account
// rather than per install: it lives in `users.tutorial`, which defaults to false
// for every new row. Someone who learns the app on one phone should not be
// taught it again on their next one, and the flag has to survive a reinstall for
// that to hold.
//
// Native only, same as the intro. The web app has a sidebar, a landing page and
// a pointer, none of which need a walkthrough of where the buttons are.

import { apiFetch } from "@/lib/apiFetch";
import { IS_NATIVE_BUILD } from "@/lib/platform";

// Mirrors the server flag locally so a failed write cannot put the tutorial back
// in front of someone who has already sat through it.
const SEEN_KEY = "listit.tutorial.seen";

function readLocalSeen(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(SEEN_KEY) === "true";
  } catch {
    return false;
  }
}

function writeLocalSeen(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SEEN_KEY, "true");
  } catch {
    // The server flag is the real record; this is only a guard against a failed
    // PATCH, so losing it costs nothing on its own.
  }
}

/**
 * True once the tutorial has been shown, and always true off-native.
 *
 * Fails *closed* — an unreachable or malformed profile counts as seen. This is
 * the opposite call to `hasSeenOnboarding()`, deliberately: that one reads
 * localStorage, where a retry is free and costs at worst one extra intro. This
 * one is a network round trip, and failing open would put the tutorial in front
 * of an existing user every time their connection is poor. Missing it once is
 * the cheaper mistake.
 */
export async function fetchTutorialSeen(): Promise<boolean> {
  if (!IS_NATIVE_BUILD) return true;
  if (readLocalSeen()) return true;

  try {
    const res = await apiFetch("/api/user/profile");
    if (!res.ok) return true;

    const { data } = await res.json();
    return data?.tutorial === true;
  } catch {
    return true;
  }
}

/**
 * Record that the tutorial is done, whether it was finished or skipped.
 *
 * The local flag is set first and unconditionally, so the tutorial stays gone
 * for this install even if the write never lands. Resolves either way — the
 * caller is dismissing an overlay, not waiting on a save.
 */
export async function markTutorialSeen(): Promise<void> {
  writeLocalSeen();

  try {
    await apiFetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tutorial: true }),
    });
  } catch (error) {
    console.error("Could not save tutorial progress:", error);
  }
}
