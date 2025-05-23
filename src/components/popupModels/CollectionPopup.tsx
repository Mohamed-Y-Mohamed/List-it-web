"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, Check, AlertCircle } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { LIST_COLORS } from "@/types/schema";
import { useAuth } from "@/context/AuthContext";
// Removed useParams to fix the unused variable error

interface SubmissionResult {
  success: boolean;
  error?: unknown;
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
  listId?: string; // Added as prop instead of using useParams
}

const CreateCollectionModal: React.FC<CreateCollectionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialName = "",
  initialColor = LIST_COLORS[0],
  // We don't need to use listId here, it will be handled by the parent component
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

      if (!collectionName.trim()) {
        setError("Collection name is required");
        return;
      }

      if (isSubmitting || isLoading) return;

      setIsLoading(true);
      setIsSubmitting(true);
      setError(null);

      try {
        if (!user || !user.id) throw new Error("User not authenticated");

        // FIXED: Don't insert directly here, just call the onSubmit prop
        // and let the parent component handle the database operation
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
      collectionName,
      selectedColor,
      isSubmitting,
      isLoading,
      onSubmit,
      onClose,
      user,
    ]
  );

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
            <div className="mb-4 p-3 rounded-md bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800">
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
                onChange={(e) => setCollectionName(e.target.value)}
                className={`w-full px-3 py-2 rounded-md border ${isDark ? "bg-gray-700 text-white border-gray-600" : "bg-white border-gray-300 text-black"}`}
                required
                maxLength={100}
                disabled={isLoading}
              />
            </div>

            <div className="mb-4">
              <label
                className={`block mb-2 text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {LIST_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-8 w-8 rounded-full relative ${selectedColor === color ? "ring-2 ring-offset-2 ring-sky-500" : ""}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                    disabled={isLoading}
                  >
                    {selectedColor === color && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Check className="text-white w-4 h-4" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className={`px-4 py-2 rounded-md ${isLoading ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-gray-200 hover:bg-gray-300 text-gray-700"}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`px-4 py-2 rounded-md ${isLoading ? "bg-sky-400 cursor-not-allowed" : "bg-sky-500 hover:bg-sky-600"} text-white`}
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
