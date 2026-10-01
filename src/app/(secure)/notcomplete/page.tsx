"use client";

// Everything still to do that has not already slipped past its due date,
// grouped by when it is due.
//
// The widest of the six filters: no due date at all counts, because a task with
// no deadline is still outstanding. Overdue owns the other side of that line.

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  ClipboardCheck,
  Clock,
  Infinity as InfinityIcon,
  Target,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useTaskView } from "@/hooks/useTaskView";
import { useTaskActions } from "@/hooks/useTaskActions";
import { isUndatedOrAhead, sortTasks } from "@/lib/taskView";
import TaskScreen from "@/components/Tasks/TaskScreen";
import TaskList, { type TaskListHandlers } from "@/components/Tasks/TaskList";
import { TaskSectionHeader } from "@/components/Tasks/TaskStatsCard";
import type { Collection as SchemaCollection } from "@/types/schema";
import type { TaskRow } from "@/types/taskView";

type GroupKey = "today" | "tomorrow" | "future" | "no_date";

/** The four bands, in the order they appear down the screen. */
const BANDS: {
  key: GroupKey;
  title: string;
  color: string;
  bgColor: string;
  icon: React.ElementType;
}[] = [
  {
    key: "today",
    title: "Due Today",
    color: "text-blue-700 dark:text-blue-400",
    bgColor: "bg-gray-100 dark:bg-blue-300/30",
    icon: Target,
  },
  {
    key: "tomorrow",
    title: "Due Tomorrow",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    icon: Calendar,
  },
  {
    key: "future",
    title: "Upcoming",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    icon: Clock,
  },
  {
    key: "no_date",
    title: "Ongoing Tasks",
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-100 dark:bg-gray-800/30",
    icon: InfinityIcon,
  },
];

export default function NotCompletedPage() {
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
  } = useTaskView({ isCompleted: false, predicate: isUndatedOrAhead });

  const actions = useTaskActions(setTasks, { collections });
  const sorted = useMemo(() => sortTasks(tasks), [tasks]);

  const grouped = useMemo(() => {
    const groups: Record<GroupKey, TaskRow[]> = {
      today: [],
      tomorrow: [],
      future: [],
      no_date: [],
    };

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    sorted.forEach((task) => {
      if (!task.due_date) {
        groups.no_date.push(task);
        return;
      }

      const dueDate = new Date(task.due_date);
      dueDate.setHours(0, 0, 0, 0);

      if (dueDate.getTime() === today.getTime()) groups.today.push(task);
      else if (dueDate.getTime() === tomorrow.getTime())
        groups.tomorrow.push(task);
      else groups.future.push(task);
    });

    return groups;
  }, [sorted, today]);

  const scheduledCount =
    grouped.today.length + grouped.tomorrow.length + grouped.future.length;

  return (
    <TaskScreen
      isDark={isDark}
      icon={ClipboardCheck}
      accent={{ dark: "text-teal-400", light: "text-teal-500" }}
      title="To-Do Tasks"
      subtitle={
        <>
          {sorted.length} task{sorted.length !== 1 ? "s" : ""} to complete •
          Organized by due date
        </>
      }
      onRefresh={refresh}
      isRefreshing={isRefreshing}
      isLoading={isLoading}
      loadingLabel="Loading your tasks..."
      stats={
        sorted.length > 0
          ? [
              {
                title: "Total Pending",
                value: sorted.length,
                icon: ClipboardCheck,
                color: "bg-teal-500",
                description: "Tasks to complete",
              },
              {
                title: "Due Today",
                value: grouped.today.length,
                icon: Target,
                color: "bg-blue-500",
                description: "Urgent items",
              },
              {
                title: "Scheduled",
                value: scheduledCount,
                icon: Calendar,
                color: "bg-indigo-500",
                description: "With due dates",
              },
              {
                title: "Ongoing",
                value: grouped.no_date.length,
                icon: InfinityIcon,
                color: "bg-purple-500",
                description: "No due date",
              },
            ]
          : undefined
      }
      empty={
        sorted.length === 0
          ? {
              title: "All caught up!",
              message:
                "You don't have any incomplete tasks at the moment. Enjoy your free time or add new tasks.",
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
          <TaskBand
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

function TaskBand({
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
        bgColor={band.bgColor}
        icon={band.icon}
        isDark={isDark}
      />
      <div className="space-y-4">
        <TaskList tasks={tasks} collections={collections} {...handlers} />
      </div>
    </motion.div>
  );
}
