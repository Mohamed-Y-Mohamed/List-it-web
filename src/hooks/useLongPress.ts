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
  // Whether the press wandered far enough to stop being a tap.
  //
  // Movement used to only disarm the long-press timer, and the release still
  // counted as a tap — so swiping a card opened it as well as revealing its swipe
  // actions. On the Lists tab that meant a swipe landed you inside the list you
  // were trying to pin; on a task or note card it opened the detail sheet over the
  // actions you had just uncovered.
  const didMove = useRef(false);

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
      didMove.current = false;

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
      // Deliberately not gated on `timer.current`. Movement has to keep being
      // recorded after the timer has already been cleared, or the first frame past
      // the tolerance disarms the long press and every frame after it is ignored —
      // leaving the release looking like a tap.
      if (!startPoint.current) return;
      const dx = Math.abs(event.clientX - startPoint.current.x);
      const dy = Math.abs(event.clientY - startPoint.current.y);
      if (dx > MOVE_TOLERANCE_PX || dy > MOVE_TOLERANCE_PX) {
        didMove.current = true;
        clear();
      }
    },
    [clear]
  );

  const onPointerUp = useCallback(() => {
    clear();

    // A tap is a press that started here, stayed put, and did not become a menu.
    //
    // `startPoint` being null means the press was cancelled rather than completed —
    // the pointer left the card, or something upstream took pointer capture, which
    // is what a parent SwipeableRow does the moment a drag begins.
    const wasPress = startPoint.current !== null;
    if (wasPress && !didMove.current && !didLongPress.current) onTap?.();

    startPoint.current = null;
    didMove.current = false;
  }, [clear, onTap]);

  const onPointerCancel = useCallback(() => {
    clear();
    startPoint.current = null;
    didMove.current = false;
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
