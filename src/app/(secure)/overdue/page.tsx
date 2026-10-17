"use client";

// Overdue: what has already slipped, and nothing else.
//
// This briefly covered everything dated — overdue, today, tomorrow and upcoming,
// in four bands — because when Overdue was the only dated screen, "what is coming
// up?" had nowhere to live and the screen was one you opened to feel bad rather
// than to plan. That reasoning held while this was the only dated view. It is not
// any more: Scheduled is a month calendar covering anything with a date on it, so
// the planning question has a better home than a band at the bottom of this list,
// and this screen is free to answer the one question it is named after.
//
// The rule is whole days: a task is overdue when its date is before today, which
// is `bandByDueDate`'s rule and the one every other screen already uses. A task
// due today is never overdue here, however late in the day — the alternative is
// rows sliding onto this screen while the user is looking at it, and Today and
// Overdue disagreeing about the same task.

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, History, Target } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useTaskView } from "@/hooks/useTaskView";
import { useTaskActions } from "@/hooks/useTaskActions";
import { daysBetween, sortTasks } from "@/lib/taskView";
import TaskScreen from "@/components/Tasks/TaskScreen";
import TaskList from "@/components/Tasks/TaskList";
import type { TaskRow } from "@/types/taskView";

/**
 * Anything with a date on it. Module level, not an inline arrow: useTaskView puts
 * the predicate in `refresh`'s dependency array, so a fresh identity each render
 * means a fetch each render.
 *
 * The narrowing to "before today" happens below rather than here, because it
 * needs `today` — which the hook owns and re-checks past midnight.
 */
const isScheduled = (task: TaskRow) => Boolean(task.due_date);

export default function OverduePage() {
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

  /** Dated, unfinished, and before today. Soonest-overdue first via `sortTasks`. */
  const overdue = useMemo(
    () =>
      sortTasks(tasks).filter(
        (task) => task.due_date && daysBetween(task.due_date, today) > 0,
      ),
    [tasks, today],
  );

  const averageDaysOverdue = useMemo(() => {
    if (overdue.length === 0) return 0;
    const total = overdue.reduce(
      (sum, task) => sum + daysBetween(task.due_date as string, today),
      0,
    );
    return Math.round(total / overdue.length);
  }, [overdue, today]);

  /** The worst one, which is the number that actually prompts someone to act. */
  const oldestDaysOverdue = useMemo(
    () =>
      overdue.reduce(
        (worst, task) =>
          Math.max(worst, daysBetween(task.due_date as string, today)),
        0,
      ),
    [overdue, today],
  );

  return (
    <TaskScreen
      isDark={isDark}
      icon={AlertTriangle}
      accent={{ dark: "text-red-400", light: "text-red-500" }}
      title="Overdue"
      subtitle={
        <>
          {overdue.length} task{overdue.length !== 1 ? "s" : ""} past their date
        </>
      }
      onRefresh={refresh}
      isRefreshing={isRefreshing}
      isLoading={isLoading}
      loadingLabel="Checking what has slipped..."
      stats={
        overdue.length > 0
          ? [
              {
                title: "Overdue",
                value: overdue.length,
                icon: AlertTriangle,
                color: "bg-red-500",
                description: "Past their date",
              },
              {
                title: "Average Delay",
                value: averageDaysOverdue,
                icon: Target,
                color: "bg-yellow-500",
                suffix: " days",
                description: "Across all of them",
              },
              {
                title: "Longest",
                value: oldestDaysOverdue,
                icon: History,
                color: "bg-orange-500",
                suffix: " days",
                description: "The one waiting longest",
              },
            ]
          : undefined
      }
      empty={
        overdue.length === 0
          ? {
              title: "Nothing overdue",
              message:
                "Nothing has slipped past its date. Anything dated and still ahead of you is on Scheduled.",
              icon: "check",
            }
          : undefined
      }
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        /* `space-y-4`, the gap every other task screen uses. AnimatePresence
           renders no element of its own, so TaskList's cards are direct children
           of this and the spacing reaches them. Without it the rows sat flush
           against each other, which the banded version never showed because each
           band brought its own wrapper. */
        className="space-y-4"
      >
        {/* One flat list, no bands. Every row here is the same kind of thing —
            late — so a heading over it would name the screen twice. */}
        <TaskList
          tasks={overdue}
          collections={collections}
          cardClassName="border-l-4 border-red-600"
          {...actions}
        />
      </motion.div>
    </TaskScreen>
  );
}
