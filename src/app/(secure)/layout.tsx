"use client";

import React from "react";
import { ThemeProvider } from "@/context/ThemeContext";
import Sidebar from "@/components/Navbar/sidebar";
import { AuthProvider } from "@/context/AuthContext";
import NavbarWrapper from "@/components/Navbar/top-Navbar";
import Footer from "@/components/Footer";
import { SidebarProvider } from "@/context/sidebarContext";

export default function SecureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <SidebarProvider>
        <NavbarWrapper />
        <Sidebar />
        {children}
      </SidebarProvider>
    </AuthProvider>
  );
}
