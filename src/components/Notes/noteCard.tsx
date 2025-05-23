"use client";

import React, { useEffect, useState, memo } from "react";
import { Pin, AlertCircle } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import NoteSidebar from "@/components/popupModels/notedetail";
import { Note } from "@/types/schema";
import { useRouter } from "next/navigation"; // ← import router

// Define a proper result type for operations
interface OperationResult {
  success: boolean;
  error?: unknown;
}

interface NoteCardProps {
  id: string;
  title: string | null;
  created_at: Date | string;
  is_deleted?: boolean | null;
  bg_color_hex?: string | null;
  is_pinned?: boolean | null;
  description?: string | null;
  collection_id?: string | null;
  list_id?: string | null; // Add this to match the schema
  user_id?: string | null; // Add this to match the schema
  onPinChange?: (noteId: string, isPinned: boolean) => Promise<OperationResult>;
  onColorChange?: (noteId: string, color: string) => Promise<OperationResult>;
  onNoteUpdate?: (
    noteId: string,
    updatedTitle: string,
    updatedDescription?: string
  ) => Promise<OperationResult>;
  onNoteDelete?: (noteId: string) => Promise<OperationResult>;
  className?: string;
}

const NoteCard = ({
  id,
  title,
  created_at,
  is_deleted = false,
  bg_color_hex,
  is_pinned = false,
  description,
  collection_id,
  list_id, // Add this prop
  user_id, // Add this prop
  onPinChange,
  onColorChange,
  onNoteUpdate,
  onNoteDelete,
  className = "",
}: NoteCardProps) => {
  const { theme } = useTheme();

  const isDark = theme === "dark";
  const router = useRouter(); // ← instantiate

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState(title || "");
  const [noteDescription, setNoteDescription] = useState(description || "");
  const [noteBackgroundColor, setNoteBackgroundColor] = useState(
    bg_color_hex || ""
  );
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorTimeout, setErrorTimeout] = useState<NodeJS.Timeout | null>(null);

  // Update local state when props change
  useEffect(() => {
    setNoteTitle(title || "");
    setNoteBackgroundColor(bg_color_hex || "");
    setNoteDescription(description || "");
  }, [title, bg_color_hex, description]);

  // Clear error after timeout
  useEffect(() => {
    return () => {
      if (errorTimeout) {
        clearTimeout(errorTimeout);
      }
    };
  }, [errorTimeout]);

  // If there's no title (null value from DB), use a placeholder
  const displayTitle = noteTitle || "Untitled Note";

  // Card styling
  // Card styling with glassy effect
  const cardStyle = noteBackgroundColor
    ? {
        backgroundColor: noteBackgroundColor,
        // Add subtle gradient overlay for glass effect but preserve base color
        backgroundImage: `linear-gradient(120deg, ${noteBackgroundColor}dd, ${noteBackgroundColor}aa)`,
      }
    : {};

  const bgClass = !noteBackgroundColor
    ? isDark
      ? "bg-gray-800"
      : "bg-yellow-50"
    : "";

  // Glass effect classes

  const useWhiteText = noteBackgroundColor
    ? !["#FFD60A", "#34C759", "#00C7BE"].includes(noteBackgroundColor)
    : isDark;

  const textColor = useWhiteText ? "text-white" : "text-gray-800";

  // Safe error handling function
  const showError = (errorMessage: string) => {
    setError(errorMessage);
    if (errorTimeout) {
      clearTimeout(errorTimeout);
    }
    const timeout = setTimeout(() => {
      setError(null);
    }, 3000);
    setErrorTimeout(timeout);
  };

  const handlePinClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!onPinChange || isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      const newPinState = !is_pinned;
      const result = await onPinChange(id, newPinState);

      if (!result.success) {
        throw new Error(
          result.error ? String(result.error) : "Failed to update pin status"
        );
      }

      // Local state will be updated via props when the parent component re-renders
    } catch (err) {
      console.error("Error toggling pin status:", err);
      showError("Failed to update pin status");
    } finally {
      setIsProcessing(false);
    }
  };

  const openSidebar = () => {
    if (!isProcessing) {
      setIsSidebarOpen(true);
    }
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  const updateNoteColor = async (noteId: string, color: string) => {
    if (!onColorChange)
      return Promise.resolve({
        success: false,
        error: "Color change handler not provided",
      });

    setIsProcessing(true);
    setError(null);

    try {
      const result = await onColorChange(noteId, color);

      if (!result.success) {
        throw new Error(
          result.error ? String(result.error) : "Failed to update note color"
        );
      }

      setNoteBackgroundColor(color);
      return { success: true };
    } catch (err) {
      console.error("Error updating note color:", err);
      showError("Failed to update note color");
      return { success: false, error: err };
    } finally {
      setIsProcessing(false);
    }
  };

  const updateNote = async (
    noteId: string,
    updatedTitle: string,
    updatedDescription?: string
  ) => {
    if (!onNoteUpdate)
      return Promise.resolve({
        success: false,
        error: "Update handler not provided",
      });

    setIsProcessing(true);
    setError(null);

    try {
      const result = await onNoteUpdate(
        noteId,
        updatedTitle,
        updatedDescription
      );

      if (!result.success) {
        throw new Error(
          result.error ? String(result.error) : "Failed to update note"
        );
      }

      setNoteTitle(updatedTitle);
      if (updatedDescription !== undefined) {
        setNoteDescription(updatedDescription);
      }

      return { success: true };
    } catch (err) {
      console.error("Error updating note:", err);
      showError("Failed to update note");
      return { success: false, error: err };
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!onNoteDelete)
      return Promise.resolve({
        success: false,
        error: "Delete handler not provided",
      });

    setIsProcessing(true);
    setError(null);

    try {
      const result = await onNoteDelete(noteId);
      if (!result.success) {
        throw new Error(
          result.error ? String(result.error) : "Failed to delete note"
        );
      }

      // Close the sidebar immediately without waiting for parent update
      closeSidebar();

      // The parent component will handle removing this note from the UI
      // No need to update local state here since the component will be unmounted
      router.refresh();

      return { success: true };
    } catch (err) {
      console.error("Error deleting note:", err);
      showError("Failed to delete note");
      return { success: false, error: err };
    } finally {
      setIsProcessing(false);
    }
  };

  // Create a Note object to pass to the sidebar
  const noteData: Note = {
    id,
    title: noteTitle as string | null,
    description: noteDescription as string | null,
    bg_color_hex: noteBackgroundColor as string | null,
    created_at:
      typeof created_at === "string" ? new Date(created_at) : created_at,
    collection_id: collection_id || null,
    list_id: list_id || null, // Add this
    user_id: user_id || null, // Add this
    is_pinned: is_pinned || false,
    is_deleted: is_deleted || false,
  };

  // Don't render if note is deleted
  if (is_deleted) {
    return null;
  }

  return (
    <>
      <div
        className={`
          rounded-lg p-4 shadow-sm hover:shadow-md
          relative overflow-hidden cursor-pointer
          w-full h-32 md:h-40
          transition-all duration-200 ease-in-out
          ${isProcessing ? "opacity-70 pointer-events-none" : ""}
          ${bgClass} ${className} 
        `}
        style={cardStyle}
        onClick={openSidebar}
        role="button"
        aria-label={`Open note: ${displayTitle}`}
        data-id={id}
      >
        {error && (
          <div className="absolute top-0 left-0 right-0 z-10 bg-red-500 bg-opacity-90 text-white text-xs py-1 px-2 flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" />
            {error}
          </div>
        )}

        <button
          onClick={handlePinClick}
          className={`absolute top-2 right-2 p-1 rounded-full txt-white transition-colors ${
            isDark
              ? "bg-gray-500/80 hover:bg-gray-600/50"
              : "bg-gray-500/80 hover:bg-gray-200/10"
          } ${isProcessing ? "opacity-50" : ""}`}
          aria-label={is_pinned ? "Unpin note" : "Pin note"}
          disabled={isProcessing}
          type="button"
        >
          <Pin className={`h-5 w-5 ${is_pinned ? "fill-current" : ""}`} />
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-2">
          <h4 className={`font-semibold ${textColor} truncate`}>
            {displayTitle}
          </h4>
          {noteDescription && (
            <p
              className={`text-xs line-clamp-1 ${textColor} opacity-80 break-words`}
              title={noteDescription}
            >
              {noteDescription}
            </p>
          )}
        </div>
      </div>

      {isSidebarOpen && (
        <NoteSidebar
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
          note={noteData}
          onColorChange={updateNoteColor}
          onNoteUpdate={updateNote}
          onNoteDelete={onNoteDelete ? deleteNote : undefined}
          isProcessing={isProcessing}
        />
      )}
    </>
  );
};

// Use memo to prevent unnecessary re-renders
export default memo(NoteCard);
