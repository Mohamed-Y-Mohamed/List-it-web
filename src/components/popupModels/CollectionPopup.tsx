"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, Check, AlertCircle } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { LIST_COLORS } from "@/types/schema";
import { useAuth } from "@/context/AuthContext";

interface SubmissionResult {
  success: boolean;
  error?: unknown;
}

interface Collection {
  id: string;
  collection_name: string | null;
}

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (collectionData: {
    collection_name: string;
    bg_color_hex: string;
  }) => Promise<SubmissionResult> | void;
  initialName?: string;
  initialColor?: string;
  listId?: string;
  existingCollections?: Collection[]; // Added to check for duplicates
}

const CreateCollectionModal: React.FC<CreateCollectionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialName = "",
  initialColor = LIST_COLORS[0],
  existingCollections = [], // Default to empty array
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === "dark";

  const [collectionName, setCollectionName] = useState(initialName);
  const [selectedColor, setSelectedColor] = useState(
    LIST_COLORS.includes(initialColor as (typeof LIST_COLORS)[number])
      ? (initialColor as (typeof LIST_COLORS)[number])
      : LIST_COLORS[0]
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Validation function to check for duplicate names (case-insensitive)
  const validateCollectionName = useCallback(
    (name: string): string | null => {
      if (!name.trim()) {
        return "Collection name is required";
      }

      // Check for case-insensitive name match (prevents both exact and case variations)
      const caseInsensitiveMatch = existingCollections.some(
        (collection) =>
          collection.collection_name &&
          collection.collection_name.toLowerCase() === name.trim().toLowerCase()
      );

      if (caseInsensitiveMatch) {
        // Find the existing name to show user what already exists
        const existingName = existingCollections.find(
          (collection) =>
            collection.collection_name &&
            collection.collection_name.toLowerCase() ===
              name.trim().toLowerCase()
        )?.collection_name;

        return `A collection named "${existingName}" already exists (case-insensitive)`;
      }

      return null; // Validation passed
    },
    [existingCollections]
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

  useEffect(() => {
    if (isOpen) {
      setCollectionName(initialName);
      setSelectedColor(
        LIST_COLORS.includes(initialColor as (typeof LIST_COLORS)[number])
          ? (initialColor as (typeof LIST_COLORS)[number])
          : LIST_COLORS[0]
      );
      setError(null);
      setIsSubmitting(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, initialName, initialColor]);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, isLoading]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate collection name before submission
      const validationError = validateCollectionName(collectionName);
      if (validationError) {
        setError(validationError);
        return;
      }

      if (isSubmitting || isLoading) return;

      setIsLoading(true);
      setIsSubmitting(true);
      setError(null);

      try {
        if (!user || !user.id) throw new Error("User not authenticated");

        if (onSubmit) {
          const result = await onSubmit({
            collection_name: collectionName.trim(),
            bg_color_hex: selectedColor,
          });

          // Check if onSubmit returned an error
          if (
            result &&
            typeof result === "object" &&
            "success" in result &&
            !result.success
          ) {
            throw result.error || new Error("Failed to submit collection");
          }
        }

        onClose();
      } catch (err: unknown) {
        console.error("Error submitting collection:", err);
        setError(
          err instanceof Error ? err.message : "Failed to create collection"
        );
      } finally {
        setIsLoading(false);
        setIsSubmitting(false);
      }
    },
    [
      validateCollectionName,
      collectionName,
      selectedColor,
      isSubmitting,
      isLoading,
      onSubmit,
      onClose,
      user,
    ]
  );

  // Check if form is valid for submit button state
  const isFormValid =
    collectionName.trim() && !validateCollectionName(collectionName);

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
          className={`w-full max-w-md rounded-lg ${isDark ? "bg-gray-800/50" : "bg-white/70"} shadow-xl transition-all p-6 mx-4 pointer-events-auto`}
        >
          <div className="flex justify-between items-center mb-4">
            <h2
              className={`text-xl font-semibold ${isDark ? "text-gray-100" : "text-gray-800"}`}
            >
              Create New Collection
            </h2>
            <button
              onClick={!isLoading ? onClose : undefined}
              className="p-1 rounded-full"
              disabled={isLoading}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div
              className={`mb-4 p-3 rounded-md bg-red-100  dark:bg-red-900/30  border border-red-200 dark:border-red-800
           ${isDark ? "text-red-100" : "text-red-900"}`}
            >
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                className={`block mb-2 text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                Collection Name
              </label>
              <input
                ref={inputRef}
                type="text"
                value={collectionName}
                onChange={handleNameChange}
                className={`w-full px-3 py-2 rounded-md border ${
                  error &&
                  (error.includes("name") || error.includes("already exists"))
                    ? "border-red-500 focus:border-red-500"
                    : isDark
                      ? "bg-gray-700 text-white border-gray-600 focus:border-blue-500"
                      : "bg-white border-gray-300 text-black focus:border-blue-500"
                } focus:outline-none focus:ring-1 ${
                  error &&
                  (error.includes("name") || error.includes("already exists"))
                    ? "focus:ring-red-500"
                    : "focus:ring-blue-500"
                }`}
                required
                maxLength={100}
                disabled={isLoading}
                placeholder="Enter collection name..."
              />

              {/* Show validation status for user reference */}
              {collectionName.trim() &&
                !error &&
                existingCollections.length > 0 && (
                  <div className="mt-1">
                    <p
                      className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      ✓ Available name
                    </p>
                  </div>
                )}
            </div>

            <div className="mb-4">
              <label
                className={`block mb-2 text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                Color
              </label>
              <div className="flex gap-2 flex-wrap">
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
                      className={`h-8 w-8 rounded-full relative transition-all duration-200 ${
                        selectedColor === color
                          ? "ring-2 ring-offset-2 ring-sky-500 scale-110"
                          : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedColor(color)}
                      disabled={isLoading}
                    >
                      {selectedColor === color && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Check
                            className={`${checkColor} w-4 h-4 drop-shadow-md`}
                          />
                        </div>
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
                disabled={isLoading}
                className={`px-4 py-2 rounded-md transition-colors duration-200 ${
                  isLoading
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : isDark
                      ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !isFormValid}
                className={`px-4 py-2 rounded-md transition-colors duration-200 ${
                  isLoading || !isFormValid
                    ? "bg-sky-400 cursor-not-allowed opacity-50"
                    : "bg-sky-500 hover:bg-sky-600"
                } text-white`}
              >
                {isLoading ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default React.memo(CreateCollectionModal);
