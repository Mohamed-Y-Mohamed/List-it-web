"use client";

// List cards, matching the Android app: the card surface, a hairline in the
// list's colour, the three-band wave reaching 90% of the width, and the name and
// counts kept inside the first 80% so text never sits on the wave's edge.
//
//   grid    two or three to a row
//   pinned  one standard size for the pinned rail; long names scroll

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Pin } from "lucide-react";
import ListWave from "./ListWave";
import { LIST_TEXT_WIDTH } from "@/lib/listWaveShape";
import { listHref } from "@/lib/routes";
import type { List } from "@/types/schema";

const FALLBACK_COLOR = "#6366F1";

/** `#RRGGBB` plus an alpha, for the hairline in the list's colour. */
function withAlpha(hex: string, alpha: number): string {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return `rgba(99,102,241,${alpha})`;
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

export function countsLabel(tasks: number, notes: number): string {
  return `${tasks} task${tasks === 1 ? "" : "s"} · ${notes} note${notes === 1 ? "" : "s"}`;
}

interface ListCardProps {
  list: List;
  isDark: boolean;
  /** Open tasks in the list. */
  taskCount: number;
  noteCount: number;
  variant?: "grid" | "pinned";
  /** Where the card goes; the list itself by default. */
  href?: string;
}

export default function ListCard({
  list,
  isDark,
  taskCount,
  noteCount,
  variant = "grid",
  href,
}: ListCardProps) {
  const color = list.bg_color_hex || FALLBACK_COLOR;
  const name = list.list_name || "Untitled";
  const ink = isDark ? "text-white" : "text-gray-900";
  const pinned = variant === "pinned";

  return (
    <Link
      href={href ?? listHref(list.id)}
      data-testid="list-card"
      className={`relative block overflow-hidden rounded-[17px] border bg-[var(--surface-card)] transition-transform duration-150 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 active:scale-[0.98] ${
        pinned ? "h-[72px]" : "min-h-[84px]"
      } ${isDark ? "shadow-[0_4px_14px_rgba(0,0,0,0.12)]" : "shadow-[0_4px_14px_rgba(0,0,0,0.06)]"}`}
      style={{ borderColor: withAlpha(color, isDark ? 0.25 : 0.16) }}
    >
      <ListWave color={color} isDark={isDark} />

      {pinned ? (
        <div
          className="relative flex h-full flex-col justify-center gap-0.5 pl-3"
          style={{ width: LIST_TEXT_WIDTH }}
        >
          <ScrollingText text={name} className={`text-[14px] font-medium ${ink}`} />
          {!list.is_default && (
            <span className={`truncate text-[11px] ${ink}`}>
              {countsLabel(taskCount, noteCount)}
            </span>
          )}
        </div>
      ) : (
        <div
          className="relative flex min-h-[84px] flex-col justify-between gap-2 p-3.5"
          style={{ width: LIST_TEXT_WIDTH }}
        >
          <span className="flex items-start gap-2.5">
            <span
              className={`line-clamp-2 text-[14px] font-medium leading-[19px] ${ink}`}
            >
              {name}
            </span>
            {list.is_pinned && (
              <Pin
                className="mt-[3px] h-3 w-3 shrink-0 text-orange-400"
                fill="currentColor"
                aria-label="Pinned"
              />
            )}
          </span>
          <span className={`truncate text-[11px] ${ink}`}>
            {countsLabel(taskCount, noteCount)}
          </span>
        </div>
      )}
    </Link>
  );
}

/**
 * One line that scrolls itself when it is too long, so the whole name can be
 * read: rests, travels at about 40px/s, rests, repeats. Names that fit never move.
 */
export function ScrollingText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const boxRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    const measure = () => {
      const box = boxRef.current;
      const inner = textRef.current;
      if (!box || !inner) return;
      const overflow = inner.scrollWidth - box.clientWidth;
      setDistance(overflow > 1 ? overflow : 0);
    };
    measure();
    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    if (observer && boxRef.current) observer.observe(boxRef.current);
    return () => observer?.disconnect();
  }, [text]);

  // The travel takes 55% of the loop (see `marquee` in globals.css).
  const duration = distance > 0 ? distance / 40 / 0.55 : 0;

  return (
    <span ref={boxRef} className="block overflow-hidden whitespace-nowrap" title={text}>
      <span
        ref={textRef}
        className={`inline-block ${distance > 0 ? "animate-marquee" : ""} ${className}`}
        style={
          distance > 0
            ? ({
                "--marquee-distance": `-${distance}px`,
                animationDuration: `${Math.max(duration, 4)}s`,
              } as React.CSSProperties)
            : undefined
        }
      >
        {text}
      </span>
    </span>
  );
}
