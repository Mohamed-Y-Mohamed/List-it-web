// src/app/page.tsx
// The root route, which only ever exists to send the visitor somewhere real.

"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { isPWAStandalone } from "@/utils/pwaUtils";

export default function Home() {
  const router = useRouter();
  const redirected = useRef(false);

  useEffect(() => {
    if (redirected.current) return;

    // In app mode PWAProvider owns this decision, because it is the only thing
    // that knows whether the splash has finished, whether there is a session and
    // whether the intro has been seen. Redirecting to /login from here as well
    // used to win the race and send every launch to the sign-in form, intro and
    // stored session both ignored.
    if (isPWAStandalone()) return;

    redirected.current = true;
    router.replace("/landingpage");
  }, [router]);

  return null;
}
