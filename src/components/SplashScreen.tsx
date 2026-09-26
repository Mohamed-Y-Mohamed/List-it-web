"use client";

// The app-mode launch screen, shown in the Android shell and in an installed PWA.
//
// It takes over from the native splash, which is a flat #4f46e5 field with no
// artwork. Both share that colour, so the hand-off reads as one screen that comes
// to life rather than two screens swapping. First launch only, so this is where
// the app can afford a little character.

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const SPLASH_DURATION_MS = 1800;

// Strong ease-out. Matches --ease-out in globals.css.
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

interface SplashScreenProps {
  onDone: () => void;
}

export default function SplashScreen({ onDone }: SplashScreenProps) {
  const [visible, setVisible] = useState(true);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDone();
    }, SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

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
          style={{ backgroundColor: "#4f46e5" }}
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
              className="text-3xl font-bold tracking-wide text-white"
              variants={rise}
              transition={{ duration: 0.4, ease: EASE_OUT }}
            >
              List It
            </motion.h1>

            <motion.p
              className="text-sm text-indigo-200"
              variants={rise}
              transition={{ duration: 0.4, ease: EASE_OUT }}
            >
              Smart Task Management
            </motion.p>

            {/* Loading dots. CSS-driven, so they keep their rhythm while the app
                bundle is still parsing and the main thread is busy. */}
            <motion.div
              className="mt-4 flex gap-1"
              variants={rise}
              transition={{ duration: 0.4, ease: EASE_OUT }}
            >
              {[0, 1, 2].map((index) => (
                <span
                  key={index}
                  className="h-2 w-2 animate-bounce rounded-full bg-white opacity-80 motion-reduce:animate-none"
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
