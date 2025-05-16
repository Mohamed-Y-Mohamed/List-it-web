import TopNavigation from "@/components/Navbar/TopNav";
import React from "react";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full flex flex-col">
      <TopNavigation />
      <main className="min-h-screen   w-full">{children}</main>
    </div>
  );
}
