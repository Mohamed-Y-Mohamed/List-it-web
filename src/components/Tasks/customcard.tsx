"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Calendar, Check, Pin, ListTodo, Folder, Clock } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import TaskSidebar from "@/components/popupModels/TasksDetails"; // Using the existing TaskSidebar

interface TodayTaskCardProps {
  id: string;
  text: string | null;
  description?: string | null;
  created_at: string | Date | null;
  due_date?: string | Date | null;
  is_completed: boolean | null;
  date_completed?: string | Date | null;
  is_pinned?: boolean | null;
  collection_id?: string | null;
  list_id?: string | null;
  user_id?: string | null;
  collection_name?: string | null;
  list_name?: string | null;
  onComplete: (
    id: string,
    is_completed: boolean
  ) => Promise<{ success: boolean; error?: any }> | void;
  onPriorityChange: (
    id: string,
    is_pinned: boolean
  ) => Promise<{ success: boolean; error?: any }> | void;
  onTaskUpdate?: (
    taskId: string,
    taskData: {
      text: string;
      description?: string | null;
      due_date?: Date | null;
      is_pinned: boolean;
    }
  ) => Promise<{ success: boolean; error?: any }> | void;
  onTaskDelete?: (
    taskId: string
  ) => Promise<{ success: boolean; error?: any }> | void;
  collections?: any[];
  onCollectionChange?: (
    taskId: string,
    collectionId: string
  ) => Promise<{ success: boolean; error?: any }> | void;
  className?: string;
}

