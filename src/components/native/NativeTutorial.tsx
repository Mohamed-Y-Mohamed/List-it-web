"use client";

// The in-app walkthrough, shown once per account on the Lists tab.
//
// Structurally a sibling of NativeOnboarding: same directional slide, same
// tappable dots, same Skip from the first frame. Two things differ on purpose.
//
// It is blue rather than orange. Orange belongs to the launch sequence — icon,
// splash, intro — and this one opens over the interface proper, which is blue;
// an orange sheet on top of the app read as a different app's advert.
//
// It sits at z-[75]: above NativeTabBar and NativeBackBar (z-40) and above
// NativeContextMenu (z-[70]), below the delete confirmation (z-[80]). Nothing
// else should be open underneath it, but a tutorial that a stray tab bar can
// poke through is worse than one that covers too much.

import React, { useCallback, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type PanInfo,
} from "framer-motion";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { useTheme } from "@/context/ThemeContext";
import {
  MockCollections,
  MockCreateList,
  MockCreateMenu,
  MockDefaultViews,
  MockNote,
  MockOpenList,
  MockTask,
} from "./tutorialMocks";

interface Step {
  title: string;
  body: string;
  Art: React.ComponentType<{ isDark: boolean }>;
}

// Every label quoted below is the one actually on screen — "Create Collection",
// "Create Task", "Create Note" come from ListFilter's menu. Teaching a synonym
// for a button the user is about to go looking for would be worse than not
// teaching it at all, so if one of those is renamed, rename it here too.
const STEPS: readonly Step[] = [
  {
    title: "Start with a list",
    body: "A list is where everything goes. It can be a project, a room, or a shop. Tap the plus at the top of the Lists tab to make your first one.",
    Art: MockCreateList,
  },
  {
    title: "Open it",
    body: "Tap a list to go inside. Press and hold it instead to pin, rename or delete it.",
    Art: MockOpenList,
  },
  {
    title: "Adding things",
    body: "Inside a list, the circled plus in the corner creates everything. Create Collection, Create Task and Create Note are all in that menu.",
    Art: MockCreateMenu,
  },
  {
    title: "Collections group your work",
    body: "A collection keeps related things together. Every new list starts with one called General. Use its Tasks and Notes tabs to switch between the two.",
    Art: MockCollections,
  },
  {
    title: "Tasks get ticked off",
    body: "Create Task adds a task to a collection. Tap the circle when it is done. Add a due date if you want a reminder on the day.",
    Art: MockTask,
  },
  {
    title: "Notes keep the rest",
    body: "Create Note is for anything you want to keep but do not need to tick off. Notes sit under the Notes tab of the same collection, and you can give each one a colour.",
    Art: MockNote,
  },
  {
    title: "Find things again",
    body: "Today, Priority and Overdue sit above your own lists on the Lists tab. Each one gathers matching tasks from all of your lists, so nothing gets lost at the bottom of a long list.",
    Art: MockDefaultViews,
  },
] as const;

// How far a swipe has to travel, or how fast it has to flick, to change step.
// Same numbers as NativeOnboarding, so the intro and the walkthrough read as one
// gesture rather than two.
const SWIPE_DISTANCE = 56;
const SWIPE_VELOCITY = 400;

export default function NativeTutorial({ onDone }: { onDone: () => void }) {
  const { theme } = useTheme();
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  // Which way the next step comes in from, so going back reverses the motion
  // instead of always sliding the same way.
  const [direction, setDirection] = useState(1);

  const isDark = theme === "dark";
  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;

  const go = useCallback(
    (next: number) => {
      void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
      setDirection(next > index ? 1 : -1);
      setIndex(next);
    },
    [index]
  );

  const advance = useCallback(() => {
    if (isLast) {
      void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
      onDone();
      return;
    }
    go(index + 1);
  }, [isLast, onDone, go, index]);

  // Swiping between the cards, matching NativeOnboarding so the walkthrough
  // behaves the same way the first-run intro just did.
  //
  // The Next button is untouched — this is a second route through the same `go`.
  // Unlike the button, a swipe does not finish the tutorial: reaching the end is
  // an explicit "Start using List It", not something a stray flick can trigger.
  const handleDragEnd = useCallback(
    (_event: unknown, info: PanInfo) => {
      const { offset, velocity } = info;

      const forward =
        offset.x < -SWIPE_DISTANCE || velocity.x < -SWIPE_VELOCITY;
      const back = offset.x > SWIPE_DISTANCE || velocity.x > SWIPE_VELOCITY;

      if (forward && index < STEPS.length - 1) go(index + 1);
      else if (back && index > 0) go(index - 1);
    },
    [index, go]
  );

  // Distance is small and the fade does most of the work — a full-width slide
  // reads as a page turn, which oversells moving between five cards.
  const offset = reduceMotion ? 0 : 28;
  const Art = step.Art;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="How List It works"
      className="fixed inset-0 z-[75] flex flex-col bg-white pb-safe-bottom pt-safe-top dark:bg-gray-950"
    >
      {/* Skip from the very first frame. Someone who already knows the app —
          a reinstall, a second device — should be able to leave in one tap. */}
      <div className="flex justify-end px-2 pt-1">
        <button
          type="button"
          onClick={onDone}
          className="touch-target flex items-center justify-center rounded-full px-4 text-[15px] font-medium text-gray-500 active:bg-black/5 dark:active:bg-white/10"
        >
          Skip
        </button>
      </div>

      {/* min-h-0 plus the scroll is what stops a short phone clipping the
          button row: the mocks are drawn at real screen proportions, so on a
          small device the tallest of them plus its caption genuinely does not
          fit, and silently cropping the dots and Next would be the worst way to
          find that out. */}
      {/* The drag sits on this container, not on the card inside it: the card is
          re-keyed per step by AnimatePresence, so a gesture bound to it would be
          torn down mid-swipe. touch-action pan-y matters more here than in the
          intro, because this container also scrolls vertically on a short phone. */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.18}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        style={{ touchAction: "pan-y" }}
        className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-8 py-2 text-center"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            className="flex w-full flex-col items-center"
            initial={{ opacity: 0, x: direction * offset }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -offset }}
            // Out faster than in, so the next screen never waits on the last one.
            transition={{
              duration: reduceMotion ? 0 : 0.28,
              ease: [0.23, 1, 0.32, 1],
            }}
          >
            <div className="mb-8 flex w-full justify-center">
              <Art isDark={isDark} />
            </div>

            <h1 className="text-[26px] font-bold leading-tight tracking-[-0.02em] text-gray-900 dark:text-white">
              {step.title}
            </h1>
            <p className="mt-3 max-w-[19rem] text-[15px] leading-relaxed text-gray-500 dark:text-gray-400">
              {step.body}
            </p>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <div className="px-8 pb-6">
        {/* Progress. Tappable, because a dot that shows position but refuses to
            take you there is a control pretending to be decoration. */}
        <div className="mb-7 flex justify-center gap-2">
          {STEPS.map((item, dot) => (
            <button
              key={item.title}
              type="button"
              onClick={() => go(dot)}
              aria-label={`Go to step ${dot + 1} of ${STEPS.length}`}
              aria-current={dot === index ? "step" : undefined}
              className="flex h-11 w-6 items-center justify-center"
            >
              <motion.span
                className={`block h-2 rounded-full ${
                  dot === index ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-700"
                }`}
                // The active dot stretches rather than just recolouring, so
                // position is legible without relying on colour.
                animate={{ width: dot === index ? 20 : 8 }}
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
          {isLast ? "Start using List It" : "Next"}
        </button>
      </div>
    </div>
  );
}
