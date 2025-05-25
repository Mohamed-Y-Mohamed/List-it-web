"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/utils/client";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import TodayTaskCard from "@/components/Tasks/customcard";
import {
  AlertTriangle,
  RefreshCw,
  Clock,
  Target,
  TrendingDown,
  Calendar,
} from "lucide-react";
import EmptyState from "@/components/popupModels/emptystate";
import { Collection as SchemaCollection } from "@/types/schema";

// Define types for better type safety
interface Task {
  id: string;
  text: string;
  description: string | null;
  created_at: string;
  due_date: string | null;
  is_completed: boolean;
  date_completed: string | null;
  is_pinned: boolean;
  collection_id: string | null;
  list_id: string | null;
  user_id: string;
  collection_name?: string;
  list_name?: string;
}

interface TaskGrouped {
  critical: Task[];
  high: Task[];
  medium: Task[];
}

// Animated counter component
const AnimatedCounter: React.FC<{
  value: number;
  duration?: number;
  suffix?: string;
}> = ({ value, duration = 1000, suffix = "" }) => {
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
      {count}
      {suffix}
    </span>
  );
};

// Stats card component
const StatsCard: React.FC<{
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  isDark: boolean;
  suffix?: string;
  description?: string;
  isLoading?: boolean;
}> = ({
  title,
  value,
  icon,
  color,
  isDark,
  suffix = "",
  description,
  isLoading = false,
}) => {
  const Icon = icon;

  if (isLoading) {
    return (
      <div
        className={`p-4 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} shadow-sm animate-pulse backdrop-blur-sm`}
      >
        <div className="flex items-center justify-between mb-3">
          <div
            className={`h-10 w-10 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
          ></div>
        </div>
        <div
          className={`h-4 w-16 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"} mb-2`}
        ></div>
        <div
          className={`h-6 w-12 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
        ></div>
      </div>
    );
  }
  const lightBg = color.replace(/bg-(\w+)-\d+/, "bg-$1-100");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`p-4 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} 
        shadow-sm relative overflow-hidden group hover:shadow-lg transition-all duration-300 backdrop-blur-sm border ${isDark ? "border-gray-700/50" : "border-gray-300/50"}`}
    >
      <div
        className={`absolute -bottom-2 -right-2 h-16 w-16 rounded-full blur-xl opacity-20 ${color} 
        group-hover:opacity-40 transition-opacity duration-300`}
      ></div>

      <div className="flex items-center justify-between mb-3 relative z-10">
        <div
          className={`p-2 rounded-lg ${lightBg} ${
            isDark ? "bg-opacity-40" : ""
          }`}
        >
          <Icon className={`h-5 w-5 z-1 ${color.replace("bg-", "text-")}`} />
        </div>
      </div>

      <div className="relative z-10">
        <h3
          className={`text-xs font-medium ${isDark ? "text-gray-400" : "text-gray-500"} mb-1`}
        >
          {title}
        </h3>
        <div className="text-2xl font-bold mb-1">
          <AnimatedCounter value={value} suffix={suffix} />
        </div>
        {description && (
          <p
            className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}
          >
            {description}
          </p>
        )}
      </div>
    </motion.div>
  );
};

// Priority section header component
const PriorityHeader: React.FC<{
  title: string;
  count: number;
  color: string;
  bgColor: string;
  icon: React.ElementType;
  isDark: boolean;
}> = ({ title, count, color, bgColor, icon, isDark }) => {
  const Icon = icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className={`flex items-center justify-between p-4 rounded-lg mb-4 backdrop-blur-sm ${
        isDark ? "bg-gray-800/40" : "bg-white/40"
      } border ${isDark ? "border-gray-700/50" : "border-gray-300/50"}`}
    >
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${bgColor} mr-3`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div>
          <h2 className={`text-lg font-semibold ${color}`}>{title}</h2>
          <p
            className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            {count} task{count !== 1 ? "s" : ""} need attention
          </p>
        </div>
      </div>

      <div
        className={`px-3 py-1 rounded-full ${bgColor} ${color} font-medium text-sm`}
      >
        {count}
      </div>
    </motion.div>
  );
};

export default function OverduePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [collections, setCollections] = useState<SchemaCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === "dark";

  // Format date for PostgreSQL query
  const formatDateForPostgres = useCallback((date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  // Get today's date for comparison
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  // Function to get all collections and lists for lookup
  const fetchAllCollectionsAndLists = useCallback(async () => {
    try {
      const { data: collectionsData } = await supabase
        .from("collection")
        .select("*");

      if (collectionsData) {
        const schemaCollections: SchemaCollection[] = collectionsData.map(
          (collection) => ({
            id: collection.id,
            collection_name: collection.collection_name,
            bg_color_hex: collection.bg_color_hex || "#000000",
            list_id: collection.list_id,
            user_id: collection.user_id,
            created_at: collection.created_at,
            list_name: null,
          })
        );
        setCollections(schemaCollections);
      }

      const listIds: string[] = [];
      collectionsData?.forEach((collection) => {
        if (collection.list_id && !listIds.includes(collection.list_id)) {
          listIds.push(collection.list_id);
        }
      });

      if (listIds.length > 0) {
        const { data: listsData } = await supabase
          .from("list")
          .select("*")
          .in("id", listIds);

        if (listsData && collectionsData) {
          const listMap = new Map();
          listsData.forEach((list) => {
            listMap.set(list.id, list);
          });

          const collectionsWithListNames: SchemaCollection[] =
            collectionsData.map((collection) => ({
              id: collection.id,
              collection_name: collection.collection_name,
              bg_color_hex: collection.bg_color_hex || "#000000",
              list_id: collection.list_id,
              user_id: collection.user_id,
              created_at: collection.created_at,
              list_name: collection.list_id
                ? listMap.get(collection.list_id)?.list_name || null
                : null,
            }));

          setCollections(collectionsWithListNames);
        }
      }

      return { collectionsData, listIds };
    } catch (error) {
      console.error("Error fetching collections and lists:", error);
      return { collectionsData: [], listIds: [] };
    }
  }, []);

  // Function to fetch all overdue tasks
  const fetchOverdueTasks = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setIsRefreshing(true);

    try {
      const todayFormatted = formatDateForPostgres(today);

      const { data: overdueTasks, error: tasksError } = await supabase
        .from("task")
        .select("*")
        .eq("is_completed", false)
        .eq("is_deleted", false)
        .lt("due_date", todayFormatted);

      if (tasksError) {
        console.error("Error fetching overdue tasks:", tasksError);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      if (!overdueTasks || overdueTasks.length === 0) {
        setTasks([]);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      const { collectionsData } = await fetchAllCollectionsAndLists();

      const collectionMap = new Map();
      collectionsData?.forEach((collection) => {
        collectionMap.set(collection.id, collection);
      });

      const taskListIds = overdueTasks
        .map((task) => task.list_id)
        .filter((id) => id !== null) as string[];

      const { data: listsData } = await supabase
        .from("list")
        .select("*")
        .in("id", taskListIds);

      const listMap = new Map();
      listsData?.forEach((list) => {
        listMap.set(list.id, list);
      });

      const tasksWithNames = overdueTasks.map((task) => {
        const collection = task.collection_id
          ? collectionMap.get(task.collection_id)
          : null;
        const list = task.list_id ? listMap.get(task.list_id) : null;

        return {
          ...task,
          collection_name: collection
            ? collection.collection_name
            : "Uncategorized",
          list_name: list ? list.list_name : "Default List",
        };
      });

      setTasks(tasksWithNames);
    } catch (error) {
      console.error("Unexpected error fetching overdue tasks:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [today, formatDateForPostgres, user, fetchAllCollectionsAndLists]);

  // Load tasks on initial render
  useEffect(() => {
    fetchOverdueTasks();
  }, [fetchOverdueTasks]);

  // Task handlers
  const handleTaskComplete = useCallback(
    async (taskId: string, isCompleted: boolean) => {
      if (!user) return { success: false, error: "User not authenticated" };

      try {
        const { error } = await supabase
          .from("task")
          .update({
            is_completed: isCompleted,
            date_completed: isCompleted ? new Date().toISOString() : null,
          })
          .eq("id", taskId);

        if (error) {
          console.error("Error updating task completion:", error);
          return { success: false, error };
        }

        if (isCompleted) {
          setTasks((prevTasks) => prevTasks.filter((t) => t.id !== taskId));
        }

        return { success: true };
      } catch (error) {
        console.error("Unexpected error updating task completion:", error);
        return { success: false, error };
      }
    },
    [user]
  );

  const handleTaskPriority = useCallback(
    async (taskId: string, isPinned: boolean) => {
      if (!user) return { success: false, error: "User not authenticated" };

      try {
        const { error } = await supabase
          .from("task")
          .update({ is_pinned: isPinned })
          .eq("id", taskId);

        if (error) {
          console.error("Error updating task priority:", error);
          return { success: false, error };
        }

        setTasks((prevTasks) =>
          prevTasks.map((t) =>
            t.id === taskId ? { ...t, is_pinned: isPinned } : t
          )
        );

        return { success: true };
      } catch (error) {
        console.error("Unexpected error updating task priority:", error);
        return { success: false, error };
      }
    },
    [user]
  );

  const handleTaskUpdate = useCallback(
    async (
      taskId: string,
      taskData: {
        text: string;
        description?: string | null;
        due_date?: Date | null;
        is_pinned: boolean;
      }
    ) => {
      if (!user) return { success: false, error: "User not authenticated" };

      try {
        const { error } = await supabase
          .from("task")
          .update({
            text: taskData.text,
            description: taskData.description,
            due_date: taskData.due_date
              ? taskData.due_date.toISOString()
              : null,
            is_pinned: taskData.is_pinned,
          })
          .eq("id", taskId);

        if (error) {
          console.error("Error updating task:", error);
          return { success: false, error };
        }

        let shouldRemove = false;
        if (taskData.due_date) {
          const updatedDueDate = new Date(taskData.due_date);
          updatedDueDate.setHours(0, 0, 0, 0);
          shouldRemove = updatedDueDate.getTime() >= today.getTime();
        }

        if (shouldRemove) {
          setTasks((prevTasks) => prevTasks.filter((t) => t.id !== taskId));
        } else {
          setTasks((prevTasks) =>
            prevTasks.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    text: taskData.text,
                    description: taskData.description ?? null,
                    due_date: taskData.due_date
                      ? taskData.due_date.toISOString()
                      : null,
                    is_pinned: taskData.is_pinned,
                  }
                : t
            )
          );
        }

        return { success: true };
      } catch (error) {
        console.error("Unexpected error updating task:", error);
        return { success: false, error };
      }
    },
    [user, today]
  );

  const handleCollectionChange = useCallback(
    async (taskId: string, collectionId: string) => {
      if (!user) return { success: false, error: "User not authenticated" };

      try {
        const { error } = await supabase
          .from("task")
          .update({ collection_id: collectionId })
          .eq("id", taskId);

        if (error) {
          console.error("Error updating task collection:", error);
          return { success: false, error };
        }

        const collection = collections.find((c) => c.id === collectionId);
        const collectionName = collection
          ? collection.collection_name
          : "Uncategorized";

        setTasks((prevTasks) =>
          prevTasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  collection_id: collectionId,
                  collection_name: collectionName ?? undefined,
                }
              : t
          )
        );

        return { success: true };
      } catch (error) {
        console.error("Unexpected error updating task collection:", error);
        return { success: false, error };
      }
    },
    [user, collections]
  );

  const handleTaskDelete = useCallback(
    async (taskId: string) => {
      if (!user) return { success: false, error: "User not authenticated" };

      try {
        setTasks((prevTasks) => prevTasks.filter((t) => t.id !== taskId));
        return { success: true };
      } catch (error) {
        console.error("Error handling task deletion:", error);
        return { success: false, error };
      }
    },
    [user]
  );

  // Calculate how many days overdue each task is
  const getDaysOverdue = useCallback(
    (dueDate: string) => {
      const due = new Date(dueDate);
      due.setHours(0, 0, 0, 0);
      const diffTime = today.getTime() - due.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    },
    [today]
  );

  // Group tasks by how overdue they are
  const groupedTasks = useMemo((): TaskGrouped => {
    const groups: TaskGrouped = {
      critical: [], // More than 7 days overdue
      high: [], // 3-7 days overdue
      medium: [], // 1-2 days overdue
    };

    tasks.forEach((task) => {
      if (!task.due_date) return;

      const daysOverdue = getDaysOverdue(task.due_date);

      if (daysOverdue > 7) {
        groups.critical.push(task);
      } else if (daysOverdue >= 3) {
        groups.high.push(task);
      } else {
        groups.medium.push(task);
      }
    });

    return groups;
  }, [tasks, getDaysOverdue]);

  // Get human readable overdue text
  const getOverdueText = useCallback(
    (dueDate: string) => {
      const daysOverdue = getDaysOverdue(dueDate);
      if (daysOverdue === 1) return "1 day overdue";
      return `${daysOverdue} days overdue`;
    },
    [getDaysOverdue]
  );

  // Calculate average days overdue
  const averageDaysOverdue = useMemo(() => {
    if (tasks.length === 0) return 0;
    const totalDays = tasks.reduce((sum, task) => {
      if (!task.due_date) return sum;
      return sum + getDaysOverdue(task.due_date);
    }, 0);
    return Math.round(totalDays / tasks.length);
  }, [tasks, getDaysOverdue]);

  return (
    <main
      className={`transition-all pt-16 pr-4 md:pr-16 min-h-screen duration-300 pb-20 w-full relative
      ${isDark ? "text-gray-200" : "text-gray-800"}`}
    >
      {/*  background */}
      {isDark ? (
        <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(135deg,#121212_0%,#1a1a1a_30%,#232323_70%,#2a1810_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_top_right,rgba(251,146,60,0.1)_0%,transparent_50%)] before:content-['']" />
      ) : (
        <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(135deg,#ffffff_0%,#fefefe_50%,#f9fafb_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_top_right,rgba(251,146,60,0.05)_0%,transparent_70%)] before:content-['']" />
      )}

      <div className="max-w-7xl pl-4 md:pl-20 w-full mx-auto">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center mb-2">
                <AlertTriangle
                  className={`h-7 w-7 mr-3 ${isDark ? "text-red-400" : "text-red-500"}`}
                />
                <h1
                  className={`text-3xl md:text-4xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  Overdue Tasks
                </h1>
              </div>
              <p
                className={`text-base ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                {tasks.length} task{tasks.length !== 1 ? "s" : ""} need
                {tasks.length === 1 ? "s" : ""} your immediate attention
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchOverdueTasks}
              disabled={isRefreshing}
              className={`p-3 rounded-xl transition-all duration-200 shadow-sm ${
                isDark
                  ? "bg-gray-800/50 hover:bg-gray-700/50 text-gray-300"
                  : "bg-white/50 hover:bg-gray-100/50 text-gray-700"
              } ${isRefreshing ? "animate-pulse" : ""} backdrop-blur-sm border ${isDark ? "border-gray-700/50" : "border-gray-300/50"}`}
              aria-label="Refresh tasks"
            >
              <RefreshCw
                className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </motion.button>
          </div>
        </motion.header>

        {/* Quick Stats */}
        {!isLoading && tasks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatsCard
              title="Total Overdue"
              value={tasks.length}
              icon={AlertTriangle}
              color="bg-red-500"
              isDark={isDark}
              description="Tasks past due"
              isLoading={isLoading}
            />
            <StatsCard
              title="Critical Items"
              value={groupedTasks.critical.length}
              icon={TrendingDown}
              color="bg-red-600 "
              isDark={isDark}
              description="7+ days overdue"
              isLoading={isLoading}
            />
            <StatsCard
              title="Average Delay"
              value={averageDaysOverdue}
              icon={Clock}
              color="bg-orange-500"
              isDark={isDark}
              suffix=" days"
              description="Days overdue"
              isLoading={isLoading}
            />
            <StatsCard
              title="Completion Rate"
              value={
                tasks.length > 0 ? Math.max(0, 100 - tasks.length * 5) : 100
              }
              icon={Target}
              color="bg-yellow-500"
              isDark={isDark}
              suffix="%"
              description="Time management"
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Loading state */}
        {isLoading ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className={`text-center py-16 rounded-xl ${
              isDark
                ? "bg-gray-800/50 text-gray-300"
                : "bg-white/50 text-gray-500"
            } shadow-sm backdrop-blur-sm border ${isDark ? "border-gray-700/50" : "border-gray-300/50"}`}
          >
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <RefreshCw
                  className={`h-10 w-10 animate-spin ${isDark ? "text-red-400" : "text-red-500"}`}
                />
                <div
                  className={`absolute inset-0 animate-pulse ${isDark ? "bg-red-400" : "bg-red-500"} rounded-full opacity-20`}
                ></div>
              </div>
              <p className="text-lg font-medium">Loading overdue tasks...</p>
            </div>
          </motion.div>
        ) : tasks.length === 0 ? (
          // Empty state
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <EmptyState
              title="No overdue tasks"
              message="Excellent! You're all caught up and have no overdue tasks."
              icon="check"
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-8"
          >
            {/* Critical Tasks */}
            <AnimatePresence>
              {groupedTasks.critical.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  <PriorityHeader
                    title="Critical Priority"
                    count={groupedTasks.critical.length}
                    color="text-red-600 dark:text-red-400"
                    bgColor="bg-red-100 dark:bg-red-900/30"
                    icon={AlertTriangle}
                    isDark={isDark}
                  />
                  <div className="space-y-4">
                    {groupedTasks.critical.map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="relative group"
                      >
                        <div className="absolute -top-2 -right-2 px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white shadow-lg z-10 animate-pulse">
                          {getOverdueText(task.due_date ?? "")}
                        </div>
                        <TodayTaskCard
                          id={task.id}
                          text={task.text}
                          description={task.description}
                          created_at={task.created_at}
                          due_date={task.due_date}
                          is_completed={task.is_completed}
                          date_completed={task.date_completed}
                          is_pinned={task.is_pinned}
                          collection_id={task.collection_id}
                          list_id={task.list_id}
                          user_id={task.user_id}
                          collection_name={task.collection_name}
                          list_name={task.list_name}
                          onComplete={handleTaskComplete}
                          onPriorityChange={handleTaskPriority}
                          onTaskUpdate={handleTaskUpdate}
                          onTaskDelete={handleTaskDelete}
                          collections={collections}
                          onCollectionChange={handleCollectionChange}
                          className="border-l-4 border-red-600"
                        />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* High Priority Tasks */}
            <AnimatePresence>
              {groupedTasks.high.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <PriorityHeader
                    title="High Priority"
                    count={groupedTasks.high.length}
                    color="text-orange-600 dark:text-orange-400"
                    bgColor="bg-orange-100 dark:bg-orange-900/30"
                    icon={Clock}
                    isDark={isDark}
                  />
                  <div className="space-y-4">
                    {groupedTasks.high.map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="relative group"
                      >
                        <div className="absolute -top-2 -right-2 px-3 py-1 rounded-full text-xs font-bold bg-orange-500 text-white shadow-lg z-10">
                          {getOverdueText(task.due_date ?? "")}
                        </div>
                        <TodayTaskCard
                          id={task.id}
                          text={task.text}
                          description={task.description}
                          created_at={task.created_at}
                          due_date={task.due_date}
                          is_completed={task.is_completed}
                          date_completed={task.date_completed}
                          is_pinned={task.is_pinned}
                          collection_id={task.collection_id}
                          list_id={task.list_id}
                          user_id={task.user_id}
                          collection_name={task.collection_name}
                          list_name={task.list_name}
                          onComplete={handleTaskComplete}
                          onPriorityChange={handleTaskPriority}
                          onTaskUpdate={handleTaskUpdate}
                          onTaskDelete={handleTaskDelete}
                          collections={collections}
                          onCollectionChange={handleCollectionChange}
                          className="border-l-4 border-orange-500"
                        />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Medium Priority Tasks */}
            <AnimatePresence>
              {groupedTasks.medium.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <PriorityHeader
                    title="Recently Overdue"
                    count={groupedTasks.medium.length}
                    color="text-yellow-600 dark:text-yellow-400"
                    bgColor="bg-yellow-100 dark:bg-yellow-900/30"
                    icon={Calendar}
                    isDark={isDark}
                  />
                  <div className="space-y-4">
                    {groupedTasks.medium.map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="relative group"
                      >
                        <div className="absolute -top-2 -right-2 px-3 py-1 rounded-full text-xs font-bold bg-yellow-500 text-white shadow-lg z-10">
                          {getOverdueText(task.due_date ?? "")}
                        </div>
                        <TodayTaskCard
                          id={task.id}
                          text={task.text}
                          description={task.description}
                          created_at={task.created_at}
                          due_date={task.due_date}
                          is_completed={task.is_completed}
                          date_completed={task.date_completed}
                          is_pinned={task.is_pinned}
                          collection_id={task.collection_id}
                          list_id={task.list_id}
                          user_id={task.user_id}
                          collection_name={task.collection_name}
                          list_name={task.list_name}
                          onComplete={handleTaskComplete}
                          onPriorityChange={handleTaskPriority}
                          onTaskUpdate={handleTaskUpdate}
                          onTaskDelete={handleTaskDelete}
                          collections={collections}
                          onCollectionChange={handleCollectionChange}
                          className="border-l-4 border-yellow-500"
                        />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </main>
  );
}
