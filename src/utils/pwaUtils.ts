/**
 * Returns true when the app is running as an installed PWA (standalone mode).
 * Works for Android (TWA / "Add to Home Screen"), Windows (PWABuilder),
 * and iOS Safari ("Add to Home Screen").
 */
export function isPWAStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
}
