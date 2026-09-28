// app/(secure)/stats/page.tsx
// The analytics screen in the native app, the second tab in the bottom bar.
//
// The native /dashboard is the iOS-style lists screen, so the charts and totals
// need a route of their own. It is the same DashboardView the web serves at
// /dashboard — one implementation, two entry points.

"use client";

import DashboardView from "@/components/Dashboard/DashboardView";

export default function StatsPage() {
  // "Progress", to agree with the tab that leads here. The route stays /stats and
  // the web's own /dashboard keeps its default heading, so nothing moves there.
  return <DashboardView heading="Progress" />;
}
