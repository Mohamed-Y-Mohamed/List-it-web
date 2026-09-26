"use client";

// Screen transition for the Android app: a new screen slides in from the trailing
// edge, the way a SwiftUI NavigationStack pushes one.
//
// Purpose is spatial consistency — it shows that the list detail came from the
// right and that going back returns it there. Users of the published iOS app
// already expect this, and without it the WebView feels like a page reload.
//
// Navigation happens many times a session, so this is deliberately brief. Native
// only; the web app navigates exactly as it did before.

import React from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

export default function NativeTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  // Reduced motion keeps the transition — it still signals that the screen
  // changed — but drops the travel and leaves only the fade.
  const from = reduceMotion
    ? { opacity: 0, transform: "translateX(0px)" }
    : { opacity: 0, transform: "translateX(24px)" };

  return (
    <motion.div
      // Re-keying on the path is what restarts the animation on navigation.
      key={pathname}
      initial={from}
      animate={{ opacity: 1, transform: "translateX(0px)" }}
      transition={{
        duration: reduceMotion ? 0.15 : 0.26,
        // Matches --ease-drawer in globals.css.
        ease: [0.32, 0.72, 0, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
