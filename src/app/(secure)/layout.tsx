// app/(secure)/layout.tsx
"use client";

import SideNavigation from "@/components/Navbar/SideNav";
import React, { Suspense, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useIsNative } from "@/hooks/useIsNative";
import NativeTransition from "@/components/native/NativeTransition";
import NativeBackBar from "@/components/native/NativeBackBar";

export default function SecureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoggedIn, loading } = useAuth();
  const isNative = useIsNative();
  const router = useRouter();

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
    hasRedirected.current = true;
    router.replace("/login");
  }, [loading, isLoggedIn, router]);

  // Hold the first paint on native only, until the stored session has been read.
  // On web, children render immediately exactly as they did before, so the
  // existing flow and timing are unchanged.
  if (isNative && (loading || !isLoggedIn)) {
    return null;
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
        <>
          <NativeBackBar />
          <NativeTransition>{children}</NativeTransition>
        </>
      ) : (
        children
      )}
    </>
  );
}
