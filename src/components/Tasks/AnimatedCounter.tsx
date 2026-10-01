"use client";

// A number that counts up to its value when it appears.
//
// Was defined six times over, once in each task screen, identically. This is
// that component, unchanged in behaviour, with one fix carried over: the
// original never cancelled its animation frame, so a value arriving mid-count —
// which is exactly what a refresh does — left the old loop running alongside the
// new one and the two fought over the same state.

import React, { useEffect, useRef, useState } from "react";

interface AnimatedCounterProps {
  value: number;
  /** Milliseconds for the full count. */
  duration?: number;
  suffix?: string;
}

export default function AnimatedCounter({
  value,
  duration = 1000,
  suffix = "",
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const frame = useRef<number | undefined>(undefined);

  useEffect(() => {
    let startTime: number | undefined;

    const animate = (timestamp: number) => {
      if (startTime === undefined) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(value * progress));

      if (progress < 1) {
        frame.current = requestAnimationFrame(animate);
      }
    };

    frame.current = requestAnimationFrame(animate);

    return () => {
      if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    };
  }, [value, duration]);

  return (
    <span>
      {count}
      {suffix}
    </span>
  );
}
