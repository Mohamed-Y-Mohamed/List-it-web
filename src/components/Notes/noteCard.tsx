"use client";

import React, { useEffect, useState, memo } from "react";
import { Pin, AlertCircle, Star, Edit3, Calendar } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import NoteSidebar from "@/components/popupModels/notedetail";
import { Note } from "@/types/schema";
import { useRouter } from "next/navigation";

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
  list_id?: string | null;
  user_id?: string | null;
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
  list_id,
  user_id,
  onPinChange,
  onColorChange,
  onNoteUpdate,
  onNoteDelete,
  className = "",
}: NoteCardProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState(title || "");
  const [noteDescription, setNoteDescription] = useState(description || "");
  const [noteBackgroundColor, setNoteBackgroundColor] = useState(
    bg_color_hex || ""
  );
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
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

  //  color logic with better defaults
  const getBackgroundStyle = () => {
    if (noteBackgroundColor) {
      return {
        background: `linear-gradient(135deg, ${noteBackgroundColor}dd 0%, ${noteBackgroundColor}aa 50%, ${noteBackgroundColor}bb 100%)`,
        backdropFilter: "blur(10px)",
        borderColor: `${noteBackgroundColor}40`,
      };
    }

    return isDark
      ? {
          background:
            "linear-gradient(135deg, rgba(31, 41, 55, 0.8) 0%, rgba(17, 24, 39, 0.9) 100%)",
          backdropFilter: "blur(10px)",
          borderColor: "rgba(75, 85, 99, 0.3)",
        }
      : {
          background:
            "linear-gradient(135deg, rgba(255, 248, 220, 0.8) 0%, rgba(254, 252, 232, 0.9) 100%)",
          backdropFilter: "blur(10px)",
          borderColor: "rgba(217, 119, 6, 0.2)",
        };
  };

  // Determine text color based on background
  const getTextColor = () => {
    if (!noteBackgroundColor) {
      return isDark ? "text-gray-100" : "text-gray-800";
    }

    // Light colors that need dark text
    const lightColors = ["#FFD60A", "#34C759", "#00C7BE", "#FF9F0A", "#30D158"];
    const isLightBackground =
      lightColors.includes(noteBackgroundColor) ||
      (noteBackgroundColor.includes("#") &&
        parseInt(noteBackgroundColor.slice(1, 3), 16) +
          parseInt(noteBackgroundColor.slice(3, 5), 16) +
          parseInt(noteBackgroundColor.slice(5, 7), 16) >
          384);

    return isLightBackground ? "text-gray-800" : "text-white";
  };

  const textColor = getTextColor();

  // Format date for display
  const formatDate = (date: Date | string) => {
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return dateObj.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year:
          dateObj.getFullYear() !== new Date().getFullYear()
            ? "numeric"
            : undefined,
      });
    } catch {
      return "Invalid date";
    }
  };

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

      closeSidebar();
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
    list_id: list_id || null,
    user_id: user_id || null,
    is_pinned: is_pinned || false,
    is_deleted: is_deleted || false,
  };

  // Don't render if note is deleted
  if (is_deleted) {
    return null;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className={`
          rounded-xl p-5 shadow-sm relative overflow-hidden cursor-pointer
          w-full h-40 md:h-44 border transition-all duration-300 group
          ${isProcessing ? "opacity-70 pointer-events-none" : ""}
          ${className}
        `}
        style={getBackgroundStyle()}
        onClick={openSidebar}
        whileHover={{ y: -4, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        role="button"
        aria-label={`Open note: ${displayTitle}`}
        data-id={id}
      >
        {/*  glow effect */}
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300 bg-gradient-to-br from-white/20 to-transparent" />

        {/* Error notification */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="absolute top-0 left-0 right-0 z-20 bg-red-500/90 backdrop-blur-sm text-white text-xs py-2 px-3 flex items-center rounded-t-xl"
            >
              <AlertCircle className="h-3 w-3 mr-2 flex-shrink-0" />
              <span className="truncate">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pin button */}
        <motion.button
          whileHover={{ scale: 1.1, rotate: 15 }}
          whileTap={{ scale: 0.9 }}
          onClick={handlePinClick}
          className={`absolute top-3 right-3 p-2 rounded-lg backdrop-blur-sm transition-all duration-200 z-10 ${
            isDark
              ? "bg-black/20 hover:bg-black/40 text-white/80 hover:text-white"
              : "bg-white/20 hover:bg-white/40 text-gray-700/80 hover:text-gray-900"
          } ${isProcessing ? "opacity-50" : ""}`}
          aria-label={is_pinned ? "Unpin note" : "Pin note"}
          disabled={isProcessing}
          type="button"
        >
          <Pin
            className={`h-4 w-4 transition-all duration-200 ${is_pinned ? "fill-current text-orange-400" : ""}`}
          />
        </motion.button>

        {/* Priority badge */}
        <AnimatePresence>
          {is_pinned && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium flex items-center backdrop-blur-sm ${
                isDark
                  ? "bg-orange-900/40 text-orange-300 border border-orange-500/30"
                  : "bg-orange-100/60 text-orange-700 border border-orange-300/50"
              }`}
            >
              <Star className="h-3 w-3 mr-1 fill-current" />
              Pinned
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content area */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {/* Title */}
            <h4
              className={`font-semibold text-lg ${textColor} truncate mb-2 relative`}
            >
              {displayTitle}
              <motion.div
                className={`absolute -bottom-1 left-0 h-0.5 bg-current opacity-0 group-hover:opacity-60 transition-opacity duration-300`}
                initial={{ width: 0 }}
                animate={{ width: isHovered ? "100%" : 0 }}
                transition={{ duration: 0.3 }}
              />
            </h4>

            {/* Description */}
            {noteDescription && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className={`text-sm line-clamp-2 ${textColor} opacity-80 break-words leading-relaxed`}
                title={noteDescription}
              >
                {noteDescription}
              </motion.p>
            )}

            {/* Date and metadata */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className={`flex items-center justify-between mt-3 pt-2 border-t ${
                textColor === "text-white"
                  ? "border-white/20"
                  : "border-gray-600/20"
              }`}
            >
              <div
                className={`flex items-center text-xs ${textColor} opacity-70`}
              >
                <Calendar className="h-3 w-3 mr-1" />
                <span>{formatDate(created_at)}</span>
              </div>

              <motion.div
                className={`flex items-center text-xs ${textColor} opacity-70`}
                whileHover={{ scale: 1.05 }}
              >
                <Edit3 className="h-3 w-3 mr-1" />
                <span>Edit</span>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* Hover indicator */}
        <motion.div
          className="absolute top-4 right-12 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          initial={{ scale: 0 }}
          animate={{ scale: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              textColor === "text-white" ? "bg-white/60" : "bg-gray-600/60"
            }`}
          />
        </motion.div>

        {/* Processing overlay */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center rounded-xl"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className={`w-6 h-6 border-2 border-t-transparent rounded-full ${
                  textColor === "text-white"
                    ? "border-white"
                    : "border-gray-600"
                }`}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/*  sidebar */}
      <AnimatePresence>
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
      </AnimatePresence>
    </>
  );
};

// Use memo to prevent unnecessary re-renders
export default memo(NoteCard);
