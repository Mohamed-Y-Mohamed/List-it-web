"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, Check, AlertCircle } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Collection, LIST_COLORS, Note } from "@/types/schema";
import { supabase } from "@/utils/client";
import { useAuth } from "@/context/AuthContext";

interface CreateNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (
    noteData: {
      title: string;
      description?: string;
      bg_color_hex: string;
      collection_id?: string;
    },
    newNoteData?: Note // Pass back the complete note data
  ) => Promise<{ success: boolean; error?: any }> | void;
  collections: Collection[];
  listId?: string;
  selectedCollectionId?: string; // Only string or undefined, not null
}

const CreateNoteModal = ({
  isOpen,
  onClose,
  onSubmit,
  collections,
  listId,
  selectedCollectionId,
}: CreateNoteModalProps) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === "dark";

  // Form state
  const [noteTitle, setNoteTitle] = useState("");
  const [noteDescription, setNoteDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState<
    (typeof LIST_COLORS)[number]
  >(LIST_COLORS[0]);
  const [selectedCollection, setSelectedCollection] = useState<string>("");

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorTimeout, setErrorTimeout] = useState<NodeJS.Timeout | null>(null);

  // Refs
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Memoized function to find default collection
  const getDefaultCollection = useCallback(() => {
    // First try to find a collection marked as default
    const defaultCol = collections.find((c) => c.is_default === true);
    if (defaultCol) return defaultCol;

    // If no default, check if there's a collection with the provided listId
    if (listId) {
      const listCollection = collections.find((c) => c.list_id === listId);
      if (listCollection) return listCollection;
    }

    // Finally, return the first collection if any exist
    return collections.length > 0 ? collections[0] : null;
  }, [collections, listId]);

  // Initialize the selected collection when the modal opens
  useEffect(() => {
    if (isOpen) {
      // If a collection ID was passed from parent, use it
      if (selectedCollectionId) {
        setSelectedCollection(selectedCollectionId);
      } else {
        // Otherwise find the best default
        const defaultCollection = getDefaultCollection();
        if (defaultCollection) {
          setSelectedCollection(defaultCollection.id);
        } else {
          setSelectedCollection("");
        }
      }

      // Focus the title input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, getDefaultCollection, selectedCollectionId]);

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
      setNoteTitle("");
      setNoteDescription("");
      setSelectedColor(LIST_COLORS[0]);
      setSelectedCollection("");
      setIsSubmitting(false);
      setError(null);

      // Clear any existing error timeouts
      if (errorTimeout) {
        clearTimeout(errorTimeout);
        setErrorTimeout(null);
      }
    }
  }, [isOpen, errorTimeout]);

  // Helper function to show errors with auto-dismiss
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

  // Get collection ID safely
  const getCollectionId = useCallback((): string | undefined => {
    if (selectedCollection) {
      return selectedCollection;
    }

    const defaultCollection = getDefaultCollection();
    if (defaultCollection?.id) {
      return defaultCollection.id;
    }

    return undefined;
  }, [selectedCollection, getDefaultCollection]);

  const createNoteInDatabase = async (noteData: {
    title: string;
    description?: string;
    bg_color_hex: string;
    collection_id?: string;
  }): Promise<{
    success: boolean;
    data?: Note;
    error?: any;
  }> => {
    if (!user || !user.id) {
      return {
        success: false,
        error: "You must be logged in to create a note",
      };
    }

    try {
      // Ensure we have a title
      if (!noteData.title.trim()) {
        return { success: false, error: "Title is required" };
      }

      // Find the associated list_id from the collection if available
      let currentListId: string | null | undefined = listId ?? undefined;
      if (!currentListId && noteData.collection_id) {
        const collection = collections.find(
          (c) => c.id === noteData.collection_id
        );
        if (collection) {
          currentListId = collection.list_id;
        }
      }

      // Prepare the note data with all required fields
      const newNote = {
        title: noteData.title.trim() || null,
        description: noteData.description?.trim() || null,
        bg_color_hex: noteData.bg_color_hex || null,
        collection_id: noteData.collection_id || null,
        is_deleted: false,
        is_pinned: false,
        user_id: user.id,
      };

      // Insert into database
      const { data, error } = await supabase
        .from("note")
        .insert([newNote])
        .select("*"); // Return all columns

      if (error) {
        console.error("Database error:", error);

        if (
          error.code === "42501" ||
          error.message?.includes("row-level security policy")
        ) {
          return {
            success: false,
            error:
              "Permission denied. Make sure you're authorized to create notes.",
          };
        }

        throw new Error(error.message || "Failed to create note in database");
      }

      if (!data || data.length === 0) {
        throw new Error("No data returned from database");
      }

      return {
        success: true,
        data: data[0] as Note,
      };
    } catch (error: any) {
      console.error("Error creating note:", error);
      return {
        success: false,
        error: error.message || "Failed to create note",
      };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate title
    if (!noteTitle.trim()) {
      showError("Title is required");
      return;
    }

    // Prevent duplicate submissions
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Get collection ID
      const collectionId = getCollectionId();

      // Prepare note data
      const noteData = {
        title: noteTitle.trim(),
        description: noteDescription.trim() || undefined,
        bg_color_hex: selectedColor,
        collection_id: collectionId,
      };

      // Create note in database
      const result = await createNoteInDatabase(noteData);

      if (!result.success) {
        throw new Error(result.error || "Failed to create note");
      }

      // If creation was successful and we have data
      if (result.data) {
        // Call the onSubmit function with both the note data and the created note
        if (onSubmit) {
          await onSubmit(noteData, result.data);
        }

        // Close the modal
        onClose();
      } else {
        throw new Error("Note was created but no data was returned");
      }
    } catch (err: any) {
      console.error("Error creating note:", err);
      showError(err.message || "Failed to create note");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Define styles for better readability
  const inputStyle = `w-full px-3 py-2 rounded-md border focus:outline-none ${
    isDark
      ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-orange-500"
      : "bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:border-sky-500"
  }`;

  const buttonCancelStyle = `px-4 py-2 rounded-md ${
    isDark
      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
  }`;

  const buttonSubmitStyle = `px-4 py-2 rounded-md ${
    isDark
      ? "bg-orange-600 text-white hover:bg-orange-700 disabled:bg-orange-600/50"
      : "bg-sky-500 text-white hover:bg-sky-600 disabled:bg-sky-500/50"
  } ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""} flex items-center justify-center min-w-[80px]`;

  return (
    <>
      <div
        className="fixed inset-0 z-40 backdrop-blur-md bg-black/30"
        onClick={!isSubmitting ? onClose : undefined}
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
              Create New Note
            </h2>
            <button
              onClick={!isSubmitting ? onClose : undefined}
              className={`p-1 rounded-full ${
                isDark
                  ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
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
              }`}
              role="alert"
            >
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="note-title"
                className={`block mb-2 text-sm font-medium ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Title <span className="text-red-500">*</span>
              </label>
              <input
                ref={inputRef}
                type="text"
                id="note-title"
                placeholder="Enter note title"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                className={inputStyle}
                required
                disabled={isSubmitting}
                maxLength={100}
                aria-required="true"
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="note-description"
                className={`block mb-2 text-sm font-medium ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Description (Optional)
              </label>
              <textarea
                id="note-description"
                placeholder="Enter note description"
                value={noteDescription}
                onChange={(e) => setNoteDescription(e.target.value)}
                rows={3}
                className={`${inputStyle} resize-none`}
                disabled={isSubmitting}
                maxLength={500}
              />
            </div>

            <div className="mb-6">
              <label
                className={`block mb-2 text-sm font-medium ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Note Color <span className="text-red-500">*</span>
              </label>
              <div
                className="flex flex-wrap gap-2"
                role="radiogroup"
                aria-label="Note color"
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
                    } transition-all duration-150 ${
                      isSubmitting
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:shadow-md"
                    }`}
                    onClick={() => setSelectedColor(color)}
                    aria-label={`Select ${color} color`}
                    aria-pressed={selectedColor === color}
                    disabled={isSubmitting}
                  >
                    {selectedColor === color && (
                      <Check className="h-4 w-4 text-white drop-shadow-sm" />
                    )}
                  </button>
                ))}
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
                value={selectedCollection}
                onChange={(e) => setSelectedCollection(e.target.value)}
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
                  No collections available. Note will be created without a
                  collection.
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3">
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
                disabled={!noteTitle.trim() || isSubmitting}
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

export default React.memo(CreateNoteModal);
