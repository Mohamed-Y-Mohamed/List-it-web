import TopNavigation from "@/components/Navbar/TopNav";
import React from "react";
import { IS_NATIVE_BUILD } from "@/lib/platform";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full flex flex-col">
      {/* The marketing top bar — logo, hamburger, About and Sign-up links — is web
          chrome. The iOS app goes straight from launch to the sign-in screen with
          no navigation bar above it, so the Android app does the same. */}
      {!IS_NATIVE_BUILD && <TopNavigation />}
      <main className="min-h-screen   w-full">{children}</main>
    </div>
  );
}
