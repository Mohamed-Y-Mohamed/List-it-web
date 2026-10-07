"use client";

import React, { useCallback, useEffect, useState } from "react";

import { usePathname, useRouter } from "next/navigation";

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

  /**
   * Show splash immediately for native builds so the first native
   * frame cannot briefly expose the empty document underneath.
   */
  const [showSplash, setShowSplash] = useState(IS_NATIVE_BUILD);

  const [splashDone, setSplashDone] = useState(false);

  const [isStandalone, setIsStandalone] = useState(false);

  /**
   * Native launch waits until session/navigation resolution has
   * completed before allowing the splash to disappear.
   *
   * Web/PWA keeps the existing behaviour.
   */
  const [launchResolved, setLaunchResolved] = useState(!IS_NATIVE_BUILD);

  // ============================================================
  // PWA detection + service worker
  // ============================================================

  useEffect(() => {
    const standalone = isPWAStandalone();

    setIsStandalone(standalone);

    if (standalone) {
      setShowSplash(true);
    }

    /**
     * Capacitor/native already ships its web bundle locally.
     *
     * A service worker inside that shell would create another copy
     * of the application that can become stale, so native continues
     * to skip SW registration entirely.
     */
    if (!("serviceWorker" in navigator) || isNativeApp()) {
      return;
    }

    /**
     * DEVELOPMENT
     * -----------
     *
     * Do not allow an old production/PWA worker to control
     * localhost development.
     *
     * This is particularly important with Next/Turbopack because
     * otherwise you can change a React component and still be
     * looking at an application document controlled by an older SW.
     */
    if (process.env.NODE_ENV === "development") {
      const clearDevelopmentWorkers = async () => {
        try {
          const registrations =
            await navigator.serviceWorker.getRegistrations();

          await Promise.all(
            registrations.map((registration) => registration.unregister()),
          );

          /**
           * Delete only List-It-owned caches.
           *
           * Do not indiscriminately delete every cache on the
           * origin in case another development tool owns one.
           */
          if ("caches" in window) {
            const cacheNames = await caches.keys();

            await Promise.all(
              cacheNames
                .filter((name) => name.startsWith("list-it"))
                .map((name) => caches.delete(name)),
            );
          }
        } catch (error) {
          console.error("Failed to clear development service worker:", error);
        }
      };

      void clearDevelopmentWorkers();

      return;
    }

    /**
     * PRODUCTION WEB / PWA
     * --------------------
     *
     * Register normally.
     *
     * updateViaCache:none tells the browser not to satisfy checks
     * for the worker script itself from the HTTP cache.
     */
    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });

        /**
         * Explicitly ask for an update check on application launch.
         *
         * Failure here is non-fatal: the current worker can continue
         * running and the browser will retry through its normal SW
         * lifecycle.
         */
        try {
          await registration.update();
        } catch (updateError) {
          console.warn("Service worker update check failed:", updateError);
        }
      } catch (error) {
        console.error("Service worker registration failed:", error);
      }
    };

    void registerServiceWorker();
  }, []);

  // ============================================================
  // Splash completion
  // ============================================================

  const handleSplashDone = useCallback(() => {
    setSplashDone(true);
    setShowSplash(false);
  }, []);

  // ============================================================
  // Launch routing
  // ============================================================

  useEffect(() => {
    if (!isStandalone) {
      return;
    }

    /**
     * Web/PWA retains the existing ordering:
     * wait for the splash before redirecting.
     *
     * Native does the inverse because its splash waits for this
     * launch-resolution process.
     */
    if (!IS_NATIVE_BUILD && showSplash && !splashDone) {
      return;
    }

    const publicOnlyPaths = ["/", "/landingpage", "/aboutus"];

    /**
     * Already on a real application/deep-link route.
     *
     * There is no launch routing decision left to make.
     */
    if (!publicOnlyPaths.includes(pathname)) {
      setLaunchResolved(true);
      return;
    }

    let cancelled = false;

    const resolveLaunch = async () => {
      /**
       * Read the session directly from Supabase during cold launch.
       *
       * This avoids briefly routing an already-authenticated user
       * through the login screen while another provider is still
       * restoring the stored session.
       */
      const { data } = await supabase.auth.getSession();

      if (cancelled) {
        return;
      }

      if (data.session) {
        router.replace(appPath("/dashboard"));
      } else if (IS_NATIVE_BUILD && !hasSeenOnboarding()) {
        router.replace(appPath("/onboarding"));
      } else {
        router.replace(appPath("/login"));
      }

      /**
       * Release the native splash only after the navigation
       * decision has been made.
       */
      setLaunchResolved(true);
    };

    void resolveLaunch();

    return () => {
      cancelled = true;
    };
  }, [isStandalone, splashDone, showSplash, pathname, router]);

  // ============================================================
  // Render
  // ============================================================

  return (
    <>
      {showSplash && (
        <SplashScreen onDone={handleSplashDone} ready={launchResolved} />
      )}

      {children}
    </>
  );
}
