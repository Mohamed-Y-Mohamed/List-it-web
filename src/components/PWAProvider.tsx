"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import SplashScreen from "@/components/SplashScreen";
import { isPWAStandalone } from "@/utils/pwaUtils";
import { IS_NATIVE_BUILD, isNativeApp } from "@/lib/platform";
import { hasSeenOnboarding } from "@/lib/onboarding";
import { appPath } from "@/lib/routes";
import { supabase } from "@/utils/client";

interface PWAProviderProps {
  children: React.ReactNode;
}

export default function PWAProvider({ children }: PWAProviderProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Show splash only in PWA/standalone mode.
  //
  // Seeded true for the native build so the splash is in the *first* commit. It
  // used to start false and be switched on in the effect below, which left one
  // rendered frame with no splash, no root page (page.tsx returns null in app
  // mode) and no background class yet — an empty white document, flashing white
  // even on a dark device. IS_NATIVE_BUILD is a compile-time constant, so the web
  // bundle still reads `useState(false)` and behaves exactly as before.
  const [showSplash, setShowSplash] = useState(IS_NATIVE_BUILD);
  const [splashDone, setSplashDone] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  // Whether the launch has worked out where it is going. The splash waits for
  // this instead of running down a fixed timer, so it covers the session read and
  // the navigation that follows rather than expiring halfway through them.
  //
  // Starts true off-native: an installed PWA opens directly onto a real page, so
  // there is nothing to wait for and the splash keeps its original timing.
  const [launchResolved, setLaunchResolved] = useState(!IS_NATIVE_BUILD);

  useEffect(() => {
    const standalone = isPWAStandalone();
    setIsStandalone(standalone);

    if (standalone) {
      setShowSplash(true);
    }

    // Register service worker. Skipped in the native shell: the bundle already
    // ships on the device, so a worker caching `https://localhost` adds nothing
    // but a second stale copy of the app to reason about on every update.
    if ("serviceWorker" in navigator && !isNativeApp()) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => {
          console.error("Service worker registration failed:", err);
        });
    }
  }, []);

  // After splash, redirect to /login when running as PWA and on the root
  const handleSplashDone = useCallback(() => {
    setSplashDone(true);
    setShowSplash(false);
  }, []);

  // Where a launch lands.
  //
  // A website's pages are meaningless in app mode, so the three of them hand off
  // to somewhere useful:
  //
  //   signed in            -> the Lists tab
  //   new install          -> the intro, then sign-in
  //   signed out, returning-> sign-in
  //
  // Returning users used to be bounced through /login, which noticed the session
  // and forwarded them on — so every launch flashed a sign-in form at someone who
  // was already signed in. Reading the session here removes that hop.
  useEffect(() => {
    if (!isStandalone) return;

    // Web/PWA keeps its original ordering, where the redirect waits for the
    // splash to finish. Native inverts it — there the splash waits for *this* to
    // resolve, so waiting on the splash here as well would deadlock the two.
    if (!IS_NATIVE_BUILD && showSplash && !splashDone) return;

    const publicOnlyPaths = ["/", "/landingpage", "/aboutus"];
    if (!publicOnlyPaths.includes(pathname)) {
      // Already somewhere real — a deep link, a notification tap, a WebView
      // reload after Android reclaimed the process. There is no routing decision
      // left to make, and the splash has to be released or it would sit over the
      // app until its own safety cap expired. This path is why the splash needed
      // an explicit signal rather than just a longer timer.
      setLaunchResolved(true);
      return;
    }

    let cancelled = false;

    (async () => {
      // Asked of the client directly rather than through AuthContext: on a cold
      // launch the provider can settle on "no session" before the stored one has
      // finished being read, and acting on that would send a signed-in user to
      // the intro. (secure)/layout.tsx reads it the same way, for the same
      // reason.
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;

      if (data.session) {
        router.replace(appPath("/dashboard"));
      } else if (IS_NATIVE_BUILD && !hasSeenOnboarding()) {
        router.replace(appPath("/onboarding"));
      } else {
        router.replace(appPath("/login"));
      }

      // Set after the replace, so the splash covers the navigation itself rather
      // than lifting to reveal the old screen for a frame first.
      setLaunchResolved(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [isStandalone, splashDone, showSplash, pathname, router]);

  return (
    <>
      {showSplash && (
        <SplashScreen onDone={handleSplashDone} ready={launchResolved} />
      )}
      {children}
    </>
  );
}

