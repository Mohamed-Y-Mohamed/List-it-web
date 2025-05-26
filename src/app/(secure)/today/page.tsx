"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@utils/client";
import { useAuth } from "@/context/AuthContext";
import TodayTaskCard from "@/components/Tasks/customcard";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarClock, RefreshCw, Target, CheckCircle2 } from "lucide-react";
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
  isLoading?: boolean;
}> = ({
  title,
  value,
  icon,
  color,
  isDark,
  suffix = "",
  isLoading = false,
}) => {
  const Icon = icon;

  if (isLoading) {
    return (
      <div
        className={`p-4 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} shadow-sm animate-pulse`}
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`p-4 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} 
        shadow-sm relative overflow-hidden group hover:shadow-lg transition-all duration-300`}
    >
      <div
        className={`absolute -bottom-2 -right-2 h-16 w-16 rounded-full blur-xl opacity-20 ${color} 
        group-hover:opacity-40 transition-opacity duration-300`}
      ></div>

      <div className="flex items-center justify-between mb-3">
        <div
          className={`p-2 rounded-lg ${color.replace("bg-", "bg-").replace("-500", "-100")} ${isDark ? "bg-opacity-20" : ""}`}
        >
          <Icon className={`h-5 w-5 ${color.replace("bg-", "text-")}`} />
        </div>
      </div>

      <div>
        <h3
          className={`text-xs font-medium ${isDark ? "text-gray-400" : "text-gray-500"} mb-1`}
        >
          {title}
        </h3>
        <div className="text-2xl font-bold">
          <AnimatedCounter value={value} suffix={suffix} />
        </div>
      </div>
    </motion.div>
  );
};

