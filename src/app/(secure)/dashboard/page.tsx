"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3,
  ListTodo,
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  Plus,
  Edit,
  Star,
  CircleAlert,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { format, subDays, parseISO, isValid } from "date-fns";

// Interfaces
interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  completionRate: number;
  todayCompleted: number;
  todayCreated: number;
}

interface DailyMetric {
  date: string;
  completed: number;
  created: number;
  pending: number;
}

interface PriorityTask {
  id: string;
  text: string | null;
  due_date: string | null;
  is_pinned: boolean;
  created_at: string;
}

interface ActivityItem {
  id: string;
  type: "completed" | "created";
  description: string;
  timestamp: string;
}

interface ErrorState {
  hasError: boolean;
  message: string;
}

// Utility functions
const safeCalculatePercentage = (
  numerator: number,
  denominator: number
): number => {
  if (!denominator || denominator === 0 || !numerator || numerator < 0)
    return 0;
  const result = (numerator / denominator) * 100;
  return Number.isFinite(result) ? Math.min(result, 100) : 0;
};

const formatDate = (dateString: string): string => {
  try {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (!isValid(date)) return "Invalid date";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year:
        date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    });
  } catch {
    return "Invalid date";
  }
};

const formatTimeAgo = (dateString: string): string => {
  try {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    if (!isValid(date)) return "Invalid date";

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
      return `${diffHour}h ago`;
    } else if (diffMin > 0) {
      return `${diffMin}m ago`;
    } else {
      return "Just now";
    }
  } catch {
    return "Unknown";
  }
};

// Loading skeleton component
const StatsSkeleton: React.FC<{ isDark: boolean }> = ({ isDark }) => (
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

// Stats card component
const StatsCard: React.FC<{
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  isDark: boolean;
  trend?: number;
  suffix?: string;
}> = ({ title, value, icon, color, isDark, trend, suffix = "" }) => {
  const Icon = icon;
  const hasTrend = trend !== undefined && trend !== 0;
  const isPositiveTrend = trend && trend > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`p-4 md:p-6 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} 
        shadow-sm hover:shadow-md transition-all duration-200`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 md:p-3 rounded-lg ${color}`}>
          <Icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
        </div>
        {hasTrend && (
          <div
            className={`flex items-center text-xs md:text-sm ${
              isPositiveTrend ? "text-green-500" : "text-red-500"
            }`}
          >
            {isPositiveTrend ? (
              <TrendingUp className="h-3 w-3 md:h-4 md:w-4 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 md:h-4 md:w-4 mr-1" />
            )}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <h3
        className={`text-xs md:text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-500"} mb-1`}
      >
        {title}
      </h3>
      <div className="text-2xl md:text-3xl font-bold">
        {value}
        {suffix}
      </div>
    </motion.div>
  );
};

