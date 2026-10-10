"use client";

// Loading placeholders shaped like the thing that is coming.
//
// The screens used to show a centred spinner with a halo and the words "Loading
// tasks…", which tells you the app is busy and nothing about what is arriving.
// A skeleton the same height as a task card means the layout does not jump when
// the data lands, and the shape itself says "a list of cards" before the first
// one exists.
//
// One shared pulse, deliberately: several independent animations drifting out of
// phase on the same screen reads as jitter rather than loading. `animate-pulse`
// is Tailwind's, so every skeleton on a page is on the same clock.

import React from "react";

function Bar({
  className = "",
  isDark,
}: {
  className?: string;
  isDark: boolean;
}) {
  return (
    <span
      className={`block rounded-md ${
        isDark ? "bg-white/[0.07]" : "bg-black/[0.06]"
      } ${className}`}
    />
  );
}

/**
 * One task card's worth of placeholder: stripe, title, meta row.
 *
 * On the field, not the card. That is what a real task card is now — a task sits
 * inside a collection, so it drops back to the page colour to stand off it — and
 * a placeholder painted on the card colour would be a visibly different shade
 * from the thing replacing it, so the screen would change tone as data landed.
 *
 * The stripe is 4px and opaque for the same reason: every task has one now,
 * whatever its status, so the placeholder has one too.
 */
export function SkeletonTaskCard({ isDark }: { isDark: boolean }) {
  return (
    <div
      className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface-field)] p-2.5 pl-3.5"
      style={{
        borderLeft: `4px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.09)"}`,
      }}
      aria-hidden="true"
    >
      <div className="space-y-1.5">
        <Bar className="h-3.5 w-1/2" isDark={isDark} />
        <Bar className="h-2.5 w-3/4" isDark={isDark} />
        <div className="flex gap-1.5 pt-0.5">
          <Bar className="h-5 w-16 rounded-full" isDark={isDark} />
          <Bar className="h-5 w-20 rounded-full" isDark={isDark} />
        </div>
      </div>
    </div>
  );
}

/** A run of them. `count` is whatever fills a first screenful without scrolling. */
export function SkeletonTaskList({
  isDark,
  count = 5,
}: {
  isDark: boolean;
  count?: number;
}) {
  return (
    <div
      className="animate-pulse space-y-2"
      role="status"
      aria-label="Loading tasks"
    >
      {Array.from({ length: count }, (_, i) => (
        <SkeletonTaskCard key={i} isDark={isDark} />
      ))}
    </div>
  );
}

/** One figure tile, matching TaskStatsCard's geometry. */
export function SkeletonStatTile({ isDark }: { isDark: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        isDark
          ? "border-white/[0.08] bg-[var(--surface-card)]"
          : "border-black/[0.06] bg-white"
      }`}
      aria-hidden="true"
    >
      <Bar className="h-2.5 w-14" isDark={isDark} />
      <Bar className="mt-2.5 h-7 w-12" isDark={isDark} />
    </div>
  );
}

/**
 * A note card's worth: taller, because a note shows a preview.
 *
 * Same field surface as the task card, matching an uncoloured note. A note with
 * a colour is painted in it, but a skeleton cannot know which colour is coming
 * and guessing one would flash the wrong hue.
 */
export function SkeletonNoteCard({ isDark }: { isDark: boolean }) {
  return (
    <div
      className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface-field)] p-2.5 pl-3.5"
      style={{
        borderLeft: `3px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.09)"}`,
      }}
      aria-hidden="true"
    >
      <div className="space-y-1.5">
        <Bar className="h-3.5 w-2/5" isDark={isDark} />
        <Bar className="h-2.5 w-full" isDark={isDark} />
        <Bar className="h-2.5 w-4/5" isDark={isDark} />
        <Bar className="h-2.5 w-20" isDark={isDark} />
      </div>
    </div>
  );
}

/**
 * A list card on the Lists home, in either layout.
 *
 * Matched to the wave card it stands in for: 17px corners rather than the old
 * 16px, the ramp's card colour in both themes rather than a hardcoded white in
 * light, and the leading colour bar both layouts now carry. No wave bands — the
 * list's colour is the one thing a placeholder cannot know, and painting a grey
 * one would read as a card that has lost its colour rather than as loading.
 */
export function SkeletonListCard({
  isDark,
  variant = "grid",
}: {
  isDark: boolean;
  variant?: "grid" | "row";
}) {
  const isGrid = variant === "grid";

  return (
    <div
      className={`flex items-start gap-2.5 rounded-[17px] border border-[var(--surface-border)] bg-[var(--surface-card)] ${
        isGrid ? "min-h-[84px] p-3.5" : "min-h-[64px] items-center px-4 py-3"
      }`}
      aria-hidden="true"
    >
      {/* The bar, in the same 4x28 the real card uses. */}
      <Bar className="h-7 w-1 shrink-0 rounded-full" isDark={isDark} />
      <div className="min-w-0 flex-1">
        <Bar className="h-3.5 w-3/5" isDark={isDark} />
        <Bar className="mt-2 h-2.5 w-2/5" isDark={isDark} />
      </div>
    </div>
  );
}

/**
 * A collapsed collection, for the list screen before its collections arrive.
 *
 * This is what fixes the list screen briefly claiming a list is empty. Every
 * list is created with a General collection, so "no collections" is almost
 * always a lie told while a request is in flight — and it is told with a
 * call-to-action button, which makes it look settled rather than pending.
 *
 * Shaped like the collapsed header of a real collection: the colour dot, the
 * name, and the counts beside it.
 */
export function SkeletonCollectionCard({ isDark }: { isDark: boolean }) {
  return (
    <div
      className="flex min-h-[64px] items-center gap-3 rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-card)] px-4 py-3"
      aria-hidden="true"
    >
      <Bar className="h-2.5 w-2.5 shrink-0 rounded-full" isDark={isDark} />
      <Bar className="h-3.5 w-28" isDark={isDark} />
      <Bar className="h-2.5 w-20" isDark={isDark} />
    </div>
  );
}

/** A run of collapsed collections. Two is what a new list usually has room for. */
export function SkeletonCollectionList({
  isDark,
  count = 3,
}: {
  isDark: boolean;
  count?: number;
}) {
  return (
    <div
      className="animate-pulse space-y-6"
      role="status"
      aria-label="Loading collections"
    >
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCollectionCard key={i} isDark={isDark} />
      ))}
    </div>
  );
}

export { Bar as SkeletonBar };
