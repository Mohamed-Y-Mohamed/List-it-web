"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Calendar, Check, Pin } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import TaskSidebar from "@/components/popupModels/TasksDetails";
import { Collection } from "@/types/schema";

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
  onTaskUpdate?: (
    taskId: string,
    taskData: {
      text: string;
      description?: string;
      due_date?: Date;
      is_priority: boolean;
    }
  ) => void;
  collections?: Collection[];
  onCollectionChange?: (taskId: string, collectionId: string) => void;
  className?: string;
}

const TaskCard = ({
  id,
  text,
  description,
  date_created,
  due_date,
  is_completed,
  date_completed,
  is_priority,
  onComplete,
  onPriorityChange,
  onTaskUpdate,
  collections,
  onCollectionChange,
  className = "",
}: TaskCardProps) => {
  const [isCompleted, setIsCompleted] = useState(is_completed);
  const [isPriority, setIsPriority] = useState(is_priority);
  const [taskText, setTaskText] = useState(text);
  const [taskDescription, setTaskDescription] = useState(description);
  const [taskDueDate, setTaskDueDate] = useState(due_date);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    setIsCompleted(is_completed);
    setIsPriority(is_priority);
    setTaskText(text);
    setTaskDescription(description);
    setTaskDueDate(due_date);
  }, [is_completed, is_priority, text, description, due_date]);

  const formatDate = useCallback((date: Date) => date.toLocaleDateString(), []);
  const createdDateFormatted = formatDate(date_created);
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
    const newState = !isPriority;
    setIsPriority(newState);
    onPriorityChange?.(id, newState);
  };

  const handleCardClick = () => setIsSidebarOpen(true);
  const handleCloseSidebar = () => setIsSidebarOpen(false);

  const handleTaskUpdate = (
    taskId: string,
    taskData: {
      text: string;
      description?: string;
      due_date?: Date;
      is_priority: boolean;
    }
  ) => {
    setTaskText(taskData.text);
    setTaskDescription(taskData.description);
    setTaskDueDate(taskData.due_date);
    setIsPriority(taskData.is_priority);
    onTaskUpdate?.(taskId, taskData);
  };

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

      <TaskSidebar
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        task={{
          id,
          text: taskText,
          description: taskDescription,
          date_created,
          due_date: taskDueDate,
          is_completed: isCompleted,
          date_completed,
          is_priority: isPriority,
        }}
        onComplete={onComplete}
        onPriorityChange={onPriorityChange}
        onTaskUpdate={handleTaskUpdate}
        collections={collections}
        onCollectionChange={onCollectionChange}
      />
    </>
  );
};

export default TaskCard;
