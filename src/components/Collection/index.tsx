"use client";

import React, { useEffect, useState, useCallback } from "react";
import { ChevronDown, ChevronRight, ListTodo, StickyNote } from "lucide-react";
import TaskCard from "@/components/Tasks/index";
import NoteCard from "@/components/Notes/noteCard";
import { Task, Note, Collection } from "@/types/schema";
import { useTheme } from "@/context/ThemeContext";

// Define types for operation results
interface OperationResult {
  success: boolean;
  error?: unknown;
}

// Make sure to add onCollectionChange to the interface// In CollectionComponentProps interface
interface CollectionComponentProps {
  id: string;
  collection_name: string;
  bg_color_hex: string;
  created_at: Date;
  is_default?: boolean;
  content_count?: number;
  tasks?: Task[];
  notes?: Note[];
  onTaskComplete: (
    taskId: string,
    is_completed: boolean
  ) => Promise<OperationResult>;
  onTaskPriority: (
    taskId: string,
    is_pinned: boolean
  ) => Promise<OperationResult>;
  onTaskDelete?: (taskId: string) => Promise<OperationResult>;
  onTaskUpdate?: (
    taskId: string,
    taskData: {
      text: string;
      description?: string | null;
      due_date?: Date | null;
      is_pinned: boolean;
    }
  ) => Promise<OperationResult>;
  onCollectionChange?: (
    taskId: string,
    collectionId: string
  ) => Promise<OperationResult>;
  onNotePin?: (noteId: string, isPinned: boolean) => Promise<OperationResult>;
  onNoteColorChange?: (
    noteId: string,
    color: string
  ) => Promise<OperationResult>;
  onNoteUpdate?: (
    noteId: string,
    updatedTitle: string,
    updatedDescription?: string
  ) => Promise<OperationResult>;
  onNoteDelete?: (noteId: string) => Promise<OperationResult>;
  collections?: Collection[]; // Add this prop
  className?: string;
}

