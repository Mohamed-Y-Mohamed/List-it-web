import React from "react";
import Navbar from "@/components/Navbar/Navbar";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full flex flex-col">
      <main className="min-h-screen   w-full">{children}</main>
    </div>
  );
}
