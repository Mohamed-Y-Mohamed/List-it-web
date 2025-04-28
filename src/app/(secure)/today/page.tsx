"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";
import TaskCard from "@/components/Tasks/index"; // Make sure this path is correct
import { dataUtils } from "@/data/data";
import { Task, Collection } from "@/types/schema";

// Define interfaces for our extended task
interface ExtendedTask extends Task {
  collection_id: number;
  collection_name: string;
  list_id: number;
  list_name: string;
}

interface ExtendedCollection extends Collection {
  list_id: number;
  list_name: string;
}

export default function TodayPage() {
  const [todayTasks, setTodayTasks] = useState<ExtendedTask[]>([]);
  const [allCollections, setAllCollections] = useState<ExtendedCollection[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Get today's date and set time to beginning of day - memoized to avoid recalculation
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  // Function to get tasks due today that are not completed
  const fetchTasksDueToday = useCallback(() => {
    setIsLoading(true);

    // Simulate API call with timeout
    setTimeout(() => {
      const allLists = dataUtils
        .getListIds()
        .map((id) => dataUtils.getList(id))
        .filter((list): list is NonNullable<typeof list> => list !== null);

      const dueTodayTasks: ExtendedTask[] = [];
      const collections: ExtendedCollection[] = [];

      // First, collect all collections in one pass
      allLists.forEach((list) => {
        list.collections?.forEach((collection) => {
          collections.push({
            ...collection,
            list_id: list.id,
            list_name: list.list_name,
          });
        });
      });

      // Then process tasks in a separate pass for clarity
      allLists.forEach((list) => {
        list.collections?.forEach((collection) => {
          collection.tasks
            ?.filter((task) => {
              if (!task.due_date || task.is_completed) return false;

              const dueDate = new Date(task.due_date);
              dueDate.setHours(0, 0, 0, 0);
              return dueDate.getTime() === today.getTime();
            })
            .forEach((task) => {
              dueTodayTasks.push({
                ...task,
                collection_id: collection.id,
                collection_name: collection.collection_name,
                list_id: list.id,
                list_name: list.list_name,
              });
            });
        });
      });

      setTodayTasks(dueTodayTasks);
      setAllCollections(collections);
      setIsLoading(false);
    }, 300);
  }, [today]);

  // Load tasks on initial render
  useEffect(() => {
    fetchTasksDueToday();
  }, [fetchTasksDueToday]);

  // Task handlers
  const handleTaskComplete = useCallback(
    (taskId: number, isCompleted: boolean) => {
      // Skip if the task is now completed - it will disappear from the view
      if (isCompleted) {
        // Find task details to update in data store
        const task = todayTasks.find((t) => t.id === taskId);
        if (task) {
          // Update the task directly with the utility function
          dataUtils.updateTaskCompletion(
            task.list_id,
            task.collection_id,
            taskId,
            true
          );
        }

        // Remove from local state
        setTodayTasks((prevTasks) => prevTasks.filter((t) => t.id !== taskId));
      }
    },
    [todayTasks]
  );

  const handleTaskPriority = useCallback(
    (taskId: number, isPinned: boolean) => {
      // Find which collection and list this task belongs to
      const task = todayTasks.find((t) => t.id === taskId);
      if (!task) return;

      // Update in the data store
      dataUtils.updateTaskPin(
        task.list_id,
        task.collection_id,
        taskId,
        isPinned
      );

      // Update in local state
      setTodayTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === taskId ? { ...t, is_pinned: isPinned } : t
        )
      );
    },
    [todayTasks]
  );

  const handleTaskUpdate = useCallback(
    (
      taskId: number,
      taskData: {
        text: string;
        description?: string;
        due_date?: Date;
        is_pinned: boolean;
      }
    ) => {
      // If due date has changed and is no longer today, remove task from view
      if (taskData.due_date) {
        const updatedDueDate = new Date(taskData.due_date);
        updatedDueDate.setHours(0, 0, 0, 0);

        if (updatedDueDate.getTime() !== today.getTime()) {
          const task = todayTasks.find((t) => t.id === taskId);
          if (task) {
            dataUtils.updateTask(taskId, task.collection_id, taskData);
          }

          setTodayTasks((prevTasks) =>
            prevTasks.filter((t) => t.id !== taskId)
          );
          return;
        }
      }

      // Find the task to update
      const task = todayTasks.find((t) => t.id === taskId);
      if (task) {
        // Update in the data store
        dataUtils.updateTask(taskId, task.collection_id, taskData);
      }

      // Update in local state
      setTodayTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                text: taskData.text,
                description: taskData.description,
                due_date: taskData.due_date,
                is_pinned: taskData.is_pinned,
              }
            : t
        )
      );
    },
    [todayTasks, today]
  );

  // Memoized sorted tasks to prevent re-sorting on every render
  const sortedTasks = useMemo(() => {
    return [...todayTasks].sort((a, b) => {
      // Sort by pin status first (pinned items at top)
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;

      // Then by due date (if available)
      const aDate = a.due_date ? new Date(a.due_date) : new Date(a.created_at);
      const bDate = b.due_date ? new Date(b.due_date) : new Date(b.created_at);
      return aDate.getTime() - bDate.getTime();
    });
  }, [todayTasks]);

  // Background styles - memoized to prevent recreation on each render
  const backgroundStyle = useMemo(
    () => ({
      background: isDark ? "#2d3748" : "#FAF9F6",
    }),
    [isDark]
  );

  return (
    <main
      className={`min-h-screen w-full transition-all duration-300 pt-16 pl-20 ${
        isDark ? "text-gray-200" : "text-gray-800"
      }`}
      style={backgroundStyle}
    >
      <div className="p-4 md:p-6 box-border">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 px-4">
            <h1
              className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
            >
              Due Today
            </h1>
            <p
              className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              {sortedTasks.length} incomplete task
              {sortedTasks.length !== 1 && "s"} due today
            </p>
          </div>

          {isLoading ? (
            <div
              className={`text-center py-10 rounded-xl ${
                isDark
                  ? "bg-black/70 text-gray-300"
                  : "bg-white/90 text-gray-500"
              } shadow-md border-l-4 border-orange-500`}
            >
              <p className="text-lg">Loading today's tasks...</p>
            </div>
          ) : sortedTasks.length === 0 ? (
            <div
              className={`text-center py-16 rounded-xl ${
                isDark
                  ? "bg-black/70 text-gray-300"
                  : "bg-white/90 text-gray-500"
              } shadow-md`}
            >
              <p className="text-lg mb-4">No incomplete tasks due today.</p>
              <p className="text-sm">Everything is done! 🎉</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedTasks.map((task) => (
                <div
                  key={task.id}
                  className={`
                    rounded-xl overflow-hidden
                    shadow-md
                    transition-all duration-200 hover:translate-y-[-2px] hover:shadow-lg
                  `}
                >
                  <TaskCard
                    id={task.id}
                    text={task.text}
                    description={task.description}
                    created_at={new Date(task.created_at)}
                    due_date={
                      task.due_date ? new Date(task.due_date) : undefined
                    }
                    is_completed={task.is_completed}
                    date_completed={
                      task.date_completed
                        ? new Date(task.date_completed)
                        : undefined
                    }
                    is_pinned={task.is_pinned || false}
                    onComplete={handleTaskComplete}
                    onPriorityChange={handleTaskPriority}
                    onTaskUpdate={handleTaskUpdate}
                    collections={allCollections}
                    className={`border-l-4`}
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
