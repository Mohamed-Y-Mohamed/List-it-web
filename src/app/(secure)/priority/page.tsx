"use client";
import React from "react";
import { useTheme } from "@/context/ThemeContext";

export default function PriortyPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      style={{
        backgroundColor: isDark ? "#2d3748" : "#FAF9F6",
      }}
      className="flex flex-col items-center  justify-center h-screen"
    >
      <h1
        className="text-2xl font-bold"
        style={{ color: isDark ? "#ffffff" : "#000000" }}
      >
        Priority
      </h1>
      <p
        className="mt-4"
        style={{ color: isDark ? "#e0e0e0" : "#4a5568" }} // light gray for light mode
      >
        This page is not yet implemented. Please check back later.
      </p>
    </div>
  );
}