const TodayTaskCard = ({
  id,
  text,
  description,
  created_at,
  due_date,
  is_completed,
  date_completed,
  is_pinned = false,
  collection_id,
  list_id,
  user_id,
  collection_name,
  list_name,
  onComplete,
  onPriorityChange,
  onTaskUpdate,
  onTaskDelete,
  collections,
  onCollectionChange,
  className = "",
}: TodayTaskCardProps) => {
  const [isCompleted, setIsCompleted] = useState<boolean>(!!is_completed);
  const [isPinned, setIsPinned] = useState<boolean>(!!is_pinned);
  const [taskText, setTaskText] = useState<string>(text || "");
  const [taskDescription, setTaskDescription] = useState<
    string | null | undefined
  >(description);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    setIsCompleted(!!is_completed);
    setIsPinned(!!is_pinned);
    setTaskText(text || "");
    setTaskDescription(description);
  }, [is_completed, is_pinned, text, description]);

  // Format date for display
  const formatDate = useCallback((date: Date | string | null | undefined) => {
    if (!date) return "No date";
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return dateObj.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year:
          dateObj.getFullYear() !== new Date().getFullYear()
            ? "numeric"
            : undefined,
      });
    } catch (error) {
      console.error("Invalid date:", date);
      return "Invalid date";
    }
  }, []);

  // Format time for display
  const formatTime = useCallback((date: Date | string | null | undefined) => {
    if (!date) return "";
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return dateObj.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Invalid time:", date);
      return "";
    }
  }, []);

  const createdDateFormatted = formatDate(created_at);
  const dueDateFormatted = due_date ? formatDate(due_date) : null;
  const dueTimeFormatted = due_date ? formatTime(due_date) : null;

  const handleCompletionToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isUpdating) return;
    setIsUpdating(true);

    const newState = !isCompleted;
    setIsCompleted(newState);

    if (onComplete) {
      try {
        const result = await onComplete(id, newState);
        // If there was an error, revert the state
        if (result && !result.success) {
          setIsCompleted(!newState);
          console.error("Failed to update completion status:", result.error);
        }
      } catch (error) {
        console.error("Error in completion toggle:", error);
        setIsCompleted(!newState); // Revert on error
      } finally {
        setIsUpdating(false);
      }
    } else {
      setIsUpdating(false);
    }
  };

  const handlePriorityToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isUpdating) return;
    setIsUpdating(true);

    const newState = !isPinned;
    setIsPinned(newState);

    if (onPriorityChange) {
      try {
        const result = await onPriorityChange(id, newState);
        // If there was an error, revert the state
        if (result && !result.success) {
          setIsPinned(!newState);
          console.error("Failed to update priority status:", result.error);
        }
      } catch (error) {
        console.error("Error in priority toggle:", error);
        setIsPinned(!newState); // Revert on error
      } finally {
        setIsUpdating(false);
      }
    } else {
      setIsUpdating(false);
    }
  };

  const handleCardClick = () => {
    setIsSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Ensure we have a valid Date object for TaskSidebar
  const getDateObject = (date: Date | string | null | undefined) => {
    if (!date) return null;
    try {
      return date instanceof Date ? date : new Date(date);
    } catch (error) {
      console.error("Invalid date:", date);
      return null;
    }
  };

  const createdAtDate = getDateObject(created_at);
  const dueDateObject = getDateObject(due_date);
  const dateCompletedObject = getDateObject(date_completed);

  // Generate a border color based on collection_id if available
  const getBorderColor = () => {
    if (!collection_id) return isDark ? "border-gray-700" : "border-gray-300";

    // Predefined colors
    const predefinedColors = [
      "border-blue-500",
      "border-green-500",
      "border-yellow-500",
      "border-purple-500",
      "border-pink-500",
      "border-indigo-500",
      "border-red-500",
      "border-orange-500",
      "border-teal-500",
      "border-cyan-500",
    ];

    // Use the sum of character codes to select a color
    const charSum = collection_id
      .split("")
      .reduce((sum, char) => sum + char.charCodeAt(0), 0);

    const colorIndex = charSum % predefinedColors.length;
    return predefinedColors[colorIndex];
  };

  return (
    <>
      <div
        className={`rounded-xl border p-4 transition-all duration-300 cursor-pointer overflow-hidden ${className} ${getBorderColor()} ${
          isDark
            ? "bg-gray-800 hover:shadow-lg hover:shadow-gray-900/30"
            : "bg-white hover:shadow-lg hover:shadow-gray-300/70"
        }`}
        onClick={handleCardClick}
      >
        <div className="flex flex-col space-y-2">
          {/* Header row with task name and pin button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden">
              <button
                onClick={handleCompletionToggle}
                disabled={isUpdating}
                className={`flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${
                  isDark
                    ? isCompleted
                      ? "border-green-400 bg-green-500 text-gray-900"
                      : "border-gray-600 bg-gray-700 hover:border-green-500"
                    : isCompleted
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-gray-300 bg-white hover:border-green-500"
                } ${isUpdating ? "opacity-50" : ""}`}
                aria-label={
                  isCompleted ? "Mark as incomplete" : "Mark as complete"
                }
              >
                {isCompleted && <Check className="h-3 w-3" />}
              </button>

              <h4
                className={`font-semibold truncate ${
                  isDark
                    ? isCompleted
                      ? "text-gray-400 line-through"
                      : "text-gray-100"
                    : isCompleted
                      ? "text-gray-500 line-through"
                      : "text-gray-800"
                }`}
              >
                {taskText || "Unnamed Task"}
              </h4>

              {isPinned && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    isDark
                      ? "bg-orange-900/50 text-orange-300"
                      : "bg-orange-100 text-orange-600"
                  }`}
                >
                  Priority
                </span>
              )}
            </div>

            <button
              onClick={handlePriorityToggle}
              disabled={isUpdating}
              className={`flex-shrink-0 transition-colors p-1 rounded-full ${
                isDark
                  ? isPinned
                    ? "text-orange-400 bg-orange-900/30"
                    : "text-gray-500 hover:text-gray-300 hover:bg-gray-700"
                  : isPinned
                    ? "text-orange-500 bg-orange-100"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              } ${isUpdating ? "opacity-50" : ""}`}
              aria-label={isPinned ? "Unpin task" : "Pin task"}
            >
              <Pin className={`h-4 w-4 ${isPinned ? "fill-current" : ""}`} />
            </button>
          </div>

          {/* Task description */}
          {taskDescription && (
            <p
              className={`pl-8 text-sm break-words ${
                isDark
                  ? isCompleted
                    ? "text-gray-500 line-through"
                    : "text-gray-400"
                  : isCompleted
                    ? "text-gray-400 line-through"
                    : "text-gray-600"
              }`}
            >
              {taskDescription}
            </p>
          )}

          {/* Collection and List information row */}
          <div className="flex flex-wrap items-center gap-2 pl-8 mt-1">
            {collection_name && (
              <div
                className={`flex items-center text-xs px-2 py-1 rounded-full ${
                  isDark ? "bg-gray-700" : "bg-gray-100"
                }`}
              >
                <Folder
                  className={`mr-1 h-3 w-3 flex-shrink-0 ${
                    isDark ? "text-blue-400" : "text-blue-600"
                  }`}
                />
                <span className="truncate font-medium">{collection_name}</span>
              </div>
            )}

            {list_name && (
              <div
                className={`flex items-center text-xs px-2 py-1 rounded-full ${
                  isDark ? "bg-gray-700" : "bg-gray-100"
                }`}
              >
                <ListTodo
                  className={`mr-1 h-3 w-3 flex-shrink-0 ${
                    isDark ? "text-green-400" : "text-green-600"
                  }`}
                />
                <span className="truncate">{list_name}</span>
              </div>
            )}

            {dueDateFormatted && (
              <div
                className={`flex items-center text-xs px-2 py-1 rounded-full ${
                  isDark ? "bg-gray-700" : "bg-gray-100"
                }`}
              >
                <Clock
                  className={`mr-1 h-3 w-3 flex-shrink-0 ${
                    isDark ? "text-purple-400" : "text-purple-600"
                  }`}
                />
                <span className="truncate">
                  {dueDateFormatted}{" "}
                  {dueTimeFormatted && `at ${dueTimeFormatted}`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Sidebar */}
      {isSidebarOpen && createdAtDate && (
        <TaskSidebar
          isOpen={isSidebarOpen}
          onClose={handleCloseSidebar}
          task={{
            id,
            text: taskText,
            description: taskDescription,
            created_at: createdAtDate,
            due_date: dueDateObject,
            is_completed: isCompleted,
            date_completed: dateCompletedObject,
            is_pinned: isPinned,
            collection_id,
            list_id,
            user_id,
          }}
          onComplete={onComplete}
          onPriorityChange={onPriorityChange}
          onTaskUpdate={onTaskUpdate}
          onTaskDelete={onTaskDelete}
          collections={collections}
          onCollectionChange={onCollectionChange}
        />
      )}
    </>
  );
};

export default TodayTaskCard;
