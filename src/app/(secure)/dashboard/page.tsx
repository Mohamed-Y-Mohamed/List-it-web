"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
} from "recharts";
import {
  CheckCircle,
  AlertCircle,
  BarChart2,
  ListChecks,
  CircleAlert,
  Plus,
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  Activity,
  Award,
  Brain,
  Timer,
  Sparkles,
  Rocket,
  Zap as Lightning,
} from "lucide-react";
import Link from "next/link";
import { format, subDays } from "date-fns";

// Enhanced interfaces
interface TaskStats {
  total: number;
  completed: number;
  dueToday: number;
  overdue: number;
  completionRate: number;
  productivity: number;
}

interface PerformanceMetric {
  date: string;
  completed: number;
  created: number;
  productivity: number;
}

interface TimeDistribution {
  day: string;
  completions: number;
  created: number;
}
/* eslint-disable @typescript-eslint/no-unused-vars */

interface PriorityDistribution {
  priority: string;
  count: number;
  percentage: number;
  color: string;
}

interface InsightData {
  type: "positive" | "negative" | "neutral";
  title: string;
  description: string;
  value: string;
  trend?: number;
  icon: React.ElementType;
}

interface ActivityItem {
  id: string;
  type: "completed" | "created" | "updated";
  description: string;
  timestamp: string;
}

interface PriorityTask {
  id: string;
  text: string | null;
  due_date: string | null;
  is_pinned: boolean;
}

// Animated counter component
const AnimatedCounter: React.FC<{
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
}> = ({ value, duration = 1000, suffix = "", prefix = "" }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    const startValue = 0;
    const endValue = value;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const current = startValue + (endValue - startValue) * progress;
      setCount(Math.floor(current));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return (
    <span>
      {prefix}
      {count}
      {suffix}
    </span>
  );
};

