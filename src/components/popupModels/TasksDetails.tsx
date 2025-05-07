"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, Check, Calendar, AlertTriangle, Trash2 } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Collection } from "@/types/schema";
import { createPortal } from "react-dom";
import { supabase } from "@/utils/client";

interface TaskSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  task: {
    id: number;
    text: string;
    description?: string | null;
    created_at: Date;
    due_date?: Date | null;
    is_completed: boolean;
    date_completed?: Date | null;
    is_pinned: boolean;
  };
  onComplete: (taskId: number, is_completed: boolean) => void;
  onPriorityChange: (taskId: number, is_pinned: boolean) => void;
  onTaskUpdate?: (
    taskId: number,
    taskData: {
      text: string;
      description?: string | null;
      due_date?: Date | null;
      is_pinned: boolean;
    }
  ) => void;
  collections?: Collection[];
  onCollectionChange?: (taskId: number, collectionId: number) => void;
  onTaskDelete?: (taskId: number) => void;
}

const TaskSidebar = ({
  isOpen,
  onClose,
  task,
  onComplete,
  onPriorityChange,
  onTaskUpdate,
  collections,
  onCollectionChange,
  onTaskDelete,
}: TaskSidebarProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const sidebarRef = useRef<HTMLDivElement>(null);

  const [taskName, setTaskName] = useState(task.text);
  const [taskDescription, setTaskDescription] = useState(
    task.description || ""
  );
  const [isPinned, setIsPinned] = useState(task.is_pinned);
  const [dueDate, setDueDate] = useState(
    task.due_date ? formatDateForInput(task.due_date) : ""
  );
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    number | null
  >(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setTaskName(task.text);
    setTaskDescription(task.description || "");
    setIsPinned(task.is_pinned);
    setDueDate(task.due_date ? formatDateForInput(task.due_date) : "");
  }, [task]);

  function formatDateForInput(date: Date | string | null | undefined): string {
    if (!date) return "";
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return dateObj.toISOString().split("T")[0];
    } catch (error) {
      console.error("Invalid date for input:", date);
      return "";
    }
  }

  // Format date safely for display
  const formatDateForDisplay = (
    date: Date | string | null | undefined
  ): string => {
    if (!date) return "Unknown date";
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return dateObj.toLocaleDateString();
    } catch (error) {
      console.error("Invalid date for display:", date);
      return "Invalid date";
    }
  };

  // Add event listener for escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        if (showDeleteConfirmation) {
          setShowDeleteConfirmation(false);
        } else {
          handleClose();
        }
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden"; // Prevent background scrolling
    }

    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = ""; // Restore scrolling
    };
  }, [isOpen, showDeleteConfirmation]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Close without saving when clicking outside
    if (e.target === e.currentTarget) {
      if (showDeleteConfirmation) {
        setShowDeleteConfirmation(false);
      } else {
        handleClose();
      }
    }
  };

  const handleSave = () => {
    // First, properly parse the date value for comparison
    const oldDueDate = task.due_date
      ? new Date(task.due_date).toISOString().split("T")[0]
      : "";
    const newDueDate = dueDate
      ? new Date(dueDate).toISOString().split("T")[0]
      : "";

    // Check if anything has changed
    const hasChanged =
      taskName !== task.text ||
      taskDescription !== (task.description || "") ||
      isPinned !== task.is_pinned ||
      newDueDate !== oldDueDate; // Compare formatted dates

    if (hasChanged && onTaskUpdate) {
      // Prepare the task data for update
      const updateData = {
        text: taskName,
        description: taskDescription || null, // Use null for the database
        due_date: dueDate ? new Date(dueDate) : null, // Convert to Date object or null
        is_pinned: isPinned,
      };

      // Log what we're sending to make sure the data is correct
      console.log("Updating task with data from sidebar:", updateData);

      // Call the update function with the properly formatted data
      onTaskUpdate(task.id, updateData);
    }

    onClose();
  };

  // With this function:
  const handleTaskDelete = async (taskId: number) => {
    try {
      // Hard delete - completely remove the task from the database
      const { error } = await supabase.from("task").delete().eq("id", taskId);

      if (error) throw error;

      return { success: true };
    } catch (err) {
      console.error("Error deleting task:", err);
      return { success: false, error: err };
    }
  };

  // 2. Then, update the handleConfirmDelete function in TaskSidebar.tsx:

  const handleConfirmDelete = async () => {
    if (isDeleting) return; // Prevent multiple clicks

    setIsDeleting(true);

    try {
      // Hard delete the task from the database
      const { error } = await supabase.from("task").delete().eq("id", task.id);

      if (error) {
        throw error;
      }

      // Call the onTaskDelete callback if provided
      if (onTaskDelete) {
        onTaskDelete(task.id);
      }

      // Close the sidebar
      onClose();
    } catch (error) {
      console.error("Error deleting task:", error);
      // Show an error message to the user (you could add state for this)
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
    }
  };
  // Close without saving when clicking outside
  const handleClose = () => {
    onClose();
  };

  const handlePriorityToggle = () => {
    const newPriority = !isPinned;
    setIsPinned(newPriority);
    // Just update the state, don't close the sidebar
  };

  const handleCollectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const collectionId = parseInt(e.target.value, 10); // Parse string to number
    setSelectedCollectionId(collectionId);
    if (onCollectionChange && !isNaN(collectionId)) {
      onCollectionChange(task.id, collectionId);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirmation(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmation(false);
  };

  const today = new Date().toISOString().split("T")[0];
  const createdDateFormatted = formatDateForDisplay(task.created_at);
  const completedDateFormatted = task.date_completed
    ? formatDateForDisplay(task.date_completed)
    : null;

  if (!isOpen) return null;

  const borderColor = isDark ? "border-gray-700" : "border-gray-200";
  const textColor = isDark ? "text-gray-300" : "text-gray-600";
  const inputBase =
    "w-full p-2 rounded-md border focus:outline-none focus:ring-1";
  const inputStyles = isDark
    ? "bg-gray-700 text-white border-gray-600 focus:border-orange-500 focus:ring-orange-500"
    : "bg-white text-gray-800 border-gray-300 focus:border-blue-500 focus:ring-blue-500";

  // Using React Portal to render the sidebar at the root level of the DOM
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex justify-end backdrop-blur-sm bg-black/30"
      role="dialog"
      aria-modal="true"
      onClick={handleOverlayClick}
    >
      <div
        ref={sidebarRef}
        className={`w-full max-w-md h-full overflow-auto shadow-xl ${
          isDark ? "bg-gray-800 text-white" : "bg-white text-gray-800"
        }`}
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside sidebar from closing it
      >
        <div
          className={`sticky top-0 z-10 flex items-center justify-between p-4 border-b ${borderColor} ${
            isDark ? "bg-gray-800" : "bg-white"
          }`}
        >
          <h2 className="text-lg font-semibold">Edit Task</h2>
          <p
            className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
          >
            Created: {createdDateFormatted}
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              className={`p-2 rounded-full ${
                isDark
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
              aria-label="Save and close"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={handleClose}
              className={`p-2 rounded-full ${
                isDark
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
              aria-label="Close without saving"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-6">
          <div>
            <label
              htmlFor="task-name"
              className={`block text-sm font-medium mb-2 ${textColor}`}
            >
              Task Name
            </label>
            <input
              id="task-name"
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className={`${inputBase} ${inputStyles}`}
            />
          </div>

          <div>
            <label
              htmlFor="task-description"
              className={`block text-sm font-medium mb-2 ${textColor}`}
            >
              Description
            </label>
            <textarea
              id="task-description"
              rows={4}
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              className={`${inputBase} ${inputStyles}`}
            />
          </div>

          <div>
            <label
              htmlFor="due-date"
              className={`block text-sm font-medium mb-2 ${textColor}`}
            >
              Due Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-4 w-4 text-gray-400" />
              </div>
              <input
                id="due-date"
                type="date"
                min={today}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`pl-10 pr-3 py-2 ${inputBase} ${inputStyles}`}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <div className="flex items-center space-x-2 mb-2">
              <button
                onClick={handlePriorityToggle}
                className={`flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-sm border transition-colors ${
                  isDark
                    ? isPinned
                      ? "border-orange-400 bg-orange-500 text-gray-900"
                      : "border-gray-600 bg-gray-700 hover:border-orange-500"
                    : isPinned
                      ? "border-orange-500 bg-orange-500 text-white"
                      : "border-gray-300 bg-white hover:border-orange-500"
                }`}
                aria-label={isPinned ? "Remove priority" : "Mark as priority"}
              >
                {isPinned && <Check className="h-3 w-3" />}
              </button>
              <span className={`${isDark ? "text-gray-300" : "text-gray-700"}`}>
                {isPinned ? "Priority task" : "Mark as priority"}
              </span>
            </div>

            {completedDateFormatted && (
              <p
                className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
              >
                Completed: {completedDateFormatted}
              </p>
            )}
          </div>

          {/* Delete Task Section */}
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleDeleteClick}
              className={`w-full flex items-center justify-center space-x-2 p-3 rounded-md ${
                isDark
                  ? "bg-red-900/30 text-red-300 hover:bg-red-900/50"
                  : "bg-red-50 text-red-600 hover:bg-red-100"
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Task</span>
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirmation && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={handleCancelDelete}
            ></div>
            <div
              className={`relative w-full max-w-sm p-6 rounded-lg shadow-xl ${
                isDark ? "bg-gray-800" : "bg-white"
              }`}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div
                  className={`p-2 rounded-full ${
                    isDark ? "bg-red-900/30" : "bg-red-100"
                  }`}
                >
                  <AlertTriangle
                    className={`w-6 h-6 ${
                      isDark ? "text-red-300" : "text-red-600"
                    }`}
                  />
                </div>
                <h3 className="text-lg font-semibold">Delete Task</h3>
              </div>

              <p className={`mb-6 ${textColor}`}>
                Are you sure you want to delete "{task.text}"? This action
                cannot be undone.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCancelDelete}
                  className={`px-4 py-2 rounded-md ${
                    isDark
                      ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  }`}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className={`px-4 py-2 rounded-md ${
                    isDark
                      ? "bg-red-700 hover:bg-red-600 text-white"
                      : "bg-red-600 hover:bg-red-700 text-white"
                  } ${isDeleting ? "opacity-70 cursor-not-allowed" : ""}`}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default TaskSidebar;
