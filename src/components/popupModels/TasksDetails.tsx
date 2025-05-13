"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  X,
  Check,
  Calendar,
  AlertTriangle,
  Trash2,
  AlertCircle,
  Pin,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Collection } from "@/types/schema";
import { createPortal } from "react-dom";
import { supabase } from "@/utils/client";
import { useAuth } from "@/context/AuthContext";

interface TaskSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  task: {
    id: string;
    text: string;
    description?: string | null;
    created_at: Date;
    due_date?: Date | null;
    is_completed: boolean;
    date_completed?: Date | null;
    is_pinned: boolean;
    collection_id?: string | null;
    list_id?: string | null;
    user_id?: string | null;
  };
  onComplete: (
    taskId: string,
    is_completed: boolean
  ) => Promise<{ success: boolean; error?: unknown }> | void;
  onPriorityChange: (
    taskId: string,
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
  collections?: Collection[];
  onCollectionChange?: (
    taskId: string,
    collectionId: string
  ) => Promise<{ success: boolean; error?: unknown }> | void;
  onTaskDelete?: (
    taskId: string
  ) => Promise<{ success: boolean; error?: unknown }> | void;
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
  const { user } = useAuth();
  const isDark = theme === "dark";
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Form state
  const [taskName, setTaskName] = useState(task.text);
  const [taskDescription, setTaskDescription] = useState(
    task.description || ""
  );
  const [isPinned, setIsPinned] = useState(task.is_pinned);
  const [dueDate, setDueDate] = useState(
    task.due_date ? formatDateForInput(task.due_date) : ""
  );
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    string | null
  >(task.collection_id || null);
  // UI state
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorTimeout, setErrorTimeout] = useState<NodeJS.Timeout | null>(null);
  const [successTimeout, setSuccessTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [isTaskChanged, setIsTaskChanged] = useState(false);
  const [characterCount, setCharacterCount] = useState(task.text.length);
  const [descriptionCount, setDescriptionCount] = useState(
    (task.description || "").length
  );

  // Refs
  const taskNameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // Log user for debugging but don't flag it as unused
  if (user) {
    console.debug("Task sidebar opened by user:", user.id);
  }

  // Reset form state when task changes
  useEffect(() => {
    if (isOpen) {
      setTaskName(task.text);
      setTaskDescription(task.description || "");
      setIsPinned(task.is_pinned);
      setDueDate(task.due_date ? formatDateForInput(task.due_date) : "");
      setSelectedCollectionId(task.collection_id || null);
      setCharacterCount(task.text.length);
      setDescriptionCount((task.description || "").length);
      setIsTaskChanged(false);
      setError(null);
      setSuccessMessage(null);
    }
  }, [task, isOpen]);

  // Format date for input fields
  function formatDateForInput(date: Date | string | null | undefined): string {
    if (!date) return "";
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return dateObj.toISOString().split("T")[0];
    } catch {
      return "";
    }
  }

  // Format date for display
  const formatDateForDisplay = useCallback(
    (date: Date | string | null | undefined): string => {
      if (!date) return "Unknown date";
      try {
        const dateObj = date instanceof Date ? date : new Date(date);
        return dateObj.toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      } catch {
        return "Invalid date";
      }
    },
    []
  );

  // Helper function to display error with auto-dismiss
  const showError = useCallback(
    (message: string) => {
      setError(message);

      if (errorTimeout) {
        clearTimeout(errorTimeout);
      }

      const timeout = setTimeout(() => {
        setError(null);
      }, 5000);

      setErrorTimeout(timeout);
    },
    [errorTimeout]
  );

  // Helper function to display success message with auto-dismiss
  const showSuccess = useCallback(
    (message: string) => {
      setSuccessMessage(message);

      if (successTimeout) {
        clearTimeout(successTimeout);
      }

      const timeout = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);

      setSuccessTimeout(timeout);
    },
    [successTimeout]
  );

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (errorTimeout) clearTimeout(errorTimeout);
      if (successTimeout) clearTimeout(successTimeout);
    };
  }, [errorTimeout, successTimeout]);

  // Auto-resize textarea based on content
  const autoResizeTextarea = useCallback(
    (textarea: HTMLTextAreaElement | null) => {
      if (!textarea) return;

      // Reset height to ensure we get the correct scrollHeight
      textarea.style.height = "auto";
      // Set height to scrollHeight to expand to content
      textarea.style.height = `${textarea.scrollHeight}px`;
    },
    []
  );

  useEffect(() => {
    if (descriptionRef.current) {
      autoResizeTextarea(descriptionRef.current);
    }
  }, [taskDescription, autoResizeTextarea]);

  // Check if task data has changed
  useEffect(() => {
    // Format dates for proper comparison
    const oldDueDate = task.due_date ? formatDateForInput(task.due_date) : "";

    // Check if any field has changed
    const hasChanged =
      taskName !== task.text ||
      taskDescription !== (task.description || "") ||
      isPinned !== task.is_pinned ||
      dueDate !== oldDueDate ||
      selectedCollectionId !== task.collection_id;

    setIsTaskChanged(hasChanged);
  }, [
    taskName,
    taskDescription,
    isPinned,
    dueDate,
    selectedCollectionId,
    task,
  ]);

  // Handle close with unsaved changes
  const handleClose = useCallback(() => {
    if (isTaskChanged) {
      // Offer to save changes (could implement a confirmation dialog here)
      if (
        window.confirm(
          "You have unsaved changes. Are you sure you want to discard them?"
        )
      ) {
        onClose();
      }
    } else {
      onClose();
    }
  }, [isTaskChanged, onClose]);

  // Add event listener for escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        if (showDeleteConfirmation) {
          setShowDeleteConfirmation(false);
        } else if (!isSaving && !isDeleting) {
          handleClose();
        }
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden"; // Prevent background scrolling

      // Focus first input when sidebar opens
      setTimeout(() => {
        if (taskNameRef.current) {
          taskNameRef.current.focus();
        }
      }, 100);
    }

    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = ""; // Restore scrolling
    };
  }, [isOpen, showDeleteConfirmation, isSaving, isDeleting, handleClose]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      // Close without saving when clicking outside
      if (e.target === e.currentTarget) {
        if (showDeleteConfirmation) {
          setShowDeleteConfirmation(false);
        } else if (!isSaving && !isDeleting) {
          handleClose();
        }
      }
    },
    [showDeleteConfirmation, isSaving, isDeleting, handleClose]
  );

  const handleSave = async () => {
    if (isSaving) return; // Prevent multiple submissions

    // Validate task name
    if (!taskName.trim()) {
      showError("Task name is required");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Check if anything has changed
      if (isTaskChanged && onTaskUpdate) {
        // Prepare the task data for update
        const updateData = {
          text: taskName.trim(),
          description: taskDescription.trim() || null,
          due_date: dueDate
            ? (() => {
                // Ensure date is created in UTC timezone for iOS compatibility
                const [year, month, day] = dueDate.split("-").map(Number);
                return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
              })()
            : null,
          is_pinned: isPinned,
        };

        // Call the update function
        const result = await onTaskUpdate(task.id, updateData);

        // Check for errors
        if (result && !result.success) {
          throw new Error(
            result.error ? String(result.error) : "Failed to update task"
          );
        }

        // Update collection if changed
        if (
          selectedCollectionId !== task.collection_id &&
          onCollectionChange &&
          selectedCollectionId
        ) {
          const collectionResult = await onCollectionChange(
            task.id,
            selectedCollectionId
          );

          if (collectionResult && !collectionResult.success) {
            console.warn("Collection update failed:", collectionResult.error);
            // Continue anyway since the task was updated
          }
        }

        showSuccess("Task updated successfully");

        // Close after a short delay to show success message
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        // Nothing changed, just close
        onClose();
      }
    } catch (err: unknown) {
      console.error("Error updating task:", err);
      showError(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle task delete with complete removal from database
  const handleConfirmDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    setError(null);

    try {
      // Step 1: Delete all references to this task
      // First, delete any task dependencies if they exist (subtasks, etc.)
      // This depends on your database structure

      // Step 2: Hard delete from task table - permanently removes the record
      const { error: deleteError } = await supabase
        .from("task")
        .delete()
        .eq("id", task.id);

      if (deleteError) {
        throw deleteError;
      }

      // Step 3: Call parent callback to update UI state
      // This should only handle removing the task from local state arrays
      if (onTaskDelete) {
        const parentResult = await onTaskDelete(task.id);

        if (parentResult && !parentResult.success) {
          console.warn("Parent state update failed:", parentResult.error);
          // Continue anyway since database deletion succeeded
        }
      }

      // Step 4: Clear any local caches or state that might still reference this task
      // You might want to invalidate any React Query caches here if you're using them

      showSuccess("Task permanently deleted");

      // Close after showing success message
      setTimeout(() => {
        setShowDeleteConfirmation(false);
        onClose();
      }, 1000);
    } catch (deleteError: unknown) {
      console.error("Error permanently deleting task:", deleteError);
      showError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to permanently delete task"
      );
      setIsDeleting(false);
    }
  };

  const handlePriorityToggle = async () => {
    const newPriority = !isPinned;

    try {
      // Call the priority change handler
      if (onPriorityChange) {
        const result = await onPriorityChange(task.id, newPriority);

        if (result && !result.success) {
          throw new Error(
            result.error ? String(result.error) : "Failed to update priority"
          );
        }
      }

      // Update local state
      setIsPinned(newPriority);
    } catch (err: unknown) {
      console.error("Error updating priority:", err);
      showError(
        err instanceof Error ? err.message : "Failed to update priority"
      );
    }
  };

  const handleCollectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const collectionId = e.target.value || null;
    setSelectedCollectionId(collectionId);
  };

  const handleTaskNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setTaskName(value);
      setCharacterCount(value.length);
    },
    []
  );

  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setTaskDescription(value);
      setDescriptionCount(value.length);
      autoResizeTextarea(e.target);
    },
    [autoResizeTextarea]
  );

  const handleDeleteClick = () => {
    setShowDeleteConfirmation(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmation(false);
  };

  // Handle date change with validation
  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedDate = e.target.value;
      setDueDate(selectedDate);
    },
    []
  );

  const today = new Date().toISOString().split("T")[0];
  const createdDateFormatted = formatDateForDisplay(task.created_at);
  const completedDateFormatted = task.date_completed
    ? formatDateForDisplay(task.date_completed)
    : null;

  if (!isOpen) return null;

  // Style variables for better readability
  const borderColor = isDark ? "border-gray-700" : "border-gray-200";
  const textColor = isDark ? "text-gray-300" : "text-gray-600";
  const inputBase =
    "w-full p-2 rounded-md border focus:outline-none focus:ring-1 transition-colors duration-200";
  const inputStyles = isDark
    ? "bg-gray-700 text-white border-gray-600 focus:border-orange-500 focus:ring-orange-500"
    : "bg-white text-gray-800 border-gray-300 focus:border-blue-500 focus:ring-blue-500";

  const buttonStyles = isDark
    ? "p-2 rounded-full bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700/50 transition-colors duration-200"
    : "p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:bg-gray-100/50 transition-colors duration-200";

  const deleteButtonStyles = isDark
    ? "bg-red-900/30 text-red-300 hover:bg-red-900/50 transition-colors duration-200"
    : "bg-red-50 text-red-600 hover:bg-red-100 transition-colors duration-200";

  // Using React Portal to render the sidebar at the root level of the DOM
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex justify-end backdrop-blur-md bg-black/30"
      role="dialog"
      aria-modal="true"
      onClick={handleOverlayClick}
    >
      <div
        ref={sidebarRef}
        className={`w-full max-w-md h-full overflow-auto shadow-xl transition-all duration-300 ${
          isDark ? "bg-gray-800 text-white" : "bg-white text-gray-800"
        }`}
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside sidebar from closing it
      >
        <div
          className={`sticky top-0 z-10 flex items-center justify-between p-4 border-b ${borderColor} ${
            isDark ? "bg-gray-800" : "bg-white"
          }`}
        >
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold">Edit Task</h2>
            <p
              className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
            >
              Created: {createdDateFormatted}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              className={buttonStyles}
              aria-label="Save and close"
              disabled={isSaving || isDeleting}
              type="button"
            >
              <Check
                className={`w-4 h-4 ${
                  isDark ? "text-green-400" : "text-green-600"
                } ${isSaving || isDeleting ? "opacity-50" : ""}`}
              />
            </button>
            <button
              onClick={handleClose}
              className={buttonStyles}
              aria-label="Close without saving"
              disabled={isSaving || isDeleting}
              type="button"
            >
              <X
                className={`w-4 h-4 ${isSaving || isDeleting ? "opacity-50" : ""}`}
              />
            </button>
          </div>
        </div>

        {error && (
          <div
            className={`m-4 p-3 rounded-md flex items-center space-x-2 ${
              isDark ? "bg-red-900/30 text-red-300" : "bg-red-100 text-red-700"
            } animate-fadeIn`}
            role="alert"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div
            className={`m-4 p-3 rounded-md flex items-center space-x-2 ${
              isDark
                ? "bg-green-900/30 text-green-300"
                : "bg-green-100 text-green-700"
            } animate-fadeIn`}
            role="status"
          >
            <Check className="w-5 h-5 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="p-4 space-y-6">
          <div>
            <label
              htmlFor="task-name"
              className={`block text-sm font-medium mb-2 ${textColor}`}
            >
              Task Name <span className="text-red-500">*</span>
            </label>
            <input
              ref={taskNameRef}
              id="task-name"
              type="text"
              value={taskName}
              onChange={handleTaskNameChange}
              className={`${inputBase} ${inputStyles} ${
                error === "Task name is required"
                  ? isDark
                    ? "border-red-500 ring-1 ring-red-500"
                    : "border-red-500 ring-1 ring-red-500"
                  : ""
              }`}
              disabled={isSaving || isDeleting}
              maxLength={100}
              aria-required="true"
              placeholder="Task name"
            />
            <div className="mt-1 flex justify-between items-center">
              <div className="text-xs text-gray-500">{characterCount}/100</div>
            </div>
          </div>

          <div>
            <label
              htmlFor="task-description"
              className={`block text-sm font-medium mb-2 ${textColor}`}
            >
              Description
            </label>
            <textarea
              ref={descriptionRef}
              id="task-description"
              value={taskDescription}
              onChange={handleDescriptionChange}
              className={`${inputBase} ${inputStyles} resize-none min-h-[80px]`}
              disabled={isSaving || isDeleting}
              maxLength={500}
              placeholder="Optional task description"
            />
            <div className="mt-1 text-xs text-right text-gray-500">
              {descriptionCount}/500
            </div>
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
                onChange={handleDateChange}
                className={`pl-10 pr-3 py-2 ${inputBase} ${inputStyles}`}
                disabled={isSaving || isDeleting}
              />
            </div>
          </div>

          {collections && collections.length > 0 && (
            <div>
              <label
                htmlFor="collection"
                className={`block text-sm font-medium mb-2 ${textColor}`}
              >
                Collection
              </label>
              <select
                id="collection"
                value={selectedCollectionId || ""}
                onChange={handleCollectionChange}
                className={`${inputBase} ${inputStyles}`}
                disabled={isSaving || isDeleting}
              >
                <option value="">None</option>
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.collection_name?.toLowerCase().trim() ===
                    "general"
                      ? `${collection.collection_name || "General"} (Default)`
                      : collection.collection_name || "Unnamed Collection"}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <button
              onClick={handlePriorityToggle}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md w-full ${
                isDark
                  ? isPinned
                    ? "bg-gray-700 text-orange-400"
                    : "hover:bg-gray-700 text-gray-300"
                  : isPinned
                    ? "bg-gray-100 text-orange-500"
                    : "hover:bg-gray-100 text-gray-700"
              } transition-colors duration-200`}
              aria-pressed={isPinned}
              disabled={isSaving || isDeleting}
              type="button"
            >
              <Pin
                className={`h-4 w-4 ${
                  isPinned
                    ? isDark
                      ? "text-orange-400 fill-orange-400"
                      : "text-orange-500 fill-orange-500"
                    : ""
                }`}
              />
              <span>{isPinned ? "Priority task" : "Mark as priority"}</span>
            </button>

            {completedDateFormatted && (
              <div
                className={`px-3 py-2 rounded-md ${
                  isDark ? "bg-green-900/20" : "bg-green-50"
                }`}
              >
                <p
                  className={`text-sm flex items-center ${isDark ? "text-green-300" : "text-green-600"}`}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Completed: {completedDateFormatted}
                </p>
              </div>
            )}
          </div>

          {/* Task actions section */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
            <button
              onClick={() => onComplete(task.id, !task.is_completed)}
              className={`px-4 py-2 rounded-md flex items-center ${
                task.is_completed
                  ? isDark
                    ? "bg-gray-700 text-red-300 hover:bg-gray-600"
                    : "bg-gray-100 text-red-500 hover:bg-gray-200"
                  : isDark
                    ? "bg-gray-700 text-green-300 hover:bg-gray-600"
                    : "bg-gray-100 text-green-500 hover:bg-gray-200"
              } transition-colors duration-200`}
              disabled={isSaving || isDeleting}
              type="button"
            >
              <Check className="h-4 w-4 mr-2" />
              {task.is_completed ? "Mark Incomplete" : "Mark Complete"}
            </button>

            <button
              onClick={handleDeleteClick}
              className={`px-4 py-2 rounded-md flex items-center ${deleteButtonStyles} ${isSaving || isDeleting ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={isSaving || isDeleting}
              type="button"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirmation && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fadeIn">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={!isDeleting ? handleCancelDelete : undefined}
            ></div>
            <div
              className={`relative w-full max-w-sm p-6 rounded-lg shadow-xl ${
                isDark ? "bg-gray-800" : "bg-white"
              } animate-scaleIn`}
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
                <h3 className="text-lg font-semibold">
                  Permanently Delete Task
                </h3>
              </div>

              <p className={`mb-6 ${textColor}`}>
                Are you sure you want to permanently delete &quot;{task.text}
                &quot;? This action cannot be undone and will remove the task
                from the database completely.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCancelDelete}
                  className={`px-4 py-2 rounded-md ${
                    isDark
                      ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  } transition-colors duration-200`}
                  disabled={isDeleting}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className={`px-4 py-2 rounded-md flex items-center justify-center min-w-[150px] ${
                    isDark
                      ? "bg-red-700 hover:bg-red-600 text-white"
                      : "bg-red-600 hover:bg-red-700 text-white"
                  } ${isDeleting ? "opacity-70 cursor-not-allowed" : ""} transition-colors duration-200`}
                  disabled={isDeleting}
                  type="button"
                >
                  {isDeleting ? (
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    "Permanently Delete"
                  )}
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

// Use React.memo to prevent unnecessary re-renders
export default React.memo(TaskSidebar);
