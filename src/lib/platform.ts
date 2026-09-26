// lib/platform.ts
// Single source of truth for "am I the web app or the native app?".
//
// The web app and the Android app are built from the same source. There are two
// different questions to ask about that, and they have different answers:
//
//   * IS_NATIVE_BUILD — which bundle is this? Fixed at build time, so prerendered
//     HTML and the client agree on it. Use this for anything that changes what
//     renders: layout, routing, which screen is home. Because it is a compile-time
//     constant, the branch not taken is dropped from each bundle.
//
//   * isNativeApp() — is the Capacitor runtime actually present? Only knowable in
//     the browser. Use this before calling a native plugin.
//
// Branching layout on the runtime check instead would hydrate against mismatched
// HTML and flash the wrong UI for a frame, so prefer IS_NATIVE_BUILD.

import { Capacitor } from "@capacitor/core";

/** True in the bundle produced by `npm run build:native`. Compile-time constant. */
export const IS_NATIVE_BUILD =
  process.env.NEXT_PUBLIC_BUILD_TARGET === "native";

/** True only inside the Capacitor WebView. Always false during server render. */
export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  return Capacitor.isNativePlatform();
}

/** The concrete platform, for the few places that need to tell Android from iOS. */
export function getPlatform(): "android" | "ios" | "web" {
  if (typeof window === "undefined") return "web";
  const platform = Capacitor.getPlatform();
  return platform === "android" || platform === "ios" ? platform : "web";
}

/**
 * Base URL for API calls. Empty on web, where the app and its API routes share an
 * origin and a relative path plus the session cookie is all that is needed. The
 * native build has no API of its own, so its calls must be absolute.
 */
export function getApiBaseUrl(): string {
  if (!IS_NATIVE_BUILD) return "";

  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL must be set for the native build — " +
        "the app cannot reach its API from inside the WebView without it."
    );
  }
  return base.replace(/\/+$/, "");
}
