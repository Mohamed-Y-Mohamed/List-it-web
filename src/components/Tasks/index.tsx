"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Folder, ListTodo, Pin } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import TaskSidebar from "@/components/popupModels/TasksDetails";
import { Collection, OperationResult } from "@/types/schema";
import {
  STATUS_META,
  taskStatus,
  type TaskStatus,
} from "@/components/ui/tokens";
import { formatTaskDue, toDateObject } from "@/utils/dateUtils";

interface TaskCardProps {
  id: string;
  text: string | null;
  description?: string | null;
  created_at: Date | string | null;
  due_date?: Date | string | null;
  /** False for a date-only task. Without it the card invented a midnight time. */
  due_has_time?: boolean | null;
  /** Passed straight through to the detail sheet, which owns the parsing. */
  reminders?: unknown;
  is_completed: boolean | null;
  date_completed?: Date | string | null;
  is_pinned?: boolean | null;
  collection_id?: string | null;
  list_id?: string | null;
  user_id?: string | null;
  collection_name?: string | null;
  list_name?: string | null;

  onComplete: (id: string, is_completed: boolean) => Promise<OperationResult>;

  onPriorityChange: (
    id: string,
    is_pinned: boolean,
  ) => Promise<OperationResult>;

  onTaskUpdate?: (
    taskId: string,
    taskData: {
      text: string;
      description?: string | null;
      due_date?: Date | null;
      is_pinned: boolean;
    },
  ) => Promise<OperationResult>;

  onTaskDelete?: (taskId: string) => Promise<OperationResult>;

  collections?: Collection[];

  onCollectionChange?: (
    taskId: string,
    collectionId: string,
  ) => Promise<OperationResult>;

  className?: string;
}

// Status labels, colours and precedence live in `ui/tokens`. This file and
// `Tasks/customcard.tsx` each used to carry their own copy and had already
// drifted on `normal`.

const LONG_PRESS_MS = 520;

