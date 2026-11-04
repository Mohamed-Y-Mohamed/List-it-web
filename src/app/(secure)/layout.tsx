// app/(secure)/layout.tsx
// The signed-in area: the shared data cache, the side navigation and the page.

"use client";

import SideNavigation from "@/components/Navbar/SideNav";
import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AppDataProvider from "@/components/AppDataProvider";
import { supabase } from "@/utils/client";

export default function SecureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoggedIn, loading } = useAuth();
  const router = useRouter();

  // Middleware already guards these routes; this catches a session that ends
  // while the page is open. Checked against Supabase directly so a slow auth
  // context does not bounce a signed-in user.
  const hasRedirected = useRef(false);
  useEffect(() => {
    if (loading || isLoggedIn || hasRedirected.current) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled || data.session) return;
      hasRedirected.current = true;
      router.replace("/login");
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, isLoggedIn, router]);

  return (
    <AppDataProvider>
      <SideNavigation />
      {children}
    </AppDataProvider>
  );
}
