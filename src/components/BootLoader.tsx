"use client";

// Fades out the app-icon loading screen (the `#boot-loader` markup in the root
// layout) once the page has hydrated and painted, so a visitor never sees the
// footer or a half-built page first. Rendered last in <body>, so its effect runs
// after every page component has mounted.

import { useEffect } from "react";

/** Never hold the page back longer than this after hydration. */
const MAX_WAIT_MS = 400;

export default function BootLoader() {
  useEffect(() => {
    let done = false;
    const reveal = () => {
      if (done) return;
      done = true;
      // Two frames: the first lets React commit the themed re-render, the
      // second makes sure that frame has painted under the loader.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          document.documentElement.classList.add("app-ready");
          // Hidden rather than removed: React owns the node.
          window.setTimeout(
            () => document.documentElement.classList.add("app-done"),
            300,
          );
        }),
      );
    };

    const timer = window.setTimeout(reveal, MAX_WAIT_MS);
    // Web fonts are the last thing that visibly changes a page.
    document.fonts?.ready.then(reveal, reveal);
    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
