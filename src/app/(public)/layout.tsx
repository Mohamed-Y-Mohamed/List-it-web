import React from "react";

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
