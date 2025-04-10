"use client";

import { useTheme } from "@/context/ThemeContext";

export default function Dashboard() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <>
      <main
        className={`transition-all duration-300 
      mt-15 min-h-screen w-full
        ${isDark ? "bg-gray-800 text-gray-200" : "bg-gray-100 text-gray-800"}`}
      >
        <div className="p-4 md:p-6 max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
          <p>Welcome to your dashboard!</p>
        </div>
      </main>
    </>
  );
}
