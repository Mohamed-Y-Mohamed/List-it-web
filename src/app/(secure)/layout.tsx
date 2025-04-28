// app/secure-layout.tsx or similar
"use client";

import React from "react";
import { ThemeProvider } from "@/context/ThemeContext";
// import Sidebar from "@/components/Navbar/sidebar";
// import { AuthProvider } from "@/context/AuthContext"; // Remove this import
import MergedNavigation from "@/components/Navbar/Navbar";
// import { SidebarProvider } from "@/context/sidebarContext";

export default function SecureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children; // Just return children, no need for a separate provider
}
