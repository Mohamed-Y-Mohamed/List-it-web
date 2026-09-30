"use client";

// Loads the tasks for one of the six task screens, with their collection and
// list names attached.
//
// All six did this themselves, in near-identical copies, and all six did it in
// four round trips: every task, every collection, the lists behind those
// collections, and then the lists behind the tasks — the last two overlapping
// almost entirely. This does it in three, by collecting both sets of list ids
// and asking once.
//
// The screens differ only in which tasks they want, so that is all they pass.
// Everything else here was the same on every one of them.

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/utils/client";
import { useAuth } from "@/context/AuthContext";
import type { Collection as SchemaCollection } from "@/types/schema";
import type { TaskRow } from "@/types/taskView";

export interface TaskViewFilters {
  /** Matched against `is_completed`. Every screen sets this. */
  isCompleted?: boolean;
  /** Priority only: matched against `is_pinned`. */
  isPinned?: boolean;
  /** Overdue only: `due_date` strictly before this yyyy-mm-dd. */
  dueBefore?: string;
  /**
   * A date rule the query cannot express — "due today", "due tomorrow", "no due
   * date or still ahead". Runs after the fetch, against midnight-today.
   *
   * MUST be stable across renders: either a module-level function or one wrapped
   * in useMemo/useCallback. The fetch depends on its identity, so a function
   * defined inline in the component body makes a new one every render, which
   * re-runs the effect, which re-renders — a fetch loop that looks like a slow
   * screen rather than a bug.
   */
  predicate?: (task: TaskRow, today: Date) => boolean;
}

export function useTaskView(filters: TaskViewFilters) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [collections, setCollections] = useState<SchemaCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  // Destructured so the callback depends on the individual values rather than
  // the object, which every render recreates.
  const { isCompleted, isPinned, dueBefore, predicate } = filters;

  const refresh = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setIsRefreshing(true);

    try {
      let query = supabase.from("task").select("*").eq("is_deleted", false);
      if (isCompleted !== undefined) {
        query = query.eq("is_completed", isCompleted);
      }
      if (isPinned !== undefined) query = query.eq("is_pinned", isPinned);
      if (dueBefore) query = query.lt("due_date", dueBefore);

      const { data: allTasks, error: tasksError } = await query;

      if (tasksError) {
        console.error("Error fetching tasks:", tasksError);
        return;
      }

      const matching = predicate
        ? (allTasks ?? []).filter((task) => predicate(task as TaskRow, today))
        : (allTasks ?? []);

      // Collections are still wanted with no tasks to show: the task editor
      // offers them as destinations, so an empty screen still needs the list.
      const { data: collectionsData } = await supabase
        .from("collection")
        .select("*");

      // Both sets of list ids in one go. Fetching them separately is what made
      // this four round trips, and the two sets largely overlapped anyway.
      const listIds = new Set<string>();
      collectionsData?.forEach((collection) => {
        if (collection.list_id) listIds.add(collection.list_id);
      });
      matching.forEach((task) => {
        if (task.list_id) listIds.add(task.list_id);
      });

      const { data: listsData } = listIds.size
        ? await supabase.from("list").select("*").in("id", [...listIds])
        : { data: [] };

      const listMap = new Map(listsData?.map((list) => [list.id, list]));
      const collectionMap = new Map(
        collectionsData?.map((collection) => [collection.id, collection])
      );

      // One state write, where this used to set collections twice — once bare
      // and once with the list names — and render in between.
      setCollections(
        (collectionsData ?? []).map((collection) => ({
          id: collection.id,
          collection_name: collection.collection_name,
          bg_color_hex: collection.bg_color_hex || "#000000",
          list_id: collection.list_id,
          user_id: collection.user_id,
          created_at: collection.created_at,
          list_name: collection.list_id
            ? (listMap.get(collection.list_id)?.list_name ?? null)
            : null,
        }))
      );

      setTasks(
        matching.map((task) => ({
          ...(task as TaskRow),
          collection_name: task.collection_id
            ? (collectionMap.get(task.collection_id)?.collection_name ??
              "Uncategorized")
            : "Uncategorized",
          list_name: task.list_id
            ? (listMap.get(task.list_id)?.list_name ?? "Default List")
            : "Default List",
        }))
      );
    } catch (error) {
      console.error("Unexpected error fetching tasks:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, isCompleted, isPinned, dueBefore, predicate, today]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    tasks,
    setTasks,
    collections,
    isLoading,
    isRefreshing,
    refresh,
    today,
  };
}
