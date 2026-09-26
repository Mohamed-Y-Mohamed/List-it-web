// src/app/page.tsx
"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { isPWAStandalone } from "@/utils/pwaUtils";

export default function Home() {
  const router = useRouter();
  const redirected = useRef(false);

  useEffect(() => {
    if (redirected.current) return;
    redirected.current = true;

    if (isPWAStandalone()) {
      router.replace("/login");
    } else {
      router.replace("/landingpage");
    }
  }, [router]);

  return null;
}


