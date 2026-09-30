"use client";

// Tick off, pin, edit and delete a task, with the on-screen list kept in step.
//
// These four handlers were written out in full on five of the six task screens,
// identically apart from one decision: whether ticking a task off removes it
// from the screen. On Today, Tomorrow, Priority, Overdue and Not Completed it
// does — the task no longer belongs there. On Completed the opposite is true,
// so `removeWhen` says which.

import { useCallback } from "react";
import { supabase } from "@/utils/client";
import { useAuth } from "@/context/AuthContext";
import type { Collection as SchemaCollection } from "@/types/schema";
import type { TaskActionResult, TaskRow } from "@/types/taskView";

interface TaskEdit {
  text: string;
  description?: string | null;
  due_date?: Date | null;
  is_pinned: boolean;
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
  } = {}
) {
  const { user } = useAuth();
  const { removeWhen = true, collections = [] } = options;

  const guard = useCallback(
    () =>
      user ? null : { success: false, error: "User not authenticated" as const },
    [user]
  );

  const handleTaskComplete = useCallback(
    async (taskId: string, isCompleted: boolean): Promise<TaskActionResult> => {
      const denied = guard();
      if (denied) return denied;

      try {
        const { error } = await supabase
          .from("task")
          .update({
            is_completed: isCompleted,
            date_completed: isCompleted ? new Date().toISOString() : null,
          })
          .eq("id", taskId);

        if (error) {
          console.error("Error updating task completion:", error);
          return { success: false, error };
        }

        if (isCompleted === removeWhen) {
          setTasks((previous) => previous.filter((t) => t.id !== taskId));
        } else {
          setTasks((previous) =>
            previous.map((t) =>
              t.id === taskId ? { ...t, is_completed: isCompleted } : t
            )
          );
        }

        return { success: true };
      } catch (error) {
        console.error("Unexpected error updating task completion:", error);
        return { success: false, error };
      }
    },
    [guard, removeWhen, setTasks]
  );

  const handleTaskPriority = useCallback(
    async (taskId: string, isPinned: boolean): Promise<TaskActionResult> => {
      const denied = guard();
      if (denied) return denied;

      try {
        const { error } = await supabase
          .from("task")
          .update({ is_pinned: isPinned })
          .eq("id", taskId);

        if (error) {
          console.error("Error updating task priority:", error);
          return { success: false, error };
        }

        setTasks((previous) =>
          previous.map((t) =>
            t.id === taskId ? { ...t, is_pinned: isPinned } : t
          )
        );

        return { success: true };
      } catch (error) {
        console.error("Unexpected error updating task priority:", error);
        return { success: false, error };
      }
    },
    [guard, setTasks]
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
          .eq("id", taskId);

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
                  is_pinned: taskData.is_pinned,
                }
              : t
          )
        );

        return { success: true };
      } catch (error) {
        console.error("Unexpected error updating task:", error);
        return { success: false, error };
      }
    },
    [guard, setTasks]
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
    [guard, setTasks]
  );

  const handleCollectionChange = useCallback(
    async (taskId: string, collectionId: string): Promise<TaskActionResult> => {
      const denied = guard();
      if (denied) return denied;

      try {
        const { error } = await supabase
          .from("task")
          .update({ collection_id: collectionId })
          .eq("id", taskId);

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
              : t
          )
        );

        return { success: true };
      } catch (error) {
        console.error("Unexpected error updating task collection:", error);
        return { success: false, error };
      }
    },
    [guard, collections, setTasks]
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
