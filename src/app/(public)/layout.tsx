import React from "react";
import Navbar from "@/components/Navbar/top-Navbar";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full flex flex-col">
      <Navbar />
      <main className="min-h-screen   w-full">{children}</main>
    </div>
  );
}
