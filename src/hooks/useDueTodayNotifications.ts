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

export function useDueTodayNotifications(tasks: Task[]) {
  useEffect(() => {
    if (!isNativeApp()) return;

    // Nothing loaded yet — syncing now would cancel today's reminders and
    // schedule nothing in their place.
    if (tasks.length === 0) return;

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
  }, [tasks]);
}
