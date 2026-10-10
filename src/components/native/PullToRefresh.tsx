"use client";

// Pull the screen down from the top to refetch. Native only.
//
// The web does not get this, and that is the point: a browser already has a
// reload button and a pull-down gesture of its own, so adding a second one would
// be competing with the platform. On a phone there is no reload button, and after
// the launch fetch the only other thing that refetches is bringing the app back
// to the foreground — which is no help to someone who is already looking at it.
//
// ---------------------------------------------------------------------------
// Why raw touch handlers rather than framer's `drag`
//
// The gesture has to be live only at the very top of the page and get out of the
// way everywhere else. `drag="y"` would have to be enabled and disabled from
// inside the gesture it is deciding about, and framer takes pointer capture the
// moment it starts, which is exactly what must not happen when the user meant to
// scroll. Reading the scroll position on touchstart and simply not acting is both
// simpler and impossible to get into a fight with the scroller.
//
// Nothing here calls preventDefault. At scroll top there is nothing above to
// scroll to, so the browser does nothing with a downward drag anyway and the
// listeners can stay passive.

import React, { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { IS_NATIVE_BUILD, isNativeApp } from "@/lib/platform";
import { useOptionalAppData } from "@/components/native/AppDataProvider";

/** How far the finger must travel before the release counts as a refresh. */
const THRESHOLD_PX = 72;

/** How far the sheet can follow the finger. Past this it simply stops. */
const MAX_PULL_PX = 96;

/**
 * Pull travels at half the finger's speed.
 *
 * A 1:1 follow feels loose and lets a careless drag cross the threshold by
 * accident; damping it makes the gesture something you commit to.
 */
const RESISTANCE = 0.5;

/**
 * Whether anything between the touch and the document is itself scrolled.
 *
 * The page being at the top is not enough on its own. A collection's task panel
 * is its own `overflow-y-auto` scroller, and dragging down inside one that is
 * part-scrolled means "scroll this back up", not "refresh the screen". Walking up
 * from the target is the only way to tell those apart, because the touch lands on
 * the card either way.
 */
function hasScrolledAncestor(target: EventTarget | null): boolean {
  let node = target instanceof Element ? target : null;

  while (node && node !== document.body) {
    if (node.scrollTop > 0) return true;
    node = node.parentElement;
  }

  return false;
}

export default function PullToRefresh({
  children,
}: {
  children: React.ReactNode;
}) {
  // Reads the provider rather than taking an `onRefresh` prop. There is exactly
  // one thing a pull refreshes in this app, and a prop whose only argument is
  // always `appData.refresh` is a parameter pretending to be a decision.
  const appData = useOptionalAppData();
  const onRefresh = appData?.refresh;

  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  /** Where the finger went down, or null when this touch is not a candidate. */
  const startY = useRef<number | null>(null);
  /** Whether the haptic for crossing the threshold has already fired. */
  const armed = useRef(false);

  const onTouchStart = useCallback(
    (event: React.TouchEvent) => {
      if (refreshing) return;

      // Only a touch that begins at the top of a page that is itself at the top.
      if (window.scrollY > 0 || hasScrolledAncestor(event.target)) {
        startY.current = null;
        return;
      }

      startY.current = event.touches[0]?.clientY ?? null;
      armed.current = false;
    },
    [refreshing],
  );

  const onTouchMove = useCallback((event: React.TouchEvent) => {
    if (startY.current === null) return;

    const delta = (event.touches[0]?.clientY ?? 0) - startY.current;

    // An upward drag is an ordinary scroll. Abandon the gesture rather than
    // clamping to zero, so a pull-then-scroll does not snap back on release.
    if (delta <= 0) {
      startY.current = null;
      setPull(0);
      return;
    }

    const next = Math.min(delta * RESISTANCE, MAX_PULL_PX);
    setPull(next);

    // One tick as the threshold is crossed, so the user knows letting go will do
    // something without having to read the spinner.
    if (!armed.current && next >= THRESHOLD_PX) {
      armed.current = true;
      if (isNativeApp()) {
        Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
      }
    }
  }, []);

  const onTouchEnd = useCallback(async () => {
    const travelled = pull;

    startY.current = null;
    armed.current = false;

    if (travelled < THRESHOLD_PX || !onRefresh) {
      setPull(0);
      return;
    }

    // Hold the sheet at the threshold while the fetch runs, so the spinner has
    // somewhere to sit and the content does not snap back and then wait.
    setRefreshing(true);
    setPull(THRESHOLD_PX);

    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
      setPull(0);
    }
  }, [pull, onRefresh]);

  // Off-native this is a pass-through with no listeners at all. IS_NATIVE_BUILD is
  // a compile-time constant, so the web bundle drops the whole thing.
  if (!IS_NATIVE_BUILD) return <>{children}</>;

  const progress = Math.min(pull / THRESHOLD_PX, 1);

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      {/* The indicator sits in the gap the content opens up, not over it. It is
          `fixed` so it stays put while the content slides past, and it clears the
          status bar with the same inset everything else uses. */}
      <motion.div
        className="pointer-events-none fixed inset-x-0 top-0 z-30 flex justify-center pt-safe-top"
        style={{ opacity: progress }}
        aria-hidden={pull === 0}
      >
        <div
          className="mt-2 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--surface-border)] bg-[var(--surface-card)] shadow-lg"
          style={{ transform: `translateY(${pull * 0.5}px)` }}
        >
          <Loader2
            size={18}
            className={`text-[#6366F1] ${refreshing ? "animate-spin" : ""}`}
            // Before it starts spinning the glyph turns with the pull, so the
            // gesture reads as winding something up rather than as a dead icon.
            style={
              refreshing ? undefined : { transform: `rotate(${progress * 270}deg)` }
            }
          />
        </div>
      </motion.div>

      <motion.div
        animate={{ y: pull }}
        // No spring on the way down: while the finger is on the glass the sheet
        // has to track it exactly, and a spring would lag behind the thumb. The
        // release is where the animation belongs.
        transition={
          startY.current !== null
            ? { duration: 0 }
            : { type: "spring", stiffness: 420, damping: 36 }
        }
      >
        {children}
      </motion.div>
    </div>
  );
}
