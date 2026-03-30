"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import SplashScreen from "@/components/SplashScreen";
import { isPWAStandalone } from "@/utils/pwaUtils";

interface PWAProviderProps {
  children: React.ReactNode;
}

export default function PWAProvider({ children }: PWAProviderProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Show splash only in PWA/standalone mode
  const [showSplash, setShowSplash] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone = isPWAStandalone();
    setIsStandalone(standalone);

    if (standalone) {
      setShowSplash(true);
    }

    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => {
          console.error("Service worker registration failed:", err);
        });
    }
  }, []);

  // After splash, redirect to /login when running as PWA and on the root
  const handleSplashDone = useCallback(() => {
    setSplashDone(true);
    setShowSplash(false);
  }, []);

  useEffect(() => {
    if (!isStandalone) return;
    if (showSplash && !splashDone) return;

    // In PWA mode, redirect away from root / and /landingpage to /login
    const publicOnlyPaths = ["/", "/landingpage", "/aboutus"];
    if (publicOnlyPaths.includes(pathname)) {
      router.replace("/login");
    }
  }, [isStandalone, splashDone, showSplash, pathname, router]);

  return (
    <>
      {showSplash && <SplashScreen onDone={handleSplashDone} />}
      {children}
    </>
  );
}

