"use client";

import React from "react";

interface StatsSkeletonProps {
  isDark: boolean;
}

const StatsSkeleton: React.FC<StatsSkeletonProps> = ({ isDark }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
    {[1, 2, 3, 4].map((i) => (
      <div
        key={i}
        className={`p-4 md:p-6 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} shadow-sm animate-pulse`}
      >
        <div className="flex items-center justify-between mb-3">
          <div
            className={`h-10 w-10 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
          ></div>
          <div
            className={`h-6 w-12 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
          ></div>
        </div>
        <div
          className={`h-4 w-20 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"} mb-2`}
        ></div>
        <div
          className={`h-8 w-16 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
        ></div>
      </div>
    ))}
  </div>
);

export default StatsSkeleton;
