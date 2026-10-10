// The layered wave a list card carries behind its name, ported from the iOS
// ListRowView.
//
// Three S-curved bands rise from the leading edge in the list's own colour, each
// shallower and stronger than the one behind it, so the colour reads as depth
// rather than as a block. The geometry, and the reasoning behind how the iOS
// measurements were ported, live in lib/listWaveShape.
//
// No filters, no blur, no gradient: flat fills only. Worth stating because the 19
// card `backdrop-filter`s removed on 2026-10-08 are why this screen scrolls at
// 60fps, and nothing here reintroduces that cost.

import React from "react";
import { WAVES, wavePath } from "@/lib/listWaveShape";

interface ListWaveProps {
  /** The list's colour. Any CSS colour; the bands are this at reduced opacity. */
  color: string;
  isDark: boolean;
}

export default function ListWave({ color, isDark }: ListWaveProps) {
  return (
    <svg
      // Fills the card it is placed in and takes no part in layout. The card owns
      // the clip, so the bands stop at its corners.
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      // The coordinates are percentages of the card, so the box has to be allowed
      // to stretch to it in each direction independently.
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {WAVES.map((wave) => (
        <path
          key={wave.depth}
          d={wavePath(wave)}
          fill={color}
          fillOpacity={isDark ? wave.dark : wave.light}
        />
      ))}
    </svg>
  );
}
