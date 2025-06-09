"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  ChevronDown,
  ListTodo,
  StickyNote,
  AlertCircle,
  X,
  Edit3,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TaskCard from "@/components/Tasks/index";
import NoteCard from "@/components/Notes/noteCard";
import { Task, Note, Collection } from "@/types/schema";
import { useTheme } from "@/context/ThemeContext";

// Define types for operation results
interface OperationResult {
  success: boolean;
  error?: unknown;
}

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
  onCollectionEdit?: (collection: Collection) => Promise<OperationResult>;
  collections?: Collection[];
  className?: string;
}

const EnhancedCollectionComponent = ({
  id,
  collection_name,
  bg_color_hex,
  created_at,
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
  onCollectionEdit,
  collections = [],
  className = "",
}: CollectionComponentProps) => {
  const collectionId = id;
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<"tasks" | "notes">("tasks");
  const [priorityTasks, setPriorityTasks] = useState<Task[]>([]);
  const [regularTasks, setRegularTasks] = useState<Task[]>([]);
  const [sortedNotes, setSortedNotes] = useState<Note[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [errorTimeout, setErrorTimeout] = useState<NodeJS.Timeout | null>(null);
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const [isHovered, setIsHovered] = useState(false);

  // Check if this is a "General" collection (case-insensitive)
  const isGeneralCollection = useCallback(() => {
    return collection_name?.toLowerCase().trim() === "general";
  }, [collection_name]);

  // Enhanced color scheme that complements our elegant background
  const getColorScheme = () => {
    if (isDark) {
      return {
        cardBg: "bg-gray-800/30",
        headerBg: "bg-gray-800/50",
        textPrimary: "text-gray-100",
        textSecondary: "text-gray-400",
        border: "border-gray-700/50",
        hover: "hover:bg-gray-700/50",
        errorText: "text-red-300",
        errorBg: "bg-red-900/20",
        tabHover: "hover:bg-gray-700/50",
        activeTab: "bg-gray-700/60",
        accent: "text-orange-400",
        accentBg: "bg-orange-400/30",
      };
    } else {
      return {
        cardBg: "bg-white/40",
        headerBg: "bg-white/60",
        textPrimary: "text-gray-900",
        textSecondary: "text-gray-600",
        border: "border-gray-300/50",
        hover: "hover:bg-gray-100/50",
        errorText: "text-red-700",
        errorBg: "bg-red-100/50",
        tabHover: "hover:bg-gray-200/50",
        activeTab: "bg-gray-200/60",
        accent: "text-orange-600",
        accentBg: "bg-orange-100/50",
      };
    }
  };

  const colors = getColorScheme();

  // Memoized sorting functions
  const sortTasks = useCallback((taskList: Task[] = []) => {
    try {
      // Filter out deleted AND completed tasks
      const validTasks =
        taskList?.filter(
          (task) => task && !task.is_deleted && !task.is_completed
        ) || [];
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
      const validNotes =
        noteList?.filter((note) => note && !note.is_deleted) || [];
      return [...validNotes].sort((a, b) => {
        if (Boolean(a.is_pinned) && !Boolean(b.is_pinned)) return -1;
        if (!Boolean(a.is_pinned) && Boolean(b.is_pinned)) return 1;

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
  useEffect(() => {
    // Force re-render when bg_color_hex prop changes
    // This ensures the UI updates immediately when parent updates the color
  }, [bg_color_hex]);
  const getEffectiveColor = useCallback(() => {
    // For General collections, the color might be updated externally
    // Return the current bg_color_hex prop
    return bg_color_hex || "#fb923c";
  }, [bg_color_hex]);
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
    tasks?.filter((task) => task && !task.is_deleted && !task.is_completed)
      .length || 0;
  const noteCount =
    notes?.filter((note) => note && !note.is_deleted).length || 0;

  // Safely handle API operations with error handling
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

  // Handle collection edit
  const handleCollectionEdit = async () => {
    if (!onCollectionEdit) return;

    const collectionData: Collection = {
      id: id,
      collection_name: collection_name || "",
      bg_color_hex: bg_color_hex || "",
      created_at: created_at,
      list_id: "", // This will be populated by the parent
      user_id: "", // This will be populated by the parent
      tasks: tasks || [],
      notes: notes || [],
    };

    try {
      await onCollectionEdit(collectionData);
    } catch (err) {
      console.error("Error editing collection:", err);
      setError("Failed to edit collection");
    }
  };

  // Task handlers with error handling
  const handleTaskCompleteWithErrorHandling = async (
    taskId: string,
    isCompleted: boolean
  ): Promise<{ success: boolean; error?: unknown }> => {
    const result = await safelyHandleOperation(
      () => onTaskComplete(taskId, isCompleted),
      "Failed to update task status"
    );

    // If task was completed successfully, remove it from local state immediately
    if (result.success && isCompleted) {
      const updatedTasks = tasks.filter((task) => task.id !== taskId);
      const { priority, regular } = sortTasks(updatedTasks);
      setPriorityTasks(priority);
      setRegularTasks(regular);
    }

    return result;
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

    if (result.success) {
      const { priority, regular } = sortTasks(
        tasks.filter((t) => t.id !== taskId)
      );
      setPriorityTasks(priority);
      setRegularTasks(regular);
    }

    return result;
  };

  // Note handlers
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

    if (result.success) {
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`${className} rounded-xl overflow-hidden shadow-lg transition-all duration-300 backdrop-blur-sm border ${colors.border} ${colors.cardBg}`}
      data-collection-id={collectionId}
    >
      {/* Collection Header */}
      <div className={`${colors.headerBg} backdrop-blur-sm relative`}>
        {/* Accent border with collection color */}
        <div
          className="absolute top-0 left-0 right-0 h-1 opacity-80"
          style={{ backgroundColor: getEffectiveColor() }}
        />

        <motion.div
          className={`flex items-center p-5 cursor-pointer ${colors.hover} transition-all duration-200 relative`}
          onClick={() => setIsExpanded(!isExpanded)}
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.98 }}
          role="button"
          aria-expanded={isExpanded}
          aria-label={`${collection_name || "Unnamed Collection"} collection`}
        >
          {/* Enhanced collection icon */}
          <motion.div
            className="relative mr-4"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-sm"
              style={{
                backgroundColor: getEffectiveColor(),
                boxShadow: `0 4px 20px ${getEffectiveColor()}30`,
              }}
            ></div>
            <div
              className="absolute inset-0 rounded-xl opacity-30 blur-md"
              style={{ backgroundColor: getEffectiveColor() }}
            />
          </motion.div>

          {/* Collection info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              <h3
                className={`font-semibold text-lg ${colors.textPrimary} truncate`}
              >
                {collection_name || "Unnamed Collection"}
              </h3>

              {/* Content badges */}
              <div className="flex items-center space-x-2">
                {taskCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`px-2 py-1 rounded-full text-xs font-medium ${colors.accentBg} ${colors.accent}`}
                  >
                    {taskCount} task{taskCount !== 1 ? "s" : ""}
                  </motion.span>
                )}

                {noteCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`px-2 py-1 rounded-full text-xs font-medium    ${isDark ? "bg-blue-900/30 text-blue-400" : "bg-blue-100/50 text-blue-600"}`}
                  >
                    {noteCount} note{noteCount !== 1 ? "s" : ""}
                  </motion.span>
                )}
              </div>
            </div>

            <p className={`text-sm ${colors.textSecondary} mt-1`}>
              {taskCount + noteCount} total items
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2 ml-4">
            {/* Edit button - only show if not General collection */}
            {!isGeneralCollection() && onCollectionEdit && (
              <motion.button
                className={`p-2 rounded-lg ${colors.textSecondary} ${colors.hover} transition-colors duration-200`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCollectionEdit();
                }}
                aria-label="Edit collection"
              >
                <Edit3 className="h-4 w-4" />
              </motion.button>
            )}

            {/* Expand/Collapse button */}
            <motion.button
              className={`p-2 rounded-lg ${colors.textSecondary} ${colors.hover} transition-colors duration-200`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              <motion.div
                animate={{ rotate: isExpanded ? 0 : -90 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronDown className="h-5 w-5" />
              </motion.div>
            </motion.button>
          </div>
        </motion.div>

        {/* Error notification */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className={`px-5 py-3 ${colors.errorBg} ${colors.errorText} text-sm flex justify-between items-center backdrop-blur-sm`}
              role="alert"
            >
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>{error}</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={clearError}
                className="ml-3 p-1 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Dismiss error"
              >
                <X className="h-4 w-4" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced tabs */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex border-t ${colors.border} backdrop-blur-sm`}
              role="tablist"
            >
              {["tasks", "notes"].map((tab) => (
                <motion.button
                  key={tab}
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-all relative ${
                    activeTab === tab
                      ? `${colors.textPrimary} ${colors.activeTab}`
                      : `${colors.textSecondary} ${colors.tabHover}`
                  }`}
                  onClick={() => setActiveTab(tab as "tasks" | "notes")}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  role="tab"
                  aria-selected={activeTab === tab}
                  aria-controls={`${tab}-panel`}
                  id={`${tab}-tab`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    {tab === "tasks" ? (
                      <ListTodo className="h-4 w-4" />
                    ) : (
                      <StickyNote className="h-4 w-4" />
                    )}
                    <span className="capitalize">{tab}</span>

                    {/* Count badges */}
                    {((tab === "tasks" && taskCount > 0) ||
                      (tab === "notes" && noteCount > 0)) && (
                      <span
                        className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                          activeTab === tab
                            ? "bg-white/20 text-current"
                            : "bg-gray-500/20 text-gray-500"
                        }`}
                      >
                        {tab === "tasks" ? taskCount : noteCount}
                      </span>
                    )}
                  </div>

                  {/* Active tab indicator */}
                  {activeTab === tab && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                      style={{ backgroundColor: getEffectiveColor() }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Collection Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className={`${colors.cardBg} p-5 backdrop-blur-sm`}
            role="tabpanel"
            id={activeTab === "tasks" ? "tasks-panel" : "notes-panel"}
            aria-labelledby={activeTab === "tasks" ? "tasks-tab" : "notes-tab"}
          >
            {activeTab === "tasks" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="space-y-4"
              >
                {/* Priority tasks */}
                {priorityTasks.length > 0 && (
                  <>
                    <div className="space-y-3">
                      {priorityTasks.map((task, index) => (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          <TaskCard
                            {...task}
                            onComplete={handleTaskCompleteWithErrorHandling}
                            onPriorityChange={
                              handleTaskPriorityWithErrorHandling
                            }
                            onTaskUpdate={handleTaskUpdateWithErrorHandling}
                            onTaskDelete={handleTaskDeleteWithErrorHandling}
                            onCollectionChange={onCollectionChange}
                            collections={collections}
                          />
                        </motion.div>
                      ))}
                    </div>

                    {regularTasks.length > 0 && (
                      <div className={`border-t ${colors.border} pt-4`} />
                    )}
                  </>
                )}

                {/* Regular tasks */}
                {regularTasks.length > 0 ? (
                  <div className="space-y-3">
                    {regularTasks.map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: (priorityTasks.length + index) * 0.1,
                        }}
                      >
                        <TaskCard
                          {...task}
                          onComplete={handleTaskCompleteWithErrorHandling}
                          onPriorityChange={handleTaskPriorityWithErrorHandling}
                          onTaskUpdate={handleTaskUpdateWithErrorHandling}
                          onTaskDelete={handleTaskDeleteWithErrorHandling}
                          onCollectionChange={onCollectionChange}
                          collections={collections}
                        />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  priorityTasks.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4 }}
                      className={`text-center py-12 ${colors.textSecondary}`}
                    >
                      <ListTodo className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-lg font-medium mb-1">No tasks yet</p>
                      <p className="text-sm">Add tasks to organize your work</p>
                    </motion.div>
                  )
                )}
              </motion.div>
            )}

            {activeTab === "notes" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                {sortedNotes.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {sortedNotes.map((note, index) => (
                      <motion.div
                        key={note.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <NoteCard
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
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className={`text-center py-12 ${colors.textSecondary}`}
                  >
                    <StickyNote className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium mb-1">No notes yet</p>
                    <p className="text-sm">
                      Create notes to capture your ideas
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default EnhancedCollectionComponent;
