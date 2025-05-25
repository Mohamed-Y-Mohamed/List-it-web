"use client";

import React from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import { Home, FileQuestion, LayoutDashboard } from "lucide-react";

const NotFound: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <main
      className={`transition-all min-h-screen duration-300 w-full relative flex items-center justify-center
        ${isDark ? "text-gray-200" : "text-gray-800"}
      `}
    >
      {/* Background Gradient */}
      {isDark ? (
        <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(135deg,#121212_0%,#1a1a1a_30%,#232323_70%,#2a1810_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_top_right,rgba(251,146,60,0.1)_0%,transparent_50%)] before:content-['']" />
      ) : (
        <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(135deg,#ffffff_0%,#fefefe_50%,#f9fafb_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_top_right,rgba(251,146,60,0.05)_0%,transparent_70%)] before:content-['']" />
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* 404 Icon and Animation */}
          <div className="relative mb-8">
            <div
              className={`mx-auto w-32 h-32 rounded-full flex items-center justify-center ${
                isDark ? "bg-gray-800/50" : "bg-white/50"
              } shadow-xl relative overflow-hidden group`}
            >
              <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full blur-xl opacity-20 bg-red-500 group-hover:opacity-40 transition-opacity duration-300"></div>
              <FileQuestion
                className={`h-16 w-16 ${
                  isDark ? "text-orange-400" : "text-sky-500"
                }`}
              />
            </div>
          </div>

          {/* 404 Title */}
          <div className="mb-6">
            <h1
              className={`text-6xl md:text-8xl font-bold ${
                isDark ? "text-white" : "text-gray-900"
              } mb-2`}
            >
              404
            </h1>
            <h2
              className={`text-2xl md:text-3xl font-semibold ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Page Not Found
            </h2>
          </div>

          {/* Description */}
          <p
            className={`text-lg mb-8 max-w-2xl mx-auto ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Sorry, we couldn&apos;t find the page you&apos;re looking for. The
            page might have been moved, deleted, or the URL might be incorrect.
          </p>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 max-w-2xl mx-auto">
            {/* Go to Dashboard Card */}
            <Link
              href="/dashboard"
              className={`p-4 rounded-xl shadow-sm transition-all duration-200 hover:scale-105 ${
                isDark
                  ? "bg-gray-800/50 hover:bg-gray-800/70"
                  : "bg-white/50 hover:bg-white/70"
              }`}
            >
              <div
                className={`p-3 rounded-lg w-fit mx-auto ${
                  isDark ? "bg-orange-600" : "bg-sky-500"
                }`}
              >
                <LayoutDashboard className="h-6 w-6 text-white" />
              </div>
              <h3
                className={`text-base font-medium mt-3 ${
                  isDark ? "text-gray-100" : "text-gray-800"
                }`}
              >
                Go to Dashboard
              </h3>
              <p
                className={`text-sm mt-1 ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Return to your main dashboard
              </p>
            </Link>

            {/* Go to Home Page Card */}
            <Link
              href="/landingpage"
              className={`p-4 rounded-xl shadow-sm transition-all duration-200 hover:scale-105 ${
                isDark
                  ? "bg-gray-800/50 hover:bg-gray-800/70"
                  : "bg-white/50 hover:bg-white/70"
              }`}
            >
              <div
                className={`p-3 rounded-lg w-fit mx-auto ${
                  isDark ? "bg-green-600" : "bg-green-500"
                }`}
              >
                <Home className="h-6 w-6 text-white" />
              </div>
              <h3
                className={`text-base font-medium mt-3 ${
                  isDark ? "text-gray-100" : "text-gray-800"
                }`}
              >
                Go to Home
              </h3>
              <p
                className={`text-sm mt-1 ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Return to the home page
              </p>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default NotFound;
