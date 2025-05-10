"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { X, Check, Trash2, AlertTriangle, AlertCircle } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { LIST_COLORS, Note } from "@/types/schema";
import { supabase } from "@/utils/client";
import { useAuth } from "@/context/AuthContext";

interface NoteSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  note: {
    id: string;
    title: string | null;
    description?: string | null;
    bg_color_hex?: string | null;
    created_at: Date | string;
    collection_id?: string | null;
    is_pinned?: boolean | null;
    is_deleted?: boolean | null;
  };
  onColorChange?: (
    noteId: string,
    color: string
  ) => Promise<{ success: boolean; error?: any }>;
  onNoteUpdate?: (
    noteId: string,
    updatedTitle: string,
    updatedDescription?: string
  ) => Promise<{ success: boolean; error?: any }>;
  onNoteDelete?: (noteId: string) => Promise<{ success: boolean; error?: any }>;
  isProcessing?: boolean;
}

const NoteDetails = ({
  isOpen,
  onClose,
  note,
  onColorChange,
  onNoteUpdate,
  onNoteDelete,
  isProcessing: externalProcessing = false,
}: NoteSidebarProps) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === "dark";
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Form state
  const [noteTitle, setNoteTitle] = useState(note.title || "");
  const [noteDescription, setNoteDescription] = useState(
    note.description || ""
  );
  const [selectedColor, setSelectedColor] = useState<string>(
    note.bg_color_hex || LIST_COLORS[0]
  );
  const [titleCharCount, setTitleCharCount] = useState(
    (note.title || "").length
  );
  const [descriptionCharCount, setDescriptionCharCount] = useState(
    (note.description || "").length
  );
  const [isNoteChanged, setIsNoteChanged] = useState(false);

  // UI state
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorTimeout, setErrorTimeout] = useState<NodeJS.Timeout | null>(null);
  const [successTimeout, setSuccessTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  // Combined loading state
  const isProcessing = isSaving || isDeleting || externalProcessing;

  // Update form when note data changes
  useEffect(() => {
    if (isOpen) {
      setNoteTitle(note.title || "");
      setNoteDescription(note.description || "");
      setSelectedColor(note.bg_color_hex || LIST_COLORS[0]);
      setTitleCharCount((note.title || "").length);
      setDescriptionCharCount((note.description || "").length);
      setIsNoteChanged(false);
    }
  }, [note, isOpen]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (errorTimeout) clearTimeout(errorTimeout);
      if (successTimeout) clearTimeout(successTimeout);
    };
  }, [errorTimeout, successTimeout]);

  // Reset messages when modal opens or closes
  useEffect(() => {
    setError(null);
    setSuccessMessage(null);
  }, [isOpen]);

  // Check if note has been changed
  useEffect(() => {
    const hasChanged =
      noteTitle !== (note.title || "") ||
      noteDescription !== (note.description || "") ||
      selectedColor !== (note.bg_color_hex || LIST_COLORS[0]);

    setIsNoteChanged(hasChanged);
  }, [noteTitle, noteDescription, selectedColor, note]);

  // Handle keyboard events
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        if (showDeleteConfirmation) {
          setShowDeleteConfirmation(false);
        } else if (!isProcessing) {
          handleClose();
        }
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden"; // Prevent background scrolling
    }

    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = ""; // Restore scrolling
    };
  }, [isOpen, showDeleteConfirmation, isProcessing]);

  // Handle close with unsaved changes
  const handleClose = () => {
    if (isNoteChanged) {
      if (
        confirm(
          "You have unsaved changes. Are you sure you want to discard them?"
        )
      ) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Helper function to display error with auto-dismiss
  const showError = useCallback(
    (message: string) => {
      setError(message);

      if (errorTimeout) {
        clearTimeout(errorTimeout);
      }

      const timeout = setTimeout(() => {
        setError(null);
      }, 5000);

      setErrorTimeout(timeout);
    },
    [errorTimeout]
  );

  // Helper function to display success message with auto-dismiss
  const showSuccess = useCallback(
    (message: string) => {
      setSuccessMessage(message);

      if (successTimeout) {
        clearTimeout(successTimeout);
      }

      const timeout = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);

      setSuccessTimeout(timeout);
    },
    [successTimeout]
  );

  // Update note in database
  const updateNoteInDatabase = async () => {
    if (!noteTitle.trim()) {
      showError("Title is required");
      return { success: false, error: "Title is required" };
    }

    if (!user || !user.id) {
      showError("You must be logged in to update a note");
      return { success: false, error: "Authentication required" };
    }

    try {
      setIsSaving(true);
      setError(null);

      // Prepare the update data with proper checks
      const updateData = {
        title: noteTitle.trim() || null,
        description: noteDescription.trim() || null,
        bg_color_hex: selectedColor || null,
      };

      // First update in database directly
      const { data, error: dbError } = await supabase
        .from("note")
        .update(updateData)
        .eq("id", note.id)
        .select("*"); // Return updated data

      if (dbError) {
        console.error("Database error:", dbError);

        // Check for RLS policy errors
        if (
          dbError.code === "42501" ||
          dbError.message?.includes("row-level security policy")
        ) {
          throw new Error(
            "Permission denied. Make sure you're authorized to update this note."
          );
        }

        throw new Error(dbError.message || "Failed to update note in database");
      }

      // Then update parent component through callbacks if provided
      try {
        // Update title and description through provided callback
        if (onNoteUpdate) {
          const updateResult = await onNoteUpdate(
            note.id,
            noteTitle,
            noteDescription
          );
          if (!updateResult.success) {
            throw new Error(updateResult.error || "Failed to update note");
          }
        }

        // Update color through provided callback if color changed
        if (onColorChange && selectedColor !== note.bg_color_hex) {
          const colorResult = await onColorChange(note.id, selectedColor);
          if (!colorResult.success) {
            throw new Error(colorResult.error || "Failed to update note color");
          }
        }

        showSuccess("Note updated successfully");
        setIsNoteChanged(false);
        return { success: true, data };
      } catch (callbackErr: any) {
        console.error("Error in update callbacks:", callbackErr);
        // Even if callbacks fail, the database update succeeded
        showSuccess("Note updated in database");
        setIsNoteChanged(false);
        return { success: true, data, warning: callbackErr.message };
      }
    } catch (err: any) {
      console.error("Error updating note:", err);
      showError(err.message || "Failed to update note");
      return { success: false, error: err };
    } finally {
      setIsSaving(false);
    }
  };

  // Delete note from database - HARD DELETE
  // In NoteDetails component (paste-2.txt), update the deleteNoteFromDatabase function:
  const deleteNoteFromDatabase = async () => {
    if (!user || !user.id) {
      showError("You must be logged in to delete a note");
      return { success: false, error: "Authentication required" };
    }

    try {
      setIsDeleting(true);
      setError(null);

      // First, call the parent component's onNoteDelete callback
      if (onNoteDelete) {
        const deleteResult = await onNoteDelete(note.id);
        if (!deleteResult.success) {
          throw new Error(deleteResult.error || "Failed to delete note");
        }
      }

      // Always perform hard delete directly
      const { error } = await supabase.from("note").delete().eq("id", note.id);

      if (error) {
        if (
          error.code === "42501" ||
          error.message?.includes("row-level security policy")
        ) {
          throw new Error(
            "Permission denied. Make sure you're authorized to delete this note."
          );
        }

        throw new Error(error.message || "Failed to delete note from database");
      }

      showSuccess("Note permanently deleted");

      setTimeout(() => {
        setShowDeleteConfirmation(false);
        onClose(); // trigger parent UI update
      }, 1000);

      return { success: true };
    } catch (err: any) {
      console.error("Error deleting note:", err);
      showError(err.message || "Failed to delete note");
      return { success: false, error: err };
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveNote = async () => {
    const result = await updateNoteInDatabase();
    if (result.success) {
      // Delay closing to show success message
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirmation(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmation(false);
  };

  const handleConfirmDelete = async () => {
    const result = await deleteNoteFromDatabase();
    if (result.success) {
      // Delay closing to show success message
      setTimeout(() => {
        setShowDeleteConfirmation(false);
        onClose();
      }, 1000);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNoteTitle(value);
    setTitleCharCount(value.length);

    // Clear error if user starts typing a title after an empty title error
    if (error === "Title is required" && value.trim()) {
      setError(null);
    }
  };

  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setNoteDescription(value);
      setDescriptionCharCount(value.length);
      autoResizeTextarea(e.target as HTMLTextAreaElement);
    },
    []
  );

  // Auto-resize height of textarea based on content
  const autoResizeTextarea = useCallback((element: HTMLTextAreaElement) => {
    if (!element) return;

    // Reset height to ensure we get the correct scrollHeight
    element.style.height = "auto";
    // Set height to scrollHeight to expand to content
    element.style.height = element.scrollHeight + "px";
  }, []);

  useEffect(() => {
    const textarea = document.getElementById(
      "note-description"
    ) as HTMLTextAreaElement;
    if (textarea) {
      autoResizeTextarea(textarea);
    }
  }, [noteDescription, autoResizeTextarea]);

  if (!isOpen) return null;

  // Determine if light text should be used based on background color
  const useWhiteText = selectedColor
    ? !["#FFD60A", "#34C759", "#00C7BE"].includes(selectedColor)
    : isDark;

  // Style variables for better readability
  const textInputBase =
    "w-full p-2 rounded-md border focus:outline-none focus:ring-1";
  const textInputStyle = isDark
    ? "bg-gray-700 text-white border-gray-600 focus:border-orange-500 focus:ring-orange-500"
    : "bg-white text-gray-800 border-gray-300 focus:border-blue-500 focus:ring-blue-500";

  const labelColor = isDark ? "text-gray-300" : "text-gray-600";
  const borderColor = isDark ? "border-gray-700" : "border-gray-200";
  const sidebarBg = isDark
    ? "bg-gray-800 text-white"
    : "bg-white text-gray-800";

  // Format date for display
  const formattedDate = note.created_at
    ? new Date(
        typeof note.created_at === "string" ? note.created_at : note.created_at
      ).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Unknown date";

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end backdrop-blur-md bg-black/30"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) {
          if (showDeleteConfirmation) {
            setShowDeleteConfirmation(false);
          } else {
            handleClose();
          }
        }
      }}
    >
      <div
        ref={sidebarRef}
        className={`w-full max-w-md overflow-auto shadow-xl transition-transform duration-300 ease-in-out transform translate-x-0 ${sidebarBg}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`sticky top-0 z-10 flex items-center justify-between p-4 border-b ${borderColor} bg-inherit`}
        >
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold">Edit Note</h2>
            <p
              className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
            >
              Created: {formattedDate}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSaveNote}
              className={`p-2 rounded-full ${
                isDark
                  ? "bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700/50"
                  : "bg-gray-100 hover:bg-gray-200 disabled:bg-gray-100/50"
              } ${isProcessing ? "cursor-not-allowed" : ""} transition-colors duration-200`}
              aria-label="Save and close"
              disabled={isProcessing || !isNoteChanged}
              type="button"
            >
              <Check
                className={`w-4 h-4 ${
                  isDark ? "text-green-400" : "text-green-600"
                } ${isProcessing || !isNoteChanged ? "opacity-50" : ""}`}
              />
            </button>
            <button
              onClick={handleClose}
              className={`p-2 rounded-full ${
                isDark
                  ? "bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700/50"
                  : "bg-gray-100 hover:bg-gray-200 disabled:bg-gray-100/50"
              } ${isProcessing ? "cursor-not-allowed" : ""} transition-colors duration-200`}
              aria-label="Close without saving"
              disabled={isProcessing}
              type="button"
            >
              <X className={`w-4 h-4 ${isProcessing ? "opacity-50" : ""}`} />
            </button>
          </div>
        </div>

        {error && (
          <div
            className={`p-3 m-4 rounded-md flex items-center space-x-2 ${
              isDark ? "bg-red-900/30 text-red-300" : "bg-red-100 text-red-700"
            } animate-fadeIn`}
            role="alert"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div
            className={`p-3 m-4 rounded-md flex items-center space-x-2 ${
              isDark
                ? "bg-green-900/30 text-green-300"
                : "bg-green-100 text-green-700"
            } animate-fadeIn`}
            role="status"
          >
            <Check className="w-5 h-5 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="p-4 space-y-6">
          <div>
            <label
              htmlFor="note-title"
              className={`block text-sm font-medium mb-2 ${labelColor}`}
            >
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="note-title"
              type="text"
              value={noteTitle}
              onChange={handleTitleChange}
              className={`${textInputBase} ${textInputStyle} ${
                error === "Title is required"
                  ? isDark
                    ? "border-red-500 ring-1 ring-red-500"
                    : "border-red-500 ring-1 ring-red-500"
                  : ""
              } transition-colors duration-200`}
              disabled={isProcessing}
              maxLength={100}
              aria-required="true"
              placeholder="Note title"
              autoFocus
            />
            <div className="mt-1 flex justify-between">
              {error === "Title is required" ? (
                <p
                  className={`text-sm ${isDark ? "text-red-400" : "text-red-600"}`}
                >
                  Title cannot be empty
                </p>
              ) : (
                <div className="invisible">Placeholder</div>
              )}
              <div className="text-xs text-gray-500">{titleCharCount}/100</div>
            </div>
          </div>

          <div>
            <label
              htmlFor="note-description"
              className={`block text-sm font-medium mb-2 ${labelColor}`}
            >
              Description
            </label>
            <textarea
              id="note-description"
              rows={4}
              value={noteDescription}
              onChange={handleDescriptionChange}
              onInput={(e) =>
                autoResizeTextarea(e.target as HTMLTextAreaElement)
              }
              className={`${textInputBase} ${textInputStyle} transition-colors duration-200 min-h-[100px] max-h-[300px] overflow-y-auto`}
              disabled={isProcessing}
              maxLength={500}
              placeholder="Add a description (optional)"
            />
            <div className="mt-1 text-xs text-right text-gray-500">
              {descriptionCharCount}/500
            </div>
          </div>

          <div>
            <h3 className={`text-sm font-medium mb-2 ${labelColor}`}>
              Background Color
            </h3>
            <div className="flex flex-wrap gap-4">
              {LIST_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  className={`h-10 w-10 rounded-full relative shadow-md hover:shadow-lg transition-all duration-200 border-2 ${
                    color === selectedColor
                      ? isDark
                        ? "border-orange-500"
                        : "border-sky-500"
                      : "border-transparent"
                  } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                  aria-pressed={color === selectedColor}
                  disabled={isProcessing}
                  type="button"
                >
                  {color === selectedColor && (
                    <Check className="absolute top-2 left-2 h-5 w-5 text-white drop-shadow-md" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Delete Note Section */}
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleDeleteClick}
              className={`w-full flex items-center justify-center space-x-2 p-3 rounded-md ${
                isDark
                  ? "bg-red-900/30 text-red-300 hover:bg-red-900/50"
                  : "bg-red-50 text-red-600 hover:bg-red-100"
              } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""} transition-colors duration-200`}
              disabled={isProcessing}
              type="button"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              <span>Delete Note</span>
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirmation && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fadeIn">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={!isDeleting ? handleCancelDelete : undefined}
            ></div>
            <div
              className={`relative w-full max-w-sm p-6 rounded-lg shadow-xl ${
                isDark ? "bg-gray-800" : "bg-white"
              } animate-scaleIn`}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div
                  className={`p-2 rounded-full ${
                    isDark ? "bg-red-900/30" : "bg-red-100"
                  }`}
                >
                  <AlertTriangle
                    className={`w-6 h-6 ${
                      isDark ? "text-red-300" : "text-red-600"
                    }`}
                  />
                </div>
                <h3 className="text-lg font-semibold">Delete Note</h3>
              </div>

              <p className={`mb-6 ${labelColor}`}>
                Are you sure you want to delete this note? This action cannot be
                undone and the note will be permanently removed from the
                database.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCancelDelete}
                  className={`px-4 py-2 rounded-md ${
                    isDark
                      ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  } transition-colors duration-200`}
                  disabled={isDeleting}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className={`px-4 py-2 rounded-md flex items-center justify-center min-w-[90px] ${
                    isDark
                      ? "bg-red-700 hover:bg-red-600 text-white"
                      : "bg-red-600 hover:bg-red-700 text-white"
                  } ${isDeleting ? "opacity-70 cursor-not-allowed" : ""} transition-colors duration-200`}
                  disabled={isDeleting}
                  type="button"
                >
                  {isDeleting ? (
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
                    "Delete Permanently"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Use React.memo to prevent unnecessary re-renders
export default React.memo(NoteDetails);
