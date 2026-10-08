// app/(secure)/layout.tsx
"use client";

import SideNavigation from "@/components/Navbar/SideNav";
import React, { Suspense, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useIsNative } from "@/hooks/useIsNative";
import NativeTransition from "@/components/native/NativeTransition";
import AppDataProvider from "@/components/native/AppDataProvider";
import NativeBackBar from "@/components/native/NativeBackBar";
import NativeLoading from "@/components/native/NativeLoading";
import AppSurface from "@/components/AppSurface";
import NativeTabBar from "@/components/native/NativeTabBar";
import NativeTutorial from "@/components/native/NativeTutorial";
import {
  HOME_TAB_PATH,
  isTabRoot,
  normalisePath,
} from "@/components/native/navTabs";
import { ScreenTitleProvider } from "@/components/native/ScreenTitleContext";
import { useTutorial } from "@/hooks/useTutorial";
import { supabase } from "@/utils/client";
import { appPath } from "@/lib/routes";

export default function SecureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoggedIn, loading } = useAuth();
  const isNative = useIsNative();
  const router = useRouter();
  const pathname = usePathname();

  // The tab bar is fixed, so it takes up no space in the document and the last
  // row of a screen would sit underneath it. Only the three tab roots need the
  // clearance — a pushed screen has no bar over it.
  const onTabRoot = isTabRoot(pathname);

  // Progress and Settings used to be pushed screens, and the back bar above them
  // was what cleared the status bar. They are tab roots now, so it is gone and
  // they would start underneath the opaque band globals.css pins over the status
  // bar. The Lists tab is excluded because NativeHome pins its own header with
  // pt-safe-top already, and padding it here would inset it twice.
  const needsTopInset = onTabRoot && normalisePath(pathname) !== HOME_TAB_PATH;

  // The walkthrough, for an account that has never seen it. Native only — the
  // hook short-circuits on IS_NATIVE_BUILD, so the web bundle never carries it
  // and never asks the server about it.
  const { shouldShow: showTutorial, dismiss: dismissTutorial } = useTutorial();

  // Held to the Lists tab. It opens by describing the plus button on that
  // screen, so arriving anywhere else — a reminder tap landing on /today, a deep
  // link — must not be ambushed by a tour of somewhere the user is not.
  const tutorialVisible =
    showTutorial && normalisePath(pathname) === HOME_TAB_PATH;

  // On the web these routes are already gated by `middleware.ts`, which redirects
  // before this component ever renders. The native build is a static export with
  // no middleware, so this is the only thing standing between an unauthenticated
  // launch and the app shell. Keeping it here rather than in each page means a new
  // secure route is protected by virtue of its location.
  // Fires at most once per mount. The login screen sends an authenticated user
  // back here, so if the two ever disagreed about the session they could bounce
  // the user between them indefinitely; capping it means a disagreement shows up
  // as one wrong screen rather than an unusable app.
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (loading || isLoggedIn || hasRedirected.current) return;

    // Confirm with the client before bouncing anyone out. On a cold document
    // load — a deep link, a notification tap, a WebView reload — the provider can
    // settle on "no session" before the stored one has finished being read, and
    // redirecting on that alone threw signed-in users back to the login screen.
    // A direct read here is the authoritative answer.
    let cancelled = false;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled || data.session) return;

      hasRedirected.current = true;
      router.replace(appPath("/login"));
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, isLoggedIn, router]);

  // Hold the first paint on native only, until the stored session has been read.
  // On web, children render immediately exactly as they did before, so the
  // existing flow and timing are unchanged.
  //
  // This used to `return null`, which is the single largest contributor to the
  // blank screen on launch: the splash has already been dismissed by the time a
  // secure route mounts, so an empty document was all that stood between the user
  // and the app while AuthContext read the session — twice over on a cold start,
  // because that read retries once after 150ms. Painting the launch field with a
  // spinner instead means the gap reads as loading rather than as a crash.
  if (isNative && (loading || !isLoggedIn)) {
    return <NativeLoading />;
  }

  return (
    <>
      {/* The iOS app has no drawer — it reaches settings, list creation and the
          default views through a toolbar menu, which NativeHome provides. So the
          sidebar is web-only.

          The nav reads the query string to highlight the active list, and
          useSearchParams opts a subtree out of prerendering, so the boundary keeps
          that confined to the nav rather than forcing every secure page to bail
          out. The nav renders nothing until it has loaded the user's lists anyway. */}
      {!isNative && (
        <Suspense fallback={null}>
          <SideNavigation />
        </Suspense>
      )}
      {isNative ? (
        /* AppDataProvider sits outside NativeTransition on purpose. The transition
           re-keys on the pathname, which unmounts and remounts everything below it
           on every navigation — so anything holding fetched data had to live above
           it or lose that data on each tab switch. From here it is fetched once at
           launch and every screen reads it. */
        <AppDataProvider>
          <ScreenTitleProvider>
            <NativeBackBar />
            {/* `min-h-screen` lives here rather than on each page.
                Tailwind's border-box sizing keeps this div's own `pt-safe-top` and
                `pb-tab-bar` padding *inside* the 100vh, so the document is exactly
                one viewport tall when a screen has little content. It used to be
                the pages that were `min-h-screen`, which made the document
                `topInset + 100vh + tabBar` — taller than the screen by the top
                inset, so Progress and Settings scrolled a little past their own
                content and revealed this div's bare padding at the end. Home was
                unaffected only because it has no top inset.

                AppSurface goes behind everything, including that padding, so
                there is no strip left for the html background to show through. */}
            <div
              className={[
                "relative min-h-screen",
                onTabRoot ? "pb-tab-bar" : "",
                needsTopInset ? "pt-safe-top" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <AppSurface />
              <NativeTransition>{children}</NativeTransition>
            </div>
            <NativeTabBar />
            {tutorialVisible && <NativeTutorial onDone={dismissTutorial} />}
          </ScreenTitleProvider>
        </AppDataProvider>
      ) : (
        children
      )}
    </>
  );
}
