"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Target } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DashboardTaskStats } from "@/types/schema";

interface CompletionBreakdownProps {
  stats: DashboardTaskStats;
  isDark: boolean;
  isLoading: boolean;
}

const CompletionBreakdown: React.FC<CompletionBreakdownProps> = ({
  stats,
  isDark,
  isLoading,
}) => {
  const [animateChart, setAnimateChart] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setAnimateChart(true), 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <div
        className={`p-4 md:p-6 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} shadow-sm`}
      >
        <div
          className={`h-6 w-32 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"} animate-pulse mb-4`}
        ></div>
        <div
          className={`h-48 md:h-64 w-full rounded ${isDark ? "bg-gray-700" : "bg-gray-200"} animate-pulse`}
        ></div>
      </div>
    );
  }

  const pieData = [
    { name: "Completed", value: stats.completed, color: "#10b981" },
    { name: "Pending", value: stats.pending, color: "#3b82f6" },
    { name: "Overdue", value: stats.overdue, color: "#ef4444" },
  ].filter((item) => item.value > 0);

  if (pieData.length === 0) {
    return (
      <div
        className={`p-4 md:p-6 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} shadow-sm`}
      >
        <h2
          className={`text-lg md:text-xl font-semibold ${isDark ? "text-white" : "text-gray-800"} mb-4`}
        >
          Task Breakdown
        </h2>
        <div className="text-center py-8 md:py-12">
          <Target
            className={`h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 ${isDark ? "text-gray-600" : "text-gray-300"}`}
          />
          <p
            className={`text-sm md:text-base ${isDark ? "text-gray-400" : "text-gray-500"} mb-2`}
          >
            No tasks yet
          </p>
          <p
            className={`text-xs md:text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}
          >
            Create your first task to see the breakdown
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className={`p-4 md:p-6 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} shadow-sm relative overflow-hidden`}
    >
      {/* Animated background glow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: animateChart ? 0.15 : 0,
          scale: animateChart ? 1 : 0.8,
        }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute inset-0 bg-gradient-to-br from-blue-500/30 via-purple-500/30 to-green-500/30 blur-2xl rounded-full"
      />

      <div className="relative z-10">
        <h2
          className={`text-lg md:text-xl font-semibold ${isDark ? "text-white" : "text-gray-800"} mb-4`}
        >
          Task Breakdown
        </h2>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                animationBegin={0}
                animationDuration={1500}
                animationEasing="ease-out"
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${entry.name}`}
                    fill={entry.color}
                    style={{
                      filter: `drop-shadow(0 0 ${index === 0 ? "8px" : "4px"} ${entry.color}40)`,
                    }}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? "#1f2937" : "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        <div className="mt-4 space-y-2">
          {pieData.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 + 0.8 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 + 1 }}
                  className="w-3 h-3 rounded-full mr-2"
                  style={{
                    backgroundColor: item.color,
                    boxShadow: `0 0 8px ${item.color}40`,
                  }}
                ></motion.div>
                <span
                  className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}
                >
                  {item.name}
                </span>
              </div>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 + 1.2 }}
                className={`text-sm font-medium ${isDark ? "text-gray-200" : "text-gray-800"}`}
              >
                {item.value}
              </motion.span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default CompletionBreakdown;
