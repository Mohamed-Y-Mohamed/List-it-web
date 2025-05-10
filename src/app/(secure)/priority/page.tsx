"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/utils/client";
import { useAuth } from "@/context/AuthContext";
import TodayTaskCard from "@/components/Tasks/customcard"; // Reusing the same card component
import { Pin, RefreshCw, Star } from "lucide-react";
import EmptyState from "@/components/popupModels/emptystate";

export default function PriorityPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
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

  // Function to get all collections and lists for lookup
  const fetchAllCollectionsAndLists = useCallback(async () => {
    try {
      // Get all collections
      const { data: collectionsData } = await supabase
        .from("collection")
        .select("*");

      if (collectionsData) {
        setCollections(collectionsData);
      }

      // Create lookup objects for collection names and list names
      const collectionIds = collectionsData?.map((c) => c.id) || [];
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

          const collectionsWithListNames = collectionsData.map(
            (collection) => ({
              ...collection,
              list_name: collection.list_id
                ? listMap.get(collection.list_id)?.list_name || null
                : null,
            })
          );

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
      // Get all tasks that are pinned and not completed
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

      // Get collection and list info
      const { collectionsData } = await fetchAllCollectionsAndLists();

      // Create lookup maps for collections and lists
      const collectionMap = new Map();
      collectionsData?.forEach((collection) => {
        collectionMap.set(collection.id, collection);
      });

      // Get list IDs from tasks
      const taskListIds = priorityTasks
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
      const tasksWithNames = priorityTasks.map((task) => {
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

        // If unpinned, remove from priority page
        if (!isPinned) {
          setTasks((prevTasks) => prevTasks.filter((t) => t.id !== taskId));
        } else {
          // Update in local state
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

        // If unpinned, remove from priority page
        if (!taskData.is_pinned) {
          setTasks((prevTasks) => prevTasks.filter((t) => t.id !== taskId));
        } else {
          // Update in local state
          setTasks((prevTasks) =>
            prevTasks.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    text: taskData.text,
                    description: taskData.description,
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
      // Sort by due date (nearest first)
      const aDate = a.due_date ? new Date(a.due_date) : new Date(a.created_at);
      const bDate = b.due_date ? new Date(b.due_date) : new Date(b.created_at);
      return aDate.getTime() - bDate.getTime();
    });
  }, [tasks]);

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
                  <Star className="h-6 w-6 mr-2 text-orange-500" />
                  <h1
                    className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    Priority Tasks
                  </h1>
                </div>
                <p
                  className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                >
                  {sortedTasks.length} high priority task
                  {sortedTasks.length !== 1 && "s"} • Focus on these first
                </p>
              </div>
              <button
                onClick={fetchPriorityTasks}
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
              } shadow-lg border-l-4 border-orange-500 transition-all duration-300`}
            >
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="relative">
                  <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
                  <div className="absolute inset-0 animate-pulse bg-orange-500 rounded-full opacity-20"></div>
                </div>
                <p className="text-lg font-medium">Loading priority tasks...</p>
              </div>
            </div>
          ) : sortedTasks.length === 0 ? (
            // Empty state
            <EmptyState
              title="No priority tasks"
              message="You don't have any priority tasks at the moment. Mark tasks as priority by clicking the pin icon."
              icon="plus"
              onAction={fetchPriorityTasks}
            />
          ) : (
            // Tasks list
            <div className="space-y-3">
              {sortedTasks.map((task) => (
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
          )}
        </div>
      </div>
    </main>
  );
}
