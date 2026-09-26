// app/(secure)/dashboard/page.tsx
// The screen the app opens on after signing in — which differs by platform.

"use client";

import dynamic from "next/dynamic";
import { IS_NATIVE_BUILD } from "@/lib/platform";
import DashboardView from "@/components/Dashboard/DashboardView";

// Loaded as its own chunk so the web bundle does not carry the native lists
// screen it never renders. On native the chunk is requested as the component
// mounts, while the launch splash is still covering the screen.
const NativeHome = dynamic(() => import("@/components/native/NativeHome"), {
  ssr: false,
});

export default function DashboardPage() {
  // The native app opens on the iOS-style lists screen, matching the published
  // iOS app. Its analytics live at /stats instead. IS_NATIVE_BUILD is fixed at
  // build time, so each bundle keeps only the branch it uses and there is no
  // hydration mismatch.
  return IS_NATIVE_BUILD ? <NativeHome /> : <DashboardView />;
}
