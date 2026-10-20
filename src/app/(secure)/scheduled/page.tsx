"use client";

// Scheduled: a month at a glance, and the tasks on the day you tap.
//
// A port of AllScheduledView from the published iOS app. The calendar answers
// "what is coming up?" in one look — a dot under every day holding work — which
// a flat list of dated tasks never did, however it was banded. Overdue keeps the
// other half of the question: what has already slipped.
//
// Two rules the user asked for, both deliberate:
//
//  - The month cannot go back past the current one. There is nothing to plan in
//    August and the back chevron is hidden rather than disabled-looking, so the
//    control simply is not offered. It keeps its space so the header does not
//    reflow on the month boundary.
//  - Days earlier in the *current* month stay selectable. Something dated last
//    Tuesday and still open is exactly what the user came here to find, and
//    hiding it would send them to Overdue to answer a question this screen is
//    already showing a dot for.
//
// `schedule` on iOS is `due_date` here; there is no second column. A task is on
// this screen because it has a date and is not finished.

import React, { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useTaskView } from "@/hooks/useTaskView";
import { useTaskActions } from "@/hooks/useTaskActions";
import { useOptionalAppData } from "@/components/native/AppDataProvider";
import TaskScreen from "@/components/Tasks/TaskScreen";
import TaskSidebar from "@/components/popupModels/TasksDetails";
import {
  firstOfMonth,
  isSameDay,
  isSameMonth,
  monthGrid,
  startOfDay,
  weekdaySymbols,
} from "@/lib/calendarMonth";
import { isSameLocalDay } from "@/lib/taskView";
import type { TaskRow } from "@/types/taskView";

/**
 * Anything with a date on it. Module level, not an inline arrow: useTaskView puts
 * the predicate in `refresh`'s dependency array, so a fresh identity each render
 * means a fetch each render.
 */
const isScheduled = (task: TaskRow) => Boolean(task.due_date);

/** Monday, the convention the rest of the app assumes. */
const FIRST_WEEKDAY = 1;

