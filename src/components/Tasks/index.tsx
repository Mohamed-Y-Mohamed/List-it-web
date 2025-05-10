"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Calendar, Check, Pin } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import TaskSidebar from "@/components/popupModels/TasksDetails";
import { Collection } from "@/types/schema";

interface TaskCardProps {
  id: string; // Changed from number to string
  text: string | null;
  description?: string | null;
  created_at: Date | string | null;
  due_date?: Date | string | null;
  is_completed: boolean | null;
  date_completed?: Date | string | null;
  is_pinned?: boolean | null;
  collection_id?: string | null; // Added for context
  list_id?: string | null; // Added for context
  user_id?: string | null; // Added for context
  onComplete: (id: string, is_completed: boolean) => void; // Changed from number to string
  onPriorityChange: (id: string, is_pinned: boolean) => void; // Changed from number to string
  onTaskUpdate?: (
    taskId: string, // Changed from number to string
    taskData: {
      text: string;
      description?: string | null;
      due_date?: Date | null;
      is_pinned: boolean;
    }
  ) => void;
  onTaskDelete?: (taskId: string) => void; // Changed from number to string
  collections?: Collection[];
  onCollectionChange?: (taskId: string, collectionId: string) => void; // Changed from number to string
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
  collections,
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

  const { theme } = useTheme();
  const isDark = theme === "dark";

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
    } catch (error) {
      console.error("Invalid date:", date);
      return "Invalid date";
    }
  }, []);

  const createdDateFormatted = formatDate(created_at);
  const dueDateFormatted = taskDueDate
    ? formatDate(taskDueDate)
    : "No due date";

  const handleCompletionToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = !isCompleted;
    setIsCompleted(newState);
    onComplete?.(id, newState);
  };

  const handlePriorityToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = !isPinned;
    setIsPinned(newState);
    onPriorityChange?.(id, newState);
  };

  const handleCardClick = () => setIsSidebarOpen(true);
  const handleCloseSidebar = () => setIsSidebarOpen(false);

  const handleTaskUpdate = (
    taskId: string,
    taskData: {
      text: string;
      description?: string | null;
      due_date?: Date | null;
      is_pinned: boolean;
    }
  ) => {
    setTaskText(taskData.text);
    setTaskDescription(taskData.description);
    setTaskDueDate(taskData.due_date);
    setIsPinned(taskData.is_pinned);
    onTaskUpdate?.(taskId, taskData);
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

  // Portal container for the sidebar
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null
  );

  useEffect(() => {
    // Create or find portal container
    let container = document.getElementById("sidebar-portal-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "sidebar-portal-container";
      document.body.appendChild(container);
    }
    setPortalContainer(container);

    // Clean up
    return () => {
      if (
        document.getElementById("sidebar-portal-container") &&
        !document.getElementById("sidebar-portal-container")?.hasChildNodes()
      ) {
        document.getElementById("sidebar-portal-container")?.remove();
      }
    };
  }, []);

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
            <button
              onClick={handleCompletionToggle}
              className={`flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-sm border transition-colors ${
                isDark
                  ? isCompleted
                    ? "border-orange-400 bg-orange-500 text-gray-900"
                    : "border-gray-600 bg-gray-700 hover:border-orange-500"
                  : isCompleted
                    ? "border-green-500 bg-green-500 text-white"
                    : "border-gray-300 bg-white hover:border-green-500"
              }`}
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
              {taskText}
            </h4>
          </div>

          <button
            onClick={handlePriorityToggle}
            className={`flex-shrink-0 transition-colors ${
              isDark
                ? isPinned
                  ? "text-orange-400"
                  : "text-gray-500 hover:text-gray-300"
                : isPinned
                  ? "text-orange-500"
                  : "text-gray-400 hover:text-gray-600"
            }`}
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
              Created: {createdDateFormatted}
              {taskDueDate && ` | Due: ${dueDateFormatted}`}
            </span>
          </div>
        </div>
      </div>

      {isSidebarOpen && portalContainer && createdAtDate && (
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
          onTaskUpdate={handleTaskUpdate}
          onTaskDelete={onTaskDelete}
          collections={collections}
          onCollectionChange={onCollectionChange}
        />
      )}
    </>
  );
};

export default TaskCard;
