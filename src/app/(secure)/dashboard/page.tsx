"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  BarChart3,
  ListTodo,
  Activity,
  CircleAlert,
} from "lucide-react";
import Link from "next/link";
import {
  DashboardTaskStats,
  DailyMetric,
  DashboardPriorityTask,
  DashboardActivityItem,
} from "@/types/schema";
import StatsSkeleton from "@/components/Dashboard/StatsSkeleton";
import StatsCard from "@/components/Dashboard/StatsCard";
import DailyTrendChart from "@/components/Dashboard/DailyTrendChart";
import CompletionBreakdown from "@/components/Dashboard/CompletionBreakdown";
import PriorityTasksPanel from "@/components/Dashboard/PriorityTasks";
import RecentActivityFeed from "@/components/Dashboard/RecentActivity";
import NewUserWelcome from "@/components/Dashboard/NewUserWelcome";

// Main Dashboard Component
export default function Dashboard() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === "dark";

  const [isLoading, setIsLoading] = useState(true);
  const [hasNoData, setHasNoData] = useState(false);
  const [error, setError] = useState<{ hasError: boolean; message: string }>({
    hasError: false,
    message: "",
  });
  const [activeTab, setActiveTab] = useState("overview");

  const [stats, setStats] = useState<DashboardTaskStats>({
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
    dueToday: 0,
    completionRate: 0,
    todayCompleted: 0,
    todayCreated: 0,
  });

  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [priorityTasks, setPriorityTasks] = useState<DashboardPriorityTask[]>([]);
  const [recentActivity, setRecentActivity] = useState<DashboardActivityItem[]>([]);

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
        // All data is fetched through the API route — no direct Supabase queries
        // from client components.
        const res = await fetch("/api/dashboard");

        if (!res.ok) {
          throw new Error(`Dashboard API returned ${res.status}`);
        }

        const data = await res.json();
        const { stats: apiStats, priorityTasks: apiPriorityTasks, dailyMetrics: apiDailyMetrics, recentActivity: apiRecentActivity } = data;

        if (apiStats.total === 0) {
          setHasNoData(true);
          setIsLoading(false);
          return;
        }

        setHasNoData(false);
        setStats(apiStats);
        setPriorityTasks(apiPriorityTasks ?? []);
        setDailyMetrics(apiDailyMetrics ?? []);
        setRecentActivity(apiRecentActivity ?? []);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load dashboard data.";
        setError({
          hasError: true,
          message: `${message} Please try refreshing the page.`,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

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
        <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(45deg,#000000_0%,#0a0c0f_20%,#141619_40%,#0f1114_70%,#000000_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.15)_0%,transparent_60%)] after:absolute after:inset-0 after:[background:radial-gradient(ellipse_at_top_right,rgba(147,197,253,0.08)_0%,transparent_50%)] before:content-[''] after:content-['']" />
      ) : (
        <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(45deg,#f8fafc_0%,#f1f5f9_25%,#e2e8f0_50%,#f3f4f6_75%,#ffffff_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.08)_0%,transparent_60%)] after:absolute after:inset-0 after:[background:radial-gradient(ellipse_at_top_right,rgba(147,197,253,0.06)_0%,transparent_50%)] before:content-[''] after:content-['']" />
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
                <RecentActivityFeed
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
                <PriorityTasksPanel
                  tasks={priorityTasks}
                  isLoading={isLoading}
                  isDark={isDark}
                />
                <RecentActivityFeed
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
