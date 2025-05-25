"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/utils/client";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import TodayTaskCard from "@/components/Tasks/customcard";
import { Star, RefreshCw, Calendar, Zap } from "lucide-react";
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
          className={`p-2 rounded-lg ${color.replace("bg-", "bg-").replace("-500", "-100")} ${isDark ? "bg-opacity-20" : ""}`}
        >
          <Icon className={`h-5 w-5 ${color.replace("bg-", "text-")}`} />
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

export default function PriorityPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [collections, setCollections] = useState<SchemaCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === "dark";

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

  // Function to fetch all pinned tasks
  const fetchPriorityTasks = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setIsRefreshing(true);

    try {
      const { data: priorityTasks, error: tasksError } = await supabase
        .from("task")
        .select("*")
        .eq("is_pinned", true)
        .eq("is_completed", false)
        .eq("is_deleted", false);

      if (tasksError) {
        console.error("Error fetching priority tasks:", tasksError);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      if (!priorityTasks || priorityTasks.length === 0) {
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

      const taskListIds = priorityTasks
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

      const tasksWithNames: Task[] = priorityTasks.map((task) => {
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
      console.error("Unexpected error fetching priority tasks:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, fetchAllCollectionsAndLists]);

  // Load tasks on initial render
  useEffect(() => {
    fetchPriorityTasks();
  }, [fetchPriorityTasks]);

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

        if (!isPinned) {
          setTasks((prevTasks) => prevTasks.filter((t) => t.id !== taskId));
        } else {
          setTasks((prevTasks) =>
            prevTasks.map((t) =>
              t.id === taskId ? { ...t, is_pinned: isPinned } : t
            )
          );
        }

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

        if (!taskData.is_pinned) {
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
    [user]
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
        const collectionName = collection?.collection_name ?? undefined;

        setTasks((prevTasks) =>
          prevTasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  collection_id: collectionId,
                  collection_name: collectionName,
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

  // Memoized sorted tasks to prevent re-sorting on every render
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const aDate = a.due_date ? new Date(a.due_date) : new Date(a.created_at);
      const bDate = b.due_date ? new Date(b.due_date) : new Date(b.created_at);
      return aDate.getTime() - bDate.getTime();
    });
  }, [tasks]);

  // Calculate stats
  const tasksWithDueDate = sortedTasks.filter((task) => task.due_date).length;
  const tasksToday = sortedTasks.filter((task) => {
    if (!task.due_date) return false;
    const today = new Date();
    const taskDate = new Date(task.due_date);
    return (
      today.getFullYear() === taskDate.getFullYear() &&
      today.getMonth() === taskDate.getMonth() &&
      today.getDate() === taskDate.getDate()
    );
  }).length;

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
                <Star
                  className={`h-7 w-7 mr-3 ${isDark ? "text-yellow-400" : "text-yellow-500"}`}
                />
                <h1
                  className={`text-3xl md:text-4xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  Priority Tasks
                </h1>
              </div>
              <p
                className={`text-base ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                {tasks.length} high priority task{tasks.length !== 1 ? "s" : ""}{" "}
                • Focus on these first
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchPriorityTasks}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <StatsCard
              title="Priority Tasks"
              value={tasks.length}
              icon={Star}
              color="bg-yellow-500"
              isDark={isDark}
              description="High priority items"
              isLoading={isLoading}
            />
            <StatsCard
              title="Due Today"
              value={tasksToday}
              icon={Zap}
              color="bg-orange-500"
              isDark={isDark}
              description="Urgent deadlines"
              isLoading={isLoading}
            />
            <StatsCard
              title="Scheduled"
              value={tasksWithDueDate}
              icon={Calendar}
              color="bg-blue-500"
              isDark={isDark}
              description="With due dates"
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
                  className={`h-10 w-10 animate-spin ${isDark ? "text-yellow-400" : "text-yellow-500"}`}
                />
                <div
                  className={`absolute inset-0 animate-pulse ${isDark ? "bg-yellow-400" : "bg-yellow-500"} rounded-full opacity-20`}
                ></div>
              </div>
              <p className="text-lg font-medium">Loading priority tasks...</p>
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
              title="No priority tasks"
              message="You don't have any priority tasks at the moment. Mark tasks as priority by clicking the pin icon."
              icon="plus"
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
                  className="relative group"
                >
                  <div className="absolute -top-2 -right-2 px-3 py-1 rounded-full text-xs font-bold bg-yellow-500 text-yellow-900 shadow-lg z-10">
                    <Star className="w-3 h-3 inline mr-1" />
                    Priority
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
                    className="border-l-4 border-yellow-500 hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
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
