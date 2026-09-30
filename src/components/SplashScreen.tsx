"use client";

// The app-mode launch screen, shown in the Android shell and in an installed PWA.
//
// It takes over from the native splash and paints the same field, so the hand-off
// reads as one screen coming to life rather than two screens swapping. That field
// follows the system's light or dark setting through the --splash-* variables in
// globals.css, which are set by a media query rather than by ThemeContext — the
// context resolves after mount, and a frame of white before a dark launch is
// precisely the flicker this screen exists to prevent.
//
// The orange mark is the only colour on it. The field itself is the surface the
// app opens onto, so the splash is continuous with the screen behind it in both
// directions.

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

// How long the splash stays up at minimum. Long enough to read as a deliberate
// launch screen rather than a flash, and roughly how long the work behind it
// takes anyway, so most launches never wait past it.
const MIN_VISIBLE_MS = 1800;

// The point at which the splash stops waiting for `ready` and hands over
// regardless. Without a cap, a stalled session read or a token refresh on a bad
// connection would hold the splash for the life of the process — trading the old
// blank screen for a stuck one, which is no better.
const MAX_VISIBLE_MS = 8000;

// Strong ease-out. Matches --ease-out in globals.css.
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

interface SplashScreenProps {
  onDone: () => void;
  /**
   * Whether the work this splash is covering has finished. The splash stays up
   * until this is true *and* MIN_VISIBLE_MS has elapsed, which makes it a
   * hand-off rather than a timer racing the app.
   *
   * Defaults to true, reproducing the original fixed-duration behaviour exactly.
   * That is what the installed PWA gets: it opens straight onto a real page, so
   * there is nothing for the splash to wait for.
   */
  ready?: boolean;
}

export default function SplashScreen({
  onDone,
  ready = true,
}: SplashScreenProps) {
  const [visible, setVisible] = useState(true);
  const [minElapsed, setMinElapsed] = useState(false);
  const reduceMotion = useReducedMotion();

  // Fires at most once: two clocks and a readiness flag can all arrive at the
  // same hand-off, and `onDone` drives a state change in the parent.
  const handedOver = useRef(false);

  const handOver = useCallback(() => {
    if (handedOver.current) return;
    handedOver.current = true;
    setVisible(false);
    onDone();
  }, [onDone]);

  // The two clocks. Neither knows anything about what the app is doing.
  useEffect(() => {
    const minTimer = setTimeout(() => setMinElapsed(true), MIN_VISIBLE_MS);
    const maxTimer = setTimeout(handOver, MAX_VISIBLE_MS);
    return () => {
      clearTimeout(minTimer);
      clearTimeout(maxTimer);
    };
  }, [handOver]);

  // The normal way out: the app reported ready and the minimum has passed.
  useEffect(() => {
    if (!minElapsed || !ready) return;
    handOver();
  }, [minElapsed, ready, handOver]);

  // Each element arrives just behind the one above it, so the screen assembles
  // top-down instead of appearing all at once.
  const rise = {
    hidden: reduceMotion
      ? { opacity: 0, transform: "translateY(0px)" }
      : { opacity: 0, transform: "translateY(12px)" },
    shown: { opacity: 1, transform: "translateY(0px)" },
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{ backgroundColor: "var(--splash-bg)" }}
          initial={{ opacity: 1 }}
          // Fades out to reveal the app rather than cutting, which would flash.
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
        >
          <motion.div
            className="flex flex-col items-center gap-6"
            initial="hidden"
            animate="shown"
            transition={{ staggerChildren: reduceMotion ? 0 : 0.07 }}
          >
            <motion.div
              className="h-28 w-28 overflow-hidden rounded-2xl shadow-2xl"
              variants={{
                // Settles from slightly small — never from nothing, which reads
                // as a pop rather than an arrival.
                hidden: reduceMotion
                  ? { opacity: 0, transform: "scale(1)" }
                  : { opacity: 0, transform: "scale(0.92)" },
                shown: { opacity: 1, transform: "scale(1)" },
              }}
              transition={{ duration: 0.45, ease: EASE_OUT }}
            >
              <Image
                src="/android-chrome-512x512.png"
                alt="List It logo"
                width={112}
                height={112}
                priority
                className="h-full w-full object-cover"
              />
            </motion.div>

            <motion.h1
              className="text-3xl font-bold tracking-wide"
              style={{ color: "var(--splash-fg)" }}
              variants={rise}
              transition={{ duration: 0.4, ease: EASE_OUT }}
            >
              List It
            </motion.h1>

            <motion.p
              className="text-sm"
              style={{ color: "var(--splash-muted)" }}
              variants={rise}
              transition={{ duration: 0.4, ease: EASE_OUT }}
            >
              Smart Task Management
            </motion.p>

            {/* Loading dots. CSS-driven, so they keep their rhythm while the app
                bundle is still parsing and the main thread is busy.

                Orange, picked up from the mark above rather than the blue the
                interface uses: on a field this plain a second accent would just
                compete with the logo. Blue takes over the moment the app opens. */}
            <motion.div
              className="mt-4 flex gap-1"
              variants={rise}
              transition={{ duration: 0.4, ease: EASE_OUT }}
            >
              {[0, 1, 2].map((index) => (
                <span
                  key={index}
                  className="h-2 w-2 animate-bounce rounded-full bg-orange-500 motion-reduce:animate-none"
                  style={{ animationDelay: `${index * 0.15}s` }}
                />
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
