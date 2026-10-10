"use client";

import React, { useEffect, useMemo, useState } from "react";
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
//
// The long-press delay is no longer here either: `useLongPress` owns it, so the
// task cards, the note card and the list cards all hold for the same 500ms.

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

  // The long-press timer is cleaned up by useLongPress now; this card no longer
  // owns one.

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

  /**
   * Tap opens the details, hold opens the menu.
   *
   * This card used to run its own 520ms timer with its own touch and mouse
   * handlers and its own `navigator.vibrate`, which made three long-press
   * implementations in the app that agreed on nothing — not the delay, not the
   * movement tolerance, not the feedback. `useLongPress` is the one the list
   * cards and the note card use: 500ms, a 10px tolerance so a scroll is not a
   * hold, and a Capacitor haptic on native.
   */
  const gestureHandlers = useLongPress({
    onLongPress: (position) => setMenuOrigin(position),
    onTap: () => setSidebarOpen(true),
  });

  const togglePin = async () => {
    if (updating) {
      return;
    }

    const previous = pinned;
    const next = !previous;

    setPinned(next);
    setMenuOrigin(null);
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

  /**
   * Mark done, and delete, from the hold menu.
   *
   * These two were the swipe's Done and Delete panels. The swipe is gone, and
   * this card's face has no completion control of its own — `onComplete` only
   * ever reached the detail sheet — so without them here, removing the swipe
   * would have taken away the only one-gesture route to either. "Make all those
   * functions hold" is exactly that: same handlers, same card, different gesture.
   *
   * `markDone` is optimistic and reverts on failure, matching `togglePin` above.
   * Delete is not: the row disappears, and guessing that it will is how a card
   * vanishes and comes back.
   */
  const markDone = async () => {
    if (updating || completed) return;

    setCompleted(true);
    setMenuOrigin(null);
    setUpdating(true);

    try {
      const result = await onComplete(id, true);
      if (!result.success) setCompleted(false);
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

  /**
   * What the hold offers, in the order a thumb meets them.
   *
   * Pin and View details are what this menu always had. Mark done and Delete are
   * the two the swipe used to carry. Delete is last and the only destructive one,
   * so the row that cannot be undone is furthest from where the menu opens.
   *
   * Mark done drops off a task that is already done, and Delete is absent rather
   * than disabled when the card was given no delete handler — a row that does
   * nothing is worse than a shorter menu.
   */
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
        {...gestureHandlers}
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
            /* The field colour, not the card colour.

              A task sits inside a collection, and the collection is the card —
              so the task drops back to the page's own colour to stand off it.
              White task on a grey collection on a white page, and the same
              alternation in every other ramp.

              This used to be a hardcoded navy in dark and a hardcoded white in
              light, which meant a task card stayed navy on the Black and
              Charcoal backgrounds and stayed white on every light one. The ramp
              already carries the right value for the theme and the chosen
              background, so there is nothing left to branch on.

              The old hex is deliberately not written out here. Tailwind 4 builds
              its stylesheet by scanning source text and does not know a comment
              from markup, so naming the class spelled out in full was enough to
              put the dead utility back into the CSS — which is also why the
              palette is passed through `style` and custom properties rather than
              interpolated class names. */ ""
          }
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

        {/* The hold menu is NativeContextMenu now, rendered below this card.

            It used to be an `absolute` panel right here, which is why holding a
            task showed a menu with its options cut off: the card sits inside the
            collection's overflow-hidden expand wrapper and the panel's
            overflow-y-auto scroller, and an absolutely positioned child is clipped
            by both. The shared menu is portalled to the body, so nothing upstream
            can crop it, and it keeps itself on screen by flipping above the finger
            when there is no room below. */}
      </motion.article>

      {/* The hold menu. Outside the card so its backdrop covers the screen, and
          portalled to the body by NativeContextMenu so no overflow ancestor can
          crop it. */}
      <NativeContextMenu
        origin={menuOrigin}
        items={menuItems}
        onClose={() => setMenuOrigin(null)}
      />

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
