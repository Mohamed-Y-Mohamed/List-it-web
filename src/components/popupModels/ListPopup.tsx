"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
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
  existingLists?: { id: string; list_name: string | null }[]; // Added for validation
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
  existingLists = [], // Default to empty array
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
  const [allLists, setAllLists] =
    useState<{ id: string; list_name: string | null }[]>(existingLists);

  // Refs for UI interactions
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch existing lists for validation when modal opens
  useEffect(() => {
    const fetchExistingLists = async () => {
      if (!isOpen || !user) return;

      try {
        const { data: lists, error } = await supabase
          .from("list")
          .select("id, list_name")
          .eq("user_id", user.id);

        if (error) {
          console.error("Error fetching existing lists:", error);
        } else {
          setAllLists(lists || []);
        }
      } catch (err) {
        console.error("Failed to fetch existing lists:", err);
      }
    };

    fetchExistingLists();
  }, [isOpen, user]);

  // Validation function for case-insensitive list name checking
  const validateListName = useCallback(
    (name: string): string | null => {
      if (!name.trim()) {
        return "List name is required";
      }

      // Check for case-insensitive name match
      const caseInsensitiveMatch = allLists.find(
        (list) =>
          list.list_name &&
          list.list_name.toLowerCase() === name.trim().toLowerCase()
      );

      if (caseInsensitiveMatch) {
        return `A list named "${caseInsensitiveMatch.list_name}" already exists (case-insensitive)`;
      }

      return null; // Validation passed
    },
    [allLists]
  );

  // Real-time validation as user types
  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newName = e.target.value;
      setListName(newName);

      // Clear error when user starts typing
      if (error) {
        setError(null);
      }

      // Real-time validation
      if (newName.trim()) {
        const validationError = validateListName(newName);
        if (validationError && validationError !== "List name is required") {
          setError(validationError);
        }
      }
    },
    [error, validateListName]
  );

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setListName("");
      setSelectedColor("#FF3B30");
      setError(null);
      setSuccessMessage(null);
      setIsSubmitting(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
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

  // Create a new list - with case-insensitive validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation using our new case-insensitive function
    const validationError = validateListName(listName);
    if (validationError) {
      setError(validationError);
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

      // Double-check against database with case-insensitive query
      const { data: existingLists, error: checkError } = await supabase
        .from("list")
        .select("id, list_name")
        .eq("user_id", user.id)
        .ilike("list_name", listName.trim());

      if (checkError) {
        console.error("Error checking existing lists:", checkError);
      } else if (existingLists && existingLists.length > 0) {
        const existingName = existingLists[0].list_name;
        setError(
          `A list named "${existingName}" already exists (case-insensitive)`
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

  // Check if form is valid for submit button state
  const isFormValid = listName.trim() && !validateListName(listName);

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
              className={`mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800   rounded-md flex items-start
              ${isDark ? "text-red-100" : "text-red-900"}`}
              role="alert"
            >
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div
              className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-900 dark:text-green-300 rounded-md"
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
                onChange={handleNameChange}
                className={`w-full px-3 py-2 rounded-md border ${
                  error &&
                  (error.includes("name") || error.includes("already exists"))
                    ? "border-red-500 focus:border-red-500"
                    : isDark
                      ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-orange-500"
                      : "bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:border-sky-500"
                } focus:outline-none focus:ring-1 ${
                  error &&
                  (error.includes("name") || error.includes("already exists"))
                    ? "focus:ring-red-500"
                    : isDark
                      ? "focus:ring-orange-500"
                      : "focus:ring-sky-500"
                }`}
                required
                maxLength={50}
                disabled={isLoading}
                aria-required="true"
              />

              {/* Show validation status */}
              {listName.trim() && !error && (
                <div className="mt-1">
                  <p
                    className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
                    ✓ Available name
                  </p>
                </div>
              )}
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
                    className={`h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                      selectedColor === color
                        ? isDark
                          ? "ring-2 ring-offset-2 ring-offset-gray-800 ring-white scale-110"
                          : "ring-2 ring-offset-2 ring-offset-gray-100 ring-gray-800 scale-110"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                    aria-label={`Select ${color} color`}
                    aria-pressed={selectedColor === color}
                    disabled={isLoading}
                  >
                    {selectedColor === color && (
                      <Check className="h-4 w-4 text-white drop-shadow-md" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 rounded-md transition-colors duration-200 ${
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
                } text-white flex items-center justify-center min-w-[80px] disabled:cursor-not-allowed transition-colors duration-200`}
                disabled={isLoading || !isFormValid || isSubmitting}
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
