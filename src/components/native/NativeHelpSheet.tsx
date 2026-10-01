"use client";

// The help window on the Lists tab: the same material the first-run walkthrough
// teaches, available on demand.
//
// It is the walkthrough's data in a different view, not a second copy of it. The
// copy lives in lib/helpTopics.ts and the walkthrough itself is untouched: it still
// appears once per account, full screen, with its illustrations. This shows the same
// topics in a bottom sheet for anyone who skipped it, read it months ago, or has met
// something that did not exist when they did.
//
// Two deliberate differences from the walkthrough:
//
//   * Newest topic first, oldest last. Somebody opening this has already used the
//     app; what they came for is whatever changed, not "start with a list".
//   * A sheet rather than a full screen, so the lists stay visible behind it. This
//     is a reference, not a gate, and covering the thing being explained would be
//     the wrong trade.
//
// Stepping matches the walkthrough exactly: swipe either way, or use the button,
// with tappable dots for position.

import React, { useCallback, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type PanInfo,
} from "framer-motion";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { HELP_TOPICS, RECENT_TOPICS } from "@/lib/helpTopics";
import NativeSheet from "./NativeSheet";

// Same numbers as NativeOnboarding and NativeTutorial, so every card stack in the
// app answers to the same flick. Change one, change all three.
const SWIPE_DISTANCE = 56;
const SWIPE_VELOCITY = 400;

const RECENT_IDS = new Set(RECENT_TOPICS.map((topic) => topic.id));

export default function NativeHelpSheet({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  // Which way the next card comes in from, so going back reverses the motion
  // rather than always sliding the same way.
  const [direction, setDirection] = useState(1);

  const topic = HELP_TOPICS[index];
  const isLast = index === HELP_TOPICS.length - 1;

  const go = useCallback(
    (next: number) => {
      void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
      setDirection(next > index ? 1 : -1);
      setIndex(next);
    },
    [index]
  );

  // Closing resets to the top. The sheet is a reference rather than a sequence, so
  // reopening it a week later should start at whatever is newest, not wherever this
  // session happened to stop reading.
  const close = useCallback(() => {
    onClose();
    setIndex(0);
    setDirection(1);
  }, [onClose]);

  const advance = useCallback(() => {
    if (isLast) {
      close();
      return;
    }
    go(index + 1);
  }, [isLast, close, go, index]);

  // A swipe moves between cards but never closes the sheet on the last one. The
  // sheet has its own downward drag-to-dismiss, and a horizontal flick meaning
  // "close" as well would make the end of the stack feel like a trapdoor.
  const handleDragEnd = useCallback(
    (_event: unknown, info: PanInfo) => {
      const { offset, velocity } = info;

      const forward =
        offset.x < -SWIPE_DISTANCE || velocity.x < -SWIPE_VELOCITY;
      const back = offset.x > SWIPE_DISTANCE || velocity.x > SWIPE_VELOCITY;

      if (forward && index < HELP_TOPICS.length - 1) go(index + 1);
      else if (back && index > 0) go(index - 1);
    },
    [index, go]
  );

  // Distance is small and the fade carries it. A full-width slide inside a sheet
  // reads as a page turn, which oversells moving between cards.
  const offset = reduceMotion ? 0 : 28;

  return (
    <NativeSheet isOpen={isOpen} onClose={close} title="How List It works">
      {/* The drag sits on this container rather than the card: AnimatePresence
          re-keys the card per step, so a gesture bound to it would be torn down
          mid-swipe. `pan-y` leaves vertical panning to the sheet, which owns
          drag-to-dismiss and the scroll this sits in. */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.18}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        style={{ touchAction: "pan-y" }}
        className="flex flex-col"
      >
        {/* A fixed floor so the dots and the button do not walk up and down the
            sheet as the body text changes length between topics. */}
        <div className="flex min-h-[9.5rem] items-start">
          <AnimatePresence mode="wait">
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, x: direction * offset }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -offset }}
              // Out faster than in, so the next card never waits on the last one.
              transition={{
                duration: reduceMotion ? 0 : 0.28,
                ease: [0.23, 1, 0.32, 1],
              }}
            >
              <div className="flex items-center gap-2">
                <h3 className="text-[19px] font-bold leading-tight tracking-[-0.01em]">
                  {topic.title}
                </h3>
                {/* Only on what the walkthrough never covered, which is the
                    reason an existing user opens this at all. */}
                {RECENT_IDS.has(topic.id) && (
                  <span className="shrink-0 rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    New
                  </span>
                )}
              </div>
              <p className="mt-2 text-[15px] leading-relaxed text-gray-500 dark:text-gray-400">
                {topic.body}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress. Tappable, because a dot that shows position but refuses to
            take you there is a control pretending to be decoration. */}
        <div className="mb-5 mt-6 flex flex-wrap justify-center gap-1">
          {HELP_TOPICS.map((item, dot) => (
            <button
              key={item.id}
              type="button"
              onClick={() => go(dot)}
              aria-label={`Go to ${item.title}`}
              aria-current={dot === index ? "step" : undefined}
              className="flex h-11 w-5 items-center justify-center"
            >
              <motion.span
                className={`block h-2 rounded-full ${
                  dot === index ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-700"
                }`}
                // The active dot stretches rather than just recolouring, so
                // position is legible without relying on colour.
                animate={{ width: dot === index ? 18 : 8 }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 500, damping: 34 }
                }
              />
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={advance}
          className="flex min-h-[50px] w-full items-center justify-center rounded-[14px] bg-blue-500 text-[16px] font-semibold text-white transition-transform duration-100 active:scale-[0.98] active:bg-blue-600"
        >
          {isLast ? "Done" : "Next"}
        </button>
      </motion.div>
    </NativeSheet>
  );
}
