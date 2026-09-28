"use client";

// Lets a screen paint across the whole device window, system bars included.
//
// By default the native shell reserves two bands for the status bar and the
// gesture pill and fills them with the app's surface colour — correct for the
// app's own screens, which scroll content underneath them. It is wrong for the
// sign-in and sign-up screens, whose full-window gradient gets sliced into
// strips by bands in a colour the page never uses.
//
// This toggles the escape hatch in globals.css for as long as such a screen is
// mounted. Screens using it must inset their own content, or the card ends up
// under the clock.
//
// No-op on the web, where there are no insets and no bands to suppress.

import { useEffect } from "react";
import { useIsNative } from "@/hooks/useIsNative";

const IMMERSIVE_CLASS = "native-immersive";

export function useImmersiveNative(): void {
  const isNative = useIsNative();

  useEffect(() => {
    if (!isNative) return;

    const root = document.documentElement;
    root.classList.add(IMMERSIVE_CLASS);

    // Removed on the way out so the next screen gets its bands back. Without
    // this, navigating from sign-in into the app would leave content running
    // under the status bar.
    return () => root.classList.remove(IMMERSIVE_CLASS);
  }, [isNative]);
}
