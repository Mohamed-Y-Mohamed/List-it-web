"use client";

import React from "react";
import { ThemeProvider } from "@/context/ThemeContext";
// import Sidebar from "@/components/Navbar/sidebar";
import { AuthProvider } from "@/context/AuthContext";
import MergedNavigation from "@/components/Navbar/Navbar";
// import { SidebarProvider } from "@/context/sidebarContext";

export default function SecureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <MergedNavigation />
      {children}
    </AuthProvider>
  );
}
