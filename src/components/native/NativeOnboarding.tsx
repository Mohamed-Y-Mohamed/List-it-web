"use client";

// The first-run intro, shown once before a new user reaches the sign-in screen.
//
// A welcome carrying the app's own mark and what it is for, two screens on what
// it does, then the only runtime permission it asks for. Skip is available from
// the first frame — an intro that holds someone hostage is worse than no intro.
//
// Orange throughout, taken from the logo. The interface proper is blue, but the
// launch sequence — icon, splash, intro — belongs to the brand, and putting a
// blue button under an orange mark read as two different apps.
//
// Native only. The website has a landing page that does this job for visitors,
// and an installed PWA belongs to someone who already signed up.

import React, { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type PanInfo,
} from "framer-motion";
import { BellRing, ListChecks, RefreshCw, type LucideIcon } from "lucide-react";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { markOnboardingSeen } from "@/lib/onboarding";
import { ensureNotificationPermission } from "@/lib/notifications";
import { appPath } from "@/lib/routes";

interface Step {
  /** The welcome screen shows the app mark itself instead of a glyph. */
  isWelcome?: boolean;
  icon?: LucideIcon;
  title: string;
  body: string;
  /** The last screen asks for notification permission instead of moving on. */
  isPermissionRequest?: boolean;
}

// Written to be read once, quickly, by anyone.
//
// Short sentences, no dashes holding two clauses together, and no "not X, but Y"
// constructions — the previous copy leaned on all three, which is what made it read
// as machine-written rather than as someone explaining their app. Every fact the old
// copy carried is still here; only the phrasing changed.
const STEPS: readonly Step[] = [
  {
    isWelcome: true,
    title: "List It",
    body: "Keep your tasks and notes in one place, instead of spread around your phone.",
  },
  {
    icon: ListChecks,
    title: "Everything in one list",
    body: "A list holds both tasks and notes. Group them into collections so everything about one job stays together.",
  },
  {
    icon: RefreshCw,
    title: "On your phone and on the web",
    body: "Your lists are saved to your account. Sign in on the website and they are already there.",
  },
  {
    icon: BellRing,
    title: "Turn on reminders?",
    // Says what will be sent and how often, because that is what the decision
    // actually turns on. Notifications are the only permission the app asks for.
    body: "Give a task a date and add your own reminders: an hour before, a day before, or a time you pick. You only hear from List It when you have asked to. Android will ask your permission first, and this is the only permission the app needs.",
    isPermissionRequest: true,
  },
] as const;

// How far a swipe has to travel, or how fast it has to flick, to change step.
// Matched to SwipeableRow so the two gestures feel like the same hand.
const SWIPE_DISTANCE = 56;
const SWIPE_VELOCITY = 400;