export default function ScheduledPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const {
    tasks,
    setTasks,
    collections,
    isLoading,
    isRefreshing,
    refresh,
    today,
  } = useTaskView({ isCompleted: false, predicate: isScheduled });

  const actions = useTaskActions(setTasks, { collections, tasks });

  const [displayedMonth, setDisplayedMonth] = useState(() =>
    firstOfMonth(new Date()),
  );
  const [selectedDate, setSelectedDate] = useState(() =>
    startOfDay(new Date()),
  );
  const [selectedTask, setSelectedTask] = useState<TaskRow | null>(null);

  const isShowingCurrentMonth = isSameMonth(displayedMonth, today);
  const isViewingToday = isSameDay(selectedDate, today);

  /**
   * Which days carry a dot.
   *
   * A Set of `yyyy-m-d` strings rather than of Dates, because two Date objects
   * for the same day are never `===` and `Set.has` would always miss.
   */
  const daysWithTasks = useMemo(() => {
    const keys = new Set<string>();
    for (const task of tasks) {
      if (!task.due_date) continue;
      const date = new Date(task.due_date);
      if (Number.isNaN(date.getTime())) continue;
      keys.add(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
    }
    return keys;
  }, [tasks]);

  const tasksForSelectedDate = useMemo(
    () =>
      tasks
        .filter((task) => isSameLocalDay(task.due_date, selectedDate))
        .sort((a, b) => {
          const left = a.due_date ? new Date(a.due_date).getTime() : Infinity;
          const right = b.due_date ? new Date(b.due_date).getTime() : Infinity;
          return left - right;
        }),
    [tasks, selectedDate],
  );

  const cells = useMemo(
    () => monthGrid(displayedMonth, FIRST_WEEKDAY),
    [displayedMonth],
  );
  const symbols = useMemo(() => weekdaySymbols(FIRST_WEEKDAY), []);

  const changeMonth = useCallback(
    (delta: number) => {
      const next = new Date(
        displayedMonth.getFullYear(),
        displayedMonth.getMonth() + delta,
        1,
      );

      // Never behind the current month, whichever way this was called.
      if (next < firstOfMonth(today)) return;

      setDisplayedMonth(next);
      // Keep the selection inside the month on screen, so the list underneath
      // always matches a day the user can see.
      setSelectedDate(isSameMonth(next, today) ? startOfDay(today) : next);
    },
    [displayedMonth, today],
  );

  const jumpToToday = useCallback(() => {
    setDisplayedMonth(firstOfMonth(today));
    setSelectedDate(startOfDay(today));
  }, [today]);

  return (
    <TaskScreen
      isDark={isDark}
      icon={CalendarDays}
      accent={{ dark: "text-orange-400", light: "text-orange-500" }}
      title="Scheduled"
      subtitle={
        <>
          {tasks.length} dated task{tasks.length !== 1 ? "s" : ""} across your
          lists
        </>
      }
      onRefresh={refresh}
      isRefreshing={isRefreshing}
      isLoading={isLoading}
      loadingLabel="Loading your schedule..."
      /* No `empty`: it replaces the body outright, and an account with nothing
         dated should still get the calendar. The day list says its own piece. */
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        /* Phone-first, and capped on desktop. A seven-column grid stretched to
           a 1280px container gives cells wider than they are tall, which reads
           as a spreadsheet rather than as a month. */
        className="mx-auto w-full max-w-2xl"
      >
        <section
          className={`rounded-2xl border bg-[var(--surface-card)] p-4 ${
            isDark ? "border-white/[0.08]" : "border-black/[0.06]"
          }`}
        >
          {/* Month, and the two ways out of it */}
          <header className="flex items-center justify-between pb-3">
            <h2
              className={`text-[17px] font-semibold ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              {displayedMonth.toLocaleDateString(undefined, {
                month: "long",
                year: "numeric",
              })}
            </h2>

            <div className="flex items-center gap-2">
              {!isViewingToday && (
                <button
                  type="button"
                  onClick={jumpToToday}
                  className="touch-target rounded-lg px-2.5 text-[14px] font-semibold text-orange-500 active:opacity-60"
                >
                  Today
                </button>
              )}

              {/* Hidden rather than removed when there is nowhere back to go, so
                  the forward chevron keeps its position on the month boundary. */}
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                disabled={isShowingCurrentMonth}
                aria-hidden={isShowingCurrentMonth}
                aria-label="Previous month"
                className={`touch-target flex items-center justify-center rounded-lg text-orange-500 active:opacity-60 ${
                  isShowingCurrentMonth ? "pointer-events-none opacity-0" : ""
                }`}
              >
                <ChevronLeft size={20} />
              </button>

              <button
                type="button"
                onClick={() => changeMonth(1)}
                aria-label="Next month"
                className="touch-target flex items-center justify-center rounded-lg text-orange-500 active:opacity-60"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </header>

          {/* Weekday strip */}
          <div className="grid grid-cols-7">
            {symbols.map((symbol, index) => (
              <span
                key={index}
                className={`pb-1 text-center text-[11px] ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {symbol}
              </span>
            ))}
          </div>

          {/* The month */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((date, index) =>
              date ? (
                <DayCell
                  key={date.getTime()}
                  date={date}
                  isSelected={isSameDay(date, selectedDate)}
                  isToday={isSameDay(date, today)}
                  isPast={date < today}
                  hasTasks={daysWithTasks.has(
                    `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
                  )}
                  isDark={isDark}
                  onSelect={() => setSelectedDate(date)}
                />
              ) : (
                <div key={`blank-${index}`} className="h-11" />
              ),
            )}
          </div>
        </section>

        {/* The day */}
        <div className="flex items-baseline justify-between px-1 pb-2 pt-5">
          <h3
            className={`text-[14px] font-semibold ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            {selectedDate.toLocaleDateString(undefined, {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </h3>

          {tasksForSelectedDate.length > 0 && (
            <span
              className={`text-[12px] ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {tasksForSelectedDate.length}{" "}
              {tasksForSelectedDate.length === 1 ? "task" : "tasks"}
            </span>
          )}
        </div>

        {tasksForSelectedDate.length === 0 ? (
          <div
            className={`rounded-2xl border border-dashed py-12 text-center ${
              isDark
                ? "border-white/10 text-gray-400"
                : "border-black/10 text-gray-500"
            }`}
          >
            <CalendarDays size={40} className="mx-auto text-gray-400" />
            <p
              className={`pt-3 text-[15px] font-semibold ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Nothing scheduled
            </p>
            <p className="pt-1 text-[13px]">No tasks are due on this day.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {tasksForSelectedDate.map((task) => (
              <ScheduledTaskRow
                key={task.id}
                task={task}
                isDark={isDark}
                onOpen={() => setSelectedTask(task)}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* One sheet for the screen, driven by which row was tapped — the same
          shape as the iOS `.sheet(item:)` this mirrors, and the same sheet every
          other task card opens. */}
      {selectedTask && (
        <TaskSidebar
          isOpen={Boolean(selectedTask)}
          onClose={() => setSelectedTask(null)}
          task={{
            id: selectedTask.id,
            text: selectedTask.text,
            description: selectedTask.description,
            created_at: new Date(selectedTask.created_at),
            due_date: selectedTask.due_date
              ? new Date(selectedTask.due_date)
              : null,
            due_has_time: selectedTask.due_has_time,
            reminders: selectedTask.reminders,
            is_completed: selectedTask.is_completed,
            date_completed: selectedTask.date_completed
              ? new Date(selectedTask.date_completed)
              : null,
            is_pinned: selectedTask.is_pinned,
            collection_id: selectedTask.collection_id,
            list_id: selectedTask.list_id,
            user_id: selectedTask.user_id,
          }}
          collections={collections}
          onComplete={actions.onComplete}
          onPriorityChange={actions.onPriorityChange}
          onTaskUpdate={actions.onTaskUpdate}
          onTaskDelete={actions.onTaskDelete}
          onCollectionChange={actions.onCollectionChange}
        />
      )}
    </TaskScreen>
  );
}

/** One day in the grid. */
function DayCell({
  date,
  isSelected,
  isToday,
  isPast,
  hasTasks,
  isDark,
  onSelect,
}: {
  date: Date;
  isSelected: boolean;
  isToday: boolean;
  isPast: boolean;
  hasTasks: boolean;
  isDark: boolean;
  onSelect: () => void;
}) {
  // Selected wins over today, which wins over past: the strongest statement the
  // cell can make about itself is the one the user just made by tapping it.
  const text = isSelected
    ? "text-white"
    : isToday
      ? "text-orange-500"
      : isPast
        ? isDark
          ? "text-gray-500"
          : "text-gray-400"
        : isDark
          ? "text-white"
          : "text-gray-900";

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={date.toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long",
      })}
      aria-current={isToday ? "date" : undefined}
      aria-pressed={isSelected}
      className="flex h-11 flex-col items-center justify-center"
    >
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-full text-[14px] ${
          isSelected || isToday ? "font-semibold" : "font-normal"
        } ${isSelected ? "bg-orange-500" : ""} ${text}`}
      >
        {date.getDate()}
      </span>

      {/* Always rendered, transparent when empty, so a dot appearing does not
          shift the number above it by two pixels. */}
      <span
        className={`mt-0.5 h-1 w-1 rounded-full ${
          !hasTasks
            ? "bg-transparent"
            : isSelected
              ? "bg-orange-500"
              : isDark
                ? "bg-gray-400"
                : "bg-gray-500"
        }`}
      />
    </button>
  );
}

/**
 * A task on the selected day.
 *
 * Deliberately lighter than the cards on the list screens: this one sits under a
 * calendar that has already said which day it is, so it carries the task, where
 * it lives, and nothing else.
 *
 * It used to take `today` as well, to redden a due time that had gone. A due
 * date is a day now and prints no time, so there was nothing left for the
 * comparison to colour.
 */
function ScheduledTaskRow({
  task,
  isDark,
  onOpen,
}: {
  task: TaskRow;
  isDark: boolean;
  onOpen: () => void;
}) {
  const appData = useOptionalAppData();

  /** The list's own colour, which is what ties the row to where it came from. */
  const accent =
    appData?.lists.find((list) => list.id === task.list_id)?.bg_color_hex ||
    (isDark ? "#6B7280" : "#9CA3AF");

  // `due` and the `isOverdue` derived from it were only ever read by the time
  // printed beside the title, and a due date no longer carries one — see
  // composeDue. The row is already inside the day the user tapped, so there was
  // nothing for a red clock to add even while there was a time to redden.

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`relative block w-full overflow-hidden rounded-xl border bg-[var(--surface-card)] py-3 pl-4 pr-3 text-left active:scale-[0.99] ${
        isDark ? "border-white/[0.08]" : "border-black/[0.06]"
      }`}
      style={{ borderColor: `${accent}40` }}
    >
      {/* The list's colour as an edge, the way the iOS row marks it. */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ backgroundColor: accent }}
      />

      <div className="flex items-baseline gap-2">
        <span
          className={`line-clamp-2 flex-1 text-[15px] font-semibold ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          {task.text}
        </span>

        {/* No time beside the title. A due date is a day — see composeDue —
            and the rows that still hold a stored time are legacy ones whose
            time was never something the user could have chosen here. */}
      </div>

      {task.description && (
        <p
          className={`line-clamp-2 pt-1 text-[13px] ${
            isDark ? "text-gray-400" : "text-gray-500"
          }`}
        >
          {task.description}
        </p>
      )}

      <div
        className={`flex items-center gap-1.5 pt-1.5 text-[12px] ${
          isDark ? "text-gray-400" : "text-gray-500"
        }`}
      >
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: accent }}
        />
        {task.list_name && <span className="truncate">{task.list_name}</span>}
        {task.collection_name && (
          <>
            <ChevronRight size={10} className="shrink-0" />
            <span className="truncate">{task.collection_name}</span>
          </>
        )}
      </div>
    </button>
  );
}
