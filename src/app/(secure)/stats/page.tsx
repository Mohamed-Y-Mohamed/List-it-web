// app/(secure)/stats/page.tsx
// The analytics dashboard in the native app, reached from the toolbar menu
// alongside Settings.
//
// The native /dashboard is the iOS-style lists screen, so the charts and totals
// need a route of their own. It is the same DashboardView the web serves at
// /dashboard — one implementation, two entry points.

"use client";

import DashboardView from "@/components/Dashboard/DashboardView";

export default function StatsPage() {
  return <DashboardView />;
}
