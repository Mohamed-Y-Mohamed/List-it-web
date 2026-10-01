"use client";

// Tasks due today.
//
// Everything that used to live here in full — the fetch, the four mutation
// handlers, the counter, the figure tiles, the page chrome, the card list — is
// now shared with the other five task screens. What is left is what actually
// makes this screen Today: the filter, the words and the tint.

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { CalendarClock, CheckCircle2, Target } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useTaskView } from "@/hooks/useTaskView";
import { useTaskActions } from "@/hooks/useTaskActions";
import { isSameLocalDay, sortTasks } from "@/lib/taskView";
import TaskScreen from "@/components/Tasks/TaskScreen";
import TaskList from "@/components/Tasks/TaskList";
import type { TaskRow } from "@/types/taskView";

/** Due today. The query has already excluded anything completed or deleted. */
const dueToday = (task: TaskRow, today: Date) =>
  isSameLocalDay(task.due_date, today);

export default function TodayPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { tasks, setTasks, collections, isLoading, isRefreshing, refresh } =
    useTaskView({ isCompleted: false, predicate: dueToday });

  const actions = useTaskActions(setTasks, { collections });

  const sorted = useMemo(() => sortTasks(tasks), [tasks]);
  const pinnedCount = sorted.filter((task) => task.is_pinned).length;

  return (
    <TaskScreen
      isDark={isDark}
      icon={CalendarClock}
      accent={{ dark: "text-orange-400", light: "text-orange-500" }}
      title="Today's Focus"
      subtitle={`${sorted.length} task${sorted.length !== 1 ? "s" : ""} scheduled for today`}
      onRefresh={refresh}
      isRefreshing={isRefreshing}
      isLoading={isLoading}
      loadingLabel="Loading today's tasks..."
      stats={
        sorted.length > 0
          ? [
              {
                title: "Total Tasks",
                value: sorted.length,
                icon: Target,
                color: "bg-blue-500",
              },
              {
                title: "Priority Tasks",
                value: pinnedCount,
                icon: CalendarClock,
                color: "bg-orange-500",
              },
              {
                // Always zero, and was before: the old expression was
                // ((total - sorted.length) / total) * 100 with both terms the
                // same number, because every task on this screen is outstanding
                // by definition. Left showing 0% rather than quietly dropped —
                // removing a tile is a design change, not a refactor.
                title: "Completion Rate",
                value: 0,
                icon: CheckCircle2,
                color: "bg-green-500",
                suffix: "%",
              },
            ]
          : undefined
      }
      empty={
        sorted.length === 0
          ? {
              title: "No tasks due today",
              message:
                "Great job! You've completed all your tasks for today or haven't scheduled any tasks for today yet.",
              icon: "check",
            }
          : undefined
      }
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="space-y-4"
      >
        <TaskList tasks={sorted} collections={collections} {...actions} />
      </motion.div>
    </TaskScreen>
  );
}
