"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, Check, AlertCircle } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { LIST_COLORS } from "@/types/schema";

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (collectionData: {
    collection_name: string;
    bg_color_hex: string;
  }) => Promise<{ success: boolean; error?: any }> | void;
  initialName?: string;
  initialColor?: string;
}

/**
 * Modal for creating a new collection
 */
const CreateCollectionModal: React.FC<CreateCollectionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialName = "",
  initialColor = LIST_COLORS[0],
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Form state
  const [collectionName, setCollectionName] = useState(initialName);
  const [selectedColor, setSelectedColor] = useState<
    (typeof LIST_COLORS)[number]
  >(
    LIST_COLORS.includes(initialColor as any)
      ? (initialColor as any)
      : LIST_COLORS[0]
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs for UI interactions
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens or props change
  useEffect(() => {
    if (isOpen) {
      setCollectionName(initialName);
      setSelectedColor(
        LIST_COLORS.includes(initialColor as any)
          ? (initialColor as any)
          : LIST_COLORS[0]
      );
      setError(null);
      setIsSubmitting(false);

      // Focus the input field with a slight delay to ensure the modal is rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, initialName, initialColor]);

  // Handle click outside to close the modal
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, isLoading]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, isLoading]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate input
      if (!collectionName.trim()) {
        setError("Collection name is required");
        return;
      }

      // Prevent duplicate submissions
      if (isSubmitting || isLoading) {
        return;
      }

      setIsLoading(true);
      setIsSubmitting(true);
      setError(null);

      try {
        // Pass the collection data to parent component
        const result = await onSubmit({
          collection_name: collectionName.trim(),
          bg_color_hex: selectedColor,
        });

        // Check if result has properties (it's a Promise result)
        if (result && typeof result === "object" && "success" in result) {
          if (!result.success) {
            throw new Error(result.error || "Failed to create collection");
          }
        }

        // Close the modal on success
        onClose();
      } catch (err) {
        console.error("Error submitting collection:", err);
        setError(
          err instanceof Error ? err.message : "Failed to create collection"
        );
      } finally {
        setIsLoading(false);
        // Note: Don't reset isSubmitting here to prevent duplicate submissions
      }
    },
    [collectionName, selectedColor, isSubmitting, isLoading, onSubmit, onClose]
  );

  // Don't render anything if the modal is not open
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 z-40 backdrop-blur-md bg-black/30"
        onClick={!isLoading ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
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
              Create New Collection
            </h2>
            <button
              onClick={!isLoading ? onClose : undefined}
              className={`p-1 rounded-full ${
                isDark
                  ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
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

          <form onSubmit={handleSubmit} noValidate>
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
                type="text"
                id="collection-name"
                placeholder="Enter collection name"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
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
                aria-invalid={error ? "true" : "false"}
              />
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
                    style={{ backgroundColor: color }}
                    className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      selectedColor === color
                        ? isDark
                          ? "ring-2 ring-offset-2 ring-offset-gray-800 ring-white"
                          : "ring-2 ring-offset-2 ring-offset-gray-100 ring-gray-800"
                        : ""
                    } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => !isLoading && setSelectedColor(color)}
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
                onClick={!isLoading ? onClose : undefined}
                className={`px-4 py-2 rounded-md ${
                  isDark
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 rounded-md ${
                  isDark
                    ? "bg-orange-600 text-white hover:bg-orange-700 disabled:bg-orange-600/50"
                    : "bg-sky-500 text-white hover:bg-sky-600 disabled:bg-sky-500/50"
                } flex items-center justify-center min-w-[80px] ${
                  isLoading || !collectionName.trim() || isSubmitting
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                disabled={isLoading || !collectionName.trim() || isSubmitting}
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

export default CreateCollectionModal;
