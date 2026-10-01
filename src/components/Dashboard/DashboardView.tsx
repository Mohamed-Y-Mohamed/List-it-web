"use client";

// The analytics view: stats tiles, trend charts and recent activity.
// Rendered at /dashboard on the web, and at /stats in the native app, whose
// /dashboard is the iOS-style lists screen instead.

import React, { useState, useEffect, useMemo } from "react";

import { useTheme } from "@/context/ThemeContext";
import { IS_NATIVE_BUILD } from "@/lib/platform";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  CheckCircle,
  Clock,
  BarChart3,
  ListTodo,
  Target,
  Activity,
  Plus,
  Star,
  CircleAlert,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { format, subDays } from "date-fns";
import { formatDisplayDate, formatTimeAgo } from "@/utils/dateUtils";
import AppSurface from "@/components/AppSurface";

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

// Loading skeleton component
// Mirrors the real tile's geometry — same columns, padding and block sizes — so
// the layout does not jump when the figures arrive.
const StatsSkeleton: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
    {[1, 2, 3, 4].map((i) => (
      <div
        key={i}
        className={`animate-pulse rounded-2xl p-4 md:p-5 ${
          isDark
            ? "bg-gray-800/50 ring-1 ring-white/5"
            : "bg-white/70 ring-1 ring-black/5"
        }`}
      >
        <div
          className={`mb-3 h-9 w-9 rounded-[10px] ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
        ></div>
        <div
          className={`h-7 w-14 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
        ></div>
        <div
          className={`mt-2 h-3.5 w-20 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
        ></div>
      </div>
    ))}
  </div>
);

/**
 * A single headline figure.
 *
 * There is no chart here on purpose: one number answering one question is a stat
 * tile, and wrapping it in a plot would add ink without adding meaning.
 *
 * The figure leads and the label sits under it — the number is what the reader
 * came for. The icon is a tinted glyph rather than a white one on a solid block:
 * at four-across on a phone, solid blocks turn the row into a colour chart and
 * pull the eye away from the figures.
 *
 * Deliberately no trend indicator. There was one, and the percentages in it were
 * invented — `completionRate > 50 ? 5 : -5` and `overdue > 0 ? -10 : 0`, rendered
 * with an up or down arrow as though they were measured. Nothing in the data
 * supports a period-on-period comparison, so the honest version shows none.
 */
const StatsCard: React.FC<{
  title: string;
  value: number;
  icon: React.ElementType;
  /** Tailwind text colour for the glyph, e.g. "text-blue-500". */
  tone: string;
  /** Matching tint for the glyph's backing tile, e.g. "bg-blue-500/10". */
  tint: string;
  isDark: boolean;
  suffix?: string;
}> = ({ title, value, icon, tone, tint, isDark, suffix = "" }) => {
  const Icon = icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`rounded-2xl p-4 md:p-5 ${
        isDark
          ? "bg-gray-800/50 ring-1 ring-white/5"
          : "bg-white/70 ring-1 ring-black/5"
      }`}
    >
      <div
        className={`mb-3 flex h-9 w-9 items-center justify-center rounded-[10px] ${tint}`}
      >
        <Icon className={`h-[18px] w-[18px] ${tone}`} />
      </div>
      {/* Tabular figures so the four tiles line up instead of jittering as the
          numbers change width. */}
      <div className="text-[26px] font-bold leading-none tracking-[-0.02em] tabular-nums md:text-[30px]">
        {value}
        {suffix}
      </div>
      <h3
        className={`mt-1.5 text-[13px] font-medium ${
          isDark ? "text-gray-400" : "text-gray-500"
        }`}
      >
        {title}
      </h3>
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
          {/* Tasks are whole things. Without this the axis offered 0.25 and 0.75
              of a task on any day where the count was 1. */}
          <YAxis
            stroke={isDark ? "#9ca3af" : "#6b7280"}
            fontSize={12}
            tick={{ fontSize: 12 }}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? "#1f2937" : "#ffffff",
              border: "none",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          />
          {/* Two series, so the legend is not optional — identity must not rest
              on colour alone. */}
          <Legend
            verticalAlign="top"
            align="left"
            height={28}
            iconType="plainline"
            wrapperStyle={{ fontSize: 12, paddingBottom: 8 }}
          />
          {/* `linear`, not `monotone`. A spline through daily counts bulges
              between the points it is drawn from — with a single day's activity
              it rendered a smooth bell implying work spread over three days that
              never happened. Straight segments claim only what was measured. */}
          <Area
            type="linear"
            dataKey="completed"
            stroke="#10b981"
            fillOpacity={1}
            fill="url(#completedGradient)"
            strokeWidth={2}
            dot={{ r: 3, strokeWidth: 0, fill: "#10b981" }}
            name="Completed"
          />
          <Area
            type="linear"
            dataKey="created"
            stroke="#3b82f6"
            fillOpacity={1}
            fill="url(#createdGradient)"
            strokeWidth={2}
            dot={{ r: 3, strokeWidth: 0, fill: "#3b82f6" }}
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
                    {formatDisplayDate(task.due_date)}
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
    </motion.div>
  );
};

/**
 * @param heading What the screen calls itself. Defaults to "Dashboard", which is
 *   what the web has always served it as. The Android app reaches the same screen
 *   from a tab labelled "Progress", and a tab and a heading disagreeing about the
 *   name of the screen you are looking at reads as a bug.
 */
// The secure layout is what is one viewport tall in the native shell, and its own
// padding lives inside that height. A min-h-screen here as well made the document
// taller than the screen by the top inset, so these screens scrolled a little past
// their content and showed the wrapper padding at the end. The web keeps it: there
// is no such wrapper there, and this is what stops a short page floating.
const ROOT_MIN_HEIGHT = IS_NATIVE_BUILD ? '' : 'min-h-screen';

export default function DashboardView({ heading = "Dashboard" }: { heading?: string } = {}) {
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        className={`transition-all pt-16 pr-4 md:pr-16 ${ROOT_MIN_HEIGHT} duration-300 pb-20 w-full relative ${isDark ? "text-gray-200" : "text-gray-800"}`}
      >
        {/* This screen has three render paths — loading, error and the dashboard
            itself — and each draws its own background. They have to stay identical,
            or the backdrop changes colour as the data arrives.

            The loading and error paths used to carry an indigo/purple variant
            (#1e1b3a, with rgba(99,102,241) and rgba(168,85,247) washes) while the
            main view used this neutral blue one, so the screen shifted hue the
            moment it finished loading. All three are the blue set now, which is
            also what Settings, the list detail screen and the Lists tab use. */}
        <AppSurface />
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
        className={`transition-all pt-16 pr-4 md:pr-16 ${ROOT_MIN_HEIGHT} duration-300 pb-20 w-full relative ${isDark ? "text-gray-200" : "text-gray-800"}`}
      >
        <AppSurface />
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
      className={`transition-all pt-16 pr-4 md:pr-16 ${ROOT_MIN_HEIGHT} duration-300 pb-20 w-full relative ${isDark ? "text-gray-200" : "text-gray-800"}`}
    >
      <AppSurface />

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
            {heading}
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
                // Two across on a phone, not one. Each tile carries a single
                // number, so a full-width row per figure meant four screens of
                // scrolling to read four integers.
                <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
                  <StatsCard
                    title="Total tasks"
                    value={stats.total}
                    icon={ListTodo}
                    tone="text-blue-500"
                    tint="bg-blue-500/10"
                    isDark={isDark}
                  />
                  <StatsCard
                    title="Completed"
                    value={stats.completed}
                    icon={CheckCircle}
                    tone="text-green-500"
                    tint="bg-green-500/10"
                    isDark={isDark}
                  />
                  <StatsCard
                    title="Completion rate"
                    value={Math.round(stats.completionRate)}
                    icon={Target}
                    tone="text-purple-500"
                    tint="bg-purple-500/10"
                    isDark={isDark}
                    suffix="%"
                  />
                  <StatsCard
                    title="Overdue"
                    value={stats.overdue}
                    icon={CircleAlert}
                    tone="text-red-500"
                    tint="bg-red-500/10"
                    isDark={isDark}
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