export default function NativeOnboarding() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  // Which way the next step should come in from, so going back reverses the
  // motion instead of always sliding the same direction.
  const [direction, setDirection] = useState(1);
  const [requesting, setRequesting] = useState(false);

  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;

  const leave = useCallback(() => {
    markOnboardingSeen();
    // `replace`, not `push`: hardware back from the sign-in screen must not
    // return to an intro the user has already dismissed. appPath keeps the
    // trailing slash the static export needs, so this stays a client-side
    // navigation rather than a full document load.
    router.replace(appPath("/login"));
  }, [router]);

  const go = useCallback(
    (next: number) => {
      void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
      setDirection(next > index ? 1 : -1);
      setIndex(next);
    },
    [index],
  );

  const advance = useCallback(() => {
    if (isLast) return;
    go(index + 1);
  }, [isLast, go, index]);

  // Swiping between the cards, which is how anyone expects a paged intro to work.
  //
  // The Next button stays exactly as it was — this is a second route through the
  // same `go`, not a replacement for it. It also gives the flow a way *backwards*:
  // before this the only way back was tapping an earlier dot, and there was no back
  // button at all.
  const handleDragEnd = useCallback(
    (_event: unknown, info: PanInfo) => {
      const { offset, velocity } = info;

      const forward =
        offset.x < -SWIPE_DISTANCE || velocity.x < -SWIPE_VELOCITY;
      const back = offset.x > SWIPE_DISTANCE || velocity.x > SWIPE_VELOCITY;

      // Clamped at both ends rather than wrapping. Swiping past the last card must
      // not skip the permission question, and there is nothing before the welcome.
      if (forward && index < STEPS.length - 1) go(index + 1);
      else if (back && index > 0) go(index - 1);
    },
    [index, go],
  );

  // Asking here rather than when the first reminder is due is the whole point of
  // this screen: on Android 13+ the system dialog can only be shown twice, and a
  // cold prompt with no explanation is how an app burns both. The OS dialog only
  // appears once the user has said yes to this, so "Not now" costs nothing and
  // they can still be asked later.
  const requestPermission = useCallback(async () => {
    if (requesting) return;
    setRequesting(true);
    void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});

    try {
      await ensureNotificationPermission();
    } finally {
      // Granted or refused, the intro is done either way — the app works without
      // notifications and refusing is not a reason to be held here.
      leave();
    }
  }, [requesting, leave]);

  const Icon = step.icon;

  // Distance is small and the fade does most of the work — a full-width slide
  // reads as a page turn, which oversells moving between four cards.
  const offset = reduceMotion ? 0 : 28;

  return (
    // gray-900, not gray-950: this is the screen the splash fades away to
    // reveal, and the splash field is #111827. A darker surface here showed as a
    // visible step between the two on the hand-off.
    <div className="fixed inset-0 z-50 flex flex-col bg-white pt-safe-top pb-safe-bottom dark:bg-gray-900">
      {/* Skip sits top-right from the very first screen. Anyone who has used the
          app before should be able to leave in one tap. */}
      <div className="flex justify-end px-2 pt-1">
        <button
          type="button"
          onClick={leave}
          className="touch-target flex items-center justify-center rounded-full px-4 text-[15px] font-medium text-gray-500 active:bg-black/5 dark:active:bg-white/10"
        >
          Skip
        </button>
      </div>

      {/* The drag lives on this container rather than on the card inside it: the
          card is re-keyed on every step by AnimatePresence, so a gesture attached
          to it would be interrupted mid-swipe.

          dragConstraints pins it to zero so it never actually travels — the elastic
          give is the feedback, and the step change is what resolves the gesture.
          touch-action pan-y leaves vertical scrolling to the browser. */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.18}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        style={{ touchAction: "pan-y" }}
        className="flex flex-1 flex-col items-center justify-center px-8 text-center"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            className="flex flex-col items-center"
            initial={{ opacity: 0, x: direction * offset }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -offset }}
            // Out faster than in, so the next screen never waits on the last one.
            transition={{
              duration: reduceMotion ? 0 : 0.28,
              ease: [0.23, 1, 0.32, 1],
            }}
          >
            {step.isWelcome ? (
              // The mark at full strength, sized like an app icon rather than a
              // glyph in a tile. It is the same image the launcher and the splash
              // use, so the intro reads as a continuation of the launch.
              <div className="mb-9 h-[104px] w-[104px] overflow-hidden rounded-[26px] shadow-xl">
                <Image
                  src="/android-chrome-512x512.png"
                  alt=""
                  width={104}
                  height={104}
                  priority
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              Icon && (
                <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-[22px] bg-orange-500/10">
                  <Icon
                    size={36}
                    strokeWidth={1.8}
                    className="text-orange-500"
                  />
                </div>
              )
            )}

            <h1
              className={`font-bold leading-tight tracking-[-0.02em] text-gray-900 dark:text-white ${
                // The app's own name gets to be bigger than a feature heading.
                step.isWelcome ? "text-[34px]" : "text-[26px]"
              }`}
            >
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
                  dot === index
                    ? "bg-orange-500"
                    : "bg-gray-300 dark:bg-gray-700"
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

        {step.isPermissionRequest ? (
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={requestPermission}
              disabled={requesting}
              className="flex min-h-[50px] w-full items-center justify-center rounded-[14px] bg-orange-500 text-[16px] font-semibold text-white transition-transform duration-100 active:scale-[0.98] active:bg-orange-600 disabled:opacity-60"
            >
              {requesting ? "Waiting for Android..." : "Turn on reminders"}
            </button>
            <button
              type="button"
              onClick={leave}
              disabled={requesting}
              className="flex min-h-[50px] w-full items-center justify-center rounded-[14px] text-[16px] font-medium text-gray-500 active:bg-black/5 disabled:opacity-60 dark:active:bg-white/10"
            >
              Not now
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={advance}
            className="flex min-h-[50px] w-full items-center justify-center rounded-[14px] bg-orange-500 text-[16px] font-semibold text-white transition-transform duration-100 active:scale-[0.98] active:bg-orange-600"
          >
            {index === 0 ? "Get started" : "Next"}
          </button>
        )}
      </div>
    </div>
  );
}
