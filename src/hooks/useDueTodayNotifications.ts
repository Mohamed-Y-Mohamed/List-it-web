"use client";

// Keeps the scheduled due-today reminders in step with the tasks on screen.
//
// Re-syncs whenever the task list changes and whenever the app returns to the
// foreground — a task completed on another device, or the clock rolling past
// midnight, should both be reflected without the user doing anything.
//
// No-op on the web.

import { useEffect } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { isNativeApp } from "@/lib/platform";
import { syncDueTodayNotifications } from "@/lib/notifications";
import type { Task } from "@/types/schema";

/**
 * @param tasks  The caller's open, undeleted tasks.
 * @param loaded Whether `tasks` reflects a completed fetch. Required, because an
 *   empty array means two opposite things and only the caller can tell them
 *   apart.
 */
export function useDueTodayNotifications(tasks: Task[], loaded: boolean) {
  useEffect(() => {
    if (!isNativeApp()) return;

    // An empty list is only meaningless before the first fetch resolves. Once it
    // has, empty means the user genuinely has nothing open — and that has to
    // reach the scheduler, because it is exactly what completing the last task
    // looks like. Bailing on `tasks.length === 0` instead left that reminder
    // pending, so it fired hours later for a task already ticked off.
    if (!loaded) return;

    let cancelled = false;
    const sync = () => {
      if (cancelled) return;
      void syncDueTodayNotifications(tasks);
    };

    sync();

    // Resuming is when the clock may have moved on, so recompute then too.
    const listener = CapacitorApp.addListener("resume", sync);

    return () => {
      cancelled = true;
      listener.then((handle) => handle.remove()).catch(() => {});
    };
  }, [tasks, loaded]);
}
