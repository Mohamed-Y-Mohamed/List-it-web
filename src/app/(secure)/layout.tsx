// app/secure-layout.tsx or similar
"use client";

import SideNavigation from "@/components/Navbar/SideNav";
import React from "react";

export default function SecureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SideNavigation />
      {children}
    </>
  ); // Just return children, no need for a separate provider
}
