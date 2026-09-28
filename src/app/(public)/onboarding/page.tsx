// app/(public)/onboarding/page.tsx
// The first-run intro route.
//
// Only the native build ever reaches it — PWAProvider is the only thing that
// routes here, and it only does so inside the Capacitor shell. The page still
// exists in the web export because the static build prerenders every route, so
// it redirects rather than rendering an intro the website does not want.

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { IS_NATIVE_BUILD } from "@/lib/platform";

// Its own chunk, and never requested by the web bundle.
const NativeOnboarding = dynamic(
  () => import("@/components/native/NativeOnboarding"),
  { ssr: false }
);

export default function OnboardingPage() {
  const router = useRouter();

  useEffect(() => {
    if (IS_NATIVE_BUILD) return;
    // Nobody should land here on the web; the landing page is the equivalent.
    router.replace("/landingpage");
  }, [router]);

  if (!IS_NATIVE_BUILD) return null;

  return <NativeOnboarding />;
}
