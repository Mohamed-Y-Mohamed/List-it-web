"use client";

import React from "react";
import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DailyMetric } from "@/types/schema";

interface DailyTrendChartProps {
  data: DailyMetric[];
  isDark: boolean;
  isLoading: boolean;
}

const DailyTrendChart: React.FC<DailyTrendChartProps> = ({
  data,
  isDark,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div
        className={`p-4 md:p-6 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} shadow-sm`}
      >
        <div
          className={`h-6 w-40 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"} animate-pulse mb-4`}
        ></div>
        <div
          className={`h-64 md:h-80 w-full rounded ${isDark ? "bg-gray-700" : "bg-gray-200"} animate-pulse`}
        ></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div
        className={`p-4 md:p-6 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} shadow-sm`}
      >
        <h2
          className={`text-lg md:text-xl font-semibold ${isDark ? "text-white" : "text-gray-800"} mb-4`}
        >
          Daily Activity
        </h2>
        <div className="text-center py-8 md:py-12">
          <BarChart3
            className={`h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 ${isDark ? "text-gray-600" : "text-gray-300"}`}
          />
          <p
            className={`text-sm md:text-base ${isDark ? "text-gray-400" : "text-gray-500"} mb-2`}
          >
            No activity data yet
          </p>
          <p
            className={`text-xs md:text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}
          >
            Your daily progress will appear here as you complete tasks
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className={`p-4 md:p-6 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} shadow-sm`}
    >
      <h2
        className={`text-lg md:text-xl font-semibold ${isDark ? "text-white" : "text-gray-800"} mb-4`}
      >
        Daily Activity
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="createdGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={isDark ? "#374151" : "#e5e7eb"}
          />
          <XAxis
            dataKey="date"
            stroke={isDark ? "#9ca3af" : "#6b7280"}
            fontSize={12}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            stroke={isDark ? "#9ca3af" : "#6b7280"}
            fontSize={12}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? "#1f2937" : "#ffffff",
              border: "none",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          />
          <Area
            type="monotone"
            dataKey="completed"
            stroke="#10b981"
            fillOpacity={1}
            fill="url(#completedGradient)"
            strokeWidth={2}
            name="Completed"
          />
          <Area
            type="monotone"
            dataKey="created"
            stroke="#3b82f6"
            fillOpacity={1}
            fill="url(#createdGradient)"
            strokeWidth={2}
            name="Created"
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

export default DailyTrendChart;
