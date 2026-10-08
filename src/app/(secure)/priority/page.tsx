"use client";

// Pinned tasks, across every list.
//
// The only screen that filters on `is_pinned` rather than on a date, so it is
// also the only one with no client-side predicate — the query says everything.

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar, Star, Zap } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useTaskView } from "@/hooks/useTaskView";
import { useTaskActions } from "@/hooks/useTaskActions";
import { isSameLocalDay, sortTasks } from "@/lib/taskView";
import TaskScreen from "@/components/Tasks/TaskScreen";
import TaskList from "@/components/Tasks/TaskList";

export default function PriorityPage() {
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
  } = useTaskView({ isCompleted: false, isPinned: true });

  const actions = useTaskActions(setTasks, { collections, tasks });

  const sorted = useMemo(() => sortTasks(tasks), [tasks]);
  const dueTodayCount = sorted.filter((task) =>
    isSameLocalDay(task.due_date, today),
  ).length;
  const scheduledCount = sorted.filter((task) => task.due_date).length;

  return (
    <TaskScreen
      isDark={isDark}
      icon={Star}
      accent={{ dark: "text-yellow-400", light: "text-yellow-500" }}
      title="Priority Tasks"
      subtitle={
        <>
          {sorted.length} high priority task{sorted.length !== 1 ? "s" : ""} •
          Focus on these first
        </>
      }
      onRefresh={refresh}
      isRefreshing={isRefreshing}
      isLoading={isLoading}
      loadingLabel="Loading priority tasks..."
      stats={
        sorted.length > 0
          ? [
              {
                title: "Priority Tasks",
                value: sorted.length,
                icon: Star,
                color: "bg-yellow-500",
              },
              {
                title: "Due Today",
                value: dueTodayCount,
                icon: Zap,
                color: "bg-orange-500",
              },
              {
                title: "Scheduled",
                value: scheduledCount,
                icon: Calendar,
                color: "bg-blue-500",
              },
            ]
          : undefined
      }
      empty={
        sorted.length === 0
          ? {
              title: "No priority tasks",
              message:
                "You don't have any priority tasks at the moment. Mark tasks as priority by clicking the pin icon.",
              icon: "plus",
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
