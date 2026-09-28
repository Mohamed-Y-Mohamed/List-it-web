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

  // Show splash only in PWA/standalone mode
  const [showSplash, setShowSplash] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

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

  // Where a launch lands, once the splash has finished.
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
    if (showSplash && !splashDone) return;

    const publicOnlyPaths = ["/", "/landingpage", "/aboutus"];
    if (!publicOnlyPaths.includes(pathname)) return;

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
        return;
      }

      if (IS_NATIVE_BUILD && !hasSeenOnboarding()) {
        router.replace(appPath("/onboarding"));
        return;
      }

      router.replace(appPath("/login"));
    })();

    return () => {
      cancelled = true;
    };
  }, [isStandalone, splashDone, showSplash, pathname, router]);

  return (
    <>
      {showSplash && <SplashScreen onDone={handleSplashDone} />}
      {children}
    </>
  );
}

