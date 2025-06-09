"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, Check, AlertCircle, Edit3 } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/client";
import { Collection, ListColor, LIST_COLORS } from "@/types/schema";

// Define a proper result type for submission
interface SubmissionResult {
  success: boolean;
  error?: unknown;
}

interface EditCollectionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    collectionId: string,
    collectionData: { collection_name: string; bg_color_hex: ListColor }
  ) => Promise<SubmissionResult> | void;
  existingCollections?: Collection[];
  currentCollection: Collection | null;
}

/**
 * Modal component for editing an existing collection
 */
const EditCollectionPopup: React.FC<EditCollectionPopupProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingCollections = [],
  currentCollection,
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === "dark";

  // Form state
  const [collectionName, setCollectionName] = useState("");
  const [selectedColor, setSelectedColor] = useState<ListColor>("#FF3B30");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs for UI interactions
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize form with current collection data
  useEffect(() => {
    if (isOpen && currentCollection) {
      setCollectionName(currentCollection.collection_name || "");
      // Ensure the color is a valid ListColor, fallback to default if not
      const validColor = LIST_COLORS.includes(
        currentCollection.bg_color_hex as ListColor
      )
        ? (currentCollection.bg_color_hex as ListColor)
        : "#FF3B30";
      setSelectedColor(validColor);
      setError(null);
      setSuccessMessage(null);
      setIsSubmitting(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, currentCollection]);

  // Validation function for case-insensitive collection name checking (excluding current collection)
  const validateCollectionName = useCallback(
    (name: string): string | null => {
      if (!name.trim()) {
        return "Collection name is required";
      }

      // Check for case-insensitive name match, excluding the current collection
      const caseInsensitiveMatch = existingCollections.find(
        (collection) =>
          collection.id !== currentCollection?.id && // Exclude current collection from validation
          collection.collection_name &&
          collection.collection_name.toLowerCase() === name.trim().toLowerCase()
      );

      if (caseInsensitiveMatch) {
        return `A collection named "${caseInsensitiveMatch.collection_name}" already exists (case-insensitive)`;
      }

      return null; // Validation passed
    },
    [existingCollections, currentCollection?.id]
  );

  // Real-time validation as user types
  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newName = e.target.value;
      setCollectionName(newName);

      // Clear error when user starts typing
      if (error) {
        setError(null);
      }

      // Real-time validation
      if (newName.trim()) {
        const validationError = validateCollectionName(newName);
        if (
          validationError &&
          validationError !== "Collection name is required"
        ) {
          setError(validationError);
        }
      }
    },
    [error, validateCollectionName]
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

  // Update collection - with case-insensitive validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentCollection) {
      setError("No collection selected for editing");
      return;
    }

    // Validation using our new case-insensitive function
    const validationError = validateCollectionName(collectionName);
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
        throw new Error("You must be logged in to edit a collection");
      }

      if (!user.id) {
        throw new Error("User ID is missing");
      }

      // Double-check against database with case-insensitive query (excluding current collection)
      const { data: existingCollections, error: checkError } = await supabase
        .from("collection")
        .select("id, collection_name")
        .eq("user_id", user.id)
        .neq("id", currentCollection.id) // Exclude current collection
        .ilike("collection_name", collectionName.trim());

      if (checkError) {
        console.error("Error checking existing collections:", checkError);
      } else if (existingCollections && existingCollections.length > 0) {
        const existingName = existingCollections[0].collection_name;
        setError(
          `A collection named "${existingName}" already exists (case-insensitive)`
        );
        setIsLoading(false);
        setIsSubmitting(false);
        return;
      }

      // Update the collection
      const { error: updateError } = await supabase
        .from("collection")
        .update({
          collection_name: collectionName.trim(),
          bg_color_hex: selectedColor,
        })
        .eq("id", currentCollection.id)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Error updating collection:", updateError);
        throw new Error(updateError.message || "Failed to update collection");
      }

      setSuccessMessage("Collection updated successfully!");

      // Call the onSubmit callback with the updated data
      await onSubmit(currentCollection.id, {
        collection_name: collectionName.trim(),
        bg_color_hex: selectedColor,
      });

      // Add a slight delay to show success message
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: unknown) {
      console.error("Error in collection update process:", err);

      // Error handling
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to update collection");
      }
    } finally {
      setIsLoading(false);
      // Note: We're not resetting isSubmitting here to prevent multiple submissions
    }
  };

  // Check if form is valid and has changes
  const hasChanges =
    collectionName.trim() !== (currentCollection?.collection_name || "") ||
    selectedColor !== (currentCollection?.bg_color_hex || "#FF3B30");

  const isFormValid =
    collectionName.trim() &&
    !validateCollectionName(collectionName) &&
    hasChanges;

  if (!isOpen || !currentCollection) return null;

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
                Edit Collection
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
                htmlFor="collection-name"
                className={`block mb-2 text-sm font-medium ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Collection Name <span className="text-red-500">*</span>
              </label>
              <input
                ref={inputRef}
                id="collection-name"
                type="text"
                placeholder="Enter collection name"
                value={collectionName}
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
              {collectionName.trim() && !error && (
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
                Collection Color <span className="text-red-500">*</span>
              </label>
              <div
                className="flex flex-wrap gap-2"
                role="radiogroup"
                aria-label="Collection color"
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
                } text-white flex items-center justify-center min-w-[120px] disabled:cursor-not-allowed transition-colors duration-200`}
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
                  "Update Collection"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default EditCollectionPopup;
