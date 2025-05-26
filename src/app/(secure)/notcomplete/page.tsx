"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/utils/client";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import TodayTaskCard from "@/components/Tasks/customcard";
import {
  ClipboardCheck,
  RefreshCw,
  Target,
  Calendar,
  Clock,
  Infinity,
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

interface TaskGroups {
  today: Task[];
  tomorrow: Task[];
  future: Task[];
  no_date: Task[];
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

// Priority section header component
const SectionHeader: React.FC<{
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
            {count} task{count !== 1 ? "s" : ""} to complete
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

export default function NotCompletedPage() {
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

  // Function to fetch all incomplete tasks that are not past their due date
  const fetchNotCompletedTasks = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setIsRefreshing(true);

    try {
      formatDateForPostgres(today);

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

      const validTasks =
        allTasks?.filter((task) => {
          if (!task.due_date) return true;

          try {
            const taskDate = new Date(task.due_date);
            taskDate.setHours(0, 0, 0, 0);
            return taskDate.getTime() >= today.getTime();
          } catch (e) {
            console.error("Error parsing date:", task.due_date, e);
            return false;
          }
        }) || [];

      if (validTasks.length === 0) {
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

      const taskListIds = validTasks
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

      const tasksWithNames: Task[] = validTasks.map((task) => {
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
      console.error("Unexpected error fetching incomplete tasks:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [today, formatDateForPostgres, user, fetchAllCollectionsAndLists]);

  // Load tasks on initial render
  useEffect(() => {
    fetchNotCompletedTasks();
  }, [fetchNotCompletedTasks]);

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
          shouldRemove = updatedDueDate.getTime() < today.getTime();
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
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;

      const aHasDueDate = !!a.due_date;
      const bHasDueDate = !!b.due_date;

      if (aHasDueDate && !bHasDueDate) return -1;
      if (!aHasDueDate && bHasDueDate) return 1;

      if (aHasDueDate && bHasDueDate) {
        const aDate = a.due_date ? new Date(a.due_date) : null;
        const bDate = b.due_date ? new Date(b.due_date) : null;

        if (aDate && bDate) {
          return aDate.getTime() - bDate.getTime();
        } else {
          return aDate ? -1 : 1;
        }
      }

      return (
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });
  }, [tasks]);

  // Group tasks by due date for better organization
  const groupedTasks = useMemo((): TaskGroups => {
    const groups: TaskGroups = {
      today: [],
      tomorrow: [],
      future: [],
      no_date: [],
    };

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    sortedTasks.forEach((task) => {
      if (!task.due_date) {
        groups.no_date.push(task);
      } else {
        const dueDate = new Date(task.due_date);
        dueDate.setHours(0, 0, 0, 0);

        if (dueDate.getTime() === today.getTime()) {
          groups.today.push(task);
        } else if (dueDate.getTime() === tomorrow.getTime()) {
          groups.tomorrow.push(task);
        } else {
          groups.future.push(task);
        }
      }
    });

    return groups;
  }, [sortedTasks, today]);

  return (
    <main
      className={`transition-all pt-16 pr-4 md:pr-16 min-h-screen duration-300 pb-20 w-full relative
      ${isDark ? "text-gray-200" : "text-gray-800"}`}
    >
      {/*  background */}
      {isDark ? (
        <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(45deg,#000000_0%,#0a0b0f_20%,#141519_40%,#0f1014_70%,#000000_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_bottom_left,rgba(79,70,229,0.14)_0%,transparent_60%)] after:absolute before:inset-0 after:[background:radial-gradient(ellipse_at_top_right,rgba(129,140,248,0.08)_0%,transparent_50%)] before:content-[''] after:content-['']" />
      ) : (
        <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(45deg,#f8f9fc_0%,#f1f3f8_25%,#e2e5ef_50%,#f3f4f7_75%,#ffffff_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_bottom_left,rgba(79,70,229,0.08)_0%,transparent_60%)] after:absolute after:inset-0 after:[background:radial-gradient(ellipse_at_top_right,rgba(129,140,248,0.06)_0%,transparent_50%)] before:content-[''] after:content-['']" />
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
                <ClipboardCheck
                  className={`h-7 w-7 mr-3 ${isDark ? "text-teal-400" : "text-teal-500"}`}
                />
                <h1
                  className={`text-3xl md:text-4xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  To-Do Tasks
                </h1>
              </div>
              <p
                className={`text-base ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                {tasks.length} task{tasks.length !== 1 ? "s" : ""} to complete •
                Organized by due date
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchNotCompletedTasks}
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
              title="Total Pending"
              value={tasks.length}
              icon={ClipboardCheck}
              color="bg-teal-500"
              isDark={isDark}
              description="Tasks to complete"
              isLoading={isLoading}
            />
            <StatsCard
              title="Due Today"
              value={groupedTasks.today.length}
              icon={Target}
              color="bg-blue-500"
              isDark={isDark}
              description="Urgent items"
              isLoading={isLoading}
            />
            <StatsCard
              title="Scheduled"
              value={
                groupedTasks.today.length +
                groupedTasks.tomorrow.length +
                groupedTasks.future.length
              }
              icon={Calendar}
              color="bg-indigo-500"
              isDark={isDark}
              description="With due dates"
              isLoading={isLoading}
            />
            <StatsCard
              title="Ongoing"
              value={groupedTasks.no_date.length}
              icon={Infinity}
              color="bg-purple-500"
              isDark={isDark}
              description="No due date"
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
                  className={`h-10 w-10 animate-spin ${isDark ? "text-teal-400" : "text-teal-500"}`}
                />
                <div
                  className={`absolute inset-0 animate-pulse ${isDark ? "bg-teal-400" : "bg-teal-500"} rounded-full opacity-20`}
                ></div>
              </div>
              <p className="text-lg font-medium">Loading your tasks...</p>
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
              title="All caught up!"
              message="You don't have any incomplete tasks at the moment. Enjoy your free time or add new tasks."
              icon="check"
            />
          </motion.div>
        ) : (
          // Tasks list grouped by due date
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-8"
          >
            {/* Today's tasks */}
            <AnimatePresence>
              {groupedTasks.today.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  <SectionHeader
                    title="Due Today"
                    count={groupedTasks.today.length}
                    color="text-blue-600 dark:text-blue-400"
                    bgColor="bg-blue-100 dark:bg-blue-900/30"
                    icon={Target}
                    isDark={isDark}
                  />
                  <div className="space-y-4">
                    {groupedTasks.today.map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
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
                          className="border-l-4 border-blue-500"
                        />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tomorrow's tasks */}
            <AnimatePresence>
              {groupedTasks.tomorrow.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <SectionHeader
                    title="Due Tomorrow"
                    count={groupedTasks.tomorrow.length}
                    color="text-purple-600 dark:text-purple-400"
                    bgColor="bg-purple-100 dark:bg-purple-900/30"
                    icon={Calendar}
                    isDark={isDark}
                  />
                  <div className="space-y-4">
                    {groupedTasks.tomorrow.map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
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
                          className="border-l-4 border-purple-500"
                        />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Future tasks */}
            <AnimatePresence>
              {groupedTasks.future.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <SectionHeader
                    title="Upcoming"
                    count={groupedTasks.future.length}
                    color="text-green-600 dark:text-green-400"
                    bgColor="bg-green-100 dark:bg-green-900/30"
                    icon={Clock}
                    isDark={isDark}
                  />
                  <div className="space-y-4">
                    {groupedTasks.future.map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
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
                          className="border-l-4 border-green-500"
                        />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* No due date tasks */}
            <AnimatePresence>
              {groupedTasks.no_date.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <SectionHeader
                    title="Ongoing Tasks"
                    count={groupedTasks.no_date.length}
                    color="text-gray-600 dark:text-gray-400"
                    bgColor="bg-gray-100 dark:bg-gray-800/30"
                    icon={Infinity}
                    isDark={isDark}
                  />
                  <div className="space-y-4">
                    {groupedTasks.no_date.map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
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
                          className="border-l-4 border-gray-500"
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
