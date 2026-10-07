"use client";

// Tasks due tomorrow.
//
// The fetch, the handlers, the tiles and the page chrome are shared with the
// other five task screens. What remains is the filter, the words and the tint.

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar, CalendarDays, Target, TrendingUp } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useTaskView } from "@/hooks/useTaskView";
import { useTaskActions } from "@/hooks/useTaskActions";
import { isSameLocalDay, sortTasks } from "@/lib/taskView";
import TaskScreen from "@/components/Tasks/TaskScreen";
import TaskList from "@/components/Tasks/TaskList";
import type { TaskRow } from "@/types/taskView";

export default function TomorrowPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Midnight tomorrow, local. The shared hook hands back midnight *today*, so
  // this screen shifts it by a day rather than keeping its own clock.
  const tomorrow = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const dueTomorrow = useMemo(
    () => (task: TaskRow) => isSameLocalDay(task.due_date, tomorrow),
    [tomorrow]
  );

  const { tasks, setTasks, collections, isLoading, isRefreshing, refresh } =
    useTaskView({ isCompleted: false, predicate: dueTomorrow });

  const actions = useTaskActions(setTasks, { collections, tasks });

  const sorted = useMemo(() => sortTasks(tasks), [tasks]);
  const pinnedCount = sorted.filter((task) => task.is_pinned).length;

  const tomorrowFormatted = useMemo(
    () =>
      tomorrow.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    [tomorrow]
  );

  return (
    <TaskScreen
      isDark={isDark}
      icon={Calendar}
      accent={{ dark: "text-purple-400", light: "text-purple-500" }}
      title="Tomorrow's Tasks"
      subtitle={
        <>
          <span className="font-medium">{tomorrowFormatted}</span> •{" "}
          {sorted.length} task{sorted.length !== 1 ? "s" : ""} scheduled
        </>
      }
      onRefresh={refresh}
      isRefreshing={isRefreshing}
      isLoading={isLoading}
      loadingLabel="Loading tomorrow's tasks..."
      stats={
        sorted.length > 0
          ? [
              {
                title: "Tomorrow's Tasks",
                value: sorted.length,
                icon: CalendarDays,
                color: "bg-purple-500",
              },
              {
                title: "Priority Tasks",
                value: pinnedCount,
                icon: Target,
                color: "bg-indigo-500",
              },
              {
                title: "Planning Score",
                value: Math.min(100, sorted.length * 20),
                icon: TrendingUp,
                color: "bg-blue-500",
              },
            ]
          : undefined
      }
      empty={
        sorted.length === 0
          ? {
              title: "No tasks due tomorrow",
              message:
                "You've got a clear schedule for tomorrow. Need to plan ahead? Add a task with tomorrow's due date.",
              icon: "calendar",
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
