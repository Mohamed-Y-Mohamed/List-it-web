/**
 * Returns true when the app is running as an installed app rather than in a
 * browser tab — an installed PWA (Android TWA / "Add to Home Screen", Windows
 * PWABuilder, iOS Safari).
 *
 * Callers use this to pick the app-style entry flow: show the splash screen and
 * open on /login instead of the marketing landing page.
 */
export function isPWAStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
}