export default function TodayPage() {
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

  // Get today's date and set time to beginning of day
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  // Function to get all collections and lists for lookup
  const fetchAllCollectionsAndLists = useCallback(async () => {
    try {
      // Get all collections
      const { data: collectionsData } = await supabase
        .from("collection")
        .select("*");

      if (collectionsData) {
        // Convert to the correct type with all required properties
        const schemaCollections: SchemaCollection[] = collectionsData.map(
          (collection) => ({
            id: collection.id,
            collection_name: collection.collection_name,
            bg_color_hex: collection.bg_color_hex || "#000000", // Provide default if null
            list_id: collection.list_id,
            user_id: collection.user_id,
            created_at: collection.created_at,
            list_name: null, // Will be updated below
          })
        );

        setCollections(schemaCollections);
      }

      // Create lookup objects for collection names and list names
      const listIds: string[] = [];

      // Get unique list IDs from collections
      collectionsData?.forEach((collection) => {
        if (collection.list_id && !listIds.includes(collection.list_id)) {
          listIds.push(collection.list_id);
        }
      });

      // Get list data for all list IDs
      if (listIds.length > 0) {
        const { data: listsData } = await supabase
          .from("list")
          .select("*")
          .in("id", listIds);

        // Add list names to collections
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

  // Handle task deletion
  const handleTaskDelete = useCallback(
    async (taskId: string) => {
      if (!user) return { success: false, error: "User not authenticated" };

      try {
        // Remove from local state
        setTasks((prevTasks) => prevTasks.filter((t) => t.id !== taskId));
        return { success: true };
      } catch (error) {
        console.error("Error handling task deletion:", error);
        return { success: false, error };
      }
    },
    [user]
  );

  // Function to fetch tasks due today
  const fetchTasksDueToday = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setIsRefreshing(true);

    try {
      // Get today's date in the format that PostgreSQL expects (YYYY-MM-DD)
      formatDateForPostgres(today);

      // Get all tasks
      const { data: allTasks, error: tasksError } = await supabase
        .from("task")
        .select("*")
        .eq("is_completed", false)
        .eq("is_deleted", false);

      if (tasksError) {
        console.error("Error fetching tasks:", tasksError);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      // Filter tasks for today
      const todaysTasks =
        allTasks?.filter((task) => {
          if (!task.due_date) return false;

          try {
            const taskDate = new Date(task.due_date);
            const taskYear = taskDate.getFullYear();
            const taskMonth = taskDate.getMonth();
            const taskDay = taskDate.getDate();

            const todayYear = today.getFullYear();
            const todayMonth = today.getMonth();
            const todayDay = today.getDate();

            return (
              taskYear === todayYear &&
              taskMonth === todayMonth &&
              taskDay === todayDay
            );
          } catch (e) {
            console.error("Error parsing date:", task.due_date, e);
            return false;
          }
        }) || [];

      if (todaysTasks.length === 0) {
        setTasks([]);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      // Get collection and list info
      const { collectionsData } = await fetchAllCollectionsAndLists();

      // Create lookup maps for collections and lists
      const collectionMap = new Map();
      collectionsData?.forEach((collection) => {
        collectionMap.set(collection.id, collection);
      });

      // Get list IDs from tasks
      const taskListIds = todaysTasks
        .map((task) => task.list_id)
        .filter((id) => id !== null) as string[];

      // Get list data for task list IDs
      const { data: listsData } = await supabase
        .from("list")
        .select("*")
        .in("id", taskListIds);

      // Create list lookup map
      const listMap = new Map();
      listsData?.forEach((list) => {
        listMap.set(list.id, list);
      });

      // Add collection and list names to tasks
      const tasksWithNames: Task[] = todaysTasks.map((task) => {
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
      console.error("Unexpected error fetching today's tasks:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [today, formatDateForPostgres, user, fetchAllCollectionsAndLists]);

  // Load tasks on initial render
  useEffect(() => {
    fetchTasksDueToday();
  }, [fetchTasksDueToday]);

  // Task handlers
  const handleTaskComplete = useCallback(
    async (taskId: string, isCompleted: boolean) => {
      if (!user) return { success: false, error: "User not authenticated" };

      try {
        // Update the task in the database
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

        // Remove from local state if completed
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
        // Update in the database
        const { error } = await supabase
          .from("task")
          .update({ is_pinned: isPinned })
          .eq("id", taskId);

        if (error) {
          console.error("Error updating task priority:", error);
          return { success: false, error };
        }

        // Update in local state
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
        // Check if due date has changed and is no longer today
        let willRemoveFromView = false;
        if (taskData.due_date) {
          const updatedDueDate = new Date(taskData.due_date);
          updatedDueDate.setHours(0, 0, 0, 0);
          willRemoveFromView = updatedDueDate.getTime() !== today.getTime();
        }

        // Update in the database
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

        // Update in local state
        if (willRemoveFromView) {
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

        // Find the collection in our collections array
        const collection = collections.find((c) => c.id === collectionId);
        const collectionName = collection
          ? collection.collection_name
          : "Uncategorized";

        // Update in local state
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

  // Memoized sorted tasks to prevent re-sorting on every render
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      // Sort by pin status first (pinned items at top)
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;

      // Then by due date (if available)
      const aDate = a.due_date ? new Date(a.due_date) : new Date(a.created_at);
      const bDate = b.due_date ? new Date(b.due_date) : new Date(b.created_at);
      return aDate.getTime() - bDate.getTime();
    });
  }, [tasks]);

  // Calculate stats
  const pinnedTasks = sortedTasks.filter((task) => task.is_pinned).length;
  const totalTasks = sortedTasks.length;

  return (
    <main
      className={`transition-all pt-16 pr-16 min-h-screen duration-300 pb-20 w-full relative
      ${isDark ? "text-gray-200" : "text-gray-800"}`}
    >
      {/*  background */}
      {isDark ? (
        <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(45deg,#000000_0%,#090f0b_20%,#131a15_40%,#0e1410_70%,#000000_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.11)_0%,transparent_64%)] after:absolute after:inset-0 after:[background:radial-gradient(ellipse_at_top_right,rgba(110,231,183,0.06)_0%,transparent_54%)] before:content-[''] after:content-['']" />
      ) : (
        <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(45deg,#f8fcfa_0%,#f1f8f5_25%,#e3f0e8_50%,#f3f8f5_75%,#ffffff_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.07)_0%,transparent_64%)] after:absolute after:inset-0 after:[background:radial-gradient(ellipse_at_top_right,rgba(110,231,183,0.04)_0%,transparent_54%)] before:content-[''] after:content-['']" />
      )}

      <div className="max-w-7xl pl-20 w-full mx-auto">
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
                <CalendarClock
                  className={`h-7 w-7 mr-3 ${isDark ? "text-orange-400" : "text-orange-500"}`}
                />
                <h1
                  className={`text-3xl md:text-4xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  Today&apos;s Focus
                </h1>
              </div>
              <p
                className={`text-base ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                {sortedTasks.length} task{sortedTasks.length !== 1 && "s"}{" "}
                scheduled for today
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchTasksDueToday}
              disabled={isRefreshing}
              className={`p-3 rounded-xl transition-all duration-200 shadow-sm ${
                isDark
                  ? "bg-gray-800/50 hover:bg-gray-700/50 text-gray-300"
                  : "bg-white/50 hover:bg-gray-100/50 text-gray-700"
              } ${isRefreshing ? "animate-pulse" : ""}`}
              aria-label="Refresh tasks"
            >
              <RefreshCw
                className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </motion.button>
          </div>
        </motion.header>

        {/* Quick Stats */}
        {!isLoading && sortedTasks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <StatsCard
              title="Total Tasks"
              value={totalTasks}
              icon={Target}
              color="bg-blue-500"
              isDark={isDark}
              isLoading={isLoading}
            />
            <StatsCard
              title="Priority Tasks"
              value={pinnedTasks}
              icon={CalendarClock}
              color="bg-orange-500"
              isDark={isDark}
              isLoading={isLoading}
            />
            <StatsCard
              title="Completion Rate"
              value={
                totalTasks > 0
                  ? Math.round(
                      ((totalTasks - sortedTasks.length) / totalTasks) * 100
                    )
                  : 0
              }
              icon={CheckCircle2}
              color="bg-green-500"
              isDark={isDark}
              suffix="%"
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
            } shadow-sm`}
          >
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <RefreshCw
                  className={`h-10 w-10 animate-spin ${isDark ? "text-orange-400" : "text-orange-500"}`}
                />
                <div
                  className={`absolute inset-0 animate-pulse ${isDark ? "bg-orange-400" : "bg-orange-500"} rounded-full opacity-20`}
                ></div>
              </div>
              <p className="text-lg font-medium">
                Loading today&apos;s tasks...
              </p>
            </div>
          </motion.div>
        ) : sortedTasks.length === 0 ? (
          // Empty state
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <EmptyState
              title="No tasks due today"
              message="Great job! You've completed all your tasks for today or haven't scheduled any tasks for today yet."
              icon="check"
            />
          </motion.div>
        ) : (
          // Tasks list
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-4"
          >
            <AnimatePresence>
              {sortedTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="transform transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                >
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
                    className="border-l-4"
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </main>
  );
}
