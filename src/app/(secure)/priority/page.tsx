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

const GRADIENT = {
  dark: "[background:linear-gradient(45deg,#000000_0%,#0b0a0f_20%,#151419_40%,#100f14_70%,#000000_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_bottom_left,rgba(124,58,237,0.12)_0%,transparent_62%)] after:absolute after:inset-0 after:[background:radial-gradient(ellipse_at_top_right,rgba(196,181,253,0.07)_0%,transparent_52%)] before:content-[''] after:content-['']",
  light:
    "[background:linear-gradient(45deg,#fafbfc_0%,#f3f4f8_25%,#e5e7ef_50%,#f5f6f8_75%,#ffffff_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_bottom_left,rgba(124,58,237,0.07)_0%,transparent_62%)] after:absolute after:inset-0 after:[background:radial-gradient(ellipse_at_top_right,rgba(196,181,253,0.05)_0%,transparent_52%)] before:content-[''] after:content-['']",
};

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

  const actions = useTaskActions(setTasks, { collections });

  const sorted = useMemo(() => sortTasks(tasks), [tasks]);
  const dueTodayCount = sorted.filter((task) =>
    isSameLocalDay(task.due_date, today)
  ).length;
  const scheduledCount = sorted.filter((task) => task.due_date).length;

  return (
    <TaskScreen
      isDark={isDark}
      gradient={GRADIENT}
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
