"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, Check, AlertCircle, Edit3 } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/client";
import { List, ListColor, LIST_COLORS } from "@/types/schema";

// Define a proper result type for submission
interface SubmissionResult {
  success: boolean;
  error?: unknown;
}

interface EditListPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    listId: string,
    listData: { list_name: string; bg_color_hex: ListColor }
  ) => Promise<SubmissionResult> | void;
  existingLists?: { id: string; list_name: string | null }[];
  currentList: List | null;
}

/**
 * Modal component for editing an existing list
 */
const EditListPopup: React.FC<EditListPopupProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingLists = [],
  currentList,
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

  // Initialize form with current list data
  useEffect(() => {
    if (isOpen && currentList) {
      setListName(currentList.list_name || "");
      // Ensure the color is a valid ListColor, fallback to default if not
      const validColor = LIST_COLORS.includes(
        currentList.bg_color_hex as ListColor
      )
        ? (currentList.bg_color_hex as ListColor)
        : "#FF3B30";
      setSelectedColor(validColor);
      setError(null);
      setSuccessMessage(null);
      setIsSubmitting(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, currentList]);

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

  // Validation function for case-insensitive list name checking (excluding current list)
  const validateListName = useCallback(
    (name: string): string | null => {
      if (!name.trim()) {
        return "List name is required";
      }

      // Check for case-insensitive name match, excluding the current list
      const caseInsensitiveMatch = allLists.find(
        (list) =>
          list.id !== currentList?.id && // Exclude current list from validation
          list.list_name &&
          list.list_name.toLowerCase() === name.trim().toLowerCase()
      );

      if (caseInsensitiveMatch) {
        return `A list named "${caseInsensitiveMatch.list_name}" already exists (case-insensitive)`;
      }

      return null; // Validation passed
    },
    [allLists, currentList?.id]
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

  // Update list - with case-insensitive validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentList) {
      setError("No list selected for editing");
      return;
    }

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
        throw new Error("You must be logged in to edit a list");
      }

      if (!user.id) {
        throw new Error("User ID is missing");
      }

      // Double-check against database with case-insensitive query (excluding current list)
      const { data: existingLists, error: checkError } = await supabase
        .from("list")
        .select("id, list_name")
        .eq("user_id", user.id)
        .neq("id", currentList.id) // Exclude current list
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

      // Update the list
      const { error: updateError } = await supabase
        .from("list")
        .update({
          list_name: listName.trim(),
          bg_color_hex: selectedColor,
        })
        .eq("id", currentList.id)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Error updating list:", updateError);
        throw new Error(updateError.message || "Failed to update list");
      }

      // Update any associated collections with the new color
      const { error: collectionsUpdateError } = await supabase
        .from("collection")
        .update({
          bg_color_hex: selectedColor,
        })
        .eq("list_id", currentList.id)
        .eq("user_id", user.id)
        .ilike("collection_name", "general"); // ADD THIS LINE

      if (collectionsUpdateError) {
        console.error(
          "Error updating collections color:",
          collectionsUpdateError
        );
        // Continue anyway since the list was updated
      }

      setSuccessMessage("List updated successfully!");

      // Call the onSubmit callback with the updated data
      await onSubmit(currentList.id, {
        list_name: listName.trim(),
        bg_color_hex: selectedColor,
      });

      // Add a slight delay to show success message
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: unknown) {
      console.error("Error in list update process:", err);

      // Error handling
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to update list");
      }
    } finally {
      setIsLoading(false);
      // Note: We're not resetting isSubmitting here to prevent multiple submissions
    }
  };

  // Check if form is valid and has changes
  const hasChanges =
    listName.trim() !== (currentList?.list_name || "") ||
    selectedColor !== (currentList?.bg_color_hex || "#FF3B30");

  const isFormValid =
    listName.trim() && !validateListName(listName) && hasChanges;

  if (!isOpen || !currentList) return null;

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
            <div className="flex items-center">
              <Edit3
                className={`h-5 w-5 mr-2 ${isDark ? "text-orange-400" : "text-sky-500"}`}
              />
              <h2
                id="modal-title"
                className={`text-xl font-semibold ${isDark ? "text-gray-100" : "text-gray-800"}`}
              >
                Edit List
              </h2>
            </div>
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
              className={`mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md flex items-start
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
                {LIST_COLORS.map((color) => {
                  // Determine if this is a light color that needs dark checkmark
                  const lightColors = [
                    "#FFD60A",
                    "#34C759",
                    "#00C7BE",
                    "#FF9F0A",
                    "#30D158",
                    "#ff69B4",
                  ];
                  const isLight =
                    lightColors.includes(color.toLowerCase()) ||
                    (color.includes("#") &&
                      parseInt(color.slice(1, 3), 16) +
                        parseInt(color.slice(3, 5), 16) +
                        parseInt(color.slice(5, 7), 16) >
                        384);
                  const checkColor = isLight ? "text-gray-800" : "text-white";

                  return (
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
                        <Check
                          className={`h-4 w-4 ${checkColor} drop-shadow-md`}
                        />
                      )}
                    </button>
                  );
                })}
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
                } text-white flex items-center justify-center min-w-[100px] disabled:cursor-not-allowed transition-colors duration-200`}
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
                  "Update List"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default EditListPopup;
