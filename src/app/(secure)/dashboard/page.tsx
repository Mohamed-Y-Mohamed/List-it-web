// app/(secure)/dashboard/page.tsx
// The screen the app opens on after signing in — which differs by platform.

"use client";

import dynamic from "next/dynamic";
import { IS_NATIVE_BUILD } from "@/lib/platform";
import DashboardView from "@/components/Dashboard/DashboardView";
import NativeLoading from "@/components/native/NativeLoading";

// Loaded as its own chunk so the web bundle does not carry the native lists
// screen it never renders.
//
// A previous comment here claimed the chunk is fetched "while the launch splash
// is still covering the screen". It was not: PWAProvider dismissed the splash
// before it had even read the session, let alone navigated here, so the fetch
// happened over a bare document. Hence the explicit `loading` fallback — without
// one, `dynamic` renders null, which was another window of blank screen on every
// cold launch.
const NativeHome = dynamic(() => import("@/components/native/NativeHome"), {
  ssr: false,
  loading: () => <NativeLoading />,
});

export default function DashboardPage() {
  // The native app opens on the iOS-style lists screen, matching the published
  // iOS app. Its analytics live at /stats instead. IS_NATIVE_BUILD is fixed at
  // build time, so each bundle keeps only the branch it uses and there is no
  // hydration mismatch.
  return IS_NATIVE_BUILD ? <NativeHome /> : <DashboardView />;
}
