"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/utils/client";
import { useAuth } from "@/context/AuthContext";
import TodayTaskCard from "@/components/Tasks/customcard"; // Reusing the same card component
import { ClipboardCheck, RefreshCw } from "lucide-react";
import EmptyState from "@/components/popupModels/emptystate"; // Reusing the same empty state component
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

interface TaskGroups {
  today: Task[];
  tomorrow: Task[];
  future: Task[];
  no_date: Task[];
}

export default function NotCompletedPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [collections, setCollections] = useState<SchemaCollection[]>([]); // Use the correct Collection type
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === "dark";

  // Background styles
  const backgroundStyle = useMemo(
    () => ({
      background: isDark ? "#2d3748" : "#FAF9F6",
    }),
    [isDark]
  );

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

  // Function to fetch all incomplete tasks that are not past their due date
  const fetchNotCompletedTasks = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setIsRefreshing(true);

    try {
      // Get today's date in the format that PostgreSQL expects (YYYY-MM-DD)
      formatDateForPostgres(today);

      // First, get all incomplete tasks
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

      // Filter tasks based on due date criteria:
      // 1. Tasks with no due date (ongoing tasks)
      // 2. Tasks with a due date >= today (not past due)
      const validTasks =
        allTasks?.filter((task) => {
          // Include tasks with no due date
          if (!task.due_date) return true;

          // Filter out tasks with past due dates
          try {
            const taskDate = new Date(task.due_date);
            taskDate.setHours(0, 0, 0, 0);

            // Include if due date is today or in the future
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

      // Get collection and list info
      const { collectionsData } = await fetchAllCollectionsAndLists();

      // Create lookup maps for collections and lists
      const collectionMap = new Map();
      collectionsData?.forEach((collection) => {
        collectionMap.set(collection.id, collection);
      });

      // Get list IDs from tasks
      const taskListIds = validTasks
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

        // Check if the updated task now has a past due date
        let shouldRemove = false;
        if (taskData.due_date) {
          const updatedDueDate = new Date(taskData.due_date);
          updatedDueDate.setHours(0, 0, 0, 0);
          shouldRemove = updatedDueDate.getTime() < today.getTime();
        }

        if (shouldRemove) {
          // Remove task if it now has a past due date
          setTasks((prevTasks) => prevTasks.filter((t) => t.id !== taskId));
        } else {
          // Update in local state
          setTasks((prevTasks) =>
            prevTasks.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    text: taskData.text,
                    description: taskData.description ?? null, // Add null check and default value
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
        const collectionName = collection?.collection_name ?? undefined;

        // Update in local state
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

  // Memoized sorted tasks to prevent re-sorting on every render
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      // Sort by pin status first (pinned items at top)
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;

      // Then by due date - tasks with due dates first,
      // followed by tasks without due dates
      const aHasDueDate = !!a.due_date;
      const bHasDueDate = !!b.due_date;

      if (aHasDueDate && !bHasDueDate) return -1;
      if (!aHasDueDate && bHasDueDate) return 1;

      // Then sort by due date if both have due dates (earliest first)
      if (aHasDueDate && bHasDueDate) {
        const aDate = a.due_date ? new Date(a.due_date) : null;
        const bDate = b.due_date ? new Date(b.due_date) : null;

        if (aDate && bDate) {
          return aDate.getTime() - bDate.getTime();
        } else {
          // If either date is null, consider it as a later date
          return aDate ? -1 : 1;
        }
      }

      // Finally, sort by creation date if neither has due date
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
      className={`min-h-screen w-full transition-all duration-300 pt-16 pl-20 ${
        isDark ? "text-gray-200" : "text-gray-800"
      }`}
      style={backgroundStyle}
    >
      <div className="p-4 md:p-6 box-border">
        <div className="max-w-4xl mx-auto">
          {/* Header with title and refresh button */}
          <div className="mb-6 px-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center mb-1">
                  <ClipboardCheck className="h-6 w-6 mr-2 text-teal-500" />
                  <h1
                    className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    Not Completed
                  </h1>
                </div>
                <p
                  className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                >
                  {tasks.length} task{tasks.length !== 1 && "s"} to complete •
                  Organized by due date
                </p>
              </div>
              <button
                onClick={fetchNotCompletedTasks}
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
              } shadow-lg border-l-4 border-teal-500 transition-all duration-300`}
            >
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="relative">
                  <RefreshCw className="h-8 w-8 animate-spin text-teal-500" />
                  <div className="absolute inset-0 animate-pulse bg-teal-500 rounded-full opacity-20"></div>
                </div>
                <p className="text-lg font-medium">Loading your tasks...</p>
              </div>
            </div>
          ) : tasks.length === 0 ? (
            // Empty state
            <EmptyState
              title="All caught up!"
              message="You don't have any incomplete tasks at the moment. Enjoy your free time or add new tasks."
              icon="check"
            />
          ) : (
            // Tasks list grouped by due date
            <div className="space-y-6">
              {/* Today's tasks */}
              {groupedTasks.today.length > 0 && (
                <div>
                  <h2
                    className={`text-lg font-medium mb-3 px-1 flex items-center ${
                      isDark ? "text-blue-300" : "text-blue-600"
                    }`}
                  >
                    <span className="flex h-2 w-2 mr-2 rounded-full bg-blue-500"></span>
                    Due Today
                  </h2>
                  <div className="space-y-3">
                    {groupedTasks.today.map((task) => (
                      <div
                        key={task.id}
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
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tomorrow's tasks */}
              {groupedTasks.tomorrow.length > 0 && (
                <div>
                  <h2
                    className={`text-lg font-medium mb-3 px-1 flex items-center ${
                      isDark ? "text-purple-300" : "text-purple-600"
                    }`}
                  >
                    <span className="flex h-2 w-2 mr-2 rounded-full bg-purple-500"></span>
                    Due Tomorrow
                  </h2>
                  <div className="space-y-3">
                    {groupedTasks.tomorrow.map((task) => (
                      <div
                        key={task.id}
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
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Future tasks */}
              {groupedTasks.future.length > 0 && (
                <div>
                  <h2
                    className={`text-lg font-medium mb-3 px-1 flex items-center ${
                      isDark ? "text-green-300" : "text-green-600"
                    }`}
                  >
                    <span className="flex h-2 w-2 mr-2 rounded-full bg-green-500"></span>
                    Upcoming
                  </h2>
                  <div className="space-y-3">
                    {groupedTasks.future.map((task) => (
                      <div
                        key={task.id}
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
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No due date tasks */}
              {groupedTasks.no_date.length > 0 && (
                <div>
                  <h2
                    className={`text-lg font-medium mb-3 px-1 flex items-center ${
                      isDark ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    <span className="flex h-2 w-2 mr-2 rounded-full bg-gray-500"></span>
                    No Due Date
                  </h2>
                  <div className="space-y-3">
                    {groupedTasks.no_date.map((task) => (
                      <div
                        key={task.id}
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
