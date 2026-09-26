"use client";

// Long-press detection, standing in for SwiftUI's `.contextMenu`.
//
// iOS opens a context menu when a card is held; the hint text on the lists screen
// ("Holds Lists for more options") tells users to expect exactly that, so the
// Android build needs the same gesture rather than a visible overflow button.

import { useCallback, useRef } from "react";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { isNativeApp } from "@/lib/platform";

// iOS fires its context menu at roughly half a second.
const LONG_PRESS_MS = 500;

// A press that wanders further than this is a scroll, not a long press.
const MOVE_TOLERANCE_PX = 10;

interface LongPressHandlers {
  onLongPress: (position: { x: number; y: number }) => void;
  onTap?: () => void;
}

export function useLongPress({ onLongPress, onTap }: LongPressHandlers) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPoint = useRef<{ x: number; y: number } | null>(null);
  const didLongPress = useRef(false);

  const clear = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const start = useCallback(
    (x: number, y: number) => {
      startPoint.current = { x, y };
      didLongPress.current = false;

      timer.current = setTimeout(() => {
        didLongPress.current = true;

        // The tap that confirms a long press is what tells the user the gesture
        // landed, since the menu appears under their finger.
        if (isNativeApp()) {
          Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
        }

        onLongPress({ x, y });
      }, LONG_PRESS_MS);
    },
    [onLongPress]
  );

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      // Ignore secondary buttons; only a primary press should arm the timer.
      if (event.button !== 0) return;
      start(event.clientX, event.clientY);
    },
    [start]
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (!startPoint.current || !timer.current) return;
      const dx = Math.abs(event.clientX - startPoint.current.x);
      const dy = Math.abs(event.clientY - startPoint.current.y);
      if (dx > MOVE_TOLERANCE_PX || dy > MOVE_TOLERANCE_PX) clear();
    },
    [clear]
  );

  const onPointerUp = useCallback(() => {
    clear();
    // Releasing after the menu has opened must not also activate the card.
    if (!didLongPress.current) onTap?.();
    startPoint.current = null;
  }, [clear, onTap]);

  const onPointerCancel = useCallback(() => {
    clear();
    startPoint.current = null;
  }, [clear]);

  // Suppress the browser's own long-press menu so it cannot compete with ours.
  const onContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
  }, []);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onPointerLeave: onPointerCancel,
    onContextMenu,
  };
}
