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

interface OperationResult {
  success: boolean;
  error?: unknown;
  data?: unknown;
  warning?: string;
}

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
  ) => Promise<OperationResult> | void;
  onPriorityChange: (
    taskId: string,
    is_pinned: boolean
  ) => Promise<OperationResult> | void;
  onTaskUpdate?: (
    taskId: string,
    taskData: {
      text: string;
      description?: string | null;
      due_date?: Date | null;
      is_pinned: boolean;
    }
  ) => Promise<OperationResult> | void;
  collections?: Collection[];
  onCollectionChange?: (
    taskId: string,
    collectionId: string
  ) => Promise<OperationResult> | void;
  onTaskDelete?: (taskId: string) => Promise<OperationResult> | void;
}

const TaskSidebar = ({
  isOpen,
  onClose,
  task,
  onComplete,
  onPriorityChange,
  onTaskUpdate,
  collections: externalCollections = [],
  onCollectionChange,
  onTaskDelete,
}: TaskSidebarProps) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === "dark";
  const sidebarRef = useRef<HTMLDivElement>(null);

  // --- FETCH COLLECTIONS FOR THIS TASK'S LIST_ID OR USER ---
  const [collections, setCollections] =
    useState<{ id: string; collection_name: string | null }[]>(
      externalCollections
    );

  useEffect(() => {
    if (!isOpen || !user) return;
    let query = supabase.from("collection").select("id,collection_name");
    if (task.list_id) {
      query = query.eq("list_id", task.list_id);
    } else {
      query = query.eq("user_id", user.id);
    }
    query.order("collection_name", { ascending: true }).then(({ data }) => {
      if (data) setCollections(data);
    });
  }, [isOpen, task.list_id, user]);

  // --- FORM STATE ---
  const [taskText, setTaskText] = useState<string>(task.text || "");
  const [taskDescription, setTaskDescription] = useState<string>(
    task.description || ""
  );
  const [dueDate, setDueDate] = useState<string>(
    task.due_date ? formatDateForInput(task.due_date) : ""
  );
  const [selectedCollection, setSelectedCollection] = useState<string>(
    task.collection_id || ""
  );
  const [isPinned, setIsPinned] = useState<boolean>(task.is_pinned || false);
  const [isCompleted, setIsCompleted] = useState<boolean>(
    task.is_completed || false
  );

  const [titleCharCount, setTitleCharCount] = useState<number>(
    (task.text || "").length
  );
  const [descriptionCharCount, setDescriptionCharCount] = useState<number>(
    (task.description || "").length
  );
  const [isTaskChanged, setIsTaskChanged] = useState<boolean>(false);

  // --- UI STATE ---
  const [showDeleteConfirmation, setShowDeleteConfirmation] =
    useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorTimeout, setErrorTimeout] = useState<NodeJS.Timeout | null>(null);
  const [successTimeout, setSuccessTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  const isProcessing = isSaving || isDeleting;

  // --- INIT FORM ON OPEN ---
  useEffect(() => {
    if (isOpen) {
      console.log("Setting initial values. Collection ID:", task.collection_id);

      setTaskText(task.text || "");
      setTaskDescription(task.description || "");
      setDueDate(task.due_date ? formatDateForInput(task.due_date) : "");
      setTitleCharCount((task.text || "").length);
      setDescriptionCharCount((task.description || "").length);
      setSelectedCollection(task.collection_id || "");
      setIsPinned(task.is_pinned || false);
      setIsCompleted(task.is_completed || false);
      setError(null);
      setSuccessMessage(null);
      setIsTaskChanged(false);
    }
  }, [task, isOpen]);

  // --- TRACK CHANGES ---
  useEffect(() => {
    // Format dates for proper comparison
    const oldDueDate = task.due_date ? formatDateForInput(task.due_date) : "";

    const changed =
      taskText !== task.text ||
      taskDescription !== (task.description || "") ||
      dueDate !== oldDueDate ||
      isPinned !== task.is_pinned ||
      isCompleted !== task.is_completed ||
      selectedCollection !== task.collection_id;
    setIsTaskChanged(changed);
  }, [
    taskText,
    taskDescription,
    dueDate,
    isPinned,
    isCompleted,
    selectedCollection,
    task,
  ]);

  // --- CLEANUP TIMEOUTS ---
  useEffect(() => {
    return () => {
      if (errorTimeout) clearTimeout(errorTimeout);
      if (successTimeout) clearTimeout(successTimeout);
    };
  }, [errorTimeout, successTimeout]);

  // --- MESSAGES RESET ON OPEN/CLOSE ---
  useEffect(() => {
    setError(null);
    setSuccessMessage(null);
  }, [isOpen]);

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

  // --- DISPLAY HELPERS ---
  const showError = useCallback(
    (message: string) => {
      setError(message);
      if (errorTimeout) clearTimeout(errorTimeout);
      const t = setTimeout(() => setError(null), 5000);
      setErrorTimeout(t);
    },
    [errorTimeout]
  );

  const showSuccess = useCallback(
    (message: string) => {
      setSuccessMessage(message);
      if (successTimeout) clearTimeout(successTimeout);
      const t = setTimeout(() => setSuccessMessage(null), 3000);
      setSuccessTimeout(t);
    },
    [successTimeout]
  );

  // --- AUTO-RESIZE TEXTAREA ---
  const autoResizeTextarea = useCallback((el: HTMLTextAreaElement) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, []);

  // --- HANDLE CLOSE WITH UNSAVED ---
  const handleClose = useCallback(() => {
    if (isTaskChanged) {
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

  // --- KEYBOARD ESC ---
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        if (showDeleteConfirmation) {
          setShowDeleteConfirmation(false);
        } else if (!isProcessing) {
          handleClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, showDeleteConfirmation, isProcessing, handleClose]);

  // --- FORM INPUT HANDLERS --- (moved above conditional return)
  const handleTaskTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setTaskText(v);
    setTitleCharCount(v.length);
    if (error === "Task name is required" && v.trim()) setError(null);
  };

  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const v = e.target.value;
      setTaskDescription(v);
      setDescriptionCharCount(v.length);
      autoResizeTextarea(e.target);
    },
    [autoResizeTextarea]
  );

  const handlePinToggle = () => setIsPinned((p) => !p);
  const handleCompletedToggle = () => setIsCompleted((c) => !c);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDueDate(e.target.value);
  };

  const handleCollectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCollection(e.target.value);
  };

  // --- FORMATTED DATE ---
  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return "Unknown date";
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return dateObj.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid date";
    }
  };

  const formattedCreatedDate = formatDate(task.created_at);
  const formattedCompletedDate = task.date_completed
    ? formatDate(task.date_completed)
    : null;

  // Get the current date for min date in the date picker
  const today = new Date().toISOString().split("T")[0];

  // Find the current collection for logging
  const currentCollection = collections.find(
    (c) => c.id === task.collection_id
  );

  if (!isOpen) return null;

  // --- UPDATE TASK FIELDS ---
  const updateTaskInDatabase = async (): Promise<OperationResult> => {
    if (!taskText.trim()) {
      showError("Task name is required");
      return { success: false, error: "Task name is required" };
    }
    if (!user || !user.id) {
      showError("You must be logged in to update a task");
      return { success: false, error: "Authentication required" };
    }
    try {
      setIsSaving(true);
      const updateData = {
        text: taskText.trim(),
        description: taskDescription.trim() || null,
        due_date: dueDate
          ? (() => {
              // Ensure date is created properly
              const [year, month, day] = dueDate.split("-").map(Number);
              return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
            })()
          : null,
        is_pinned: isPinned,
        is_completed: isCompleted,
        date_completed: isCompleted ? new Date() : null,
      };

      // Update the task in the database
      const { data, error: dbError } = await supabase
        .from("task")
        .update(updateData)
        .eq("id", task.id)
        .select("*");

      if (dbError) {
        if (
          dbError.code === "42501" ||
          dbError.message?.includes("row-level security")
        ) {
          throw new Error(
            "Permission denied. Make sure you're authorized to update this task."
          );
        }
        throw new Error(dbError.message);
      }

      // Call parent callbacks if they exist
      if (onTaskUpdate) {
        const result = await onTaskUpdate(task.id, updateData);
        // Handle both void and OperationResult cases
        if (
          result &&
          typeof result === "object" &&
          "success" in result &&
          !result.success
        ) {
          throw new Error(String(result.error || "Failed to update task"));
        }
      }

      if (isPinned !== task.is_pinned && onPriorityChange) {
        const result = await onPriorityChange(task.id, isPinned);
        // Handle both void and OperationResult cases
        if (
          result &&
          typeof result === "object" &&
          "success" in result &&
          !result.success
        ) {
          throw new Error(String(result.error || "Failed to update priority"));
        }
      }

      if (isCompleted !== task.is_completed && onComplete) {
        const result = await onComplete(task.id, isCompleted);
        // Handle both void and OperationResult cases
        if (
          result &&
          typeof result === "object" &&
          "success" in result &&
          !result.success
        ) {
          throw new Error(
            String(result.error || "Failed to update completion status")
          );
        }
      }

      showSuccess("Task updated successfully");
      return { success: true, data };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      showError(errorMessage || "Failed to update task");
      return { success: false, error };
    } finally {
      setIsSaving(false);
    }
  };

  // --- UPDATE COLLECTION ONLY ---
  const updateCollectionInDatabase = async (): Promise<OperationResult> => {
    if (!user || !user.id) {
      showError("You must be logged in to update a task");
      return { success: false, error: "Authentication required" };
    }

    // Convert empty string to null for database
    const collectionIdForDb =
      selectedCollection === "" ? null : selectedCollection;

    // Skip if collection hasn't changed (comparing with proper null handling)
    const currentCollectionId =
      task.collection_id === null ? "" : task.collection_id;
    if (selectedCollection === currentCollectionId) {
      return { success: true };
    }

    try {
      // If parent provides a collection change handler, use it to update UI
      if (onCollectionChange && selectedCollection) {
        console.log("Changing task collection to:", selectedCollection);
        const result = await onCollectionChange(task.id, selectedCollection);

        // Handle both void and OperationResult cases
        if (
          result &&
          typeof result === "object" &&
          "success" in result &&
          !result.success
        ) {
          throw new Error(
            String(result.error || "Failed to update collection")
          );
        }

        showSuccess("Collection updated successfully");
        setTimeout(onClose, 1000);
        return { success: true };
      }

      // Fall back to direct database update if no collection change handler
      console.warn(
        "No onCollectionChange provided, updating database directly"
      );
      const { data, error: dbError } = await supabase
        .from("task")
        .update({ collection_id: collectionIdForDb })
        .eq("id", task.id)
        .select("*");

      if (dbError) {
        throw new Error(dbError.message);
      }

      // Try to update UI through other means
      if (onTaskUpdate) {
        const updateData = {
          text: taskText,
          description: taskDescription || null,
          due_date: dueDate
            ? (() => {
                const [year, month, day] = dueDate.split("-").map(Number);
                return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
              })()
            : null,
          is_pinned: isPinned,
        };

        await onTaskUpdate(task.id, updateData);
      }

      showSuccess("Collection updated successfully");
      setTimeout(onClose, 1000);
      return { success: true, data };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      showError(errorMessage || "Failed to update collection");
      return { success: false, error };
    }
  };

  // --- HANDLE SAVE (fields + collection) ---
  const handleSaveTask = async () => {
    const res = await updateTaskInDatabase();
    if (!res.success) return;

    // Handle collection change separately
    const currentCollectionId =
      task.collection_id === null ? "" : task.collection_id;
    if (selectedCollection !== currentCollectionId) {
      await updateCollectionInDatabase();
      return; // updateCollectionInDatabase has its own close handler
    }

    // Close after success
    setTimeout(onClose, 1000);
  };

  // --- DELETE TASK ---
  const deleteTaskFromDatabase = async (): Promise<OperationResult> => {
    if (!user || !user.id) {
      showError("You must be logged in to delete a task");
      return { success: false, error: "Authentication required" };
    }
    try {
      setIsDeleting(true);

      // Update is_deleted flag (soft delete) rather than hard delete
      const { error: dbError } = await supabase
        .from("task")
        .update({ is_deleted: true })
        .eq("id", task.id);

      if (dbError) {
        if (
          dbError.code === "42501" ||
          dbError.message?.includes("row-level security")
        ) {
          throw new Error(
            "Permission denied. Make sure you're authorized to delete this task."
          );
        }
        throw new Error(dbError.message);
      }

      // Call parent delete handler to update UI
      if (onTaskDelete) {
        const result = await onTaskDelete(task.id);
        // Handle both void and OperationResult cases
        if (
          result &&
          typeof result === "object" &&
          "success" in result &&
          !result.success
        ) {
          throw new Error(String(result.error || "Failed to delete task"));
        }
      }

      showSuccess("Task deleted successfully");
      setTimeout(() => {
        setShowDeleteConfirmation(false);
        onClose();
      }, 1000);
      return { success: true };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      showError(errorMessage || "Failed to delete task");
      return { success: false, error };
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmDelete = async () => {
    await deleteTaskFromDatabase();
  };

  console.log(
    "Current collection:",
    currentCollection?.collection_name,
    "ID:",
    task.collection_id
  );
  console.log("Selected collection state:", selectedCollection);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex justify-end backdrop-blur-md bg-black/20"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) handleClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={sidebarRef}
        className={`w-full max-w-md overflow-auto shadow-xl text-white ${isDark ? "bg-black/50" : "bg-gray-600/50"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col items-center px-6 py-4 relative">
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="absolute top-4 right-4 p-2 bg-gray-700 rounded-full"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-300" />
          </button>
          <h2 className="text-2xl font-bold mb-1">Task Details</h2>
        </div>

        {/* Success */}
        {successMessage && (
          <div className="mx-6 mb-4 p-3 bg-green-900/30 border border-green-700 rounded-lg text-green-400 flex items-center">
            <Check className="w-5 h-5 mr-2" />
            {successMessage}
          </div>
        )}
        {/* Error */}
        {error && (
          <div className="mx-6 mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-400 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {/* Form */}
        <div className="px-6 py-4 space-y-8">
          {/* Task Name */}
          <div>
            <label
              htmlFor="task-name"
              className="block text-xl font-semibold mb-2"
            >
              Task Name
            </label>
            <input
              id="task-name"
              type="text"
              value={taskText}
              onChange={handleTaskTextChange}
              maxLength={100}
              disabled={isProcessing}
              placeholder="Task name"
              className="w-full p-4 rounded-2xl bg-gray-800 text-white border border-gray-700 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            <div className="text-right text-gray-500 text-xs mt-1">
              {titleCharCount}/100
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="task-description"
              className="block text-xl font-semibold mb-2"
            >
              Description
            </label>
            <textarea
              id="task-description"
              value={taskDescription}
              onChange={handleDescriptionChange}
              maxLength={500}
              disabled={isProcessing}
              placeholder="Add a description (optional)"
              className="w-full p-4 rounded-2xl bg-gray-800 text-white border border-gray-700 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 min-h-[120px]"
            />
            <div className="text-right text-gray-500 text-xs mt-1">
              {descriptionCharCount}/500
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label
              htmlFor="due-date"
              className="block text-xl font-semibold mb-2"
            >
              Due Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="due-date"
                type="date"
                value={dueDate}
                onChange={handleDateChange}
                min={today} // Prevent selecting dates in the past
                disabled={isProcessing}
                className="w-full p-4 pl-10 rounded-2xl bg-gray-800 text-white border border-gray-700 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Task Info */}
          <div className="p-6 bg-gray-800 rounded-2xl">
            <h3 className="text-2xl font-bold mb-4">Task Information</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Created</span>
                <span className="text-white">{formattedCreatedDate}</span>
              </div>

              {formattedCompletedDate && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Completed</span>
                  <span className="text-green-400">
                    {formattedCompletedDate}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-gray-400">Collection</span>
                <select
                  id="collection-select"
                  value={selectedCollection}
                  onChange={handleCollectionChange}
                  disabled={isProcessing}
                  className="bg-gray-700 border border-gray-600 text-white p-2 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  {collections.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.collection_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4 space-y-3">
                <button
                  onClick={handlePinToggle}
                  disabled={isProcessing}
                  className={`flex items-center justify-center w-full p-3 rounded-2xl transition-colors duration-200 ${
                    isPinned
                      ? "bg-purple-600 text-white"
                      : "bg-gray-700 text-purple-400 border border-purple-500"
                  }`}
                  type="button"
                >
                  <Pin
                    className={`w-5 h-5 mr-2 ${isPinned ? "fill-white" : ""}`}
                  />
                  {isPinned ? "Pinned" : "Pin this Task"}
                </button>

                <button
                  onClick={handleCompletedToggle}
                  disabled={isProcessing}
                  className={`flex items-center justify-center w-full p-3 rounded-2xl transition-colors duration-200 ${
                    isCompleted
                      ? "bg-green-700 text-white"
                      : "bg-gray-700 text-green-400 border border-green-500"
                  }`}
                  type="button"
                >
                  <Check className="w-5 h-5 mr-2" />
                  {isCompleted ? "Completed" : "Mark as Completed"}
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col space-y-4">
            <button
              onClick={handleSaveTask}
              disabled={isProcessing || !isTaskChanged}
              className={`w-full py-4 px-6 rounded-2xl font-semibold text-lg transition-colors duration-200 ${
                isProcessing || !isTaskChanged
                  ? isDark
                    ? "bg-orange-900/50 text-white/70 cursor-not-allowed"
                    : "bg-sky-700/50 text-white/70 cursor-not-allowed"
                  : isDark
                    ? "bg-orange-900 hover:bg-orange-600 text-white"
                    : "bg-sky-700 hover:bg-sky-500 text-white"
              }`}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={() => setShowDeleteConfirmation(true)}
              disabled={isProcessing}
              className="w-full py-3 px-6 rounded-2xl bg-transparent border border-red-500 text-red-400 hover:bg-red-900/30 font-medium transition-colors duration-200 flex items-center justify-center"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Delete Task
            </button>
          </div>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirmation && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fadeIn">
            <div
              className="absolute inset-0 bg-black/70"
              onClick={
                !isDeleting ? () => setShowDeleteConfirmation(false) : undefined
              }
            />
            <div className="relative w-full max-w-sm p-6 rounded-lg shadow-xl bg-gray-800 animate-scaleIn">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 rounded-full bg-red-900/30">
                  <AlertTriangle className="w-6 h-6 text-red-300" />
                </div>
                <h3 className="text-lg font-semibold">Delete Task</h3>
              </div>
              <p className="mb-6 text-gray-300">
                Are you sure you want to delete this task? This action cannot be
                undone and the task will be permanently removed.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirmation(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-md flex items-center justify-center min-w-[90px] bg-red-700 hover:bg-red-600 text-white transition-colors duration-200"
                >
                  {isDeleting ? (
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    "Delete Permanently"
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

export default React.memo(TaskSidebar);
