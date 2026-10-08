"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Edit3,
  ListTodo,
  Pin,
  StickyNote,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import TaskCard from "@/components/Tasks/index";
import NoteCard from "@/components/Notes/noteCard";
import { Collection, Note, OperationResult, Task } from "@/types/schema";
import { useTheme } from "@/context/ThemeContext";
import { STATUS_META } from "@/components/ui/tokens";
import { IS_NATIVE_BUILD } from "@/lib/platform";
import SwipeableRow, {
  type SwipeAction,
} from "@/components/native/SwipeableRow";

/**
 * The four task states, in the order the legend reads them.
 *
 * `normal` carries no label on a card, so its name is written here rather than
 * taken from `STATUS_META`; the colours come from the shared map so the legend
 * cannot describe one thing and the cards draw another.
 */
const LEGEND = [
  { label: "Normal", colour: STATUS_META.normal.colour },
  { label: STATUS_META.pinned.label, colour: STATUS_META.pinned.colour },
  { label: STATUS_META.overdue.label, colour: STATUS_META.overdue.colour },
  { label: STATUS_META.flagged.label, colour: STATUS_META.flagged.colour },
] as const;

const STAGGER_STEP = 0.055;
const MAX_STAGGERED_ITEMS = 6;

const entranceDelay = (index: number): number =>
  Math.min(index, MAX_STAGGERED_ITEMS) * STAGGER_STEP;

const MaybeSwipeable = ({
  leading,
  trailing,
  children,
}: {
  leading?: SwipeAction;
  trailing?: SwipeAction;
  children: React.ReactNode;
}) =>
  IS_NATIVE_BUILD ? (
    <SwipeableRow leading={leading} trailing={trailing}>
      {children}
    </SwipeableRow>
  ) : (
    <>{children}</>
  );

interface CollectionComponentProps {
  id: string;
  collection_name: string;
  bg_color_hex: string;
  created_at: Date;
  is_default?: boolean;
  content_count?: number;
  tasks?: Task[];
  notes?: Note[];

  /**
   * Bumped by the list screen's "Collapse all". A counter rather than a
   * boolean: the same instruction has to be able to fire twice, and a flag
   * that is already `true` cannot say "again".
   */
  collapseNonce?: number;

  /**
   * Open this collection without the user touching it. Set only for the
   * collection holding the task behind a tapped reminder, so everything else
   * on the screen stays shut.
   */
  autoExpand?: boolean;

  onTaskComplete: (
    taskId: string,
    is_completed: boolean,
  ) => Promise<OperationResult>;

  onTaskPriority: (
    taskId: string,
    is_pinned: boolean,
  ) => Promise<OperationResult>;

  onTaskDelete?: (taskId: string) => Promise<OperationResult>;

  onTaskUpdate?: (
    taskId: string,
    taskData: {
      text: string;
      description?: string | null;
      due_date?: Date | null;
      is_pinned: boolean;
    },
  ) => Promise<OperationResult>;

  onCollectionChange?: (
    taskId: string,
    collectionId: string,
  ) => Promise<OperationResult>;

  onNotePin?: (noteId: string, isPinned: boolean) => Promise<OperationResult>;

  onNoteColorChange?: (
    noteId: string,
    color: string,
  ) => Promise<OperationResult>;

  onNoteUpdate?: (
    noteId: string,
    updatedTitle: string,
    updatedDescription?: string,
  ) => Promise<OperationResult>;

  onNoteDelete?: (noteId: string) => Promise<OperationResult>;

  onCollectionEdit?: (collection: Collection) => Promise<OperationResult>;

  collections?: Collection[];
  className?: string;
}

