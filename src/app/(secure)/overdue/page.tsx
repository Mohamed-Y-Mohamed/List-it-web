"use client";

// Scheduled: everything with a date on it, soonest problem first.
//
// This was Overdue, and showed only what had already slipped. That made it a
// screen you opened to feel bad and never to plan, and it meant the question
// "what is coming up?" had no home at all. It now covers anything dated and
// unfinished, with overdue as the first band rather than the whole screen.
//
// Today still has its own screen, and still wins for one-off work due today.
// This one is the wider view: what has slipped, what lands today, and what is
// coming.
//
// One of two screens that band rather than showing a flat list, so it supplies
// its own body while still sitting in the shared frame.

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Calendar,
  CalendarClock,
  Clock,
  Target,
  TrendingDown,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useTaskView } from "@/hooks/useTaskView";
import { useTaskActions } from "@/hooks/useTaskActions";
import { bandByDueDate, daysBetween, sortTasks } from "@/lib/taskView";
import TaskScreen from "@/components/Tasks/TaskScreen";
import TaskList, { type TaskListHandlers } from "@/components/Tasks/TaskList";
import { TaskSectionHeader } from "@/components/Tasks/TaskStatsCard";
import type { Collection as SchemaCollection } from "@/types/schema";
import type { TaskRow } from "@/types/taskView";

/** The four bands, most urgent first. */
const BANDS = [
  {
    key: "overdue" as const,
    title: "Overdue",
    color: "text-red-600 dark:text-red-400",
    icon: AlertTriangle,
    cardClassName: "border-l-4 border-red-600",
  },
  {
    key: "today" as const,
    title: "Today",
    color: "text-orange-600 dark:text-orange-400",
    icon: Clock,
    cardClassName: "border-l-4 border-orange-500",
  },
  {
    key: "tomorrow" as const,
    title: "Tomorrow",
    color: "text-amber-600 dark:text-amber-400",
    icon: Calendar,
    cardClassName: "border-l-4 border-amber-500",
  },
  {
    key: "upcoming" as const,
    title: "Upcoming",
    color: "text-sky-600 dark:text-sky-400",
    icon: CalendarClock,
    cardClassName: "border-l-4 border-sky-500",
  },
];

/**
 * Anything with a date on it. Module level, not an inline arrow: useTaskView puts
 * the predicate in `refresh`'s dependency array, so a fresh identity each render
 * means a fetch each render.
 */
const isScheduled = (task: TaskRow) => Boolean(task.due_date);

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
  const sorted = useMemo(() => sortTasks(tasks), [tasks]);

  const daysOverdue = useMemo(
    () => (dueDate: string) => daysBetween(dueDate, today),
    [today],
  );

  // Everything bands together, recurring included — see `bandByDueDate`.
  const grouped = useMemo(() => bandByDueDate(sorted, today), [sorted, today]);

  const averageDaysOverdue = useMemo(() => {
    if (sorted.length === 0) return 0;
    // Only across what has actually slipped. Averaging in things due next week
    // would report a negative delay, which reads as nonsense on a stat tile.
    const late = sorted.filter(
      (task) => task.due_date && daysOverdue(task.due_date) > 0,
    );
    if (late.length === 0) return 0;
    const total = late.reduce(
      (sum, task) => sum + daysOverdue(task.due_date as string),
      0,
    );
    return Math.round(total / late.length);
  }, [sorted, daysOverdue]);

  return (
    <TaskScreen
      isDark={isDark}
      icon={CalendarClock}
      accent={{ dark: "text-sky-400", light: "text-sky-500" }}
      title="Scheduled"
      subtitle={
        <>
          {sorted.length} dated task{sorted.length !== 1 ? "s" : ""}
          {grouped.overdue.length > 0
            ? `, ${grouped.overdue.length} overdue`
            : ", nothing overdue"}
        </>
      }
      onRefresh={refresh}
      isRefreshing={isRefreshing}
      isLoading={isLoading}
      loadingLabel="Loading your schedule..."
      stats={
        sorted.length > 0
          ? [
              {
                title: "Overdue",
                value: grouped.overdue.length,
                icon: AlertTriangle,
                color: "bg-red-500",
                description: "Past their date",
              },
              {
                title: "Due Today",
                value: grouped.today.length,
                icon: Clock,
                color: "bg-orange-500",
                description: "Landing today",
              },
              {
                title: "Upcoming",
                value: grouped.tomorrow.length + grouped.upcoming.length,
                icon: TrendingDown,
                color: "bg-sky-500",
                description: "Still ahead of you",
              },
              {
                title: "Average Delay",
                value: averageDaysOverdue,
                icon: Target,
                color: "bg-yellow-500",
                suffix: " days",
                description: "Across what has slipped",
              },
            ]
          : undefined
      }
      empty={
        sorted.length === 0
          ? {
              title: "Nothing scheduled",
              message:
                "Tasks with a date show up here, whether they have slipped, land today, or are still ahead of you.",
              icon: "check",
            }
          : undefined
      }
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="space-y-8"
      >
        {BANDS.map((band) => (
          <ScheduledBand
            key={band.key}
            band={band}
            tasks={grouped[band.key]}
            collections={collections}
            isDark={isDark}
            handlers={actions}
          />
        ))}
      </motion.div>
    </TaskScreen>
  );
}

function ScheduledBand({
  band,
  tasks,
  collections,
  isDark,
  handlers,
}: {
  band: (typeof BANDS)[number];
  tasks: TaskRow[];
  collections: SchemaCollection[];
  isDark: boolean;
  handlers: TaskListHandlers;
}) {
  if (tasks.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <TaskSectionHeader
        title={band.title}
        count={tasks.length}
        color={band.color}
        icon={band.icon}
        isDark={isDark}
      />
      <div className="space-y-4">
        <TaskList
          tasks={tasks}
          collections={collections}
          cardClassName={band.cardClassName}
          {...handlers}
        />
      </div>
    </motion.div>
  );
}
