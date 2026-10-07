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

/** One task card's worth of placeholder: stripe, title, meta row. */
export function SkeletonTaskCard({ isDark }: { isDark: boolean }) {
  return (
    <div
      className={`rounded-xl border p-2.5 pl-3.5 ${
        isDark ? "border-white/[0.08] bg-[#131A2B]/80" : "border-black/[0.06] bg-white/85"
      }`}
      style={{
        borderLeft: `3px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"}`,
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
    <div className="animate-pulse space-y-2" role="status" aria-label="Loading tasks">
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
        isDark ? "border-white/[0.08] bg-[#131A2B]" : "border-black/[0.06] bg-white"
      }`}
      aria-hidden="true"
    >
      <Bar className="h-2.5 w-14" isDark={isDark} />
      <Bar className="mt-2.5 h-7 w-12" isDark={isDark} />
    </div>
  );
}

/** A note card's worth: taller, because a note shows a preview. */
export function SkeletonNoteCard({ isDark }: { isDark: boolean }) {
  return (
    <div
      className={`rounded-xl border p-2.5 pl-3.5 ${
        isDark ? "border-white/[0.08] bg-[#131A2B]/80" : "border-black/[0.06] bg-white/85"
      }`}
      style={{
        borderLeft: `3px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"}`,
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

/** A list card on the Lists home, in either layout. */
export function SkeletonListCard({
  isDark,
  variant = "grid",
}: {
  isDark: boolean;
  variant?: "grid" | "row";
}) {
  return (
    <div
      className={`rounded-2xl border ${
        variant === "grid" ? "min-h-[84px] p-3.5" : "min-h-[64px] px-4 py-3"
      } ${isDark ? "border-white/[0.08] bg-[#131A2B]" : "border-black/[0.06] bg-white"}`}
      aria-hidden="true"
    >
      <Bar className="h-3.5 w-3/5" isDark={isDark} />
      <Bar className="mt-2 h-2.5 w-2/5" isDark={isDark} />
    </div>
  );
}

export { Bar as SkeletonBar };
