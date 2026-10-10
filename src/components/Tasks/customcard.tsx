"use client";

import React, { useEffect, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Folder,
  ListTodo,
  Pin,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { useLongPress } from "@/hooks/useLongPress";
import NativeContextMenu, {
  type ContextMenuItem,
} from "@/components/native/NativeContextMenu";
import TaskSidebar from "@/components/popupModels/TasksDetails";
import { Collection, OperationResult } from "@/types/schema";
import {
  STATUS_META,
  taskStatus,
  type TaskStatus,
} from "@/components/ui/tokens";
import { formatTaskDue, toDateObject } from "@/utils/dateUtils";

interface TodayTaskCardProps {
  id: string;
  text: string | null;
  description?: string | null;
  created_at: string | Date | null;
  due_date?: string | Date | null;
  /** False for a date-only task. Without it the card invented a midnight time. */
  due_has_time?: boolean | null;
  /** Passed straight through to the detail sheet, which owns the parsing. */
  reminders?: unknown;
  is_completed: boolean | null;
  date_completed?: string | Date | null;
  is_pinned?: boolean | null;
  collection_id?: string | null;
  list_id?: string | null;
  user_id?: string | null;
  collection_name?: string | null;
  list_name?: string | null;

  onComplete: (
    id: string,
    is_completed: boolean,
  ) => Promise<{ success: boolean; error?: unknown }> | void;

  onPriorityChange: (
    id: string,
    is_pinned: boolean,
  ) => Promise<{ success: boolean; error?: unknown }> | void;

  onTaskUpdate?: (
    taskId: string,
    taskData: {
      text: string;
      description?: string | null;
      due_date?: Date | null;
      is_pinned: boolean;
    },
  ) => Promise<{ success: boolean; error?: unknown }> | void;

  onTaskDelete?: (
    taskId: string,
  ) => Promise<{ success: boolean; error?: unknown }> | void;

  collections?: Collection[];

  onCollectionChange?: (
    taskId: string,
    collectionId: string,
  ) => Promise<{ success: boolean; error?: unknown }> | void;

  className?: string;
}

// Status labels, colours and precedence live in `ui/tokens`. This file and
// `Tasks/index.tsx` each used to carry their own copy and had already drifted.

export default function TodayTaskCard({
  id,
  text,
  description,
  created_at,
  due_date,
  due_has_time,
  reminders,
  is_completed,
  date_completed,
  is_pinned = false,
  collection_id,
  list_id,
  user_id,
  collection_name,
  list_name,
  onComplete,
  onPriorityChange,
  onTaskUpdate,
  onTaskDelete,
  collections = [],
  onCollectionChange,
  className = "",
}: TodayTaskCardProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [completed, setCompleted] = useState(!!is_completed);
  const [pinned, setPinned] = useState(!!is_pinned);
  const [taskText, setTaskText] = useState(text || "");
  const [taskDescription, setTaskDescription] = useState(description);
  const [taskDueDate, setTaskDueDate] = useState(due_date);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  /** Press position for the hold menu, or null when it is shut. */
  const [menuOrigin, setMenuOrigin] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    setCompleted(!!is_completed);
    setPinned(!!is_pinned);
    setTaskText(text || "");
    setTaskDescription(description);
    setTaskDueDate(due_date);
  }, [is_completed, is_pinned, text, description, due_date]);

  const createdDate = toDateObject(created_at);
  const dueDate = toDateObject(taskDueDate);
  const completedDate = toDateObject(date_completed);

  // One rule for both cards and the detail sheet: a date-only due date is
  // stored at UTC noon and has to be read back in UTC, and has no time to show.
  const { date: formattedDate, time: formattedTime } = formatTaskDue(
    taskDueDate,
    due_has_time,
  );

  const overdue = (() => {
    if (!dueDate || completed) return false;

    const now = new Date();

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const due = new Date(
      dueDate.getFullYear(),
      dueDate.getMonth(),
      dueDate.getDate(),
    );

    return today > due;
  })();

  const scheduled = !!dueDate;

  /*
   * Overdue first. A pinned, scheduled task that is already late was being
   * shown as Flagged, so the one state the user has to act on was hidden
   * behind the one they do not.
   */
  const status: TaskStatus = taskStatus(overdue, pinned, scheduled);

  const statusInfo = STATUS_META[status];

  /** Tap opens the details, hold opens the menu. Shared hook — see Tasks/index.tsx. */
  const gestureHandlers = useLongPress({
    onLongPress: (position) => setMenuOrigin(position),
    onTap: () => setSidebarOpen(true),
  });

  const togglePin = async () => {
    if (updating) return;

    const previous = pinned;
    const next = !previous;

    setPinned(next);
    setMenuOrigin(null);
    setUpdating(true);

    try {
      const result = await onPriorityChange(id, next);

      if (result && !result.success) {
        setPinned(previous);
      }
    } catch {
      setPinned(previous);
    } finally {
      setUpdating(false);
    }
  };

  /**
   * Mark done, and delete, from the hold menu. Same reasoning as the identical
   * pair in Tasks/index.tsx: they were the swipe's two panels, and the swipe is
   * gone. `result &&` guards the same way togglePin does here — this card's
   * `onComplete` is typed to allow a void return.
   */
  const markDone = async () => {
    if (updating || completed) return;

    setCompleted(true);
    setMenuOrigin(null);
    setUpdating(true);

    try {
      const result = await onComplete(id, true);
      if (result && !result.success) setCompleted(false);
    } catch {
      setCompleted(false);
    } finally {
      setUpdating(false);
    }
  };

  const deleteTask = async () => {
    if (updating || !onTaskDelete) return;

    setMenuOrigin(null);
    setUpdating(true);

    try {
      await onTaskDelete(id);
    } finally {
      setUpdating(false);
    }
  };

  /** The same four rows as Tasks/index.tsx, in the same order. */
  const menuItems: ContextMenuItem[] = [
    {
      label: pinned ? "Unpin task" : "Pin task",
      icon: <Pin size={18} className={pinned ? "fill-current" : ""} />,
      onSelect: () => void togglePin(),
    },
    {
      label: "View details",
      icon: <ListTodo size={18} />,
      onSelect: () => setSidebarOpen(true),
    },
    ...(completed
      ? []
      : [
          {
            label: "Mark done",
            icon: <CheckCircle2 size={18} />,
            onSelect: () => void markDone(),
          },
        ]),
    ...(onTaskDelete
      ? [
          {
            label: "Delete task",
            icon: <Trash2 size={18} />,
            destructive: true,
            onSelect: () => void deleteTask(),
          },
        ]
      : []),
  ];

  const handleTaskUpdate = async (
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
        error: "Update handler not available",
      };
    }

    const previous = {
      text: taskText,
      description: taskDescription,
      dueDate: taskDueDate,
      pinned,
    };

    setTaskText(taskData.text);
    setTaskDescription(taskData.description);
    setTaskDueDate(taskData.due_date);
    setPinned(taskData.is_pinned);

    try {
      const result = await onTaskUpdate(taskId, taskData);

      // The prop allows a handler that returns nothing, and several callers do.
      // Reading .success off that threw, so a sync handler crashed the card on
      // every edit. No result means no reported failure, so the optimistic
      // state stands.
      if (result && !result.success) {
        setTaskText(previous.text);
        setTaskDescription(previous.description);
        setTaskDueDate(previous.dueDate);
        setPinned(previous.pinned);

        return result;
      }

      return result ?? { success: true };
    } catch (error) {
      setTaskText(previous.text);
      setTaskDescription(previous.description);
      setTaskDueDate(previous.dueDate);
      setPinned(previous.pinned);

      return {
        success: false,
        error,
      };
    }
  };

  if (!id) return null;

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        whileHover={{ y: -1 }}
        // No separate onContextMenu. useLongPress already supplies one that
        // suppresses the browser's own menu, and a handler written after the
        // spread would have overridden the hook's. Holding is the gesture.
        {...gestureHandlers}
        className={`
          group relative cursor-pointer select-none overflow-hidden
          rounded-2xl border transition-all duration-200
          ${className}
          ${/* Field colour, matching the card in a collection. See Tasks/index.tsx. */ ""}
          border-[var(--surface-border)]
          bg-[var(--surface-field)]
          hover:bg-[var(--surface-selected)]

          ${
            isDark
              ? `
                hover:border-white/[0.12]
                hover:shadow-[0_8px_24px_rgba(0,0,0,0.16)]
              `
              : `
                hover:border-slate-300
                hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]
              `
          }
          ${completed ? "opacity-60" : ""}
        `}
      >
        {/* STATUS SIDE ACCENT
            Normal = blue
            Pinned = yellow
            Overdue = red
            Flagged = orange

            Every task gets one. It used to be drawn only for the three
            "meaningful" states, which left an ordinary task as the single card
            type on the screen with no colour at all — so the stripe read as a
            badge that some tasks had rather than as the status every task is in.
            `normal` carries a real colour in STATUS_META precisely so this does
            not have to decide by painting nothing, and Tasks/index.tsx has always
            drawn it unconditionally. The two cards disagreed; they no longer do.

            The label beside the title is still hidden for `normal` — there is
            nothing useful to say, and STATUS_META.normal.label is "". */}
        <div
          className="absolute inset-y-0 left-0 w-[4px]"
          style={{
            backgroundColor: statusInfo.colour,
          }}
          aria-hidden="true"
        />

        <div className="px-4 py-3.5 sm:px-[18px]">
          {/* TITLE + STATUS */}
          <div className="flex min-w-0 items-start justify-between gap-3">
            <h3
              className={`
                min-w-0 flex-1 truncate
                text-[14px] font-semibold leading-5 tracking-[-0.01em]
                sm:text-[15px]
                ${
                  completed
                    ? isDark
                      ? "text-slate-500 line-through"
                      : "text-slate-400 line-through"
                    : isDark
                      ? "text-slate-100"
                      : "text-slate-900"
                }
              `}
            >
              {taskText || "Untitled Task"}
            </h3>

            {/* Never display "Normal". */}
            {status !== "normal" && (
              <div className="flex shrink-0 items-center gap-1.5 pt-[2px]">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: statusInfo.colour,
                  }}
                />

                <span
                  className={`
                    text-[10px] font-semibold uppercase tracking-[0.07em]
                    ${isDark ? "text-slate-400" : "text-slate-500"}
                  `}
                >
                  {statusInfo.label}
                </span>
              </div>
            )}
          </div>

          {/* SCHEDULE DIRECTLY BELOW TITLE */}
          {formattedDate && (
            <div
              className={`
                mt-1.5 flex items-center gap-1.5 text-[11px] font-medium
                ${
                  overdue && status !== "flagged"
                    ? "text-rose-500"
                    : isDark
                      ? "text-slate-400"
                      : "text-slate-500"
                }
              `}
            >
              <CalendarDays className="h-3.5 w-3.5 shrink-0" />

              <span>
                {formattedDate}
                {formattedTime && ` · ${formattedTime}`}
              </span>
            </div>
          )}

          {/* DESCRIPTION MOVED LOWER */}
          {taskDescription && (
            <p
              className={`
                mt-2.5 line-clamp-2 text-[12px] leading-[1.5]
                ${
                  completed
                    ? isDark
                      ? "text-slate-600"
                      : "text-slate-400"
                    : isDark
                      ? "text-slate-400"
                      : "text-slate-600"
                }
              `}
            >
              {taskDescription}
            </p>
          )}

          {/* SMALL FOOTER */}
          {(collection_name || list_name) && (
            <div
              className={`
                mt-3 flex min-w-0 items-center gap-3 border-t pt-2.5
                ${isDark ? "border-white/[0.055]" : "border-slate-100"}
              `}
            >
              {collection_name && (
                <div
                  className={`
                    flex min-w-0 items-center gap-1.5
                    text-[11px]
                    ${isDark ? "text-slate-500" : "text-slate-500"}
                  `}
                >
                  <Folder className="h-3 w-3 shrink-0" />
                  <span className="max-w-[150px] truncate">
                    {collection_name}
                  </span>
                </div>
              )}

              {list_name && (
                <div
                  className={`
                    flex min-w-0 items-center gap-1.5
                    text-[11px]
                    ${isDark ? "text-slate-500" : "text-slate-500"}
                  `}
                >
                  <ListTodo className="h-3 w-3 shrink-0" />
                  <span className="max-w-[130px] truncate">{list_name}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* The hold menu is NativeContextMenu now, rendered below this card —
            portalled, so no overflow ancestor can crop it. See Tasks/index.tsx. */}
      </motion.article>

      <NativeContextMenu
        origin={menuOrigin}
        items={menuItems}
        onClose={() => setMenuOrigin(null)}
      />

      <AnimatePresence>
        {sidebarOpen && createdDate && (
          <TaskSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            task={{
              id,
              text: taskText || "Untitled Task",
              description: taskDescription,
              created_at: createdDate,
              due_date: dueDate,
              // Both of these were missing, and neither failure was visible
              // from the card. Without `due_has_time` the sheet read a timed
              // due date as date-only, showed the wrong day, and would have
              // written the time away on the next save. Without `reminders`
              // every task opened reading "Reminder: None".
              due_has_time,
              reminders,
              is_completed: completed,
              date_completed: completedDate,
              is_pinned: pinned,
              collection_id,
              list_id,
              user_id,
            }}
            onComplete={onComplete}
            onPriorityChange={onPriorityChange}
            onTaskUpdate={handleTaskUpdate}
            onTaskDelete={onTaskDelete}
            collections={collections}
            onCollectionChange={onCollectionChange}
          />
        )}
      </AnimatePresence>
    </>
  );
}
