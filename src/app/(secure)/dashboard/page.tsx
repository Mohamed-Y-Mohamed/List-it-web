"use client";

import React from "react";
import { useTheme } from "@/context/ThemeContext";
import MergedNavigation from "@/components/Navbar/Navbar";

export default function Dashboard() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <main
      className={`transition-all duration-300 
          py-4 pt-20 px-3 sm:px-4 md:px-6 lg:px-8
          min-h-screen w-full
          ${isDark ? "bg-gray-800 text-gray-200" : "bg-gray-100 text-gray-800"}`}
    >
      <div className="max-w-6xl pl-20 w-full mx-auto">
        {/* Dashboard header */}
        <header className="mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
            Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
            Welcome to your dashboard!
          </p>
        </header>

        {/* Dashboard grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Card 1 */}
          <div
            className={`rounded-lg shadow-sm p-4 sm:p-6 
              ${isDark ? "bg-gray-700" : "bg-white"}`}
          >
            <h2 className="font-semibold text-lg mb-3">Tasks Overview</h2>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="inline-block w-24">Completed:</span>
                <span className="font-medium">12</span>
              </p>
              <p className="text-sm">
                <span className="inline-block w-24">In Progress:</span>
                <span className="font-medium">5</span>
              </p>
              <p className="text-sm">
                <span className="inline-block w-24">Pending:</span>
                <span className="font-medium">8</span>
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div
            className={`rounded-lg shadow-sm p-4 sm:p-6 
              ${isDark ? "bg-gray-700" : "bg-white"}`}
          >
            <h2 className="font-semibold text-lg mb-3">Recent Lists</h2>
            <ul className="space-y-2">
              <li className="text-sm flex justify-between">
                <span>Work</span>
                <span className="text-blue-500">5 tasks</span>
              </li>
              <li className="text-sm flex justify-between">
                <span>Personal</span>
                <span className="text-green-500">8 tasks</span>
              </li>
              <li className="text-sm flex justify-between">
                <span>Shopping</span>
                <span className="text-amber-500">3 tasks</span>
              </li>
            </ul>
          </div>

          {/* Card 3 */}
          <div
            className={`rounded-lg shadow-sm p-4 sm:p-6 md:col-span-2 lg:col-span-1
              ${isDark ? "bg-gray-700" : "bg-white"}`}
          >
            <h2 className="font-semibold text-lg mb-3">Today's Priorities</h2>
            <ul className="space-y-2">
              <li className="text-sm py-1 border-b border-gray-200 dark:border-gray-600">
                Complete project proposal
              </li>
              <li className="text-sm py-1 border-b border-gray-200 dark:border-gray-600">
                Call with design team
              </li>
              <li className="text-sm py-1">Revise marketing materials</li>
            </ul>
          </div>
        </div>

        {/* Additional section */}
        <div
          className={`mt-6 rounded-lg shadow-sm p-4 sm:p-6 
            ${isDark ? "bg-gray-700" : "bg-white"}`}
        >
          <h2 className="font-semibold text-lg mb-3">Recent Activity</h2>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 mr-3">
                <span className="text-xs font-medium">JD</span>
              </div>
              <div>
                <p className="text-sm font-medium">
                  Added 3 tasks to Work list
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  2 hours ago
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 mr-3">
                <span className="text-xs font-medium">JD</span>
              </div>
              <div>
                <p className="text-sm font-medium">
                  Completed 2 tasks in Shopping list
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Yesterday
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
