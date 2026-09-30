"use client";

// Bottom sheet, standing in for SwiftUI's `.sheet` with
// `.presentationDetents([.medium, .large])` and `.presentationCornerRadius(25)`.
//
// Matches the iOS behaviour that users of the published app will expect: it rises
// from the bottom, sits at roughly half height, can be dragged up to full height
// or flicked down to dismiss, and has a grab handle.

import React, { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  type PanInfo,
} from "framer-motion";
import { useTheme } from "@/context/ThemeContext";

type Detent = "medium" | "large";

interface NativeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Height the sheet opens at. Dragging up promotes it to "large". */
  initialDetent?: Detent;
}

const DETENT_HEIGHT: Record<Detent, string> = {
  medium: "55vh",
  large: "92vh",
};

// Flick down faster than this, or drag past a third of the sheet, to dismiss —
// the same two-part rule iOS uses, so a quick flick works without a long drag.
const DISMISS_VELOCITY = 500;
const DISMISS_FRACTION = 0.33;

export default function NativeSheet({
  isOpen,
  onClose,
  title,
  children,
  initialDetent = "medium",
}: NativeSheetProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [detent, setDetent] = useState<Detent>(initialDetent);
  const sheetRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);

  // Reset to the caller's detent each time it opens, so a sheet previously
  // dragged to full height does not reopen that way.
  useEffect(() => {
    if (isOpen) {
      setDetent(initialDetent);
      y.set(0);
    }
  }, [isOpen, initialDetent, y]);

  // The sheet is modal, so the content behind it must not scroll.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const height = sheetRef.current?.offsetHeight ?? 0;

    if (
      info.velocity.y > DISMISS_VELOCITY ||
      info.offset.y > height * DISMISS_FRACTION
    ) {
      onClose();
      return;
    }

    // A decisive upward drag promotes a medium sheet to full height.
    if (detent === "medium" && (info.offset.y < -60 || info.velocity.y < -400)) {
      setDetent("large");
    }
    y.set(0);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`fixed inset-x-0 bottom-0 z-[61] flex flex-col overflow-hidden rounded-t-[25px] ${
              isDark ? "bg-gray-900 text-white" : "bg-white text-gray-900"
            }`}
            style={{ height: DETENT_HEIGHT[detent], y }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            // Approximates the iOS sheet's settle: quick, with almost no bounce.
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.6 }}
            onDragEnd={handleDragEnd}
          >
            {/* Grab handle */}
            <div className="flex shrink-0 justify-center pt-2 pb-1">
              <div
                className={`h-1 w-10 rounded-full ${
                  isDark ? "bg-gray-600" : "bg-gray-300"
                }`}
              />
            </div>

            {title && (
              <h2 className="shrink-0 px-5 pb-2 text-center text-[17px] font-semibold">
                {title}
              </h2>
            )}

            {/* Only the content scrolls, so the handle and title stay put. The
                bottom padding clears the navigation bar and the keyboard.

                The `max()` floor is load-bearing on Android, not belt-and-braces:
                Chromium derives env(safe-area-inset-bottom) from display-cutout
                insets, so on a device with no bottom cutout it reports 0 and an
                inset-only value would leave the last row under the navigation bar.
                Same reasoning as pb-sheet-safe in globals.css, which carries the
                fuller explanation. */}
            <div
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5"
              style={{
                paddingBottom:
                  "max(5rem, calc(env(safe-area-inset-bottom, 0px) + var(--keyboard-offset, 0px) + 1.25rem))",
              }}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
