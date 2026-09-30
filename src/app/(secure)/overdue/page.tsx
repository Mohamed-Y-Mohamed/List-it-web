"use client";

// Tasks whose due date has passed, grouped by how far past.
//
// The only screen that filters in the query by date rather than after the
// fetch, and one of two that group rather than showing a flat list — so it
// supplies its own body while still sitting in the shared frame.

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Calendar,
  Clock,
  Target,
  TrendingDown,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useTaskView } from "@/hooks/useTaskView";
import { useTaskActions } from "@/hooks/useTaskActions";
import { sortTasks, toPostgresDate } from "@/lib/taskView";
import TaskScreen from "@/components/Tasks/TaskScreen";
import TaskList, { type TaskListHandlers } from "@/components/Tasks/TaskList";
import { TaskSectionHeader } from "@/components/Tasks/TaskStatsCard";
import type { Collection as SchemaCollection } from "@/types/schema";
import type { TaskRow } from "@/types/taskView";

const GRADIENT = {
  dark: "[background:linear-gradient(45deg,#000000_0%,#0a0c0f_20%,#141619_40%,#0f1114_70%,#000000_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.15)_0%,transparent_60%)] after:absolute after:inset-0 after:[background:radial-gradient(ellipse_at_top_right,rgba(147,197,253,0.08)_0%,transparent_50%)] before:content-[''] after:content-['']",
  light:
    "[background:linear-gradient(45deg,#f8fafc_0%,#f1f5f9_25%,#e2e8f0_50%,#f3f4f6_75%,#ffffff_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.08)_0%,transparent_60%)] after:absolute after:inset-0 after:[background:radial-gradient(ellipse_at_top_right,rgba(147,197,253,0.06)_0%,transparent_50%)] before:content-[''] after:content-['']",
};

/** How the three bands are labelled and coloured, worst first. */
const BANDS = [
  {
    key: "critical" as const,
    title: "Critical Priority",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    icon: AlertTriangle,
    cardClassName: "border-l-4 border-red-600",
  },
  {
    key: "high" as const,
    title: "High Priority",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    icon: Clock,
    cardClassName: "border-l-4 border-orange-500",
  },
  {
    key: "medium" as const,
    title: "Recently Overdue",
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    icon: Calendar,
    cardClassName: "border-l-4 border-yellow-500",
  },
];

export default function OverduePage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Anything due strictly before midnight today. Expressed in the query rather
  // than as a predicate, so the rows never leave the database.
  const dueBefore = useMemo(() => toPostgresDate(new Date()), []);

  const {
    tasks,
    setTasks,
    collections,
    isLoading,
    isRefreshing,
    refresh,
    today,
  } = useTaskView({ isCompleted: false, dueBefore });

  const actions = useTaskActions(setTasks, { collections });
  const sorted = useMemo(() => sortTasks(tasks), [tasks]);

  const daysOverdue = useMemo(
    () => (dueDate: string) => {
      const due = new Date(dueDate);
      due.setHours(0, 0, 0, 0);
      return Math.ceil(
        (today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)
      );
    },
    [today]
  );

  const grouped = useMemo(() => {
    const groups: Record<"critical" | "high" | "medium", TaskRow[]> = {
      critical: [],
      high: [],
      medium: [],
    };

    sorted.forEach((task) => {
      if (!task.due_date) return;
      const days = daysOverdue(task.due_date);
      if (days > 7) groups.critical.push(task);
      else if (days >= 3) groups.high.push(task);
      else groups.medium.push(task);
    });

    return groups;
  }, [sorted, daysOverdue]);

  const averageDaysOverdue = useMemo(() => {
    if (sorted.length === 0) return 0;
    const total = sorted.reduce(
      (sum, task) => (task.due_date ? sum + daysOverdue(task.due_date) : sum),
      0
    );
    return Math.round(total / sorted.length);
  }, [sorted, daysOverdue]);

  return (
    <TaskScreen
      isDark={isDark}
      gradient={GRADIENT}
      icon={AlertTriangle}
      accent={{ dark: "text-red-400", light: "text-red-500" }}
      title="Overdue Tasks"
      subtitle={
        <>
          {sorted.length} task{sorted.length !== 1 ? "s" : ""} need
          {sorted.length === 1 ? "s" : ""} your immediate attention
        </>
      }
      onRefresh={refresh}
      isRefreshing={isRefreshing}
      isLoading={isLoading}
      loadingLabel="Loading overdue tasks..."
      stats={
        sorted.length > 0
          ? [
              {
                title: "Total Overdue",
                value: sorted.length,
                icon: AlertTriangle,
                color: "bg-red-500",
                description: "Tasks past due",
              },
              {
                title: "Critical Items",
                value: grouped.critical.length,
                icon: TrendingDown,
                color: "bg-red-600",
                description: "7+ days overdue",
              },
              {
                title: "Average Delay",
                value: averageDaysOverdue,
                icon: Clock,
                color: "bg-orange-500",
                suffix: " days",
                description: "Days overdue",
              },
              {
                title: "Completion Rate",
                value: Math.max(0, 100 - sorted.length * 5),
                icon: Target,
                color: "bg-yellow-500",
                suffix: "%",
                description: "Time management",
              },
            ]
          : undefined
      }
      empty={
        sorted.length === 0
          ? {
              title: "No overdue tasks",
              message:
                "Excellent! You're all caught up and have no overdue tasks.",
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
          <OverdueBand
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

function OverdueBand({
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
        subject="need attention"
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
