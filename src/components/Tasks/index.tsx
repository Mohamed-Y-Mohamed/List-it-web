"use client";

import React, { useState } from "react";
import { Calendar, Check, Pin } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface TaskCardProps {
  id: string;
  text: string;
  description?: string;
  date_created: Date;
  due_date?: Date;
  is_completed: boolean;
  date_completed?: Date;
  is_priority: boolean;
  onComplete: (id: string, is_completed: boolean) => void;
  onPriorityChange: (id: string, is_priority: boolean) => void;
  className?: string;
}

const TaskCard = ({
  id,
  text,
  description,
  date_created,
  due_date,
  is_completed: initialIsCompleted = false,
  date_completed,
  is_priority: initialIsPriority = false,
  className = "",
  onComplete,
  onPriorityChange,
}: TaskCardProps) => {
  // Use local state to allow for immediate UI feedback
  const [isCompleted, setIsCompleted] = useState(initialIsCompleted);
  const [isPriority, setIsPriority] = useState(initialIsPriority);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Format dates for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  const createdDateFormatted = formatDate(date_created);
  const dueDateFormatted = due_date ? formatDate(due_date) : "No due date";

  // Handle click on completion circle
  const handleCompletionToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newCompletionState = !isCompleted;
    setIsCompleted(newCompletionState);

    // Call the parent component's callback if provided
    if (onComplete) {
      onComplete(id, newCompletionState);
    }
  };

  // Handle priority toggle (pin icon click)
  const handlePriorityToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newPriorityState = !isPriority;
    setIsPriority(newPriorityState);

    // Call the parent component's callback if provided
    if (onPriorityChange) {
      onPriorityChange(id, newPriorityState);
    }
  };

  return (
    <div
      className={`rounded-lg border ${
        isDark
          ? "bg-gray-800 border-gray-700 hover:shadow-gray-900/20"
          : "bg-white border-gray-200 hover:shadow-md"
      } p-4 transition-shadow ${className} cursor-pointer max-w-full overflow-hidden`}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center space-x-3 overflow-hidden">
          {/* Clickable completion circle */}
          <button
            onClick={handleCompletionToggle}
            className={`flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${
              isDark
                ? isCompleted
                  ? "border-orange-400 bg-orange-500 text-gray-900"
                  : "border-gray-600 bg-gray-700 hover:border-orange-500"
                : isCompleted
                ? "border-green-500 bg-green-500 text-white"
                : "border-gray-300 bg-white hover:border-green-500"
            }`}
            aria-label={isCompleted ? "Mark as incomplete" : "Mark as complete"}
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
            {text}
          </h4>
        </div>

        {/* Pin button for priority */}
        <button
          onClick={handlePriorityToggle}
          className={`flex-shrink-0 transition-colors ${
            isDark
              ? isPriority
                ? "text-orange-400"
                : "text-gray-500 hover:text-gray-300"
              : isPriority
              ? "text-orange-500"
              : "text-gray-400 hover:text-gray-600"
          }`}
          aria-label={isPriority ? "Unpin task" : "Pin task"}
        >
          <Pin className={`h-5 w-5 ${isPriority ? "fill-current" : ""}`} />
        </button>
      </div>

      {description && (
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
          {description}
        </p>
      )}

      <div
        className={`flex items-center pl-8 text-xs ${
          isDark ? "text-gray-500" : "text-gray-500"
        } overflow-hidden`}
      >
        <div className="flex items-center overflow-hidden">
          <Calendar className="mr-1 h-4 w-4 flex-shrink-0" />
          <span className="truncate">
            Created: {createdDateFormatted}{" "}
            {due_date && `| Due: ${dueDateFormatted}`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
