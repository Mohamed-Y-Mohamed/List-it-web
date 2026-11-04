// app/(secure)/dashboard/page.tsx
// The signed-in landing page: the user's progress overview.

"use client";

import ProgressView from "@/components/Dashboard/ProgressView";

export default function DashboardPage() {
  return <ProgressView />;
}
