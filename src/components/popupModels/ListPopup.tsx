"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Check, AlertCircle } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/client";
import { List, ListColor, LIST_COLORS } from "@/types/schema";

// Define a proper result type for submission
interface SubmissionResult {
  success: boolean;
  error?: unknown;
}

interface CreateListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    listData: Omit<
      List,
      "id" | "created_at" | "tasks" | "notes" | "collections"
    >
  ) => Promise<SubmissionResult> | void;
}

// Create a proper UTC Date object for iOS compatibility
const createUTCDate = (): Date => {
  const now = new Date();
  // Create date in UTC to avoid timezone issues
  return new Date(
    Date.UTC(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours(),
      now.getMinutes(),
      now.getSeconds()
    )
  );
};

/**
 * Modal component for creating a new list
 */
const CreateListModal: React.FC<CreateListModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === "dark";

  // Form state
  const [listName, setListName] = useState("");
  const [selectedColor, setSelectedColor] = useState<ListColor>("#FF3B30");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs for UI interactions
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        modalRef.current &&
        !modalRef.current.contains(event.target as Node) &&
        !isLoading
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, isLoading]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setListName("");
      setSelectedColor("#FF3B30");
      setError(null);
      setSuccessMessage(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Handle the escape key to close the modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, isLoading]);

  // Create a new list - with fixed duplicate creation issue
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!listName.trim()) {
      setError("List name is required");
      return;
    }

    // Prevent duplicate submissions
    if (isSubmitting || isLoading) {
      return;
    }

    setIsLoading(true);
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (!user) {
        throw new Error("You must be logged in to create a list");
      }

      if (!user.id) {
        throw new Error("User ID is missing");
      }

      // Check if a list with the same name already exists
      const { data: existingLists, error: checkError } = await supabase
        .from("list")
        .select("id")
        .eq("user_id", user.id)
        .eq("list_name", listName.trim())
        .limit(1);

      if (checkError) {
        console.error("Error checking existing lists:", checkError);
      } else if (existingLists && existingLists.length > 0) {
        setError(
          "A list with this name already exists. Please choose a different name."
        );
        setIsLoading(false);
        setIsSubmitting(false);
        return;
      }

      // Create a proper Date object with UTC timezone for iOS compatibility
      const createDate = createUTCDate();

      // Step 1: Create the list
      const { data: insertedList, error: listError } = await supabase
        .from("list")
        .insert([
          {
            list_name: listName.trim(),
            bg_color_hex: selectedColor,
            is_default: false,
            is_pinned: false,
            user_id: user.id,
            list_icon: "checklist",
            // Use the Date object directly instead of formatting it as a string
            created_at: createDate,
          },
        ])
        .select();

      if (listError) {
        console.error("Error inserting list:", listError);
        throw new Error(listError.message || "Failed to create list");
      }

      if (!insertedList || insertedList.length === 0) {
        throw new Error("No list data returned after creation");
      }

      const newListId = insertedList[0].id;

      // Step 2: Create a default collection linked to the list
      // REMOVED is_default since it doesn't exist in the database
      const { error: collectionError } = await supabase
        .from("collection")
        .insert([
          {
            list_id: newListId,
            collection_name: "General",
            bg_color_hex: selectedColor,
            user_id: user.id,
            // Use the Date object directly for iOS compatibility
            created_at: createDate,
          },
        ]);

      if (collectionError) {
        console.error("Error creating collection:", collectionError);
        // Continue anyway since the list was created
      } else {
        setSuccessMessage("List and collection created successfully!");
      }

      // Step 3: Call the onSubmit callback once with the list data
      // Important: We're not waiting for this to finish to prevent duplicate calls
      onSubmit({
        list_name: listName.trim(),
        bg_color_hex: selectedColor,
        is_default: false,
        user_id: user.id,
        is_pinned: false,
        list_icon: null,
      });

      // Add a slight delay to show success message
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: unknown) {
      console.error("Error in list creation process:", err);

      // Error handling
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create list");
      }
    } finally {
      setIsLoading(false);
      // Note: We're not resetting isSubmitting here to prevent multiple submissions
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 backdrop-blur-md bg-black/30"
        onClick={!isLoading ? onClose : undefined}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div
          ref={modalRef}
          className={`w-full max-w-md pointer-events-auto p-6 rounded-lg shadow-xl mx-4 ${
            isDark ? "bg-gray-800/50" : "bg-white/70"
          }`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="flex items-center justify-between mb-4">
            <h2
              id="modal-title"
              className={`text-xl font-semibold ${isDark ? "text-gray-100" : "text-gray-800"}`}
            >
              Create New List
            </h2>
            <button
              onClick={onClose}
              className={`p-1 rounded-full ${
                isDark
                  ? "text-gray-400 hover:bg-gray-700"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
              aria-label="Close"
              disabled={isLoading}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div
              className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-md flex items-start"
              role="alert"
            >
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div
              className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-md"
              role="status"
            >
              <Check className="h-5 w-5 mr-2 inline-block" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="list-name"
                className={`block mb-2 text-sm font-medium ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                List Name <span className="text-red-500">*</span>
              </label>
              <input
                ref={inputRef}
                id="list-name"
                type="text"
                placeholder="Enter list name"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                className={`w-full px-3 py-2 rounded-md border ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-800 placeholder-gray-400"
                } focus:outline-none ${
                  isDark ? "focus:border-orange-500" : "focus:border-sky-500"
                }`}
                required
                maxLength={50}
                disabled={isLoading}
                aria-required="true"
              />
            </div>

            <div className="mb-6">
              <label
                className={`block mb-2 text-sm font-medium ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                List Color <span className="text-red-500">*</span>
              </label>
              <div
                className="flex flex-wrap gap-2"
                role="radiogroup"
                aria-label="List color"
              >
                {LIST_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      selectedColor === color
                        ? isDark
                          ? "ring-2 ring-offset-2 ring-offset-gray-800 ring-white"
                          : "ring-2 ring-offset-2 ring-offset-gray-100 ring-gray-800"
                        : ""
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                    aria-label={`Select ${color} color`}
                    aria-pressed={selectedColor === color}
                    disabled={isLoading}
                  >
                    {selectedColor === color && (
                      <Check className="h-4 w-4 text-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 rounded-md ${
                  isDark
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 rounded-md ${
                  isDark
                    ? "bg-orange-600 hover:bg-orange-700 disabled:bg-orange-600/50"
                    : "bg-sky-500 hover:bg-sky-600 disabled:bg-sky-500/50"
                } text-white flex items-center justify-center min-w-[80px] disabled:cursor-not-allowed`}
                disabled={isLoading || !listName.trim() || isSubmitting}
              >
                {isLoading ? (
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

export default CreateListModal;