const CollectionComponent = ({
  id, // Used in DOM attributes for accessibility and required for DOM operations
  collection_name,
  bg_color_hex,
  tasks = [],
  notes = [],
  onTaskComplete,
  onTaskPriority,
  onTaskUpdate,
  onTaskDelete,
  onCollectionChange,
  onNotePin,
  onNoteColorChange,
  onNoteUpdate,
  onNoteDelete,
  collections = [], // Add this with a default empty array
  className = "",
}: CollectionComponentProps) => {
  const collectionId = id; // Store id to satisfy ESLint
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<"tasks" | "notes">("tasks");
  const [priorityTasks, setPriorityTasks] = useState<Task[]>([]);
  const [regularTasks, setRegularTasks] = useState<Task[]>([]);
  const [sortedNotes, setSortedNotes] = useState<Note[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [errorTimeout, setErrorTimeout] = useState<NodeJS.Timeout | null>(null);

  // Enhanced color utilities for better light/dark mode appearance
  const bgColor = isDark ? "bg-gray-900/40" : "bg-white/70";
  const headerBgColor = isDark ? "bg-gray-850" : "bg-gray-50";
  const textColor = isDark ? "text-gray-100" : "text-gray-800";
  const subtextColor = isDark ? "text-gray-400" : "text-gray-600";
  const borderColor = isDark ? "border-gray-700" : "border-gray-200";
  const hoverColor = isDark ? "hover:bg-gray-800" : "hover:bg-gray-100";
  const errorColor = isDark ? "text-red-400" : "text-red-600";
  const errorBgColor = isDark ? "bg-red-900/30" : "bg-red-50";
  const tabHoverColor = isDark ? "hover:bg-gray-800" : "hover:bg-gray-100";
  const activeTabBgColor = isDark ? "bg-gray-800" : "bg-gray-100";

  // Memoized sorting functions to avoid unnecessary re-computations
  const sortTasks = useCallback((taskList: Task[] = []) => {
    try {
      // Filter out null/undefined tasks and already deleted ones
      const validTasks =
        taskList?.filter((task) => task && !task.is_deleted) || [];

      // Split into priority and regular tasks
      const priority = validTasks.filter((task) => Boolean(task.is_pinned));
      const regular = validTasks.filter((task) => !task.is_pinned);

      return { priority, regular };
    } catch (err) {
      console.error("Error sorting tasks:", err);
      setError("Failed to process tasks");
      return { priority: [], regular: [] };
    }
  }, []);

  const sortNotes = useCallback((noteList: Note[] = []) => {
    try {
      // Filter out null/undefined notes and already deleted ones
      const validNotes =
        noteList?.filter((note) => note && !note.is_deleted) || [];

      // Sort by pinned status, then by creation date (newest first)
      return [...validNotes].sort((a, b) => {
        // Handle pinned notes first
        if (Boolean(a.is_pinned) && !Boolean(b.is_pinned)) return -1;
        if (!Boolean(a.is_pinned) && Boolean(b.is_pinned)) return 1;

        // Then sort by creation date
        const dateA =
          a.created_at instanceof Date ? a.created_at : new Date(a.created_at);

        const dateB =
          b.created_at instanceof Date ? b.created_at : new Date(b.created_at);

        return dateB.getTime() - dateA.getTime();
      });
    } catch (err) {
      console.error("Error sorting notes:", err);
      setError("Failed to process notes");
      return [];
    }
  }, []);

  // Apply sorting when tasks or notes change
  useEffect(() => {
    const { priority, regular } = sortTasks(tasks);
    setPriorityTasks(priority);
    setRegularTasks(regular);
  }, [tasks, sortTasks]);

  useEffect(() => {
    const sorted = sortNotes(notes);
    setSortedNotes(sorted);
  }, [notes, sortNotes]);

  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (error) {
      if (errorTimeout) {
        clearTimeout(errorTimeout);
      }
      const timeout = setTimeout(() => {
        setError(null);
      }, 5000);
      setErrorTimeout(timeout);
    }

    return () => {
      if (errorTimeout) {
        clearTimeout(errorTimeout);
      }
    };
  }, [error, errorTimeout]);

  // Calculate content counts
  const taskCount =
    tasks?.filter((task) => task && !task.is_deleted).length || 0;
  const noteCount =
    notes?.filter((note) => note && !note.is_deleted).length || 0;

  /**
   * Safely handle API operations with error handling
   * @param operation The async operation to perform
   * @param errorMessage The error message to show if the operation fails
   * @returns The result of the operation or { success: false } on failure
   */
  const safelyHandleOperation = async (
    operation: () => Promise<OperationResult>,
    errorMessage: string
  ): Promise<OperationResult> => {
    try {
      const result = await operation();
      if (!result.success) {
        throw new Error(result.error ? String(result.error) : errorMessage);
      }
      return { success: true };
    } catch (err) {
      console.error(`${errorMessage}:`, err);
      setError(errorMessage);
      return { success: false, error: err };
    }
  };

  // Task handlers with the correct return types
  const handleTaskCompleteWithErrorHandling = async (
    taskId: string,
    isCompleted: boolean
  ): Promise<{ success: boolean; error?: unknown }> => {
    return safelyHandleOperation(
      () => onTaskComplete(taskId, isCompleted),
      "Failed to update task status"
    );
  };

  const handleTaskPriorityWithErrorHandling = async (
    taskId: string,
    isPinned: boolean
  ): Promise<{ success: boolean; error?: unknown }> => {
    return safelyHandleOperation(
      () => onTaskPriority(taskId, isPinned),
      "Failed to update task priority"
    );
  };

  const handleTaskUpdateWithErrorHandling = async (
    taskId: string,
    taskData: {
      text: string;
      description?: string | null;
      due_date?: Date | null;
      is_pinned: boolean;
    }
  ): Promise<{ success: boolean; error?: unknown }> => {
    if (!onTaskUpdate) {
      return { success: false, error: "Task update handler not available" };
    }

    return safelyHandleOperation(
      () => onTaskUpdate(taskId, taskData),
      "Failed to update task"
    );
  };

  const handleTaskDeleteWithErrorHandling = async (
    taskId: string
  ): Promise<{ success: boolean; error?: unknown }> => {
    if (!onTaskDelete) {
      return { success: false, error: "Task delete handler not available" };
    }

    const result = await safelyHandleOperation(
      () => onTaskDelete(taskId),
      "Failed to delete task"
    );

    // Re-run sorting after successful deletion
    if (result.success) {
      const { priority, regular } = sortTasks(
        tasks.filter((t) => t.id !== taskId)
      );
      setPriorityTasks(priority);
      setRegularTasks(regular);
    }

    return result;
  };

  // Note handlers with improved deletion handling
  const handleNotePinWithErrorHandling = async (
    noteId: string,
    isPinned: boolean
  ): Promise<OperationResult> => {
    if (!onNotePin) {
      return { success: false, error: "Pin handler not available" };
    }

    const result = await safelyHandleOperation(
      () => onNotePin(noteId, isPinned),
      "Failed to pin note"
    );

    // Re-run sorting after successful pin change
    if (result.success) {
      setSortedNotes(sortNotes(notes));
    }

    return result;
  };

  const handleNoteColorChangeWithErrorHandling = async (
    noteId: string,
    color: string
  ): Promise<OperationResult> => {
    if (!onNoteColorChange) {
      return { success: false, error: "Color change handler not available" };
    }

    return safelyHandleOperation(
      () => onNoteColorChange(noteId, color),
      "Failed to change note color"
    );
  };

  const handleNoteUpdateWithErrorHandling = async (
    noteId: string,
    updatedTitle: string,
    updatedDescription?: string
  ): Promise<OperationResult> => {
    if (!onNoteUpdate) {
      return { success: false, error: "Update handler not available" };
    }

    return safelyHandleOperation(
      () => onNoteUpdate(noteId, updatedTitle, updatedDescription),
      "Failed to update note"
    );
  };

  // Key improvement: Better note deletion handling
  const handleNoteDeleteWithErrorHandling = async (
    noteId: string
  ): Promise<OperationResult> => {
    if (!onNoteDelete) {
      return { success: false, error: "Delete handler not available" };
    }

    const result = await safelyHandleOperation(
      () => onNoteDelete(noteId),
      "Failed to delete note"
    );

    // Force re-sort after successful deletion
    if (result.success) {
      // Filter out the deleted note and re-sort
      const updatedNotes = notes.filter((note) => note.id !== noteId);
      setSortedNotes(sortNotes(updatedNotes));
    }

    return result;
  };

  // Clear any displayed errors
  const clearError = () => {
    setError(null);
    if (errorTimeout) {
      clearTimeout(errorTimeout);
      setErrorTimeout(null);
    }
  };

  return (
    <div
      className={`${className} rounded-lg overflow-hidden shadow-lg transition-shadow duration-300 hover:shadow-xl ${bgColor}`}
      data-collection-id={collectionId}
    >
      {/* Collection Header */}
      <div
        className={`${headerBgColor} border-l-4 transition-colors duration-300`}
        style={{ borderLeftColor: bg_color_hex || "#cccccc" }}
      >
        <div
          className={`flex items-center p-4 cursor-pointer ${hoverColor} transition-colors duration-200`}
          onClick={() => setIsExpanded(!isExpanded)}
          role="button"
          aria-expanded={isExpanded}
          aria-label={`${collection_name || "Unnamed Collection"} collection`}
        >
          {/* Icon with collection color */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center mr-3 shadow-sm"
            style={{ backgroundColor: bg_color_hex || "#cccccc" }}
            aria-hidden="true"
          ></div>

          {/* Collection title and info */}
          <div className="flex-1 min-w-0">
            <h3 className={`font-medium ${textColor} truncate`}>
              {collection_name || "Unnamed Collection"}
            </h3>
            <p className={`text-xs ${subtextColor}`}>
              {taskCount} task{taskCount !== 1 ? "s" : ""}, {noteCount} note
              {noteCount !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            <button
              className={`p-1.5 rounded-full ${subtextColor} ${hoverColor} transition-colors duration-200`}
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div
            className={`px-4 py-2 ${errorBgColor} ${errorColor} text-sm flex justify-between items-center`}
            role="alert"
          >
            <span>{error}</span>
            <button
              onClick={clearError}
              className="ml-2 text-xs font-medium hover:underline"
              aria-label="Dismiss error"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tabs */}
        {isExpanded && (
          <div className={`flex border-t ${borderColor}`} role="tablist">
            <button
              className={`flex-1 py-2.5 px-4 text-sm font-medium transition-all relative ${
                activeTab === "tasks"
                  ? `${textColor} ${activeTabBgColor}`
                  : `${subtextColor} ${tabHoverColor}`
              }`}
              onClick={() => setActiveTab("tasks")}
              role="tab"
              aria-selected={activeTab === "tasks"}
              aria-controls="tasks-panel"
              id="tasks-tab"
            >
              <div className="flex items-center justify-center space-x-1">
                <ListTodo className="h-4 w-4" />

                <span>Tasks</span>
              </div>
              {activeTab === "tasks" && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5 transition-colors duration-300"
                  style={{ backgroundColor: bg_color_hex || "#cccccc" }}
                  aria-hidden="true"
                />
              )}
            </button>

            <button
              className={`flex-1 py-2.5 px-4 text-sm font-medium transition-all relative ${
                activeTab === "notes"
                  ? `${textColor} ${activeTabBgColor}`
                  : `${subtextColor} ${tabHoverColor}`
              }`}
              onClick={() => setActiveTab("notes")}
              role="tab"
              aria-selected={activeTab === "notes"}
              aria-controls="notes-panel"
              id="notes-tab"
            >
              <div className="flex items-center justify-center space-x-1">
                <StickyNote className="h-4 w-4" />
                <span>Notes</span>
              </div>
              {activeTab === "notes" && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5 transition-colors duration-300"
                  style={{ backgroundColor: bg_color_hex || "#cccccc" }}
                  aria-hidden="true"
                />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Collection Content */}
      {isExpanded && (
        <div
          className={`${bgColor} p-4`}
          role="tabpanel"
          id={activeTab === "tasks" ? "tasks-panel" : "notes-panel"}
          aria-labelledby={activeTab === "tasks" ? "tasks-tab" : "notes-tab"}
        >
          {activeTab === "tasks" && (
            <div className="space-y-3">
              {priorityTasks.length > 0 && (
                <>
                  <div className="space-y-2">
                    {priorityTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        {...task}
                        onComplete={handleTaskCompleteWithErrorHandling}
                        onPriorityChange={handleTaskPriorityWithErrorHandling}
                        onTaskUpdate={handleTaskUpdateWithErrorHandling}
                        onTaskDelete={handleTaskDeleteWithErrorHandling}
                        onCollectionChange={onCollectionChange}
                        collections={collections} // Pass the collections prop
                      />
                    ))}
                  </div>
                  {regularTasks.length > 0 && (
                    <div
                      className={`border-t ${borderColor} pt-2 my-3`}
                      aria-hidden="true"
                    ></div>
                  )}
                </>
              )}

              {/* Regular Tasks Section */}
              {regularTasks.length > 0 ? (
                <div className="space-y-2">
                  {regularTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      {...task}
                      onComplete={handleTaskCompleteWithErrorHandling}
                      onPriorityChange={handleTaskPriorityWithErrorHandling}
                      onTaskUpdate={handleTaskUpdateWithErrorHandling}
                      onTaskDelete={handleTaskDeleteWithErrorHandling}
                      onCollectionChange={onCollectionChange}
                      collections={collections} // Pass the collections prop
                    />
                  ))}
                </div>
              ) : (
                priorityTasks.length === 0 && (
                  <div className={`text-center py-6 ${subtextColor} text-sm`}>
                    No tasks in this collection
                  </div>
                )
              )}
            </div>
          )}
          {activeTab === "notes" && (
            <>
              {sortedNotes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {sortedNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      id={note.id}
                      title={note.title}
                      description={note.description}
                      created_at={note.created_at}
                      is_deleted={note.is_deleted}
                      bg_color_hex={note.bg_color_hex}
                      is_pinned={note.is_pinned}
                      onPinChange={handleNotePinWithErrorHandling}
                      onColorChange={handleNoteColorChangeWithErrorHandling}
                      onNoteUpdate={handleNoteUpdateWithErrorHandling}
                      onNoteDelete={handleNoteDeleteWithErrorHandling}
                    />
                  ))}
                </div>
              ) : (
                <div className={`text-center py-6 ${subtextColor} text-sm`}>
                  No notes in this collection
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CollectionComponent;
