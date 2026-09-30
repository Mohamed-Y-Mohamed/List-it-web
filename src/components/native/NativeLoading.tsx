"use client";

// The screen shown while the app is still fetching what it needs to draw
// something real: after the splash has handed over, and while the stored session
// or a route's own chunk is still resolving.
//
// It paints the same field as SplashScreen — var(--splash-bg), which is set by a
// media query rather than by ThemeContext, so it resolves on the first paint with
// no JavaScript. That makes the launch read as one screen settling rather than a
// sequence of different ones.
//
// Before this existed, every one of those gaps rendered `null`: the native splash
// was dismissed as soon as React mounted, the web splash left on a fixed timer,
// and (secure)/layout.tsx returned nothing at all until auth settled. Three
// separate windows of empty document, which is what made a cold launch look
// broken.
//
// Native only — nothing on the web renders it.

import React from "react";

interface NativeLoadingProps {
  /** Overrides the default message where a screen can say something better. */
  label?: string;
}

export default function NativeLoading({
  label = "Loading your lists",
}: NativeLoadingProps) {
  return (
    <div
      className="flex min-h-screen w-full flex-col items-center justify-center gap-4"
      style={{ backgroundColor: "var(--splash-bg)" }}
      role="status"
      aria-live="polite"
    >
      {/* CSS-driven rather than framer-motion, for the same reason the splash's
          dots are: this is on screen precisely when the main thread is busy
          parsing a chunk, and a JS-driven animation would stall at exactly the
          wrong moment.

          Orange, picked up from the splash mark rather than the blue the
          interface uses, so the two screens agree.

          With reduced motion the ring stops spinning, so the transparent quarter
          is filled back in — a static three-quarter circle just looks broken. */}
      <span
        className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent motion-reduce:animate-none motion-reduce:border-t-orange-500"
        aria-hidden="true"
      />
      <p className="text-sm" style={{ color: "var(--splash-muted)" }}>
        {label}
      </p>
    </div>
  );
}
