"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, Calendar, AlertCircle, Pin } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Collection } from "@/types/schema";

// Define a proper result type for submission
interface SubmissionResult {
  success: boolean;
  error?: unknown;
}

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: {
    text: string;
    description: string;
    is_pinned: boolean;
    due_date?: Date;
    collection_id?: string;
  }) => Promise<SubmissionResult> | void;
  collections: Collection[];
  selectedCollectionId?: string;
}

const CreateTaskModal = ({
  isOpen,
  onClose,
  onSubmit,
  collections,
  selectedCollectionId: initialCollectionId,
}: CreateTaskModalProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Form state
  const [taskName, setTaskName] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [dueDate, setDueDate] = useState<string>("");
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorTimeout, setErrorTimeout] = useState<NodeJS.Timeout | null>(null);
  const [characterCount, setCharacterCount] = useState<number>(0);
  const [descriptionCount, setDescriptionCount] = useState<number>(0);

  // Refs
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // Get default (General) collection
  const defaultCollection = collections.find((c) => c.is_default);

  // Set initial collection ID from prop when modal opens
  useEffect(() => {
    if (isOpen) {
      // If a collection ID was passed from parent, use it
      if (initialCollectionId) {
        setSelectedCollectionId(initialCollectionId);
      } else if (defaultCollection && defaultCollection.id) {
        // Otherwise use default collection if available
        setSelectedCollectionId(defaultCollection.id);
      } else if (collections.length > 0) {
        // Fall back to first collection if no default
        setSelectedCollectionId(collections[0].id);
      } else {
        // No collections available
        setSelectedCollectionId("");
      }

      // Focus the task name input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, initialCollectionId, defaultCollection, collections]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        modalRef.current &&
        !modalRef.current.contains(event.target as Node) &&
        !isSubmitting
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, isSubmitting]);

  // Handle escape key press
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, isSubmitting]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTaskName("");
      setTaskDescription("");
      setIsPinned(false);
      setDueDate("");
      setSelectedCollectionId("");
      setError(null);
      setIsSubmitting(false);
      setCharacterCount(0);
      setDescriptionCount(0);

      // Clear any existing timeouts
      if (errorTimeout) {
        clearTimeout(errorTimeout);
        setErrorTimeout(null);
      }
    }
  }, [isOpen, errorTimeout]);

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

  // Helper function to display error with auto-dismiss
  const showError = useCallback(
    (errorMessage: string) => {
      setError(errorMessage);

      // Clear any existing timeout
      if (errorTimeout) {
        clearTimeout(errorTimeout);
      }

      // Set new timeout to clear error after 5 seconds
      const timeout = setTimeout(() => {
        setError(null);
      }, 5000);

      setErrorTimeout(timeout);
    },
    [errorTimeout]
  );

  // Get the collection ID safely
  const getCollectionId = useCallback((): string | undefined => {
    // If user selected a collection, use that
    if (selectedCollectionId) {
      return selectedCollectionId;
    }

    // Try to use default collection
    if (defaultCollection?.id) {
      return defaultCollection.id;
    }

    // If collections exist, use the first one
    if (collections.length > 0) {
      return collections[0].id;
    }

    // No valid collection ID found
    return undefined;
  }, [selectedCollectionId, defaultCollection, collections]);

  // Handle task name input change with character count
  const handleTaskNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setTaskName(value);
      setCharacterCount(value.length);
    },
    []
  );

  // Handle description input change with character count
  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setTaskDescription(value);
      setDescriptionCount(value.length);
      autoResizeTextarea(e.target);
    },
    [autoResizeTextarea]
  );

  // Handle form submission - Let parent handle the database operations
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate task name
    if (!taskName.trim()) {
      showError("Task name is required");
      return;
    }

    // Prevent multiple submissions
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      // Create task data with properly formatted due date
      const taskData = {
        text: taskName.trim(),
        description: taskDescription.trim(),
        is_pinned: isPinned,
        due_date: dueDate
          ? (() => {
              // Create a Date object using UTC to match iOS format expectations
              // This creates an ISO8601 date string that the iOS app can parse
              const [year, month, day] = dueDate.split("-").map(Number);
              // Create date in UTC to avoid timezone issues
              const dueDateObj = new Date(
                Date.UTC(year, month - 1, day, 12, 0, 0)
              );
              return dueDateObj;
            })()
          : undefined,
        collection_id: getCollectionId(),
      };

      // Submit the task to the parent component
      const result = await onSubmit(taskData);

      // Check for errors
      if (result && !result.success) {
        throw new Error(
          result.error ? String(result.error) : "Failed to create task"
        );
      }

      // If successful, close the modal
      onClose();
    } catch (err: unknown) {
      console.error("Error creating task:", err);
      showError(err instanceof Error ? err.message : "Failed to create task");
      setIsSubmitting(false);
    }
  };

  // Handle date change with validation
  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedDate = e.target.value;

      // Check if selected date is in the past
      if (selectedDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dateToCheck = new Date(selectedDate + "T12:00:00"); // Parse at noon

        if (dateToCheck < today) {
          showError("Due date cannot be in the past");
          return;
        }
      }

      setDueDate(selectedDate);
    },
    [showError]
  );

  if (!isOpen) return null;

  // Format today's date for the min attribute
  const today = new Date().toISOString().split("T")[0];

  // Style variables for better readability
  const inputStyle = `w-full px-3 py-2 rounded-md border focus:outline-none ${
    isDark
      ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-orange-500"
      : "bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:border-sky-500"
  } transition-colors duration-200`;

  const buttonCancelStyle = `px-4 py-2 rounded-md ${
    isDark
      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
  } transition-colors duration-200`;

  const buttonSubmitStyle = `px-4 py-2 rounded-md ${
    isDark
      ? "bg-orange-600 text-white hover:bg-orange-700 disabled:bg-orange-600/50"
      : "bg-sky-500 text-white hover:bg-sky-600 disabled:bg-sky-500/50"
  } ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""} transition-colors duration-200`;

  return (
    <>
      <div
        className="fixed inset-0 z-40 backdrop-blur-md bg-black/30"
        onClick={!isSubmitting ? onClose : undefined}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
        <div
          ref={modalRef}
          className={`w-full max-w-md rounded-lg ${
            isDark ? "bg-gray-800" : "bg-white"
          } shadow-xl transition-all p-6 mx-4 pointer-events-auto`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="flex items-center justify-between mb-4">
            <h2
              id="modal-title"
              className={`text-xl font-semibold ${
                isDark ? "text-gray-100" : "text-gray-800"
              }`}
            >
              Create New Task
            </h2>
            <button
              onClick={!isSubmitting ? onClose : undefined}
              className={`p-1 rounded-full ${
                isDark
                  ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""} transition-colors duration-200`}
              aria-label="Close"
              disabled={isSubmitting}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div
              className={`mb-4 p-3 rounded-md flex items-start ${
                isDark
                  ? "bg-red-900/30 border border-red-800 text-red-300"
                  : "bg-red-100 border border-red-200 text-red-700"
              } animate-fadeIn`}
              role="alert"
            >
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="task-name"
                className={`block mb-2 text-sm font-medium ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Task Name <span className="text-red-500">*</span>
              </label>
              <input
                ref={inputRef}
                type="text"
                id="task-name"
                placeholder="Enter task name"
                value={taskName}
                onChange={handleTaskNameChange}
                className={inputStyle}
                required
                disabled={isSubmitting}
                maxLength={100}
                aria-required="true"
              />
              <div className="mt-1 flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  {characterCount}/100
                </div>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setIsPinned(!isPinned)}
                    className={`flex items-center text-xs ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    } hover:underline`}
                    disabled={isSubmitting}
                  >
                    <Pin
                      className={`h-3 w-3 mr-1 ${
                        isPinned
                          ? isDark
                            ? "text-orange-400 fill-orange-400"
                            : "text-orange-500 fill-orange-500"
                          : ""
                      }`}
                    />
                    {isPinned ? "Priority task" : "Mark as priority"}
                  </button>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label
                htmlFor="task-description"
                className={`block mb-2 text-sm font-medium ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Description (Optional)
              </label>
              <textarea
                ref={descriptionRef}
                id="task-description"
                placeholder="Enter task description"
                value={taskDescription}
                onChange={handleDescriptionChange}
                rows={3}
                className={`${inputStyle} resize-none min-h-[80px]`}
                disabled={isSubmitting}
                maxLength={500}
              />
              <div className="mt-1 text-xs text-right text-gray-500">
                {descriptionCount}/500
              </div>
            </div>

            <div className="mb-4">
              <label
                htmlFor="due-date"
                className={`block mb-2 text-sm font-medium ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Due Date (Optional)
              </label>
              <div
                className={`relative ${
                  isDark ? "text-gray-100" : "text-gray-800"
                }`}
              >
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="due-date"
                  min={today}
                  value={dueDate}
                  onChange={handleDateChange}
                  className={`${inputStyle} pl-10`}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="mb-4">
              <label
                htmlFor="collection"
                className={`block mb-2 text-sm font-medium ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Collection
              </label>
              <select
                id="collection"
                value={selectedCollectionId}
                onChange={(e) => setSelectedCollectionId(e.target.value)}
                className={inputStyle}
                disabled={isSubmitting || collections.length === 0}
              >
                {collections.length === 0 ? (
                  <option value="">No collections available</option>
                ) : (
                  <>
                    <option value="">Select a collection</option>
                    {collections.map((collection) => (
                      <option key={collection.id} value={collection.id}>
                        {collection.is_default
                          ? `${collection.collection_name || "General"} (Default)`
                          : collection.collection_name || "Unnamed Collection"}
                      </option>
                    ))}
                  </>
                )}
              </select>
              {collections.length === 0 && (
                <p
                  className={`mt-1 text-xs ${isDark ? "text-yellow-400" : "text-yellow-600"}`}
                >
                  No collections available. Task will be created without a
                  collection.
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={!isSubmitting ? onClose : undefined}
                className={buttonCancelStyle}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={buttonSubmitStyle}
                disabled={!taskName.trim() || isSubmitting}
              >
                {isSubmitting ? (
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
                  "Create"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default React.memo(CreateTaskModal);
