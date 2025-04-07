// src/app/(secure)/layout.tsx
import React from "react";
import { ThemeProvider } from "@/context/ThemeContext";
import Sidebar from "@/components/Navbar/sidebar";
import { AuthProvider } from "@/context/AuthContext";

export default function SecureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AuthProvider>
        <Sidebar />
        {children}
      </AuthProvider>
    </>
  );
}