// Enhanced stats cards with animations
const EnhancedStatsCard: React.FC<{
  title: string;
  value: number;
  change: number;
  icon: React.ElementType;
  color: string;
  isDark: boolean;
  suffix?: string;
  prefix?: string;
  isLoading?: boolean;
}> = ({
  title,
  value,
  change,
  icon,
  color,
  isDark,
  suffix = "",
  prefix = "",
  isLoading = false,
}) => {
  const Icon = icon;
  const isPositive = change >= 0;

  if (isLoading) {
    return (
      <div
        className={`p-6 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} shadow-sm animate-pulse`}
      >
        <div className="flex items-center justify-between mb-3">
          <div
            className={`h-12 w-12 rounded-xl ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
          ></div>
          <div
            className={`h-6 w-16 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
          ></div>
        </div>
        <div
          className={`h-4 w-20 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"} mb-2`}
        ></div>
        <div
          className={`h-8 w-16 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
        ></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`p-6 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} 
        shadow-sm relative overflow-hidden group hover:shadow-lg transition-all duration-300`}
    >
      <div
        className={`absolute -bottom-3 -right-3 h-20 w-20 rounded-full blur-xl opacity-20 ${color} 
        group-hover:opacity-40 transition-opacity duration-300`}
      ></div>

      <div className="flex items-center justify-between mb-3">
        <div
          className={`p-3 rounded-xl ${color.replace("bg-", "bg-").replace("-500", "-100")} ${isDark ? "bg-opacity-20" : ""}`}
        >
          <Icon className={`h-6 w-6 ${color.replace("bg-", "text-")}`} />
        </div>
        {change !== 0 && (
          <div
            className={`flex items-center text-sm ${isPositive ? "text-green-500" : "text-red-500"}`}
          >
            {isPositive ? (
              <TrendingUp className="h-4 w-4 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 mr-1" />
            )}
            {Math.abs(change)}%
          </div>
        )}
      </div>

      <div>
        <h3
          className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-500"} mb-1`}
        >
          {title}
        </h3>
        <div className="text-3xl font-bold">
          <AnimatedCounter value={value} prefix={prefix} suffix={suffix} />
        </div>
      </div>
    </motion.div>
  );
};

// Performance chart component
const PerformanceChart: React.FC<{
  data: PerformanceMetric[];
  isDark: boolean;
  isLoading: boolean;
}> = ({ data, isDark, isLoading }) => {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className={`p-6 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} shadow-sm`}
      >
        <div className="flex justify-between items-center mb-6">
          <div
            className={`h-6 w-40 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"} animate-pulse`}
          ></div>
          <div
            className={`h-10 w-10 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-200"} animate-pulse`}
          ></div>
        </div>
        <div
          className={`h-72 w-full rounded ${isDark ? "bg-gray-700" : "bg-gray-200"} animate-pulse`}
        ></div>
      </motion.div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className={`p-6 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} shadow-sm`}
      >
        <div className="flex justify-between items-center mb-6">
          <h2
            className={`text-xl font-semibold ${isDark ? "text-white" : "text-gray-800"}`}
          >
            📈 Performance Analytics
          </h2>
          <div
            className={`p-2 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-100"}`}
          >
            <Activity
              className={`h-5 w-5 ${isDark ? "text-gray-400" : "text-gray-500"}`}
            />
          </div>
        </div>
        <div className="text-center py-16">
          <Rocket
            className={`h-16 w-16 mx-auto mb-4 ${isDark ? "text-gray-600" : "text-gray-300"}`}
          />
          <p
            className={`text-lg font-medium ${isDark ? "text-gray-400" : "text-gray-500"} mb-2`}
          >
            🚀 Ready for Launch!
          </p>
          <p
            className={`text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}
          >
            Complete some tasks to see your performance trends take off
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
      className={`p-6 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} shadow-sm`}
    >
      <div className="flex justify-between items-center mb-6">
        <h2
          className={`text-xl font-semibold ${isDark ? "text-white" : "text-gray-800"}`}
        >
          📈 Performance Analytics
        </h2>
        <div
          className={`p-2 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-100"}`}
        >
          <Activity
            className={`h-5 w-5 ${isDark ? "text-gray-400" : "text-gray-500"}`}
          />
        </div>
      </div>

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
          />
          <YAxis stroke={isDark ? "#9ca3af" : "#6b7280"} fontSize={12} />
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
          />
          <Area
            type="monotone"
            dataKey="created"
            stroke="#3b82f6"
            fillOpacity={1}
            fill="url(#createdGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

// Productivity heatmap
const ProductivityHeatmap: React.FC<{
  data: TimeDistribution[];
  isDark: boolean;
  isLoading: boolean;
}> = ({ data, isDark, isLoading }) => {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7 }}
        className={`p-6 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} shadow-sm`}
      >
        <div className="flex justify-between items-center mb-6">
          <div
            className={`h-6 w-48 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"} animate-pulse`}
          ></div>
          <div
            className={`h-10 w-10 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-200"} animate-pulse`}
          ></div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div
              key={i}
              className={`h-20 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-200"} animate-pulse`}
            ></div>
          ))}
        </div>
      </motion.div>
    );
  }

  const maxCompletions = Math.max(...data.map((d) => d.completions));

  if (maxCompletions === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7 }}
        className={`p-6 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} shadow-sm`}
      >
        <div className="flex justify-between items-center mb-6">
          <h2
            className={`text-xl font-semibold ${isDark ? "text-white" : "text-gray-800"}`}
          >
            ⚡ Weekly Energy Map
          </h2>
          <div
            className={`p-2 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-100"}`}
          >
            <Timer
              className={`h-5 w-5 ${isDark ? "text-gray-400" : "text-gray-500"}`}
            />
          </div>
        </div>
        <div className="text-center py-12">
          <Lightning
            className={`h-16 w-16 mx-auto mb-4 ${isDark ? "text-gray-600" : "text-gray-300"}`}
          />
          <p
            className={`text-lg font-medium ${isDark ? "text-gray-400" : "text-gray-500"} mb-2`}
          >
            ⚡ Charging Up...
          </p>
          <p
            className={`text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}
          >
            Your productivity heatmap will light up as you complete tasks
            throughout the week
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7 }}
      className={`p-6 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} shadow-sm`}
    >
      <div className="flex justify-between items-center mb-6">
        <h2
          className={`text-xl font-semibold ${isDark ? "text-white" : "text-gray-800"}`}
        >
          ⚡ Weekly Energy Map
        </h2>
        <div
          className={`p-2 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-100"}`}
        >
          <Timer
            className={`h-5 w-5 ${isDark ? "text-gray-400" : "text-gray-500"}`}
          />
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {data.map((item, index) => {
          const intensity =
            maxCompletions > 0 ? item.completions / maxCompletions : 0;
          return (
            <motion.div
              key={item.day}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`p-3 rounded-lg text-center relative group cursor-pointer`}
              style={{
                backgroundColor: `rgba(59, 130, 246, ${0.1 + intensity * 0.8})`,
                border: `1px solid rgba(59, 130, 246, ${0.3 + intensity * 0.4})`,
              }}
            >
              <div
                className={`text-xs font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                {item.day}
              </div>
              <div
                className={`text-lg font-bold mt-1 ${isDark ? "text-white" : "text-gray-900"}`}
              >
                {item.completions}
              </div>

              {/* Tooltip */}
              <div
                className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 
                rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10
                ${isDark ? "bg-gray-900 text-white" : "bg-gray-800 text-white"}`}
              >
                {item.completions} tasks completed
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

// Smart insights component
const SmartInsights: React.FC<{
  insights: InsightData[];
  isDark: boolean;
  isLoading: boolean;
}> = ({ insights, isDark, isLoading }) => {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className={`p-6 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} shadow-sm`}
      >
        <div className="flex justify-between items-center mb-6">
          <div
            className={`h-6 w-32 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"} animate-pulse`}
          ></div>
          <div
            className={`h-10 w-10 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-200"} animate-pulse`}
          ></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`p-4 rounded-lg ${isDark ? "bg-gray-700/50" : "bg-gray-100"} animate-pulse`}
            >
              <div
                className={`h-4 w-3/4 rounded ${isDark ? "bg-gray-600" : "bg-gray-200"} mb-2`}
              ></div>
              <div
                className={`h-3 w-1/2 rounded ${isDark ? "bg-gray-600" : "bg-gray-200"}`}
              ></div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (!insights || insights.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className={`p-6 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} shadow-sm`}
      >
        <div className="flex justify-between items-center mb-6">
          <h2
            className={`text-xl font-semibold ${isDark ? "text-white" : "text-gray-800"}`}
          >
            🧠 AI Insights
          </h2>
          <div
            className={`p-2 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-100"}`}
          >
            <Brain
              className={`h-5 w-5 ${isDark ? "text-gray-400" : "text-gray-500"}`}
            />
          </div>
        </div>
        <div className="text-center py-12">
          <Sparkles
            className={`h-16 w-16 mx-auto mb-4 ${isDark ? "text-gray-600" : "text-gray-300"}`}
          />
          <p
            className={`text-lg font-medium ${isDark ? "text-gray-400" : "text-gray-500"} mb-2`}
          >
            🧠 Brain Loading...
          </p>
          <p
            className={`text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}
          >
            I&apos;ll analyze your productivity patterns and serve up some
            brilliant insights once you have more data
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className={`p-6 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} shadow-sm`}
    >
      <div className="flex justify-between items-center mb-6">
        <h2
          className={`text-xl font-semibold ${isDark ? "text-white" : "text-gray-800"}`}
        >
          🧠 AI Insights
        </h2>
        <div
          className={`p-2 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-100"}`}
        >
          <Brain
            className={`h-5 w-5 ${isDark ? "text-gray-400" : "text-gray-500"}`}
          />
        </div>
      </div>

      <div className="space-y-4">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`p-4 rounded-lg border-l-4 ${
                insight.type === "positive"
                  ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                  : insight.type === "negative"
                    ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                    : "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-3">
                  <div
                    className={`p-2 rounded-lg ${
                      insight.type === "positive"
                        ? "bg-green-100 dark:bg-green-800"
                        : insight.type === "negative"
                          ? "bg-red-100 dark:bg-red-800"
                          : "bg-blue-100 dark:bg-blue-800"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${
                        insight.type === "positive"
                          ? "text-green-600 dark:text-green-400"
                          : insight.type === "negative"
                            ? "text-red-600 dark:text-red-400"
                            : "text-blue-600 dark:text-blue-400"
                      }`}
                    />
                  </div>
                  <div>
                    <h3
                      className={`font-semibold ${isDark ? "text-white" : "text-gray-800"}`}
                    >
                      {insight.title}
                    </h3>
                    <p
                      className={`text-sm mt-1 ${isDark ? "text-gray-300" : "text-gray-600"}`}
                    >
                      {insight.description}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-lg font-bold ${
                      insight.type === "positive"
                        ? "text-green-600 dark:text-green-400"
                        : insight.type === "negative"
                          ? "text-red-600 dark:text-red-400"
                          : "text-blue-600 dark:text-blue-400"
                    }`}
                  >
                    {insight.value}
                  </div>
                  {insight.trend !== undefined && insight.trend !== 0 && (
                    <div
                      className={`text-xs flex items-center ${
                        insight.trend > 0 ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {insight.trend > 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(insight.trend)}%
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

// New User Welcome component for empty dashboard
const NewUserWelcome: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
      className={`rounded-xl shadow-sm p-12 text-center ${isDark ? "bg-gray-800/50" : "bg-white/50"}`}
    >
      <div className="mx-auto w-20 h-20 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 mb-6">
        <Rocket className="h-10 w-10 text-white" />
      </div>
      <h3
        className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-800"} mb-3`}
      >
        🚀 Welcome to Your Command Center!
      </h3>
      <p
        className={`text-lg max-w-md mx-auto ${isDark ? "text-gray-400" : "text-gray-500"} mb-6`}
      >
        Your productivity mission starts here. Create tasks, crush goals, and
        watch your performance metrics soar to new heights!
      </p>
      <Link
        href="/create"
        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
      >
        <Plus className="h-5 w-5 mr-2" />
        Launch Your First Task
      </Link>
    </motion.div>
  );
};

// Helper functions
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year:
      date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
};
/* eslint-disable @typescript-eslint/no-unused-vars */
const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 6) {
    return formatDate(dateString);
  } else if (diffDay > 0) {
    return diffDay === 1 ? "Yesterday" : `${diffDay} days ago`;
  } else if (diffHour > 0) {
    return `${diffHour} ${diffHour === 1 ? "hour" : "hours"} ago`;
  } else if (diffMin > 0) {
    return `${diffMin} ${diffMin === 1 ? "minute" : "minutes"} ago`;
  } else {
    return "Just now";
  }
};

// Main Dashboard Component
export default function EnhancedDashboard() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === "dark";
  const [isLoading, setIsLoading] = useState(true);
  const [hasNoData, setHasNoData] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Enhanced state management
  const [stats, setStats] = useState<TaskStats>({
    total: 0,
    completed: 0,
    dueToday: 0,
    overdue: 0,
    completionRate: 0,
    productivity: 0,
  });

  const [performanceData, setPerformanceData] = useState<PerformanceMetric[]>(
    []
  );
  const [timeDistribution, setTimeDistribution] = useState<TimeDistribution[]>(
    []
  );
  const [insights, setInsights] = useState<InsightData[]>([]);
  /* eslint-disable @typescript-eslint/no-unused-vars */
  /* eslint-disable @typescript-eslint/no-unused-vars */

  const [priorityTasks, setPriorityTasks] = useState<PriorityTask[]>([]);
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

  // Calculate today's date for filtering
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  // Format date for Postgres query
  const formatDateForPostgres = (date: Date): string => {
    return date.toISOString().split("T")[0];
  };

  // Tab configuration
  const tabs = [
    { id: "overview", label: "Mission Control", icon: Rocket },
    { id: "analytics", label: "Data Vault", icon: Activity },
    { id: "performance", label: "Power Metrics", icon: Target },
    { id: "insights", label: "AI Brain", icon: Brain },
  ];

  // Enhanced data fetching using your original logic
  useEffect(() => {
    if (!user) return;

    const fetchEnhancedDashboardData = async () => {
      setIsLoading(true);

      try {
        const todayFormatted = formatDateForPostgres(today);

        // Get total tasks count
        const { count: totalCount } = await supabase
          .from("task")
          .select("*", { count: "exact", head: true })
          .eq("is_deleted", false);

        // Check if user has any data
        if (!totalCount || totalCount === 0) {
          setHasNoData(true);
          setIsLoading(false);
          return;
        } else {
          setHasNoData(false);
        }

        // Get completed tasks count
        const { count: completedCount } = await supabase
          .from("task")
          .select("*", { count: "exact", head: true })
          .eq("is_completed", true)
          .eq("is_deleted", false);

        // Get due today tasks count
        const { count: dueTodayCount } = await supabase
          .from("task")
          .select("*", { count: "exact", head: true })
          .eq("is_completed", false)
          .eq("is_deleted", false)
          .gte("due_date", todayFormatted)
          .lt(
            "due_date",
            formatDateForPostgres(new Date(today.getTime() + 86400000))
          );

        // Get overdue tasks count
        const { count: overdueCount } = await supabase
          .from("task")
          .select("*", { count: "exact", head: true })
          .eq("is_completed", false)
          .eq("is_deleted", false)
          .lt("due_date", todayFormatted);

        // Handle null values and calculate completion rate and productivity
        const safeCompletedCount = completedCount ?? 0;
        const safeTotalCount = totalCount ?? 0;
        const safeDueTodayCount = dueTodayCount ?? 0;
        const safeOverdueCount = overdueCount ?? 0;

        const completionRate =
          safeTotalCount > 0 ? (safeCompletedCount / safeTotalCount) * 100 : 0;
        const productivity =
          safeCompletedCount > 0
            ? Math.min(completionRate + safeCompletedCount * 2, 100)
            : 0;

        // Set stats
        setStats({
          total: safeTotalCount,
          completed: safeCompletedCount,
          dueToday: safeDueTodayCount,
          overdue: safeOverdueCount,
          completionRate,
          productivity,
        });

        // Get performance data for last 7 days
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = subDays(new Date(), 6 - i);
          return date;
        });

        const performanceMetrics: PerformanceMetric[] = [];

        for (const date of last7Days) {
          const dateStr = formatDateForPostgres(date);
          const nextDay = formatDateForPostgres(
            new Date(date.getTime() + 86400000)
          );

          const { count: dayCompleted } = await supabase
            .from("task")
            .select("*", { count: "exact", head: true })
            .eq("is_completed", true)
            .gte("date_completed", dateStr)
            .lt("date_completed", nextDay);

          const { count: dayCreated } = await supabase
            .from("task")
            .select("*", { count: "exact", head: true })
            .gte("created_at", dateStr)
            .lt("created_at", nextDay);

          const safeDayCompleted = dayCompleted ?? 0;
          const safeDayCreated = dayCreated ?? 0;

          performanceMetrics.push({
            date: format(date, "MMM dd"),
            completed: safeDayCompleted,
            created: safeDayCreated,
            productivity:
              safeDayCompleted && safeDayCreated
                ? (safeDayCompleted / safeDayCreated) * 100
                : 0,
          });
        }

        setPerformanceData(performanceMetrics);

        // Generate weekly distribution
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const weekDistribution: TimeDistribution[] = [];

        for (let i = 0; i < 7; i++) {
          const dayData = performanceMetrics[i];
          weekDistribution.push({
            day: days[i],
            completions: dayData?.completed ?? 0,
            created: dayData?.created ?? 0,
          });
        }

        setTimeDistribution(weekDistribution);

        // Get priority tasks (pinned and not completed)
        const { data: pinnedTasks } = await supabase
          .from("task")
          .select("*")
          .eq("is_pinned", true)
          .eq("is_completed", false)
          .eq("is_deleted", false)
          .order("due_date", { ascending: true })
          .limit(5);

        setPriorityTasks(pinnedTasks || []);

        // Generate real insights from data
        const realInsights: InsightData[] = [];

        // Completion rate insight
        if (completionRate > 75) {
          realInsights.push({
            type: "positive",
            title: "🔥 Crushing It!",
            description: `You're absolutely dominating with a ${Math.round(completionRate)}% completion rate!`,
            value: `${Math.round(completionRate)}%`,
            trend: 15,
            icon: Award,
          });
        } else if (completionRate > 50) {
          realInsights.push({
            type: "neutral",
            title: "⚡ Building Momentum",
            description: `You're on track with a ${Math.round(completionRate)}% completion rate. Keep pushing!`,
            value: `${Math.round(completionRate)}%`,
            icon: Target,
          });
        } else if (totalCount > 0) {
          realInsights.push({
            type: "negative",
            title: "🎯 Focus Mode Needed",
            description: `Let's boost that ${Math.round(completionRate)}% completion rate - you've got this!`,
            value: `${Math.round(completionRate)}%`,
            trend: -5,
            icon: CircleAlert,
          });
        }

        // Overdue tasks insight
        if (safeOverdueCount > 0) {
          realInsights.push({
            type: "negative",
            title: "⏰ Time Warp Alert",
            description: `You have ${safeOverdueCount} tasks that need some time travel magic!`,
            value: `${safeOverdueCount} tasks`,
            icon: AlertCircle,
          });
        }

        // Productivity streak insight
        const recentCompletions = performanceMetrics
          .slice(-3)
          .reduce((sum, day) => sum + day.completed, 0);
        if (recentCompletions > 5) {
          realInsights.push({
            type: "positive",
            title: "🚀 Productivity Rocket",
            description: `Amazing! You've completed ${recentCompletions} tasks in the last 3 days!`,
            value: `${recentCompletions} tasks`,
            trend: 25,
            icon: Rocket,
          });
        }

        // If no insights, add a motivational one
        if (realInsights.length === 0 && safeTotalCount > 0) {
          realInsights.push({
            type: "neutral",
            title: "🌟 Getting Started",
            description:
              "Your productivity journey is just beginning. Every task completed is a step forward!",
            value: "Keep Going",
            icon: Sparkles,
          });
        }

        setInsights(realInsights);

        // Get recent activity using your original logic
        const { data: recentlyCompletedTasks } = await supabase
          .from("task")
          .select("*")
          .eq("is_completed", true)
          .order("date_completed", { ascending: false })
          .limit(5);

        const { data: recentlyCreatedTasks } = await supabase
          .from("task")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5);

        // Combine and format activity data
        const activityItems = [
          ...(recentlyCompletedTasks || []).map((task) => ({
            id: `completed-${task.id}`,
            type: "completed" as const,
            description: `Completed: ${task.text}`,
            timestamp: task.date_completed,
          })),
          ...(recentlyCreatedTasks || []).map((task) => ({
            id: `created-${task.id}`,
            type: "created" as const,
            description: `Created: ${task.text}`,
            timestamp: task.created_at,
          })),
        ]
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )
          .slice(0, 5);

        setRecentActivity(activityItems);
      } catch (error) {
        console.error("Error fetching enhanced dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEnhancedDashboardData();
  }, [user, today]);

  if (hasNoData) {
    return (
      <main
        className={`transition-all pt-16 pr-16 min-h-screen duration-300 pb-20 w-full relative
        ${isDark ? "text-gray-200" : "text-gray-800"}`}
      >
        {isDark ? (
          <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(135deg,#121212_0%,#1a1a1a_30%,#232323_70%,#2a1810_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_top_right,rgba(20,184,166,0.1)_0%,transparent_50%)] before:content-['']" />
        ) : (
          <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(135deg,#ffffff_0%,#fefefe_50%,#f9fafb_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_top_right,rgba(20,184,166,0.05)_0%,transparent_70%)] before:content-['']" />
        )}

        <div className="max-w-7xl pl-20 w-full mx-auto">
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1
              className={`text-3xl md:text-4xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
            >
              🚀 Mission Control Center
            </h1>
            <p
              className={`text-base mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              Ready to launch your productivity to the stars,{" "}
              {user?.user_metadata.full_name || "Commander"}?
            </p>
          </motion.header>

          <NewUserWelcome isDark={isDark} />
        </div>
      </main>
    );
  }

  return (
    <main
      className={`transition-all pt-16 pr-16 min-h-screen duration-300 pb-20 w-full relative
      ${isDark ? "text-gray-200" : "text-gray-800"}`}
    >
      {/* Animated background */}
      {isDark ? (
        <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(135deg,#121212_0%,#1a1a1a_30%,#232323_70%,#2a1810_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_top_right,rgba(251,146,60,0.1)_0%,transparent_50%)] before:content-['']" />
      ) : (
        <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(135deg,#ffffff_0%,#fefefe_50%,#f9fafb_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_top_right,rgba(251,146,60,0.05)_0%,transparent_70%)] before:content-['']" />
      )}

      <div className="max-w-7xl pl-20 w-full mx-auto">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1
            className={`text-3xl md:text-4xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
          >
            🚀 Mission Control Center
          </h1>
          <p
            className={`text-base mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            Welcome back, {user?.user_metadata.full_name || "Commander"}! Your
            productivity empire awaits.
          </p>
        </motion.header>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex space-x-1 mb-8"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? isDark
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                      : "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                    : isDark
                      ? "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* Enhanced Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <EnhancedStatsCard
                  title="🎯 Total Missions"
                  value={stats.total}
                  change={12}
                  icon={ListChecks}
                  color="bg-blue-500"
                  isDark={isDark}
                  isLoading={isLoading}
                />
                <EnhancedStatsCard
                  title="✅ Victories"
                  value={stats.completed}
                  change={18}
                  icon={CheckCircle}
                  color="bg-green-500"
                  isDark={isDark}
                  isLoading={isLoading}
                />
                <EnhancedStatsCard
                  title="🏆 Success Rate"
                  value={Math.round(stats.completionRate)}
                  change={5}
                  icon={Target}
                  color="bg-purple-500"
                  isDark={isDark}
                  suffix="%"
                  isLoading={isLoading}
                />
                <EnhancedStatsCard
                  title="⚡ Power Level"
                  value={Math.round(stats.productivity)}
                  change={stats.productivity > 50 ? 8 : -3}
                  icon={Zap}
                  color="bg-orange-500"
                  isDark={isDark}
                  isLoading={isLoading}
                />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <PerformanceChart
                  data={performanceData}
                  isDark={isDark}
                  isLoading={isLoading}
                />
                <ProductivityHeatmap
                  data={timeDistribution}
                  isDark={isDark}
                  isLoading={isLoading}
                />
              </div>
            </motion.div>
          )}

          {activeTab === "analytics" && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Performance Chart */}
                <div className="lg:col-span-2">
                  <PerformanceChart
                    data={performanceData}
                    isDark={isDark}
                    isLoading={isLoading}
                  />
                </div>

                {/* Efficiency Gauge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className={`p-6 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} shadow-sm`}
                >
                  <h3
                    className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-gray-800"}`}
                  >
                    ⚡ Power Gauge
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <RadialBarChart
                      cx="50%"
                      cy="50%"
                      innerRadius="30%"
                      outerRadius="90%"
                      data={[
                        {
                          value: Math.round(stats.productivity),
                          fill: "#3b82f6",
                        },
                      ]}
                    >
                      <RadialBar
                        dataKey="value"
                        cornerRadius={10}
                        fill="#3b82f6"
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="text-center mt-4">
                    <span className="text-2xl font-bold">
                      {Math.round(stats.productivity)}%
                    </span>
                    <p
                      className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Productivity Score
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Weekly heatmap */}
              <ProductivityHeatmap
                data={timeDistribution}
                isDark={isDark}
                isLoading={isLoading}
              />
            </motion.div>
          )}

          {activeTab === "performance" && (
            <motion.div
              key="performance"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* Performance Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Completion Velocity */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6 }}
                  className={`p-6 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} shadow-sm`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3
                      className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-800"}`}
                    >
                      🚀 Completion Velocity
                    </h3>
                    <div
                      className={`p-2 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-100"}`}
                    >
                      <Zap
                        className={`h-5 w-5 ${isDark ? "text-yellow-400" : "text-yellow-500"}`}
                      />
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="animate-pulse">
                      <div
                        className={`h-8 w-20 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"} mb-2`}
                      ></div>
                      <div
                        className={`h-4 w-32 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
                      ></div>
                    </div>
                  ) : (
                    <>
                      <div className="text-3xl font-bold mb-2">
                        <AnimatedCounter
                          value={Math.round(stats.productivity)}
                          suffix="%"
                        />
                      </div>
                      <p
                        className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
                      >
                        {stats.productivity > 70
                          ? "🔥 Blazing fast!"
                          : stats.productivity > 40
                            ? "⚡ Good pace"
                            : "🐌 Room to improve"}
                      </p>
                      <div
                        className={`mt-3 h-2 rounded-full ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
                      >
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-1000"
                          style={{
                            width: `${Math.min(stats.productivity, 100)}%`,
                          }}
                        ></div>
                      </div>
                    </>
                  )}
                </motion.div>

                {/* Task Momentum */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className={`p-6 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} shadow-sm`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3
                      className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-800"}`}
                    >
                      📈 Task Momentum
                    </h3>
                    <div
                      className={`p-2 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-100"}`}
                    >
                      <TrendingUp
                        className={`h-5 w-5 ${isDark ? "text-green-400" : "text-green-500"}`}
                      />
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="animate-pulse">
                      <div
                        className={`h-8 w-16 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"} mb-2`}
                      ></div>
                      <div
                        className={`h-4 w-24 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
                      ></div>
                    </div>
                  ) : (
                    <>
                      <div className="text-3xl font-bold mb-2">
                        <AnimatedCounter
                          value={performanceData
                            .slice(-3)
                            .reduce((sum, day) => sum + day.completed, 0)}
                        />
                      </div>
                      <p
                        className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
                      >
                        Tasks completed in last 3 days
                      </p>
                      <div className="flex items-center mt-3">
                        <div
                          className={`flex items-center text-sm ${
                            performanceData.length > 3 &&
                            performanceData
                              .slice(-3)
                              .reduce((sum, day) => sum + day.completed, 0) >
                              performanceData
                                .slice(-6, -3)
                                .reduce((sum, day) => sum + day.completed, 0)
                              ? "text-green-500"
                              : "text-gray-500"
                          }`}
                        >
                          <TrendingUp className="h-4 w-4 mr-1" />
                          {performanceData.length > 3
                            ? `${Math.abs(
                                ((performanceData
                                  .slice(-3)
                                  .reduce(
                                    (sum, day) => sum + day.completed,
                                    0
                                  ) -
                                  performanceData
                                    .slice(-6, -3)
                                    .reduce(
                                      (sum, day) => sum + day.completed,
                                      0
                                    )) /
                                  Math.max(
                                    performanceData
                                      .slice(-6, -3)
                                      .reduce(
                                        (sum, day) => sum + day.completed,
                                        0
                                      ),
                                    1
                                  )) *
                                  100
                              ).toFixed(0)}% vs last period`
                            : "Building momentum"}
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>

                {/* Focus Score */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className={`p-6 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} shadow-sm`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3
                      className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-800"}`}
                    >
                      🎯 Focus Score
                    </h3>
                    <div
                      className={`p-2 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-100"}`}
                    >
                      <Target
                        className={`h-5 w-5 ${isDark ? "text-purple-400" : "text-purple-500"}`}
                      />
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="animate-pulse">
                      <div
                        className={`h-8 w-20 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"} mb-2`}
                      ></div>
                      <div
                        className={`h-4 w-28 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
                      ></div>
                    </div>
                  ) : (
                    <>
                      <div className="text-3xl font-bold mb-2">
                        <AnimatedCounter
                          value={Math.round(stats.completionRate)}
                          suffix="%"
                        />
                      </div>
                      <p
                        className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
                      >
                        Task completion ratio
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            stats.completionRate > 80
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : stats.completionRate > 60
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}
                        >
                          {stats.completionRate > 80
                            ? "🔥 Elite"
                            : stats.completionRate > 60
                              ? "⚡ Good"
                              : "📈 Growing"}
                        </span>
                      </div>
                    </>
                  )}
                </motion.div>
              </div>

              {/* Performance Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Detailed Performance Chart */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8 }}
                  className={`p-6 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} shadow-sm`}
                >
                  <div className="flex justify-between items-center mb-6">
                    <h2
                      className={`text-xl font-semibold ${isDark ? "text-white" : "text-gray-800"}`}
                    >
                      📊 Performance Timeline
                    </h2>
                    <div
                      className={`p-2 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-100"}`}
                    >
                      <BarChart2
                        className={`h-5 w-5 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                      />
                    </div>
                  </div>

                  {isLoading ? (
                    <div
                      className={`h-72 w-full rounded ${isDark ? "bg-gray-700" : "bg-gray-200"} animate-pulse`}
                    ></div>
                  ) : performanceData.length === 0 ? (
                    <div className="text-center py-16">
                      <Activity
                        className={`h-16 w-16 mx-auto mb-4 ${isDark ? "text-gray-600" : "text-gray-300"}`}
                      />
                      <p
                        className={`text-lg font-medium ${isDark ? "text-gray-400" : "text-gray-500"} mb-2`}
                      >
                        📊 Data Loading...
                      </p>
                      <p
                        className={`text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}
                      >
                        Your performance timeline will appear as you complete
                        tasks
                      </p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={performanceData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke={isDark ? "#374151" : "#e5e7eb"}
                        />
                        <XAxis
                          dataKey="date"
                          stroke={isDark ? "#9ca3af" : "#6b7280"}
                          fontSize={12}
                        />
                        <YAxis
                          stroke={isDark ? "#9ca3af" : "#6b7280"}
                          fontSize={12}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDark ? "#1f2937" : "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          }}
                        />
                        <Bar
                          dataKey="completed"
                          fill="#10b981"
                          radius={[4, 4, 0, 0]}
                          name="Completed"
                        />
                        <Bar
                          dataKey="created"
                          fill="#3b82f6"
                          radius={[4, 4, 0, 0]}
                          name="Created"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </motion.div>

                {/* Productivity Rings */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                  className={`p-6 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} shadow-sm`}
                >
                  <div className="flex justify-between items-center mb-6">
                    <h2
                      className={`text-xl font-semibold ${isDark ? "text-white" : "text-gray-800"}`}
                    >
                      🎯 Power Rings
                    </h2>
                    <div
                      className={`p-2 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-100"}`}
                    >
                      <Target
                        className={`h-5 w-5 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                      />
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="flex justify-center py-12">
                      <div
                        className={`h-48 w-48 rounded-full ${isDark ? "bg-gray-700" : "bg-gray-200"} animate-pulse`}
                      ></div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-6">
                      {/* Main productivity ring */}
                      <div className="relative w-48 h-48">
                        <svg
                          className="w-48 h-48 transform -rotate-90"
                          viewBox="0 0 100 100"
                        >
                          {/* Background circle */}
                          <circle
                            className={`${isDark ? "stroke-gray-700" : "stroke-gray-200"}`}
                            strokeWidth="6"
                            fill="transparent"
                            r="42"
                            cx="50"
                            cy="50"
                          />
                          {/* Productivity circle */}
                          <circle
                            className="stroke-blue-500 transition-all duration-2000"
                            strokeWidth="6"
                            strokeLinecap="round"
                            fill="transparent"
                            r="42"
                            cx="50"
                            cy="50"
                            strokeDasharray={`${(stats.productivity / 100) * 264} 264`}
                            strokeDashoffset="0"
                          />
                          {/* Completion circle */}
                          <circle
                            className="stroke-green-500 transition-all duration-2000"
                            strokeWidth="4"
                            strokeLinecap="round"
                            fill="transparent"
                            r="35"
                            cx="50"
                            cy="50"
                            strokeDasharray={`${(stats.completionRate / 100) * 220} 220`}
                            strokeDashoffset="0"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span
                            className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-800"}`}
                          >
                            {Math.round(stats.productivity)}%
                          </span>
                          <span
                            className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
                          >
                            Power Level
                          </span>
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="flex space-x-6">
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-full bg-blue-500 mr-2"></div>
                          <span
                            className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
                          >
                            Productivity
                          </span>
                        </div>
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                          <span
                            className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
                          >
                            Completion
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Performance Insights */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className={`p-6 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} shadow-sm`}
              >
                <h2
                  className={`text-xl font-semibold mb-6 ${isDark ? "text-white" : "text-gray-800"}`}
                >
                  ⚡ Performance Breakdown
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div
                      className={`text-2xl font-bold ${isDark ? "text-blue-400" : "text-blue-600"}`}
                    >
                      {stats.total}
                    </div>
                    <div
                      className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Total Tasks
                    </div>
                  </div>

                  <div className="text-center">
                    <div
                      className={`text-2xl font-bold ${isDark ? "text-green-400" : "text-green-600"}`}
                    >
                      {stats.completed}
                    </div>
                    <div
                      className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Completed
                    </div>
                  </div>

                  <div className="text-center">
                    <div
                      className={`text-2xl font-bold ${isDark ? "text-yellow-400" : "text-yellow-600"}`}
                    >
                      {stats.dueToday}
                    </div>
                    <div
                      className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Due Today
                    </div>
                  </div>

                  <div className="text-center">
                    <div
                      className={`text-2xl font-bold ${isDark ? "text-red-400" : "text-red-600"}`}
                    >
                      {stats.overdue}
                    </div>
                    <div
                      className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Overdue
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {activeTab === "insights" && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
            >
              <SmartInsights
                insights={insights}
                isDark={isDark}
                isLoading={isLoading}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
