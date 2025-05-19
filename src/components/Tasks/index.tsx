"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Calendar, Pin } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import TaskSidebar from "@/components/popupModels/TasksDetails";
import { Collection } from "@/types/schema";

interface OperationResult {
  success: boolean;
  error?: unknown;
  data?: unknown;
  warning?: string;
}

interface TaskCardProps {
  id: string;
  text: string | null;
  description?: string | null;
  created_at: Date | string | null;
  due_date?: Date | string | null;
  is_completed: boolean | null;
  date_completed?: Date | string | null;
  is_pinned?: boolean | null;
  collection_id?: string | null;
  list_id?: string | null;
  user_id?: string | null;
  onComplete: (id: string, is_completed: boolean) => Promise<OperationResult>;
  onPriorityChange: (
    id: string,
    is_pinned: boolean
  ) => Promise<OperationResult>;
  onTaskUpdate?: (
    taskId: string,
    taskData: {
      text: string;
      description?: string | null;
      due_date?: Date | null;
      is_pinned: boolean;
    }
  ) => Promise<OperationResult>;
  onTaskDelete?: (taskId: string) => Promise<OperationResult>;
  collections?: Collection[];
  onCollectionChange?: (
    taskId: string,
    collectionId: string
  ) => Promise<OperationResult>;
  className?: string;
}

const TaskCard = ({
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
  onComplete,
  onPriorityChange,
  onTaskUpdate,
  onTaskDelete,
  collections = [],
  onCollectionChange,
  className = "",
}: TaskCardProps) => {
  const [isCompleted, setIsCompleted] = useState<boolean>(!!is_completed);
  const [isPinned, setIsPinned] = useState<boolean>(!!is_pinned);
  const [taskText, setTaskText] = useState<string>(text || "");
  const [taskDescription, setTaskDescription] = useState<
    string | null | undefined
  >(description);
  const [taskDueDate, setTaskDueDate] = useState<
    Date | string | null | undefined
  >(due_date);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Update state when props change
  useEffect(() => {
    setIsCompleted(!!is_completed);
    setIsPinned(!!is_pinned);
    setTaskText(text || "");
    setTaskDescription(description);
    setTaskDueDate(due_date);
  }, [is_completed, is_pinned, text, description, due_date]);

  // Improved date formatting with proper null/undefined handling
  const formatDate = useCallback((date: Date | string | null | undefined) => {
    if (!date) return "No date";
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return dateObj.toLocaleDateString();
    } catch {
      console.error("Invalid date:", date);
      return "Invalid date";
    }
  }, []);

  const dueDateFormatted = taskDueDate
    ? formatDate(taskDueDate)
    : "No due date";

  const handlePriorityToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isUpdating) return;
    setIsUpdating(true);

    const newState = !isPinned;
    const previousState = isPinned;
    setIsPinned(newState);

    try {
      const result = await onPriorityChange(id, newState);
      // If there was an error, revert the state
      if (!result.success) {
        setIsPinned(previousState);
        console.error("Failed to update priority status:", result.error);
      }
    } catch (error) {
      console.error("Error in priority toggle:", error);
      setIsPinned(previousState); // Revert on error
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCardClick = () => setIsSidebarOpen(true);
  const handleCloseSidebar = () => setIsSidebarOpen(false);

  // Handler for task updates from the sidebar
  const handleTaskUpdate = async (
    taskId: string,
    taskData: {
      text: string;
      description?: string | null;
      due_date?: Date | null;
      is_pinned: boolean;
    }
  ): Promise<OperationResult> => {
    if (!onTaskUpdate) {
      return { success: false, error: "Update handler not available" };
    }

    // Store current state for potential rollback
    const previousState = {
      text: taskText,
      description: taskDescription,
      due_date: taskDueDate,
      is_pinned: isPinned,
    };

    // Update UI optimistically
    setTaskText(taskData.text);
    setTaskDescription(taskData.description);
    setTaskDueDate(taskData.due_date);
    setIsPinned(taskData.is_pinned);

    try {
      const result = await onTaskUpdate(taskId, taskData);
      if (!result.success) {
        // Revert to previous state on error
        setTaskText(previousState.text);
        setTaskDescription(previousState.description);
        setTaskDueDate(previousState.due_date);
        setIsPinned(previousState.is_pinned);
        console.error("Failed to update task:", result.error);
      }
      return result;
    } catch (error) {
      console.error("Error updating task:", error);
      // Revert to previous state on error
      setTaskText(previousState.text);
      setTaskDescription(previousState.description);
      setTaskDueDate(previousState.due_date);
      setIsPinned(previousState.is_pinned);
      return { success: false, error };
    }
  };

  // Ensure we have a valid Date object for TaskSidebar
  const getDateObject = (date: Date | string | null | undefined) => {
    if (!date) return null;
    try {
      return date instanceof Date ? date : new Date(date);
    } catch {
      console.error("Invalid date:", date);
      return null;
    }
  };

  const createdAtDate = getDateObject(created_at);
  const dueDateObject = getDateObject(due_date);
  const dateCompletedObject = getDateObject(date_completed);

  // Skip rendering if no valid ID or text
  if (!id) {
    return null;
  }

  return (
    <>
      <div
        className={`rounded-lg border p-4 transition-shadow cursor-pointer max-w-full overflow-hidden ${className} ${
          isDark
            ? "bg-gray-800 border-gray-700 hover:shadow-gray-900/20"
            : "bg-white border-gray-200 hover:shadow-md"
        }`}
        onClick={handleCardClick}
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
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
              {taskText || "Untitled Task"}
            </h4>
          </div>

          <button
            onClick={handlePriorityToggle}
            disabled={isUpdating}
            className={`flex-shrink-0 transition-colors ${
              isDark
                ? isPinned
                  ? "text-white"
                  : "text-gray-500 hover:text-gray-300"
                : isPinned
                  ? "text-black"
                  : "text-gray-400 hover:text-gray-600"
            } ${isUpdating ? "opacity-50" : ""}`}
            aria-label={isPinned ? "Unpin task" : "Pin task"}
          >
            <Pin className={`h-5 w-5 ${isPinned ? "fill-current" : ""}`} />
          </button>
        </div>

        {taskDescription && (
          <p
            className={`mb-2 pl-8 text-sm break-words ${
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

        <div
          className={`flex items-center pl-8 text-xs overflow-hidden ${
            isDark ? "text-gray-500" : "text-gray-500"
          }`}
        >
          <div className="flex items-center overflow-hidden">
            <Calendar className="mr-1 h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              {taskDueDate ? `Due: ${dueDateFormatted}` : "No due date"}
            </span>
          </div>
        </div>
      </div>

      {isSidebarOpen && createdAtDate && (
        <TaskSidebar
          isOpen={isSidebarOpen}
          onClose={handleCloseSidebar}
          task={{
            id,
            text: taskText || "Untitled Task",
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
          onTaskUpdate={handleTaskUpdate}
          onTaskDelete={onTaskDelete}
          collections={collections}
          onCollectionChange={onCollectionChange}
        />
      )}
    </>
  );
};

export default React.memo(TaskCard);