const TaskCard = ({
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
}: TaskCardProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [completed, setCompleted] = useState(!!is_completed);
  const [pinned, setPinned] = useState(!!is_pinned);
  const [taskText, setTaskText] = useState(text || "");
  const [taskDescription, setTaskDescription] = useState(description);

  const [taskDueDate, setTaskDueDate] = useState<
    Date | string | null | undefined
  >(due_date);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const longPressTriggered = useRef(false);

  useEffect(() => {
    setCompleted(!!is_completed);
    setPinned(!!is_pinned);
    setTaskText(text || "");
    setTaskDescription(description);
    setTaskDueDate(due_date);
  }, [is_completed, is_pinned, text, description, due_date]);

  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  const createdDate = toDateObject(created_at);
  const dueDate = toDateObject(taskDueDate);
  const completedDate = toDateObject(date_completed);

  // One rule for both cards and the detail sheet: a date-only due date is
  // stored at UTC noon and has to be read back in UTC, and has no time to show.
  const { date: formattedDate, time: formattedTime } = formatTaskDue(
    taskDueDate,
    due_has_time,
  );

  const overdue = useMemo(() => {
    if (!dueDate || completed) {
      return false;
    }

    const now = new Date();

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const due = new Date(
      dueDate.getFullYear(),
      dueDate.getMonth(),
      dueDate.getDate(),
    );

    return today > due;
  }, [dueDate, completed]);

  const scheduled = !!dueDate;

  /*
   * Overdue first. A pinned, scheduled task that is already late was being
   * shown as Flagged, so the one state the user has to act on was hidden
   * behind the one they do not.
   */
  const status: TaskStatus = taskStatus(overdue, pinned, scheduled);

  const statusInfo = STATUS_META[status];

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const startLongPress = () => {
    cancelLongPress();

    longPressTriggered.current = false;

    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      setMenuOpen(true);

      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.(30);
      }
    }, LONG_PRESS_MS);
  };

  const handleCardClick = () => {
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }

    if (menuOpen) {
      setMenuOpen(false);
      return;
    }

    setSidebarOpen(true);
  };

  const togglePin = async () => {
    if (updating) {
      return;
    }

    const previous = pinned;
    const next = !previous;

    setPinned(next);
    setMenuOpen(false);
    setUpdating(true);

    try {
      const result = await onPriorityChange(id, next);

      if (!result.success) {
        setPinned(previous);
      }
    } catch {
      setPinned(previous);
    } finally {
      setUpdating(false);
    }
  };

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

      if (!result.success) {
        setTaskText(previous.text);
        setTaskDescription(previous.description);
        setTaskDueDate(previous.dueDate);
        setPinned(previous.pinned);
      }

      return result;
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

  if (!id) {
    return null;
  }

  return (
    <>
      <motion.article
        initial={{
          opacity: 0,
          y: 8,
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
          duration: 0.2,
        }}
        whileHover={{
          y: -1,
        }}
        onClick={handleCardClick}
        onTouchStart={startLongPress}
        onTouchEnd={cancelLongPress}
        onTouchMove={cancelLongPress}
        onTouchCancel={cancelLongPress}
        onMouseDown={startLongPress}
        onMouseUp={cancelLongPress}
        onMouseLeave={cancelLongPress}
        onContextMenu={(event) => {
          event.preventDefault();
          setMenuOpen(true);
        }}
        className={`
          group
          relative
          cursor-pointer
          select-none
          overflow-hidden

          rounded-2xl
          border

          transition-all
          duration-200

          ${className}

          ${
            isDark
              ? `
                border-white/[0.07]
                bg-[#131a28]

                hover:border-white/[0.12]
                hover:bg-[#161e2e]
                hover:shadow-[0_8px_24px_rgba(0,0,0,0.16)]
              `
              : `
                border-slate-200/80
                bg-white

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
        */}
        <div
          className="
            absolute
            inset-y-0
            left-0
            w-[4px]
          "
          style={{
            backgroundColor: statusInfo.colour,
          }}
          aria-hidden="true"
        />

        <div
          className="
            px-4
            py-3.5
            pl-[18px]

            sm:px-[18px]
            sm:pl-[21px]
          "
        >
          {/* ===============================================
              TITLE + STATUS
             =============================================== */}

          <div
            className="
              flex
              min-w-0
              items-start
              justify-between
              gap-3
            "
          >
            <h3
              className={`
                min-w-0
                flex-1
                truncate

                text-[14px]
                font-semibold
                leading-5
                tracking-[-0.01em]

                sm:text-[15px]

                ${
                  completed
                    ? isDark
                      ? `
                        text-slate-500
                        line-through
                      `
                      : `
                        text-slate-400
                        line-through
                      `
                    : isDark
                      ? "text-slate-100"
                      : "text-slate-900"
                }
              `}
            >
              {taskText || "Untitled Task"}
            </h3>

            {/* Normal never displays text on the card. */}
            {status !== "normal" && (
              <div
                className="
                  flex
                  shrink-0
                  items-center
                  gap-1.5
                  pt-[2px]
                "
              >
                <span
                  className="
                    h-2
                    w-2
                    rounded-full
                  "
                  style={{
                    backgroundColor: statusInfo.colour,
                  }}
                  aria-hidden="true"
                />

                <span
                  className={`
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-[0.07em]

                    ${isDark ? "text-slate-400" : "text-slate-500"}
                  `}
                >
                  {statusInfo.label}
                </span>
              </div>
            )}
          </div>

          {/* ===============================================
              SCHEDULE
              Directly below the title
             =============================================== */}

          {formattedDate && (
            <div
              className={`
                mt-1.5
                flex
                items-center
                gap-1.5

                text-[11px]
                font-medium

                ${
                  overdue && status !== "flagged"
                    ? "text-rose-500"
                    : isDark
                      ? "text-slate-400"
                      : "text-slate-500"
                }
              `}
            >
              <CalendarDays
                className="
                  h-3.5
                  w-3.5
                  shrink-0
                "
              />

              <span className="truncate">
                {formattedDate}

                {formattedTime && ` · ${formattedTime}`}
              </span>
            </div>
          )}

          {/* ===============================================
              DESCRIPTION

              - One line only
              - Maximum 75% card width
              - Automatically ends in ...
             =============================================== */}

          {taskDescription && (
            <p
              title={taskDescription}
              className={`
                mt-2.5
                w-3/4
                truncate

                text-[12px]
                leading-[1.5]

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

          {/* ===============================================
              COLLECTION / LIST
             =============================================== */}

          {(collection_name || list_name) && (
            <div
              className={`
                mt-3
                flex
                min-w-0
                items-center
                gap-3

                border-t
                pt-2.5

                ${isDark ? "border-white/[0.055]" : "border-slate-100"}
              `}
            >
              {collection_name && (
                <div
                  className={`
                    flex
                    min-w-0
                    items-center
                    gap-1.5

                    text-[11px]

                    ${isDark ? "text-slate-500" : "text-slate-500"}
                  `}
                >
                  <Folder
                    className="
                      h-3
                      w-3
                      shrink-0
                    "
                  />

                  <span
                    className="
                      max-w-[150px]
                      truncate
                    "
                  >
                    {collection_name}
                  </span>
                </div>
              )}

              {list_name && (
                <div
                  className={`
                    flex
                    min-w-0
                    items-center
                    gap-1.5

                    text-[11px]

                    ${isDark ? "text-slate-500" : "text-slate-500"}
                  `}
                >
                  <ListTodo
                    className="
                      h-3
                      w-3
                      shrink-0
                    "
                  />

                  <span
                    className="
                      max-w-[130px]
                      truncate
                    "
                  >
                    {list_name}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ===============================================
            LONG PRESS / RIGHT CLICK MENU
           =============================================== */}

        <AnimatePresence>
          {menuOpen && (
            <>
              <button
                type="button"
                aria-label="Close task menu"
                className="
                  fixed
                  inset-0
                  z-40
                  cursor-default
                "
                onClick={(event) => {
                  event.stopPropagation();
                  setMenuOpen(false);
                }}
              />

              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.96,
                  y: -4,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.96,
                  y: -4,
                }}
                transition={{
                  duration: 0.12,
                }}
                onClick={(event) => event.stopPropagation()}
                className={`
                  absolute
                  right-3
                  top-3
                  z-50

                  w-[150px]

                  rounded-xl
                  border
                  p-1.5

                  shadow-xl

                  ${
                    isDark
                      ? `
                        border-white/10
                        bg-[#1b2333]
                      `
                      : `
                        border-slate-200
                        bg-white
                      `
                  }
                `}
              >
                {/* PIN */}

                <button
                  type="button"
                  disabled={updating}
                  onClick={(event) => {
                    event.stopPropagation();
                    void togglePin();
                  }}
                  className={`
                    flex
                    min-h-[40px]
                    w-full
                    items-center
                    gap-2

                    rounded-lg

                    px-3

                    text-left
                    text-[12px]
                    font-medium

                    transition-colors

                    disabled:opacity-50

                    ${
                      isDark
                        ? `
                          text-slate-200
                          hover:bg-white/[0.06]
                        `
                        : `
                          text-slate-700
                          hover:bg-slate-100
                        `
                    }
                  `}
                >
                  <Pin
                    className={`
                      h-3.5
                      w-3.5

                      ${pinned ? "fill-current" : ""}
                    `}
                  />

                  {pinned ? "Unpin task" : "Pin task"}
                </button>

                {/* VIEW DETAILS */}

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();

                    setMenuOpen(false);
                    setSidebarOpen(true);
                  }}
                  className={`
                    flex
                    min-h-[40px]
                    w-full
                    items-center

                    rounded-lg

                    px-3

                    text-left
                    text-[12px]
                    font-medium

                    transition-colors

                    ${
                      isDark
                        ? `
                          text-slate-200
                          hover:bg-white/[0.06]
                        `
                        : `
                          text-slate-700
                          hover:bg-slate-100
                        `
                    }
                  `}
                >
                  View details
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.article>

      {/* ===============================================
          TASK DETAILS
         =============================================== */}

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
};

export default React.memo(TaskCard);
export { TaskCard };
