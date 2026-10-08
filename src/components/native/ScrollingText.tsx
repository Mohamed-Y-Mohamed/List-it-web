"use client";

// A single line of text that scrolls itself when it is too long to fit, so the
// whole of it can be read without opening anything.
//
// ---------------------------------------------------------------------------
// Why it is not a plain marquee
//
// A list screen can hold a dozen cards. If every long name scrolled continuously
// from the moment the screen appeared, the result is a wall of movement nobody
// asked for, repainting forever on a phone. So the cycle rests: it holds still
// long enough to read the beginning, travels at a readable speed, waits at the
// end, snaps back, and only then goes again.
//
// It also only ever animates text that genuinely does not fit. Overflow is
// measured against the real box rather than guessed from a character count, which
// is what keeps a screen of mostly-short names completely still.
//
// The right edge fades instead of ending in an ellipsis. An ellipsis cannot
// survive the scroll — `text-overflow` belongs to the clipping box, so it would
// sit at the end of the moving text rather than at the edge of the card — and a
// fade reads as "there is more this way" during the travel as well as at rest.

import React, { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

/** How long the start of the name is held still before it moves, in seconds. */
const REST_SECONDS = 3;
/** Reading pace of the travel, in pixels per second. */
const TRAVEL_PX_PER_SECOND = 40;
/** Pause at the far end before snapping back, in seconds. */
const END_SECONDS = 1.5;
/** The snap back, in seconds. Fast, because it is a reset rather than a move. */
const RETURN_SECONDS = 0.4;

/** Ignore sub-pixel overflow, which rounding produces on text that really fits. */
const OVERFLOW_TOLERANCE_PX = 2;

export default function ScrollingText({
  children,
  className = "",
}: {
  /** Plain text. Measured by width, so it has to be a single line. */
  children: string;
  /** Typography for the text itself; the clipping box is this component's. */
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const boxRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    const box = boxRef.current;
    const text = textRef.current;
    if (!box || !text) return;

    const measure = () => {
      const overflow = text.scrollWidth - box.clientWidth;
      setDistance(overflow > OVERFLOW_TOLERANCE_PX ? overflow : 0);
    };

    measure();

    // The card is in a grid that reflows between two and three columns, and the
    // name can change under an edit, so a single measurement at mount goes stale.
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    observer.observe(text);
    return () => observer.disconnect();
  }, [children]);

  const shouldScroll = distance > 0 && !reduceMotion;

  // Travel time follows the distance, so a name that is barely too long does not
  // crawl and a very long one does not blur past.
  const travel = distance / TRAVEL_PX_PER_SECOND;
  const total = REST_SECONDS + travel + END_SECONDS + RETURN_SECONDS;

  return (
    <span
      ref={boxRef}
      className="block w-full overflow-hidden"
      // Only while it can actually scroll. At rest the fade would dim the last
      // letter of a name that fits perfectly well.
      style={
        shouldScroll
          ? {
              maskImage:
                "linear-gradient(to right, #000 calc(100% - 1.5em), transparent)",
              WebkitMaskImage:
                "linear-gradient(to right, #000 calc(100% - 1.5em), transparent)",
            }
          : undefined
      }
    >
      <motion.span
        ref={textRef}
        className={`inline-block whitespace-nowrap ${
          shouldScroll ? "" : "block w-full truncate"
        } ${className}`}
        animate={
          shouldScroll ? { x: [0, 0, -distance, -distance, 0] } : { x: 0 }
        }
        transition={
          shouldScroll
            ? {
                duration: total,
                times: [
                  0,
                  REST_SECONDS / total,
                  (REST_SECONDS + travel) / total,
                  (REST_SECONDS + travel + END_SECONDS) / total,
                  1,
                ],
                // Constant speed across the travel so it reads evenly; the snap
                // back eases out because it is the one part that is not reading.
                ease: ["linear", "linear", "linear", "easeOut"],
                repeat: Infinity,
              }
            : { duration: 0 }
        }
      >
        {children}
      </motion.span>
    </span>
  );
}