type Tab = "tasks" | "notes";

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
  collapseNonce,
  autoExpand = false,
}: CollectionComponentProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  /* All collections begin collapsed. */
  const [isExpanded, setIsExpanded] = useState(false);

  /*
   * Collapse all.
   *
   * Keyed on the nonce alone, and deliberately not on mount: the initial run
   * is skipped by the ref so arriving on the screen does not count as an
   * instruction to collapse something the user has just been sent to.
   */
  const lastCollapseNonce = useRef(collapseNonce);
  useEffect(() => {
    if (collapseNonce === lastCollapseNonce.current) return;
    lastCollapseNonce.current = collapseNonce;
    setIsExpanded(false);
  }, [collapseNonce]);

  /*
   * Opened from a tapped reminder.
   *
   * Runs when the flag turns on rather than on every render, so the user can
   * still close the collection afterwards and have it stay closed.
   */
  useEffect(() => {
    if (autoExpand) setIsExpanded(true);
  }, [autoExpand]);
  const [activeTab, setActiveTab] = useState<Tab>("tasks");

  const [priorityTasks, setPriorityTasks] = useState<Task[]>([]);
  const [regularTasks, setRegularTasks] = useState<Task[]>([]);
  const [sortedNotes, setSortedNotes] = useState<Note[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isGeneralCollection = useCallback(
    () => collection_name?.toLowerCase().trim() === "general",
    [collection_name],
  );

  const getEffectiveColor = useCallback(
    () => bg_color_hex || "#fb923c",
    [bg_color_hex],
  );

  const colors = isDark
    ? {
        textPrimary: "text-slate-100",
        textSecondary: "text-slate-400",
        textMuted: "text-slate-500",
        outer: "border-white/[0.055] bg-white/[0.018]",
        header: "bg-white/[0.012]",
        content: "bg-transparent",
        border: "border-white/[0.06]",
        buttonHover: "hover:bg-white/[0.055]",
        activeTab: "text-slate-100",
        inactiveTab: "text-slate-500 hover:text-slate-300",
        count: "text-slate-500",
        errorBg: "bg-rose-500/[0.08]",
        errorText: "text-rose-300",
      }
    : {
        textPrimary: "text-slate-900",
        textSecondary: "text-slate-600",
        textMuted: "text-slate-400",
        outer: "border-slate-200/70 bg-white/35",
        header: "bg-white/25",
        content: "bg-transparent",
        border: "border-slate-200/70",
        buttonHover: "hover:bg-slate-100/70",
        activeTab: "text-slate-900",
        inactiveTab: "text-slate-400 hover:text-slate-700",
        count: "text-slate-400",
        errorBg: "bg-rose-50/70",
        errorText: "text-rose-700",
      };

  /* =======================================================
     SORTING
     ======================================================= */

  const sortTasks = useCallback((taskList: Task[] = []) => {
    try {
      const validTasks = taskList.filter(
        (task) => task && !task.is_deleted && !task.is_completed,
      );

      return {
        priority: validTasks.filter((task) => Boolean(task.is_pinned)),
        regular: validTasks.filter((task) => !task.is_pinned),
      };
    } catch (err) {
      console.error("Error sorting tasks:", err);
      setError("Failed to process tasks");

      return {
        priority: [],
        regular: [],
      };
    }
  }, []);

  const sortNotes = useCallback((noteList: Note[] = []) => {
    try {
      const validNotes = noteList.filter((note) => note && !note.is_deleted);

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

  useEffect(() => {
    const { priority, regular } = sortTasks(tasks);

    setPriorityTasks(priority);
    setRegularTasks(regular);
  }, [tasks, sortTasks]);

  useEffect(() => {
    setSortedNotes(sortNotes(notes));
  }, [notes, sortNotes]);

  useEffect(() => {
    if (!error) return;

    const timeout = setTimeout(() => {
      setError(null);
    }, 5000);

    return () => clearTimeout(timeout);
  }, [error]);

  /* =======================================================
     COUNTS
     ======================================================= */

  const taskCount = tasks.filter(
    (task) => task && !task.is_deleted && !task.is_completed,
  ).length;

  const noteCount = notes.filter((note) => note && !note.is_deleted).length;

  /* =======================================================
     SAFE OPERATION
     ======================================================= */

  const safelyHandleOperation = async (
    operation: () => Promise<OperationResult>,
    errorMessage: string,
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

      return {
        success: false,
        error: err,
      };
    }
  };

  /* =======================================================
     COLLECTION
     ======================================================= */

  const handleCollectionEdit = async () => {
    if (!onCollectionEdit) return;

    const collectionData: Collection = {
      id,
      collection_name: collection_name || "",
      bg_color_hex: bg_color_hex || "",
      created_at,
      list_id: "",
      user_id: "",
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

  /* =======================================================
     TASK OPERATIONS
     ======================================================= */

  const handleTaskCompleteWithErrorHandling = async (
    taskId: string,
    isCompleted: boolean,
  ): Promise<OperationResult> => {
    const result = await safelyHandleOperation(
      () => onTaskComplete(taskId, isCompleted),
      "Failed to update task status",
    );

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
    isPinned: boolean,
  ): Promise<OperationResult> =>
    safelyHandleOperation(
      () => onTaskPriority(taskId, isPinned),
      "Failed to update task priority",
    );

  const handleTaskUpdateWithErrorHandling = async (
    taskId: string,
    taskData: {
      text: string;
      description?: string | null;
      due_date?: Date | null;
      is_pinned: boolean;
    },
  ): Promise<OperationResult> => {
    if (!onTaskUpdate) {
      return {
        success: false,
        error: "Task update handler not available",
      };
    }

    return safelyHandleOperation(
      () => onTaskUpdate(taskId, taskData),
      "Failed to update task",
    );
  };

  const handleTaskDeleteWithErrorHandling = async (
    taskId: string,
  ): Promise<OperationResult> => {
    if (!onTaskDelete) {
      return {
        success: false,
        error: "Task delete handler not available",
      };
    }

    const result = await safelyHandleOperation(
      () => onTaskDelete(taskId),
      "Failed to delete task",
    );

    if (result.success) {
      const { priority, regular } = sortTasks(
        tasks.filter((task) => task.id !== taskId),
      );

      setPriorityTasks(priority);
      setRegularTasks(regular);
    }

    return result;
  };

  /* =======================================================
     NOTE OPERATIONS
     ======================================================= */

  const handleNotePinWithErrorHandling = async (
    noteId: string,
    isPinned: boolean,
  ): Promise<OperationResult> => {
    if (!onNotePin) {
      return {
        success: false,
        error: "Pin handler not available",
      };
    }

    const result = await safelyHandleOperation(
      () => onNotePin(noteId, isPinned),
      "Failed to pin note",
    );

    if (result.success) {
      setSortedNotes(sortNotes(notes));
    }

    return result;
  };

  const handleNoteColorChangeWithErrorHandling = async (
    noteId: string,
    color: string,
  ): Promise<OperationResult> => {
    if (!onNoteColorChange) {
      return {
        success: false,
        error: "Color change handler not available",
      };
    }

    return safelyHandleOperation(
      () => onNoteColorChange(noteId, color),
      "Failed to change note color",
    );
  };

  const handleNoteUpdateWithErrorHandling = async (
    noteId: string,
    updatedTitle: string,
    updatedDescription?: string,
  ): Promise<OperationResult> => {
    if (!onNoteUpdate) {
      return {
        success: false,
        error: "Update handler not available",
      };
    }

    return safelyHandleOperation(
      () => onNoteUpdate(noteId, updatedTitle, updatedDescription),
      "Failed to update note",
    );
  };

  const handleNoteDeleteWithErrorHandling = async (
    noteId: string,
  ): Promise<OperationResult> => {
    if (!onNoteDelete) {
      return {
        success: false,
        error: "Delete handler not available",
      };
    }

    const result = await safelyHandleOperation(
      () => onNoteDelete(noteId),
      "Failed to delete note",
    );

    if (result.success) {
      setSortedNotes(sortNotes(notes.filter((note) => note.id !== noteId)));
    }

    return result;
  };

  /* =======================================================
     NATIVE SWIPE ACTIONS
     ======================================================= */

  const taskSwipeComplete = (taskId: string): SwipeAction => ({
    label: "Done",
    icon: CheckCircle2,
    background: "bg-emerald-600",
    onAction: () => void handleTaskCompleteWithErrorHandling(taskId, true),
  });

  const taskSwipeDelete = (taskId: string): SwipeAction => ({
    label: "Delete",
    icon: Trash2,
    background: "bg-red-600",
    onAction: () => void handleTaskDeleteWithErrorHandling(taskId),
  });

  const noteSwipePin = (noteId: string, isPinned: boolean): SwipeAction => ({
    label: isPinned ? "Unpin" : "Pin",
    icon: Pin,
    background: "bg-orange-500",
    onAction: () => void handleNotePinWithErrorHandling(noteId, !isPinned),
  });

  const noteSwipeDelete = (noteId: string): SwipeAction => ({
    label: "Delete",
    icon: Trash2,
    background: "bg-red-600",
    onAction: () => void handleNoteDeleteWithErrorHandling(noteId),
  });

  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        y: -8,
      }}
      transition={{
        duration: 0.25,
      }}
      data-collection-id={id}
      className={`
        ${className}
        overflow-hidden
        rounded-[18px]
        border
        backdrop-blur-[14px]
        transition-colors
        duration-200
        ${colors.outer}
      `}
    >
      {/* ===================================================
          HEADER
         =================================================== */}

      <div
        className={`
          relative
          ${colors.header}
        `}
      >
        {/* Equal top/bottom padding keeps chevron centred */}
        <div
          className="
            px-4
            py-4
            sm:px-5
            sm:py-5
          "
        >
          <div className="flex items-center gap-3">
            {/* Collection colour */}
            <div
              className="
                h-2.5
                w-2.5
                shrink-0
                rounded-full
              "
              style={{
                backgroundColor: getEffectiveColor(),
                boxShadow: `0 0 0 3px ${getEffectiveColor()}14`,
              }}
              aria-hidden="true"
            />

            {/* Title + counts */}
            <button
              type="button"
              onClick={() => setIsExpanded((previous) => !previous)}
              aria-expanded={isExpanded}
              className="
                min-w-0
                flex-1
                text-left
              "
            >
              <div
                className="
                  flex
                  flex-wrap
                  items-baseline
                  gap-x-3
                  gap-y-0.5
                "
              >
                <h3
                  className={`
                    max-w-full
                    truncate
                    text-[16px]
                    font-semibold
                    leading-6
                    tracking-[-0.015em]
                    sm:text-[17px]
                    ${colors.textPrimary}
                  `}
                >
                  {collection_name || "Unnamed Collection"}
                </h3>

                <span
                  className={`
                    whitespace-nowrap
                    text-[11px]
                    font-medium
                    leading-5
                    ${colors.count}
                  `}
                >
                  {taskCount} {taskCount === 1 ? "Task" : "Tasks"}
                  <span className="mx-1.5 opacity-50">·</span>
                  {noteCount} {noteCount === 1 ? "Note" : "Notes"}
                </span>
              </div>
            </button>

            {/* Header actions */}
            <div
              className="
                -mr-1
                flex
                shrink-0
                items-center
                gap-0.5
              "
            >
              {!isGeneralCollection() && onCollectionEdit && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    void handleCollectionEdit();
                  }}
                  aria-label="Edit collection"
                  className={`
                    flex
                    h-8
                    w-8
                    shrink-0
                    items-center
                    justify-center
                    rounded-lg
                    p-0
                    transition-colors
                    ${colors.textMuted}
                    ${colors.buttonHover}
                  `}
                >
                  <Edit3 className="h-[15px] w-[15px]" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsExpanded((previous) => !previous)}
                aria-label={
                  isExpanded ? "Collapse collection" : "Expand collection"
                }
                aria-expanded={isExpanded}
                className={`
                  flex
                  h-8
                  w-8
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  p-0
                  transition-colors
                  ${colors.textMuted}
                  ${colors.buttonHover}
                `}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {isExpanded ? (
                    <motion.span
                      key="expanded"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.1 }}
                      className="
                        flex
                        h-5
                        w-5
                        items-center
                        justify-center
                      "
                    >
                      <ChevronDown className="h-4 w-4" strokeWidth={2} />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="collapsed"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.1 }}
                      className="
                        flex
                        h-5
                        w-5
                        items-center
                        justify-center
                      "
                    >
                      <ChevronRight className="h-4 w-4" strokeWidth={2} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div
                role="alert"
                className={`
                  mx-4
                  mb-3
                  flex
                  items-center
                  justify-between
                  gap-3
                  rounded-lg
                  px-3
                  py-2.5
                  text-[12px]
                  sm:mx-5
                  ${colors.errorBg}
                  ${colors.errorText}
                `}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />

                  <span className="truncate">{error}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setError(null)}
                  aria-label="Dismiss error"
                  className="
                    shrink-0
                    rounded-md
                    p-1
                    hover:bg-black/5
                  "
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* =================================================
            EXPANDED CONTROLS
           ================================================= */}

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{
                opacity: 0,
                height: 0,
              }}
              animate={{
                opacity: 1,
                height: "auto",
              }}
              exit={{
                opacity: 0,
                height: 0,
              }}
              transition={{
                duration: 0.2,
              }}
              className="overflow-hidden"
            >
              <div
                className="
                  px-4
                  pb-1
                  sm:px-5
                "
              >
                {/* =========================================
                    TASKS / NOTES SEGMENTED SWITCH

                    Outer box makes it obvious that these
                    controls switch the collection view.

                    Active tab gets:
                    - stronger surface
                    - inner border
                    - collection-colour indicator
                   ========================================= */}

                <div
                  role="tablist"
                  aria-label="Collection content"
                  className={`
                    inline-flex
                    items-center
                    gap-1
                    rounded-lg
                    border
                    p-1
                    ${
                      isDark
                        ? "border-white/[0.07] bg-white/[0.025]"
                        : "border-slate-200/80 bg-slate-100/50"
                    }
                  `}
                >
                  {(
                    [
                      {
                        key: "tasks",
                        label: "Tasks",
                        icon: ListTodo,
                        count: taskCount,
                      },
                      {
                        key: "notes",
                        label: "Notes",
                        icon: StickyNote,
                        count: noteCount,
                      },
                    ] as const
                  ).map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.key;

                    return (
                      <button
                        key={tab.key}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        aria-controls={`${tab.key}-panel`}
                        id={`${tab.key}-tab`}
                        onClick={() => setActiveTab(tab.key)}
                        className={`
                          relative
                          flex
                          h-8
                          items-center
                          gap-1.5
                          rounded-md
                          border
                          px-3
                          text-[12px]
                          font-medium
                          transition-all
                          duration-150

                          ${
                            active
                              ? isDark
                                ? "border-white/[0.09] bg-white/[0.08] text-slate-100 shadow-sm"
                                : "border-slate-200 bg-white text-slate-900 shadow-sm"
                              : isDark
                                ? "border-transparent text-slate-500 hover:bg-white/[0.035] hover:text-slate-300"
                                : "border-transparent text-slate-500 hover:bg-white/60 hover:text-slate-700"
                          }
                        `}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />

                        <span>{tab.label}</span>

                        <span
                          className={`
                            text-[10px]
                            font-medium
                            ${active ? "opacity-70" : "opacity-50"}
                          `}
                        >
                          {tab.count}
                        </span>

                        {active && (
                          <motion.span
                            layoutId={`collection-active-tab-${id}`}
                            className="
                              absolute
                              bottom-[3px]
                              left-3
                              right-3
                              h-[2px]
                              rounded-full
                            "
                            style={{
                              backgroundColor: getEffectiveColor(),
                            }}
                            transition={{
                              type: "spring",
                              stiffness: 450,
                              damping: 36,
                            }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* =========================================
                    TASK STATUS LEGEND
                   ========================================= */}

                <AnimatePresence initial={false}>
                  {activeTab === "tasks" && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: -3,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      exit={{
                        opacity: 0,
                        y: -3,
                      }}
                      transition={{
                        duration: 0.15,
                      }}
                      aria-label="Task status legend"
                      className="
                        flex
                        flex-wrap
                        items-center
                        gap-x-4
                        gap-y-1.5
                        py-3
                      "
                    >
                      {/* The legend names the four states, so it has to read
                          its colours from the same place the cards do. This was
                          a third hand-written copy of the palette. */}
                      {LEGEND.map((entry) => (
                        <span
                          key={entry.label}
                          className={`
                            inline-flex
                            items-center
                            gap-1.5
                            whitespace-nowrap
                            text-[10px]
                            font-medium
                            ${colors.textMuted}
                          `}
                        >
                          <span
                            className="
                              h-[7px]
                              w-[7px]
                              shrink-0
                              rounded-full
                            "
                            style={{
                              backgroundColor: entry.colour,
                              boxShadow: `0 0 0 2px ${entry.colour}12`,
                            }}
                            aria-hidden="true"
                          />

                          {entry.label}
                        </span>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===================================================
          CONTENT
         =================================================== */}

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{
              opacity: 0,
              height: 0,
            }}
            animate={{
              opacity: 1,
              height: "auto",
            }}
            exit={{
              opacity: 0,
              height: 0,
            }}
            transition={{
              duration: 0.2,
            }}
            className="overflow-hidden"
          >
            <div
              role="tabpanel"
              id={activeTab === "tasks" ? "tasks-panel" : "notes-panel"}
              aria-labelledby={
                activeTab === "tasks" ? "tasks-tab" : "notes-tab"
              }
              className={`
                px-3
                pb-4
                sm:px-4
                sm:pb-5

                ${activeTab === "notes" ? "pt-4 sm:pt-5" : "pt-1"}

                ${colors.content}
              `}
            >
              {/* =================================================
                  TASKS
                 ================================================= */}

              {activeTab === "tasks" && (
                <motion.div
                  key="tasks"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.18 }}
                >
                  {priorityTasks.length > 0 || regularTasks.length > 0 ? (
                    <div className="space-y-2.5">
                      {priorityTasks.map((task, index) => (
                        <motion.div
                          key={task.id}
                          initial={{
                            opacity: 0,
                            y: 6,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          transition={{
                            duration: 0.2,
                            delay: entranceDelay(index),
                          }}
                        >
                          <MaybeSwipeable
                            leading={taskSwipeComplete(task.id)}
                            trailing={taskSwipeDelete(task.id)}
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
                          </MaybeSwipeable>
                        </motion.div>
                      ))}

                      {regularTasks.map((task, index) => (
                        <motion.div
                          key={task.id}
                          initial={{
                            opacity: 0,
                            y: 6,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          transition={{
                            duration: 0.2,
                            delay: entranceDelay(priorityTasks.length + index),
                          }}
                        >
                          <MaybeSwipeable
                            leading={taskSwipeComplete(task.id)}
                            trailing={taskSwipeDelete(task.id)}
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
                          </MaybeSwipeable>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`
                        flex
                        min-h-[150px]
                        flex-col
                        items-center
                        justify-center
                        px-6
                        py-8
                        text-center
                        ${colors.textMuted}
                      `}
                    >
                      <div
                        className={`
                          mb-3
                          flex
                          h-9
                          w-9
                          items-center
                          justify-center
                          rounded-xl
                          ${isDark ? "bg-white/[0.035]" : "bg-slate-100/70"}
                        `}
                      >
                        <ListTodo className="h-4 w-4" />
                      </div>

                      <p
                        className={`
                          text-[13px]
                          font-medium
                          ${colors.textSecondary}
                        `}
                      >
                        No tasks yet
                      </p>

                      <p className="mt-1 text-[11px]">
                        Tasks added to this collection will appear here.
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* =================================================
                  NOTES

                  Extra top padding is applied to the content
                  wrapper whenever Notes is active so the note
                  cards do not sit directly against the switch.
                 ================================================= */}

              {activeTab === "notes" && (
                <motion.div
                  key="notes"
                  initial={{
                    opacity: 0,
                    y: 3,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: 0.18,
                  }}
                >
                  {sortedNotes.length > 0 ? (
                    <div
                      className="
                        grid
                        grid-cols-1
                        gap-3
                        sm:grid-cols-2
                        lg:grid-cols-3
                        xl:grid-cols-4
                      "
                    >
                      {sortedNotes.map((note, index) => (
                        <motion.div
                          key={note.id}
                          initial={{
                            opacity: 0,
                            y: 6,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          transition={{
                            duration: 0.2,
                            delay: entranceDelay(index),
                          }}
                        >
                          <MaybeSwipeable
                            leading={noteSwipePin(
                              note.id,
                              Boolean(note.is_pinned),
                            )}
                            trailing={noteSwipeDelete(note.id)}
                          >
                            <NoteCard
                              id={note.id}
                              title={note.title}
                              description={note.description}
                              created_at={note.created_at}
                              is_deleted={note.is_deleted}
                              bg_color_hex={note.bg_color_hex}
                              is_pinned={note.is_pinned}
                              collection_id={note.collection_id}
                              list_id={note.list_id}
                              user_id={note.user_id}
                              onPinChange={handleNotePinWithErrorHandling}
                              onColorChange={
                                handleNoteColorChangeWithErrorHandling
                              }
                              onNoteUpdate={handleNoteUpdateWithErrorHandling}
                              onNoteDelete={handleNoteDeleteWithErrorHandling}
                            />
                          </MaybeSwipeable>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`
                        flex
                        min-h-[150px]
                        flex-col
                        items-center
                        justify-center
                        px-6
                        py-8
                        text-center
                        ${colors.textMuted}
                      `}
                    >
                      <div
                        className={`
                          mb-3
                          flex
                          h-9
                          w-9
                          items-center
                          justify-center
                          rounded-xl
                          ${isDark ? "bg-white/[0.035]" : "bg-slate-100/70"}
                        `}
                      >
                        <StickyNote className="h-4 w-4" />
                      </div>

                      <p
                        className={`
                          text-[13px]
                          font-medium
                          ${colors.textSecondary}
                        `}
                      >
                        No notes yet
                      </p>

                      <p className="mt-1 text-[11px]">
                        Notes added to this collection will appear here.
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
};

export default EnhancedCollectionComponent;
