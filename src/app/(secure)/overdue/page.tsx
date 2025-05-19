"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/utils/client";
import { useAuth } from "@/context/AuthContext";
import TodayTaskCard from "@/components/Tasks/customcard"; // Reusing the same card component
import { AlertCircle, RefreshCw } from "lucide-react";
import EmptyState from "@/components/popupModels/emptystate";
import { Collection as SchemaCollection } from "@/types/schema"; // Import the schema type

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

export default function OverduePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [collections, setCollections] = useState<SchemaCollection[]>([]); // Use the correct Collection type
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === "dark";

  // Background styles

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

  // Function to fetch all overdue tasks
  const fetchOverdueTasks = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setIsRefreshing(true);

    try {
      // Get today's date in the format that PostgreSQL expects (YYYY-MM-DD)
      const todayFormatted = formatDateForPostgres(today);

      // Get all tasks that are:
      // 1. Not completed
      // 2. Not deleted
      // 3. Have a due date that is earlier than today
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

      // Get collection and list info
      const { collectionsData } = await fetchAllCollectionsAndLists();

      // Create lookup maps for collections and lists
      const collectionMap = new Map();
      collectionsData?.forEach((collection) => {
        collectionMap.set(collection.id, collection);
      });

      // Get list IDs from tasks
      const taskListIds = overdueTasks
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

        // Check if the updated date is no longer overdue
        let shouldRemove = false;
        if (taskData.due_date) {
          const updatedDueDate = new Date(taskData.due_date);
          updatedDueDate.setHours(0, 0, 0, 0);
          shouldRemove = updatedDueDate.getTime() >= today.getTime();
        }

        if (shouldRemove) {
          // If due date is updated to today or future, remove from overdue view
          setTasks((prevTasks) => prevTasks.filter((t) => t.id !== taskId));
        } else {
          // Update in local state
          setTasks((prevTasks) =>
            prevTasks.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    text: taskData.text,
                    description: taskData.description ?? null, // Add null check here
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
      <div className="p-4 md:p-6 box-border">
        <div className="max-w-4xl mx-auto">
          {/* Header with title and refresh button */}
          <div className="mb-6 px-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center mb-1">
                  <AlertCircle className="h-6 w-6 mr-2 text-red-500" />
                  <h1
                    className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    Overdue Tasks
                  </h1>
                </div>
                <p
                  className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                >
                  {tasks.length} overdue task{tasks.length !== 1 && "s"} • Needs
                  your attention
                </p>
              </div>
              <button
                onClick={fetchOverdueTasks}
                disabled={isRefreshing}
                className={`p-2 rounded-full transition-all duration-200 ${
                  isDark
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                } ${isRefreshing ? "animate-pulse" : ""}`}
                aria-label="Refresh tasks"
              >
                <RefreshCw
                  className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>

          {/* Loading state */}
          {isLoading ? (
            <div
              className={`text-center py-12 rounded-xl ${
                isDark
                  ? "bg-gray-800/80 text-gray-300"
                  : "bg-white text-gray-500"
              } shadow-lg border-l-4 border-red-500 transition-all duration-300`}
            >
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="relative">
                  <RefreshCw className="h-8 w-8 animate-spin text-red-500" />
                  <div className="absolute inset-0 animate-pulse bg-red-500 rounded-full opacity-20"></div>
                </div>
                <p className="text-lg font-medium">Loading overdue tasks...</p>
              </div>
            </div>
          ) : tasks.length === 0 ? (
            // Empty state
            <EmptyState
              title="No overdue tasks"
              message="You're all caught up! You don't have any overdue tasks."
              icon="check"
            />
          ) : (
            <div className="space-y-6">
              {/* Display tasks grouped by urgency level */}
              {groupedTasks.critical.length > 0 && (
                <div>
                  <h2
                    className={`text-lg font-medium mb-3 px-1 flex items-center text-red-600`}
                  >
                    <span className="flex h-2 w-2 mr-2 rounded-full bg-red-600"></span>
                    Critical ({groupedTasks.critical.length})
                  </h2>
                  <div className="space-y-3">
                    {groupedTasks.critical.map((task) => (
                      <div
                        key={task.id}
                        className="transform transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                      >
                        <div className="relative">
                          {/* Overdue badge */}
                          <div className="absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-bold bg-red-600 text-white shadow-md z-10">
                            {getOverdueText(task.due_date ?? "")}{" "}
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
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {groupedTasks.high.length > 0 && (
                <div>
                  <h2
                    className={`text-lg font-medium mb-3 px-1 flex items-center text-orange-600`}
                  >
                    <span className="flex h-2 w-2 mr-2 rounded-full bg-orange-500"></span>
                    High Priority ({groupedTasks.high.length})
                  </h2>
                  <div className="space-y-3">
                    {groupedTasks.high.map((task) => (
                      <div
                        key={task.id}
                        className="transform transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                      >
                        <div className="relative">
                          {/* Overdue badge */}
                          <div className="absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-bold bg-orange-500 text-white shadow-md z-10">
                            {getOverdueText(task.due_date ?? "")}{" "}
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
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {groupedTasks.medium.length > 0 && (
                <div>
                  <h2
                    className={`text-lg font-medium mb-3 px-1 flex items-center text-yellow-600`}
                  >
                    <span className="flex h-2 w-2 mr-2 rounded-full bg-yellow-500"></span>
                    Recently Overdue ({groupedTasks.medium.length})
                  </h2>
                  <div className="space-y-3">
                    {groupedTasks.medium.map((task) => (
                      <div
                        key={task.id}
                        className="transform transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                      >
                        <div className="relative">
                          {/* Overdue badge */}
                          <div className="absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-bold bg-yellow-500 text-white shadow-md z-10">
                            {getOverdueText(task.due_date ?? "")}{" "}
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
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
