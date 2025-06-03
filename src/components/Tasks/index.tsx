"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Calendar, Pin, Clock, Star, Folder, ListTodo } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
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
  collection_name?: string | null;
  list_name?: string | null;
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
  collection_name,
  list_name,
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
  const [isHovered, setIsHovered] = useState(false);

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
      return dateObj.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year:
          dateObj.getFullYear() !== new Date().getFullYear()
            ? "numeric"
            : undefined,
      });
    } catch {
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
    } catch {
      return "";
    }
  }, []);

  const dueDateFormatted = taskDueDate ? formatDate(taskDueDate) : null;
  const dueTimeFormatted = taskDueDate ? formatTime(taskDueDate) : null;

  const handlePriorityToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isUpdating) return;
    setIsUpdating(true);

    const newState = !isPinned;
    const previousState = isPinned;
    setIsPinned(newState);

    try {
      const result = await onPriorityChange(id, newState);
      if (!result.success) {
        setIsPinned(previousState);
        console.error("Failed to update priority status:", result.error);
      }
    } catch (error) {
      console.error("Error in priority toggle:", error);
      setIsPinned(previousState);
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

    const previousState = {
      text: taskText,
      description: taskDescription,
      due_date: taskDueDate,
      is_pinned: isPinned,
    };

    setTaskText(taskData.text);
    setTaskDescription(taskData.description);
    setTaskDueDate(taskData.due_date);
    setIsPinned(taskData.is_pinned);

    try {
      const result = await onTaskUpdate(taskId, taskData);
      if (!result.success) {
        setTaskText(previousState.text);
        setTaskDescription(previousState.description);
        setTaskDueDate(previousState.due_date);
        setIsPinned(previousState.is_pinned);
        console.error("Failed to update task:", result.error);
      }
      return result;
    } catch (error) {
      console.error("Error updating task:", error);
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

  //  border color generation
  const getBorderColor = () => {
    if (!collection_id)
      return isDark ? "border-gray-700/50" : "border-gray-300/50";

    const colors = [
      "border-blue-500",
      "border-emerald-500",
      "border-purple-500",
      "border-orange-500",
      "border-pink-500",
      "border-indigo-500",
      "border-teal-500",
      "border-cyan-500",
      "border-amber-500",
      "border-red-500",
    ];

    const charSum = collection_id
      .split("")
      .reduce((sum, char) => sum + char.charCodeAt(0), 0);

    return colors[charSum % colors.length];
  };

  // Get accent color for tags
  const getAccentColor = () => {
    if (!collection_id) return isDark ? "text-orange-400" : "text-orange-500";

    const colors = [
      "text-blue-500",
      "text-emerald-500",
      "text-purple-500",
      "text-orange-500",
      "text-pink-500",
      "text-indigo-500",
      "text-teal-500",
      "text-cyan-500",
      "text-amber-500",
      "text-red-500",
    ];

    const charSum = collection_id
      .split("")
      .reduce((sum, char) => sum + char.charCodeAt(0), 0);

    return colors[charSum % colors.length];
  };

  // Check if task is overdue
  const isOverdue = useMemo(() => {
    if (!dueDateObject || isCompleted) return false;

    // Get current date without time (start of day)
    const today = new Date();
    const currentDateOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    // Get due date without time (start of day)
    const dueDateOnly = new Date(
      dueDateObject.getFullYear(),
      dueDateObject.getMonth(),
      dueDateObject.getDate()
    );

    // Task is overdue only if current date is AFTER the due date (not same day)
    return currentDateOnly > dueDateOnly;
  }, [dueDateObject, isCompleted]);
  // Skip rendering if no valid ID
  if (!id) {
    return null;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className={`rounded-xl border p-5 transition-all duration-300 cursor-pointer overflow-hidden 
          ${className} ${getBorderColor()} 
          ${
            isDark
              ? "bg-gray-800/50 hover:bg-gray-800/70 hover:shadow-xl hover:shadow-gray-900/30"
              : "bg-white/50 hover:bg-white/70 hover:shadow-xl hover:shadow-gray-300/30"
          }
          backdrop-blur-sm relative group`}
        onClick={handleCardClick}
        whileHover={{ y: -2, scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        {/* Subtle glow effect */}
        <div
          className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 
          ${getBorderColor().replace("border-", "bg-").replace("-500", "-500/20")}`}
        />

        <div className="flex flex-col space-y-3 relative z-10">
          {/* Header with completion, title, and pin */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden flex-1">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4
                    className={`font-semibold pl-8 truncate ${
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

                  <AnimatePresence>
                    {isPinned && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`text-xs px-2 py-1 rounded-full font-medium flex items-center ${
                          isDark
                            ? "bg-orange-900/30 text-orange-300 border border-orange-500/30"
                            : "bg-orange-100 text-orange-600 border border-orange-200"
                        }`}
                      >
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        Priority
                      </motion.span>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {isOverdue && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`text-xs px-2 py-1 rounded-full font-medium flex items-center ${
                          isDark
                            ? "bg-red-900/30 text-red-300 border border-red-500/30"
                            : "bg-red-100 text-red-600 border border-red-200"
                        }`}
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        Overdue
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
              onClick={handlePriorityToggle}
              disabled={isUpdating}
              className={`flex-shrink-0 transition-all duration-200 p-2 rounded-lg ${
                isDark
                  ? isPinned
                    ? "text-orange-400 bg-transparent hover:bg-orange-900/50"
                    : "text-gray-500 hover:text-orange-400 hover:bg-gray-700/50"
                  : isPinned
                    ? "text-orange-500 bg-orange-100 hover:bg-orange-200"
                    : "text-gray-400 hover:text-orange-400/50 hover:bg-orange-50"
              } ${isUpdating ? "opacity-50" : ""}`}
              aria-label={isPinned ? "Unpin task" : "Pin task"}
            >
              <Pin
                className={`h-5 w-5 transition-transform duration-200 ${isPinned ? "fill-current text-black" : ""}`}
              />
            </motion.button>
          </div>

          {/* Task description */}
          <AnimatePresence>
            {taskDescription && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className={`pl-9 text-sm break-words ${
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
              </motion.p>
            )}
          </AnimatePresence>

          {/* Collection, List, and Due Date information */}
          <motion.div
            className="flex flex-wrap items-center gap-2 pl-9"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {collection_name && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                className={`flex items-center text-xs px-3 py-1.5 rounded-full transition-all duration-200 ${
                  isDark
                    ? "bg-gray-700/50 hover:bg-gray-700 border border-gray-600/50"
                    : "bg-gray-100/50 hover:bg-gray-200 border border-gray-200/50"
                }`}
              >
                <Folder
                  className={`mr-1.5 h-3 w-3 flex-shrink-0 ${getAccentColor()}`}
                />
                <span className="truncate font-medium">{collection_name}</span>
              </motion.div>
            )}

            {list_name && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                className={`flex items-center text-xs px-3 py-1.5 rounded-full transition-all duration-200 ${
                  isDark
                    ? "bg-gray-700/50 hover:bg-gray-700 border border-gray-600/50"
                    : "bg-gray-100/50 hover:bg-gray-200 border border-gray-200/50"
                }`}
              >
                <ListTodo
                  className={`mr-1.5 h-3 w-3 flex-shrink-0 ${
                    isDark ? "text-emerald-400" : "text-emerald-600"
                  }`}
                />
                <span className="truncate">{list_name}</span>
              </motion.div>
            )}

            {dueDateFormatted && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                className={`flex items-center text-xs px-3 py-1.5 rounded-full transition-all duration-200 ${
                  isOverdue
                    ? isDark
                      ? "bg-red-900/30 hover:bg-red-900/50 border border-red-500/30 text-red-300"
                      : "bg-red-100 hover:bg-red-200 border border-red-200 text-red-600"
                    : isDark
                      ? "bg-gray-700/50 hover:bg-gray-700 border border-gray-600/50"
                      : "bg-gray-100/50 hover:bg-gray-200 border border-gray-200/50"
                }`}
              >
                <Calendar
                  className={`mr-1.5 h-3 w-3 flex-shrink-0 ${
                    isOverdue
                      ? isDark
                        ? "text-red-300"
                        : "text-red-600"
                      : isDark
                        ? "text-purple-400"
                        : "text-purple-600"
                  }`}
                />
                <span className="truncate">
                  {dueDateFormatted}
                  {dueTimeFormatted && ` at ${dueTimeFormatted}`}
                </span>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Hover indicator */}
        <motion.div
          className={`absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
          initial={{ scale: 0 }}
          animate={{ scale: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className={`w-2 h-2 rounded-full ${getBorderColor().replace("border-", "bg-")}`}
          />
        </motion.div>
      </motion.div>

      {/* Task Sidebar */}
      <AnimatePresence>
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
      </AnimatePresence>
    </>
  );
};

export default React.memo(TaskCard);
export { TaskCard as TaskCard };
