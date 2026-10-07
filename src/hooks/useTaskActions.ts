"use client";

// Tick off, pin, edit and delete a task, with the on-screen list kept in step.
//
// These four handlers were written out in full on five of the six task screens,
// identically apart from one decision: whether ticking a task off removes it
// from the screen. On Today, Tomorrow, Priority, Overdue and Not Completed it
// does — the task no longer belongs there. On Completed the opposite is true,
// so `removeWhen` says which.

import { useCallback, useRef } from "react";
import { supabase } from "@/utils/client";
import { useAuth } from "@/context/AuthContext";
import type { Collection as SchemaCollection } from "@/types/schema";
import type { TaskActionResult, TaskRow } from "@/types/taskView";
import { applyCompletion } from "@/lib/completion";

interface TaskEdit {
  text: string;
  description?: string | null;
  due_date?: Date | null;
  is_pinned: boolean;
  /**
   * Sent by the detail sheet and previously undeclared, so the compiler said
   * they did not exist while they arrived at runtime regardless. The sheet owns
   * writing them; this hook only needs them to keep the on-screen row honest.
   */
  due_has_time?: boolean;
  reminders?: unknown;
}

export function useTaskActions(
  setTasks: React.Dispatch<React.SetStateAction<TaskRow[]>>,
  options: {
    /**
     * Which completion state means "this no longer belongs on this screen".
     * `true` on the screens listing outstanding work, `false` on Completed.
     */
    removeWhen?: boolean;
    /** Needed only to name the collection a task is moved into. */
    collections?: SchemaCollection[];
    /**
     * The rows currently on screen.
     *
     * Completion needs the task's own `repeat_rule` and `due_date` to decide
     * whether ticking it means "done" or "due again", and this hook only ever
     * had the setter. Passed rather than fetched: the caller already holds them.
     */
    tasks?: TaskRow[];
  } = {},
) {
  const { user } = useAuth();
  const { removeWhen = true, collections = [], tasks = [] } = options;

  // Through a ref so the handlers do not take `tasks` as a dependency and get
  // rebuilt on every keystroke that changes a row.
  const tasksRef = useRef<TaskRow[]>(tasks);
  tasksRef.current = tasks;

  const guard = useCallback(
    () =>
      user
        ? null
        : { success: false, error: "User not authenticated" as const },
    [user],
  );

  const handleTaskComplete = useCallback(
    async (taskId: string, isCompleted: boolean): Promise<TaskActionResult> => {
      const denied = guard();
      if (denied) return denied;

      try {
        // What ticking this task means. Shared with ListDetailView and
        // TasksDetails so the three write paths cannot disagree.
        const existing = tasksRef.current.find((t) => t.id === taskId);
        const patch = applyCompletion(existing ?? {}, isCompleted);

        const { error } = await supabase
          .from("task")
          .update(patch)
          .eq("id", taskId)
          // Scoped to the signed-in user as well as the row id. RLS should make
          // this redundant, but a missing predicate here is the difference
          // between a policy being defence in depth and being the only defence.
          // `guard()` at the top has already returned when there is no user.
          .eq("user_id", user!.id);

        if (error) {
          console.error("Error updating task completion:", error);
          return { success: false, error };
        }

        // `patch.is_completed` rather than the argument: the decision of what
        // was written belongs to applyCompletion, and reading it back keeps this
        // correct if that ever decides something other than the argument again.
        if (patch.is_completed === removeWhen) {
          setTasks((previous) => previous.filter((t) => t.id !== taskId));
        } else {
          setTasks((previous) =>
            previous.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    is_completed: patch.is_completed,
                    date_completed: patch.date_completed,
                  }
                : t,
            ),
          );
        }

        return { success: true };
      } catch (error) {
        console.error("Unexpected error updating task completion:", error);
        return { success: false, error };
      }
    },
    [guard, removeWhen, setTasks, user],
  );

  const handleTaskPriority = useCallback(
    async (taskId: string, isPinned: boolean): Promise<TaskActionResult> => {
      const denied = guard();
      if (denied) return denied;

      try {
        const { error } = await supabase
          .from("task")
          .update({ is_pinned: isPinned })
          .eq("id", taskId)
          // Same scoping as the completion write above, and for the same
          // reason. Three of the four writes in this hook were missing it while
          // the fourth carried a comment explaining why it mattered.
          .eq("user_id", user!.id);

        if (error) {
          console.error("Error updating task priority:", error);
          return { success: false, error };
        }

        setTasks((previous) =>
          previous.map((t) =>
            t.id === taskId ? { ...t, is_pinned: isPinned } : t,
          ),
        );

        return { success: true };
      } catch (error) {
        console.error("Unexpected error updating task priority:", error);
        return { success: false, error };
      }
    },
    [guard, setTasks, user],
  );

  const handleTaskUpdate = useCallback(
    async (taskId: string, taskData: TaskEdit): Promise<TaskActionResult> => {
      const denied = guard();
      if (denied) return denied;

      try {
        const dueDate = taskData.due_date
          ? taskData.due_date.toISOString()
          : null;

        const { error } = await supabase
          .from("task")
          .update({
            text: taskData.text,
            description: taskData.description,
            due_date: dueDate,
            is_pinned: taskData.is_pinned,
          })
          .eq("id", taskId)
          .eq("user_id", user!.id);

        if (error) {
          console.error("Error updating task:", error);
          return { success: false, error };
        }

        setTasks((previous) =>
          previous.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  text: taskData.text,
                  description: taskData.description ?? null,
                  due_date: dueDate,
                  // The sheet has already written these; carrying them into the
                  // row on screen stops the card reading a freshly timed due
                  // date with the old `due_has_time` and showing the wrong day
                  // until the next full refetch.
                  ...(taskData.due_has_time === undefined
                    ? {}
                    : { due_has_time: taskData.due_has_time }),
                  ...(taskData.reminders === undefined
                    ? {}
                    : { reminders: taskData.reminders }),
                  is_pinned: taskData.is_pinned,
                }
              : t,
          ),
        );

        return { success: true };
      } catch (error) {
        console.error("Unexpected error updating task:", error);
        return { success: false, error };
      }
    },
    [guard, setTasks, user],
  );

  /**
   * Drops a deleted task from the screen. Deliberately does NOT write to the
   * database: TaskCard has already done that by the time it calls back, and
   * deleting again here would be a second write against a row that is gone.
   */
  const handleTaskDelete = useCallback(
    async (taskId: string): Promise<TaskActionResult> => {
      const denied = guard();
      if (denied) return denied;

      try {
        setTasks((previous) => previous.filter((t) => t.id !== taskId));
        return { success: true };
      } catch (error) {
        console.error("Error handling task deletion:", error);
        return { success: false, error };
      }
    },
    [guard, setTasks],
  );

  const handleCollectionChange = useCallback(
    async (taskId: string, collectionId: string): Promise<TaskActionResult> => {
      const denied = guard();
      if (denied) return denied;

      try {
        const { error } = await supabase
          .from("task")
          .update({ collection_id: collectionId })
          .eq("id", taskId)
          .eq("user_id", user!.id);

        if (error) {
          console.error("Error updating task collection:", error);
          return { success: false, error };
        }

        const collectionName =
          collections.find((c) => c.id === collectionId)?.collection_name ??
          "Uncategorized";

        setTasks((previous) =>
          previous.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  collection_id: collectionId,
                  collection_name: collectionName ?? undefined,
                }
              : t,
          ),
        );

        return { success: true };
      } catch (error) {
        console.error("Unexpected error updating task collection:", error);
        return { success: false, error };
      }
    },
    [guard, collections, setTasks, user],
  );

  // Named for the props they end up as, so a screen can spread the whole lot
  // into TaskList rather than wiring five callbacks by hand — which is how
  // Today ended up passing a slightly different set from the others.
  return {
    onComplete: handleTaskComplete,
    onPriorityChange: handleTaskPriority,
    onTaskUpdate: handleTaskUpdate,
    onTaskDelete: handleTaskDelete,
    onCollectionChange: handleCollectionChange,
  };
}