// Daily trend chart
const DailyTrendChart: React.FC<{
  data: DailyMetric[];
  isDark: boolean;
  isLoading: boolean;
}> = ({ data, isDark, isLoading }) => {
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

// Task completion breakdown
const CompletionBreakdown: React.FC<{
  stats: TaskStats;
  isDark: boolean;
  isLoading: boolean;
}> = ({ stats, isDark, isLoading }) => {
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

// Priority tasks component
const PriorityTasks: React.FC<{
  tasks: PriorityTask[];
  isLoading: boolean;
  isDark: boolean;
}> = ({ tasks, isLoading, isDark }) => {
  if (isLoading) {
    return (
      <div
        className={`p-4 md:p-6 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} shadow-sm`}
      >
        <div
          className={`h-6 w-32 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"} animate-pulse mb-4`}
        ></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`p-3 rounded-lg ${isDark ? "bg-gray-700/50" : "bg-gray-100"} animate-pulse`}
            >
              <div
                className={`h-4 w-3/4 rounded ${isDark ? "bg-gray-600" : "bg-gray-200"} mb-2`}
              ></div>
              <div
                className={`h-3 w-1/4 rounded ${isDark ? "bg-gray-600" : "bg-gray-200"}`}
              ></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div
        className={`p-4 md:p-6 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} shadow-sm`}
      >
        <h2
          className={`text-lg md:text-xl font-semibold ${isDark ? "text-white" : "text-gray-800"} mb-4`}
        >
          Priority Tasks
        </h2>
        <div className="text-center py-8">
          <Star
            className={`h-12 w-12 mx-auto mb-4 ${isDark ? "text-gray-600" : "text-gray-300"}`}
          />
          <p
            className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"} mb-2`}
          >
            No priority tasks
          </p>
          <p
            className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}
          >
            Pin important tasks to see them here
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className={`p-4 md:p-6 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} shadow-sm`}
    >
      <h2
        className={`text-lg md:text-xl font-semibold ${isDark ? "text-white" : "text-gray-800"} mb-4`}
      >
        Priority Tasks
      </h2>
      <div className="space-y-3">
        {tasks.slice(0, 5).map((task) => (
          <Link
            href={`/task/${task.id}`}
            key={task.id}
            className={`block p-3 rounded-lg ${
              isDark
                ? "bg-gray-700/50 hover:bg-gray-700 border border-gray-700"
                : "bg-gray-50/50 hover:bg-gray-100 border border-gray-100"
            } transition-colors duration-200`}
          >
            <div className="flex items-start">
              <Star
                className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isDark ? "text-orange-400" : "text-orange-500"} mr-2`}
              />
              <div className="flex-1 min-w-0">
                <h4
                  className={`text-sm font-medium ${isDark ? "text-gray-200" : "text-gray-700"} line-clamp-1`}
                >
                  {task.text || "Untitled Task"}
                </h4>
                {task.due_date && (
                  <p
                    className={`text-xs flex items-center mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDate(task.due_date)}
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
      {tasks.length > 5 && (
        <Link
          href="/tasks"
          className={`flex items-center justify-center text-sm font-medium mt-4 py-2 rounded-lg
            ${
              isDark
                ? "text-gray-300 hover:text-white bg-gray-700/50 hover:bg-gray-700"
                : "text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200"
            } transition-colors duration-200`}
        >
          View all tasks
          <ArrowRight className="h-3 w-3 ml-1" />
        </Link>
      )}
    </motion.div>
  );
};

// Recent activity component
const RecentActivity: React.FC<{
  activities: ActivityItem[];
  isLoading: boolean;
  isDark: boolean;
}> = ({ activities, isLoading, isDark }) => {
  if (isLoading) {
    return (
      <div
        className={`p-4 md:p-6 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} shadow-sm`}
      >
        <div
          className={`h-6 w-32 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"} animate-pulse mb-4`}
        ></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start animate-pulse">
              <div
                className={`h-8 w-8 rounded-full ${isDark ? "bg-gray-700/50" : "bg-gray-200/50"} mr-3`}
              ></div>
              <div className="flex-1">
                <div
                  className={`h-4 w-3/4 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"} mb-2`}
                ></div>
                <div
                  className={`h-3 w-1/3 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div
        className={`p-4 md:p-6 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} shadow-sm`}
      >
        <h2
          className={`text-lg md:text-xl font-semibold ${isDark ? "text-white" : "text-gray-800"} mb-4`}
        >
          Recent Activity
        </h2>
        <div className="text-center py-8">
          <Activity
            className={`h-12 w-12 mx-auto mb-4 ${isDark ? "text-gray-600" : "text-gray-300"}`}
          />
          <p
            className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"} mb-2`}
          >
            No recent activity
          </p>
          <p
            className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}
          >
            Your task activity will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className={`p-4 md:p-6 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} shadow-sm`}
    >
      <h2
        className={`text-lg md:text-xl font-semibold ${isDark ? "text-white" : "text-gray-800"} mb-4`}
      >
        Recent Activity
      </h2>
      <div className="space-y-4">
        {activities.slice(0, 5).map((activity) => (
          <div key={activity.id} className="flex items-start">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-white mr-3 ${
                activity.type === "completed"
                  ? isDark
                    ? "bg-green-600"
                    : "bg-green-500"
                  : isDark
                    ? "bg-blue-600"
                    : "bg-blue-500"
              }`}
            >
              {activity.type === "completed" ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium ${isDark ? "text-gray-200" : "text-gray-700"} line-clamp-2`}
              >
                {activity.description}
              </p>
              <p
                className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"} mt-1`}
              >
                {formatTimeAgo(activity.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// New user welcome
const NewUserWelcome: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
      className={`rounded-xl shadow-sm p-8 md:p-12 text-center ${isDark ? "bg-gray-800/50" : "bg-white/50"}`}
    >
      <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-blue-100 mb-6">
        <ListTodo className="h-8 w-8 text-blue-600" />
      </div>
      <h3
        className={`text-xl md:text-2xl font-semibold ${isDark ? "text-white" : "text-gray-800"} mb-3`}
      >
        Welcome to Your Dashboard
      </h3>
      <p
        className={`text-sm md:text-base max-w-md mx-auto ${isDark ? "text-gray-400" : "text-gray-500"} mb-6`}
      >
        Start creating tasks to see your productivity insights and track your
        progress over time.
      </p>
      <Link
        href="/create"
        className="inline-flex items-center px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors duration-200"
      >
        <Plus className="h-5 w-5 mr-2" />
        Create Your First Task
      </Link>
    </motion.div>
  );
};

// Main Dashboard Component
export default function Dashboard() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === "dark";

  const [isLoading, setIsLoading] = useState(true);
  const [hasNoData, setHasNoData] = useState(false);
  const [error, setError] = useState<ErrorState>({
    hasError: false,
    message: "",
  });
  const [activeTab, setActiveTab] = useState("overview");

  const [stats, setStats] = useState<TaskStats>({
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
    completionRate: 0,
    todayCompleted: 0,
    todayCreated: 0,
  });

  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [priorityTasks, setPriorityTasks] = useState<PriorityTask[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const formatDateForPostgres = (date: Date): string => {
    return date.toISOString().split("T")[0];
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "analytics", label: "Analytics", icon: Activity },
    { id: "tasks", label: "Tasks", icon: ListTodo },
  ];

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError({ hasError: false, message: "" });

      try {
        const todayFormatted = formatDateForPostgres(today);

        // Get all basic counts with error handling
        const [totalResult, completedResult, dueTodayResult, overdueResult] =
          await Promise.allSettled([
            supabase
              .from("task")
              .select("*", { count: "exact", head: true })
              .eq("is_deleted", false),
            supabase
              .from("task")
              .select("*", { count: "exact", head: true })
              .eq("is_completed", true)
              .eq("is_deleted", false),
            supabase
              .from("task")
              .select("*", { count: "exact", head: true })
              .eq("is_completed", false)
              .eq("is_deleted", false)
              .gte("due_date", todayFormatted)
              .lt(
                "due_date",
                formatDateForPostgres(new Date(today.getTime() + 86400000))
              ),
            supabase
              .from("task")
              .select("*", { count: "exact", head: true })
              .eq("is_completed", false)
              .eq("is_deleted", false)
              .lt("due_date", todayFormatted),
          ]);

        // Extract counts with fallbacks
        const totalCount =
          totalResult.status === "fulfilled" ? totalResult.value.count || 0 : 0;
        const completedCount =
          completedResult.status === "fulfilled"
            ? completedResult.value.count || 0
            : 0;
        const dueTodayCount =
          dueTodayResult.status === "fulfilled"
            ? dueTodayResult.value.count || 0
            : 0;
        const overdueCount =
          overdueResult.status === "fulfilled"
            ? overdueResult.value.count || 0
            : 0;

        // Check if user has any data
        if (totalCount === 0) {
          setHasNoData(true);
          setIsLoading(false);
          return;
        }

        setHasNoData(false);

        // Calculate metrics with error handling
        const pendingCount = Math.max(0, totalCount - completedCount);
        const completionRate = safeCalculatePercentage(
          completedCount,
          totalCount
        );

        // Get today's activity
        const [todayCompletedResult, todayCreatedResult] =
          await Promise.allSettled([
            supabase
              .from("task")
              .select("*", { count: "exact", head: true })
              .eq("is_completed", true)
              .gte("date_completed", todayFormatted)
              .lt(
                "date_completed",
                formatDateForPostgres(new Date(today.getTime() + 86400000))
              ),
            supabase
              .from("task")
              .select("*", { count: "exact", head: true })
              .gte("created_at", todayFormatted)
              .lt(
                "created_at",
                formatDateForPostgres(new Date(today.getTime() + 86400000))
              ),
          ]);

        const todayCompleted =
          todayCompletedResult.status === "fulfilled"
            ? todayCompletedResult.value.count || 0
            : 0;
        const todayCreated =
          todayCreatedResult.status === "fulfilled"
            ? todayCreatedResult.value.count || 0
            : 0;

        setStats({
          total: totalCount,
          completed: completedCount,
          pending: pendingCount,
          overdue: overdueCount,
          completionRate,
          todayCompleted,
          todayCreated,
        });

        // Get 7 days of metrics for charts
        const last7Days = Array.from({ length: 7 }, (_, i) =>
          subDays(new Date(), 6 - i)
        );
        const dailyData: DailyMetric[] = [];

        for (const date of last7Days) {
          const dateStr = formatDateForPostgres(date);
          const nextDay = formatDateForPostgres(
            new Date(date.getTime() + 86400000)
          );

          try {
            const [dayCompletedResult, dayCreatedResult] =
              await Promise.allSettled([
                supabase
                  .from("task")
                  .select("*", { count: "exact", head: true })
                  .eq("is_completed", true)
                  .gte("date_completed", dateStr)
                  .lt("date_completed", nextDay),
                supabase
                  .from("task")
                  .select("*", { count: "exact", head: true })
                  .gte("created_at", dateStr)
                  .lt("created_at", nextDay),
              ]);

            const dayCompleted =
              dayCompletedResult.status === "fulfilled"
                ? dayCompletedResult.value.count || 0
                : 0;
            const dayCreated =
              dayCreatedResult.status === "fulfilled"
                ? dayCreatedResult.value.count || 0
                : 0;
            const dayPending = Math.max(0, dayCreated - dayCompleted);

            dailyData.push({
              date: format(date, "MMM dd"),
              completed: dayCompleted,
              created: dayCreated,
              pending: dayPending,
            });
          } catch (err) {
            console.error(`Error fetching data for ${dateStr}:`, err);
            dailyData.push({
              date: format(date, "MMM dd"),
              completed: 0,
              created: 0,
              pending: 0,
            });
          }
        }

        setDailyMetrics(dailyData);

        // Get priority tasks
        try {
          const { data: pinnedTasks, error: pinnedError } = await supabase
            .from("task")
            .select("*")
            .eq("is_pinned", true)
            .eq("is_completed", false)
            .eq("is_deleted", false)
            .order("due_date", { ascending: true })
            .limit(10);

          if (pinnedError) throw pinnedError;
          setPriorityTasks(pinnedTasks || []);
        } catch (err) {
          console.error("Error fetching priority tasks:", err);
          setPriorityTasks([]);
        }

        // Get recent activity
        try {
          const [recentCompletedResult, recentCreatedResult] =
            await Promise.allSettled([
              supabase
                .from("task")
                .select("*")
                .eq("is_completed", true)
                .order("date_completed", { ascending: false })
                .limit(10),
              supabase
                .from("task")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(10),
            ]);

          const recentCompleted =
            recentCompletedResult.status === "fulfilled"
              ? recentCompletedResult.value.data || []
              : [];
          const recentCreated =
            recentCreatedResult.status === "fulfilled"
              ? recentCreatedResult.value.data || []
              : [];

          const activityItems = [
            ...recentCompleted.map((task) => ({
              id: `completed-${task.id}`,
              type: "completed" as const,
              description: `Completed: ${task.text || "Untitled task"}`,
              timestamp: task.date_completed || task.created_at,
            })),
            ...recentCreated.map((task) => ({
              id: `created-${task.id}`,
              type: "created" as const,
              description: `Created: ${task.text || "Untitled task"}`,
              timestamp: task.created_at,
            })),
          ]
            .filter((item) => item.timestamp)
            .sort(
              (a, b) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime()
            )
            .slice(0, 10);

          setRecentActivity(activityItems);
        } catch (err) {
          console.error("Error fetching recent activity:", err);
          setRecentActivity([]);
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError({
          hasError: true,
          message:
            "Failed to load dashboard data. Please try refreshing the page.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, today]);

  if (error.hasError) {
    return (
      <main
        className={`transition-all pt-16 pr-4 md:pr-16 min-h-screen duration-300 pb-20 w-full relative ${isDark ? "text-gray-200" : "text-gray-800"}`}
      >
        {isDark ? (
          <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(45deg,#000000_0%,#0f172a_20%,#1e293b_40%,#1e1b3a_70%,#000000_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_bottom_left,rgba(99,102,241,0.2)_0%,transparent_60%)] after:absolute after:inset-0 after:[background:radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.15)_0%,transparent_50%)] before:content-[''] after:content-['']" />
        ) : (
          <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(45deg,#f8fafc_0%,#f1f5f9_25%,#e2e8f0_50%,#f3f4f6_75%,#ffffff_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_bottom_left,rgba(99,102,241,0.08)_0%,transparent_60%)] after:absolute after:inset-0 after:[background:radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.06)_0%,transparent_50%)] before:content-[''] after:content-['']" />
        )}
        <div className="max-w-7xl pl-4 md:pl-20 w-full mx-auto">
          <div className="text-center py-16">
            <CircleAlert
              className={`h-16 w-16 mx-auto mb-4 ${isDark ? "text-red-400" : "text-red-500"}`}
            />
            <h2
              className={`text-xl font-semibold ${isDark ? "text-white" : "text-gray-800"} mb-2`}
            >
              Something went wrong
            </h2>
            <p
              className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
            >
              {error.message}
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (hasNoData) {
    return (
      <main
        className={`transition-all pt-16 pr-4 md:pr-16 min-h-screen duration-300 pb-20 w-full relative ${isDark ? "text-gray-200" : "text-gray-800"}`}
      >
        {isDark ? (
          <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(45deg,#000000_0%,#0f172a_20%,#1e293b_40%,#1e1b3a_70%,#000000_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_bottom_left,rgba(99,102,241,0.2)_0%,transparent_60%)] after:absolute after:inset-0 after:[background:radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.15)_0%,transparent_50%)] before:content-[''] after:content-['']" />
        ) : (
          <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(45deg,#f8fafc_0%,#f1f5f9_25%,#e2e8f0_50%,#f3f4f6_75%,#ffffff_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_bottom_left,rgba(99,102,241,0.08)_0%,transparent_60%)] after:absolute after:inset-0 after:[background:radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.06)_0%,transparent_50%)] before:content-[''] after:content-['']" />
        )}
        <div className="max-w-7xl pl-4 md:pl-20 w-full mx-auto">
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1
              className={`text-2xl md:text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
            >
              Dashboard
            </h1>
            <p
              className={`text-sm md:text-base mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              Welcome back, {user?.user_metadata.full_name || "there"}!
            </p>
          </motion.header>
          <NewUserWelcome isDark={isDark} />
        </div>
      </main>
    );
  }

  return (
    <main
      className={`transition-all pt-16 pr-4 md:pr-16 min-h-screen duration-300 pb-20 w-full relative ${isDark ? "text-gray-200" : "text-gray-800"}`}
    >
      {isDark ? (
        <div className="absolute inset-0 -z-10 size-full items-center [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#7c2d12_100%)]" />
      ) : (
        <div className="absolute inset-0 -z-10 size-full bg-white [background:radial-gradient(125%_125%_at_60%_10%,#fff_20%,#bae6fd_100%)]" />
      )}

      <div className="max-w-7xl pl-4 md:pl-20 w-full mx-auto">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 md:mb-8"
        >
          <h1
            className={`text-2xl md:text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
          >
            Dashboard
          </h1>
          <p
            className={`text-sm md:text-base mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            Welcome back, {user?.user_metadata.full_name || "there"}!
          </p>
        </motion.header>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex space-x-1 mb-6 md:mb-8 overflow-x-auto"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? isDark
                      ? "bg-blue-600 text-white"
                      : "bg-blue-500 text-white"
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
              className="space-y-6 md:space-y-8"
            >
              {/* Stats Cards */}
              {isLoading ? (
                <StatsSkeleton isDark={isDark} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  <StatsCard
                    title="Total Tasks"
                    value={stats.total}
                    icon={ListTodo}
                    color="bg-blue-500"
                    isDark={isDark}
                  />
                  <StatsCard
                    title="Completed"
                    value={stats.completed}
                    icon={CheckCircle}
                    color="bg-green-500"
                    isDark={isDark}
                    trend={stats.todayCompleted > 0 ? 10 : undefined}
                  />
                  <StatsCard
                    title="Completion Rate"
                    value={Math.round(stats.completionRate)}
                    icon={Target}
                    color="bg-purple-500"
                    isDark={isDark}
                    suffix="%"
                    trend={stats.completionRate > 50 ? 5 : -5}
                  />
                  <StatsCard
                    title="Overdue"
                    value={stats.overdue}
                    icon={CircleAlert}
                    color="bg-red-500"
                    isDark={isDark}
                    trend={stats.overdue > 0 ? -10 : 0}
                  />
                </div>
              )}

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                <DailyTrendChart
                  data={dailyMetrics}
                  isDark={isDark}
                  isLoading={isLoading}
                />
                <CompletionBreakdown
                  stats={stats}
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
              className="space-y-6 md:space-y-8"
            >
              <DailyTrendChart
                data={dailyMetrics}
                isDark={isDark}
                isLoading={isLoading}
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                <CompletionBreakdown
                  stats={stats}
                  isDark={isDark}
                  isLoading={isLoading}
                />
                <RecentActivity
                  activities={recentActivity}
                  isLoading={isLoading}
                  isDark={isDark}
                />
              </div>
            </motion.div>
          )}

          {activeTab === "tasks" && (
            <motion.div
              key="tasks"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-6 md:space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                <PriorityTasks
                  tasks={priorityTasks}
                  isLoading={isLoading}
                  isDark={isDark}
                />
                <RecentActivity
                  activities={recentActivity}
                  isLoading={isLoading}
                  isDark={isDark}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
