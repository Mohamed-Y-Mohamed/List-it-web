// app/secure-layout.tsx or similar
"use client";

import React from "react";

export default function SecureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children; // Just return children, no need for a separate provider
}
