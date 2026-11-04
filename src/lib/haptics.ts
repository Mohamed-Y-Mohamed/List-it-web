// lib/haptics.ts
// A short vibration to confirm a gesture, on phones whose browser supports it
// (Android Chrome). Silently does nothing elsewhere.

export function haptic(durationMs = 10): void {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  try {
    navigator.vibrate(durationMs);
  } catch {
    // Some browsers throw outside a user gesture; feedback is optional.
  }
}
