"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/client";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  BarChart2,
  ListChecks,
  PieChart,
  ArrowUpRight,
  Layers,
  Star,
  CircleAlert,
  Plus,
  Edit,
} from "lucide-react";
import Link from "next/link";

// Define types for our component props and state
interface TaskStats {
  total: number;
  completed: number;
  dueToday: number;
  overdue: number;
}

interface TaskStatusData {
  label: string;
  count: number;
}

interface PriorityTask {
  id: string;
  text: string | null;
  due_date: string | null;
  is_pinned: boolean;
}

interface ActivityItem {
  id: string;
  type: "completed" | "created" | "updated";
  description: string;
  timestamp: string;
}

// Dashboard task statistics component with modern design
const DashboardStats: React.FC<{
  stats: TaskStats;
  isLoading: boolean;
  isDark: boolean;
}> = ({ stats, isLoading, isDark }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Tasks Card */}
      <div
        className={`p-4 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} shadow-sm relative overflow-hidden group`}
      >
        <div className="absolute -bottom-3 -right-3 h-16 w-16 rounded-full blur-xl opacity-20 bg-blue-500 group-hover:opacity-40 transition-opacity duration-300"></div>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-2">
            <h3
              className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}
            >
              Total Tasks
            </h3>
            <div
              className={`p-2 rounded-lg ${isDark ? "bg-gray-700" : "bg-blue-50"}`}
            >
              <Layers
                className={`h-4 w-4 ${isDark ? "text-blue-400" : "text-blue-500"}`}
              />
            </div>
          </div>
          <div className="mt-2">
            {isLoading ? (
              <div className="h-8 w-20 animate-pulse rounded bg-gray-300 dark:bg-gray-700"></div>
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">{stats.total || 0}</span>
                <span
                  className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                >
                  tasks
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Completed Card */}
      <div
        className={`p-4 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} shadow-sm relative overflow-hidden group`}
      >
        <div className="absolute -bottom-3 -right-3 h-16 w-16 rounded-full blur-xl opacity-20 bg-green-500 group-hover:opacity-40 transition-opacity duration-300"></div>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-2">
            <h3
              className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}
            >
              Completed
            </h3>
            <div
              className={`p-2 rounded-lg ${isDark ? "bg-gray-700" : "bg-green-50"}`}
            >
              <CheckCircle
                className={`h-4 w-4 ${isDark ? "text-green-400" : "text-green-500"}`}
              />
            </div>
          </div>
          <div className="mt-2">
            {isLoading ? (
              <div className="h-8 w-20 animate-pulse rounded bg-gray-300 dark:bg-gray-700"></div>
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">
                  {stats.completed || 0}
                </span>
                <span
                  className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                >
                  tasks
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Due Today Card */}
      <div
        className={`p-4 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} shadow-sm relative overflow-hidden group`}
      >
        <div className="absolute -bottom-3 -right-3 h-16 w-16 rounded-full blur-xl opacity-20 bg-blue-500 group-hover:opacity-40 transition-opacity duration-300"></div>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-2">
            <h3
              className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}
            >
              Due Today
            </h3>
            <div
              className={`p-2 rounded-lg ${isDark ? "bg-gray-700" : "bg-blue-50"}`}
            >
              <Calendar
                className={`h-4 w-4 ${isDark ? "text-blue-400" : "text-blue-500"}`}
              />
            </div>
          </div>
          <div className="mt-2">
            {isLoading ? (
              <div className="h-8 w-20 animate-pulse rounded bg-gray-300 dark:bg-gray-700"></div>
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">
                  {stats.dueToday || 0}
                </span>
                <span
                  className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                >
                  tasks
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overdue Card */}
      <div
        className={`p-4 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} shadow-sm relative overflow-hidden group`}
      >
        <div className="absolute -bottom-3 -right-3 h-16 w-16 rounded-full blur-xl opacity-20 bg-red-500 group-hover:opacity-40 transition-opacity duration-300"></div>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-2">
            <h3
              className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}
            >
              Overdue
            </h3>
            <div
              className={`p-2 rounded-lg ${isDark ? "bg-gray-700" : "bg-red-50"}`}
            >
              <CircleAlert
                className={`h-4 w-4 ${isDark ? "text-red-400" : "text-red-500"}`}
              />
            </div>
          </div>
          <div className="mt-2">
            {isLoading ? (
              <div className="h-8 w-20 animate-pulse rounded bg-gray-300 dark:bg-gray-700"></div>
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">{stats.overdue || 0}</span>
                <span
                  className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                >
                  tasks
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Task distribution chart by status (React component)
const TaskDistributionChart: React.FC<{
  taskData: TaskStatusData[];
  isDark: boolean;
  noDataState?: boolean;
}> = ({ taskData, isDark, noDataState = false }) => {
  // Adjust the design based on dark mode
  const getBarColor = (index: number) => {
    const colors = isDark
      ? ["#3182CE", "#38A169", "#DD6B20", "#E53E3E"]
      : ["#4299E1", "#48BB78", "#ED8936", "#F56565"];
    return colors[index % colors.length];
  };

  const maxValue = Math.max(...taskData.map((item) => item.count)) || 10;

  if (noDataState) {
    return (
      <div
        className={`py-8 text-center ${isDark ? "text-gray-400" : "text-gray-500"}`}
      >
        <p className="mb-2">No task data available yet</p>
        <p className="text-sm">Start creating tasks to see your distribution</p>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <div className="space-y-3">
        {taskData.map((item, index) => (
          <div key={item.label} className="flex flex-col">
            <div className="flex justify-between items-center mb-1">
              <span
                className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                {item.label}
              </span>
              <span
                className={`text-xs font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                {item.count}
              </span>
            </div>
            <div
              className={`h-2 w-full rounded-full ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
            >
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${(item.count / maxValue) * 100}%`,
                  backgroundColor: getBarColor(index),
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Recent Task Activity component
const RecentTaskActivity: React.FC<{
  activities: ActivityItem[];
  isLoading: boolean;
  isDark: boolean;
}> = ({ activities, isLoading, isDark }) => {
  if (isLoading) {
    return (
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
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div
        className={`text-center py-8 ${isDark ? "text-gray-400" : "text-gray-500"}`}
      >
        <p className="mb-2">No recent activity</p>
        <p className="text-sm">
          Your activities will appear here as you use the app
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start">
          <div
            className={`h-8 w-8 rounded-full flex items-center justify-center text-white mr-3 ${
              activity.type === "completed"
                ? isDark
                  ? "bg-green-600"
                  : "bg-green-500"
                : activity.type === "created"
                  ? isDark
                    ? "bg-blue-600"
                    : "bg-blue-500"
                  : isDark
                    ? "bg-purple-600"
                    : "bg-purple-500"
            }`}
          >
            {activity.type === "completed" ? (
              <CheckCircle className="h-4 w-4" />
            ) : activity.type === "created" ? (
              <Plus className="h-4 w-4" />
            ) : (
              <Edit className="h-4 w-4" />
            )}
          </div>
          <div>
            <p
              className={`text-sm font-medium ${isDark ? "text-gray-200" : "text-gray-700"}`}
            >
              {activity.description}
            </p>
            <p
              className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}
            >
              {formatTimeAgo(activity.timestamp)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

// Priority Tasks component
const PriorityTasks: React.FC<{
  tasks: PriorityTask[];
  isLoading: boolean;
  isDark: boolean;
}> = ({ tasks, isLoading, isDark }) => {
  if (isLoading) {
    return (
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
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div
        className={`text-center py-8 ${isDark ? "text-gray-400" : "text-gray-500"}`}
      >
        <p className="mb-2">No priority tasks yet</p>
        <p className="text-sm">Pin a task to see it here</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
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
            <div>
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
  );
};

// Helper for formatting dates
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year:
      date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
};

// Helper for formatting time ago
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

// Quick action card component
interface QuickActionCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  linkHref: string;
  linkText: string;
  bgColor: string;
  isDark: boolean;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({
  icon,
  title,
  description,
  linkHref,
  linkText,
  bgColor,
  isDark,
}) => {
  const Icon = icon;
  return (
    <div
      className={`p-4 rounded-xl shadow-sm ${isDark ? "bg-gray-800/50" : "bg-white/50"}`}
    >
      <div className={`p-2 rounded-lg w-fit ${bgColor}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <h3
        className={`text-base font-medium mt-3 ${isDark ? "text-gray-100" : "text-gray-800"}`}
      >
        {title}
      </h3>
      <p
        className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}
      >
        {description}
      </p>
      <Link
        href={linkHref}
        className={`flex items-center text-sm mt-4 font-medium
          ${isDark ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"}`}
      >
        {linkText}
        <ArrowUpRight className="h-3 w-3 ml-1" />
      </Link>
    </div>
  );
};

// New User Welcome component for empty dashboard
const NewUserWelcome: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  return (
    <div
      className={`rounded-xl shadow-sm p-8 text-center ${isDark ? "bg-gray-800/50" : "bg-white/50"}`}
    >
      <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-blue-100 mb-4">
        <Calendar className="h-8 w-8 text-blue-600" />
      </div>
      <h3
        className={`text-xl font-semibold ${isDark ? "text-white" : "text-gray-800"}`}
      >
        Welcome to Your Dashboard!
      </h3>
      <p
        className={`mt-2 max-w-md mx-auto ${isDark ? "text-gray-400" : "text-gray-500"}`}
      >
        It looks like you&apos;re new here. Start by creating tasks to track
        your work, set priorities, and meet your deadlines.
      </p>
    </div>
  );
};

// Main Dashboard Component
export default function Dashboard() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === "dark";
  const [isLoading, setIsLoading] = useState(true);
  const [hasNoData, setHasNoData] = useState(false);

  // Dashboard data states
  const [stats, setStats] = useState<TaskStats>({
    total: 0,
    completed: 0,
    dueToday: 0,
    overdue: 0,
  });
  const [tasksByStatus, setTasksByStatus] = useState<TaskStatusData[]>([]);
  const [priorityTasks, setPriorityTasks] = useState<PriorityTask[]>([]);
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

  // Fetch dashboard data from Supabase
  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
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
          ); // tomorrow

        // Get overdue tasks count
        const { count: overdueCount } = await supabase
          .from("task")
          .select("*", { count: "exact", head: true })
          .eq("is_completed", false)
          .eq("is_deleted", false)
          .lt("due_date", todayFormatted);

        // Set stats
        setStats({
          total: totalCount || 0,
          completed: completedCount || 0,
          dueToday: dueTodayCount || 0,
          overdue: overdueCount || 0,
        });

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

        // Create task distribution by status data
        setTasksByStatus([
          { label: "Completed", count: completedCount || 0 },
          { label: "Due Today", count: dueTodayCount || 0 },
          {
            label: "Upcoming",
            count:
              (totalCount || 0) -
              (completedCount || 0) -
              (dueTodayCount || 0) -
              (overdueCount || 0),
          },
          { label: "Overdue", count: overdueCount || 0 },
        ]);

        // Get 5 most recently completed tasks for activity
        const { data: recentlyCompletedTasks } = await supabase
          .from("task")
          .select("*")
          .eq("is_completed", true)
          .order("date_completed", { ascending: false })
          .limit(5);

        // Get 5 most recently created tasks
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
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, today]);

  return (
    <main
      className={`transition-all pt-16 pr-16 min-h-screen duration-300 
     pb-20 w-full relative
    ${isDark ? "text-gray-200" : "text-gray-800"}
    `}
    >
      {isDark ? (
        <div className="absolute inset-0 -z-10 size-full items-center [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#7c2d12_100%)]" />
      ) : (
        <div className="absolute inset-0 -z-10 size-full bg-white [background:radial-gradient(125%_125%_at_60%_10%,#fff_20%,#bae6fd_100%)]" />
      )}
      <div className="max-w-7xl pl-20 w-full mx-auto">
        {/* Dashboard header */}
        <header className="mb-6">
          <h1
            className={`text-2xl md:text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
          >
            Dashboard
          </h1>
          <p
            className={`text-sm sm:text-base mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            Welcome back,{" "}
            {user?.user_metadata.full_name
              ? user.user_metadata.full_name
              : "there"}
            !
          </p>
        </header>

        {/* Stats Cards */}
        {!hasNoData && (
          <DashboardStats stats={stats} isLoading={isLoading} isDark={isDark} />
        )}

        {/* Main Dashboard Content */}
        {hasNoData ? (
          <NewUserWelcome isDark={isDark} />
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Tasks Status Distribution */}
                <div
                  className={`rounded-xl shadow-sm p-5 ${isDark ? "bg-gray-800/50" : "bg-white/50"}`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2
                      className={`font-semibold ${isDark ? "text-white" : "text-gray-800"}`}
                    >
                      Task Distribution
                    </h2>
                    <div
                      className={`p-2 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-100"}`}
                    >
                      <BarChart2
                        className={`h-4 w-4 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                      />
                    </div>
                  </div>

                  <TaskDistributionChart
                    taskData={tasksByStatus}
                    isDark={isDark}
                    noDataState={stats.total === 0}
                  />
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <QuickActionCard
                    icon={Calendar}
                    title="Today's Tasks"
                    description="View and manage tasks due today"
                    linkHref="/today"
                    linkText="View tasks"
                    bgColor={isDark ? "bg-blue-600" : "bg-blue-500"}
                    isDark={isDark}
                  />

                  <QuickActionCard
                    icon={AlertCircle}
                    title="Overdue Tasks"
                    description="Handle tasks that are past due"
                    linkHref="/overdue"
                    linkText="View overdue"
                    bgColor={isDark ? "bg-red-600" : "bg-red-500"}
                    isDark={isDark}
                  />

                  <QuickActionCard
                    icon={ListChecks}
                    title="completed Tasks"
                    description="Browse all your active tasks"
                    linkHref="/completed"
                    linkText="View all"
                    bgColor={isDark ? "bg-green-600" : "bg-green-500"}
                    isDark={isDark}
                  />
                </div>

                {/* Recent Activity */}
                <div
                  className={`rounded-xl shadow-sm p-5 ${isDark ? "bg-gray-800/50" : "bg-white/50"}`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2
                      className={`font-semibold ${isDark ? "text-white" : "text-gray-800"}`}
                    >
                      Recent Activity
                    </h2>
                    <div
                      className={`p-2 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-100"}`}
                    >
                      <Clock
                        className={`h-4 w-4 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                      />
                    </div>
                  </div>

                  <RecentTaskActivity
                    activities={recentActivity}
                    isLoading={isLoading}
                    isDark={isDark}
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Priority Tasks */}
                <div
                  className={`rounded-xl shadow-sm p-5 ${isDark ? "bg-gray-800/50" : "bg-white/50"}`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2
                      className={`font-semibold ${isDark ? "text-white" : "text-gray-800"}`}
                    >
                      Priority Tasks
                    </h2>
                    <div
                      className={`p-2 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-100"}`}
                    >
                      <Star
                        className={`h-4 w-4 ${isDark ? "text-orange-400" : "text-orange-500"}`}
                      />
                    </div>
                  </div>

                  <PriorityTasks
                    tasks={priorityTasks}
                    isLoading={isLoading}
                    isDark={isDark}
                  />

                  <Link
                    href="/priority"
                    className={`flex items-center justify-center text-sm font-medium mt-4 py-2 rounded-lg
                      ${
                        isDark
                          ? "text-gray-300 hover:text-white bg-gray-700/50 hover:bg-gray-700"
                          : "text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200"
                      } transition-colors duration-200`}
                  >
                    View all priority tasks
                    <ArrowUpRight className="h-3 w-3 ml-1" />
                  </Link>
                </div>

                {/* Task Completion Progress */}
                <div
                  className={`rounded-xl shadow-sm p-5 ${isDark ? "bg-gray-800/50" : "bg-white/50"}`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2
                      className={`font-semibold ${isDark ? "text-white" : "text-gray-800"}`}
                    >
                      Completion Rate
                    </h2>
                    <div
                      className={`p-2 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-100"}`}
                    >
                      <PieChart
                        className={`h-4 w-4 ${isDark ? "text-purple-400" : "text-purple-500"}`}
                      />
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="flex justify-center py-8 animate-pulse">
                      <div
                        className={`h-32 w-32 rounded-full ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
                      ></div>
                    </div>
                  ) : stats.total === 0 ? (
                    <div
                      className={`text-center py-8 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                    >
                      <p className="mb-2">No completion data yet</p>
                      <p className="text-sm">
                        Complete tasks to see your progress
                      </p>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Circular progress chart */}
                      <div className="flex justify-center">
                        <div className="relative h-32 w-32">
                          {/* Background circle */}
                          <svg className="w-32 h-32" viewBox="0 0 100 100">
                            <circle
                              className={`${isDark ? "stroke-gray-700" : "stroke-gray-200"}`}
                              strokeWidth="8"
                              fill="transparent"
                              r="40"
                              cx="50"
                              cy="50"
                            />
                            {/* Progress circle */}
                            <circle
                              className={`${isDark ? "stroke-green-500" : "stroke-green-500"} transition-all duration-1000`}
                              strokeWidth="8"
                              strokeLinecap="round"
                              fill="transparent"
                              r="40"
                              cx="50"
                              cy="50"
                              strokeDasharray={`${
                                stats.total > 0
                                  ? (stats.completed / stats.total) * 251.2
                                  : 0
                              } 251.2`}
                              strokeDashoffset="0"
                              transform="rotate(-90 50 50)"
                            />
                          </svg>
                          {/* Percentage text in middle */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span
                              className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-800"}`}
                            >
                              {stats.total > 0
                                ? Math.round(
                                    (stats.completed / stats.total) * 100
                                  )
                                : 0}
                              %
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-6">
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                          <span
                            className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                          >
                            Completed
                          </span>
                        </div>
                        <span
                          className={`text-xs font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
                        >
                          {stats.completed} tasks
                        </span>
                      </div>

                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center">
                          <div
                            className={`h-3 w-3 rounded-full ${isDark ? "bg-gray-700" : "bg-gray-300"} mr-2`}
                          ></div>
                          <span
                            className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                          >
                            Total
                          </span>
                        </div>
                        <span
                          className={`text-xs font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
                        >
                          {stats.total} tasks
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
