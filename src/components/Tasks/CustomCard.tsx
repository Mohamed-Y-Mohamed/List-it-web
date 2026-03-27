"use client";

import React, { useState, useEffect } from "react";
import { Check, Pin, ListTodo, Folder, Clock, Star } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import TaskSidebar from "@/components/popupModels/TasksDetails";
import { Collection } from "@/types/schema";
import {
  formatDisplayDate,
  formatDisplayTime,
  toDateObject,
} from "@/utils/dateUtils";
import { getTaskBorderColor, getTaskAccentColor, getTaskBgGlowColor, getTaskBgSolidColor } from "@/utils/taskColorUtils";

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
  ) => Promise<{ success: boolean; error?: unknown }> | void;
  onPriorityChange: (
    id: string,
    is_pinned: boolean
  ) => Promise<{ success: boolean; error?: unknown }> | void;
  onTaskUpdate?: (
    taskId: string,
    taskData: {
      text: string;
      description?: string | null;
      due_date?: Date | null;
      is_pinned: boolean;
    }
  ) => Promise<{ success: boolean; error?: unknown }> | void;
  onTaskDelete?: (
    taskId: string
  ) => Promise<{ success: boolean; error?: unknown }> | void;
  collections?: Collection[];
  onCollectionChange?: (
    taskId: string,
    collectionId: string
  ) => Promise<{ success: boolean; error?: unknown }> | void;
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
  const [isHovered, setIsHovered] = useState(false);

  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    setIsCompleted(!!is_completed);
    setIsPinned(!!is_pinned);
    setTaskText(text || "");
    setTaskDescription(description);
  }, [is_completed, is_pinned, text, description]);

  // Format date for display
  const dueDateFormatted = due_date ? formatDisplayDate(due_date) : null;
  const dueTimeFormatted = due_date ? formatDisplayTime(due_date) : null;

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
  const createdAtDate = toDateObject(created_at);
  const dueDateObject = toDateObject(due_date);
  const dateCompletedObject = toDateObject(date_completed);

  //  border color generation
  const getBorderColor = () => getTaskBorderColor(collection_id, isDark);

  // Get accent color for priority badge
  const getAccentColor = () => getTaskAccentColor(collection_id, isDark);

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
          ${getTaskBgGlowColor(collection_id, isDark)}`}
        />

        <div className="flex flex-col space-y-3 relative z-10">
          {/* Header row with task name and actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden flex-1">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleCompletionToggle}
                disabled={isUpdating}
                className={`flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                  isDark
                    ? isCompleted
                      ? "border-emerald-400 bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                      : "border-gray-600 bg-gray-800/50 hover:border-emerald-500 hover:bg-emerald-500/10"
                    : isCompleted
                      ? "border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                      : "border-gray-300 bg-white hover:border-emerald-500 hover:bg-emerald-50"
                } ${isUpdating ? "opacity-50" : ""}`}
                aria-label={
                  isCompleted ? "Mark as incomplete" : "Mark as complete"
                }
              >
                <AnimatePresence>
                  {isCompleted && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
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
                    ? "text-orange-400 bg-orange-900/30 hover:bg-orange-900/50"
                    : "text-gray-500 hover:text-orange-400 hover:bg-gray-700/50"
                  : isPinned
                    ? "text-orange-500 bg-orange-100 hover:bg-orange-200"
                    : "text-gray-400 hover:text-orange-500 hover:bg-orange-50"
              } ${isUpdating ? "opacity-50" : ""}`}
              aria-label={isPinned ? "Unpin task" : "Pin task"}
            >
              <Pin
                className={`h-4 w-4 transition-transform duration-200 ${isPinned ? "fill-current" : ""}`}
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
                  isDark
                    ? "bg-gray-700/50 hover:bg-gray-700 border border-gray-600/50"
                    : "bg-gray-100/50 hover:bg-gray-200 border border-gray-200/50"
                }`}
              >
                <Clock
                  className={`mr-1.5 h-3 w-3 flex-shrink-0 ${
                    isDark ? "text-purple-400" : "text-purple-600"
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
            className={`w-2 h-2 rounded-full ${getTaskBgSolidColor(collection_id, isDark)}`}
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
      </AnimatePresence>
    </>
  );
};

export default TodayTaskCard;
