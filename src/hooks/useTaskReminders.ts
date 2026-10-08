"use client";

// Keeps the OS's pending reminders in step with the user's tasks.
//
// Mounted in AppDataProvider rather than on a screen. The due-today version this
// replaces ran from NativeHome, which meant nothing was ever rescheduled unless
// the Lists tab happened to be mounted — edit a task's reminder from inside a
// list and walk away, and the old reminder was still the one queued. The provider
// holds every task and sits above the navigation boundary, so this runs wherever
// the user is.

import { useEffect } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { isNativeApp } from "@/lib/platform";
import { syncTaskReminders } from "@/lib/notifications";
import { NOTIFICATION_PREFS_CHANGED } from "@/lib/notificationPrefs";
import type { Task } from "@/types/schema";

export function useTaskReminders(tasks: Task[], loaded: boolean): void {
  useEffect(() => {
    if (!isNativeApp()) return;

    // The loaded flag is load-bearing, and the reason is worth keeping written
    // down. An empty `tasks` means "not fetched yet" before the first load
    // resolves and "nothing to remind about" after it. Acting on the first would
    // cancel every pending reminder on each cold start, and they would only come
    // back if the fetch succeeded.
    if (!loaded) return;

    let cancelled = false;

    const sync = () => {
      if (cancelled) return;
      void syncTaskReminders(tasks);
    };

    sync();

    // Re-sync on foreground. The clock may have rolled over, the reminders may
    // have been changed on another device, and the Settings switch may have been
    // turned off while the app sat in the background.
    const listener = CapacitorApp.addListener("resume", sync);

    // And the moment the master switch moves. Settings is an in-app tab, so
    // flipping it fired neither trigger above: reminders turned off kept firing
    // until the app was next backgrounded, and turned back on scheduled nothing
    // while the switch read On.
    window.addEventListener(NOTIFICATION_PREFS_CHANGED, sync);

    return () => {
      cancelled = true;
      window.removeEventListener(NOTIFICATION_PREFS_CHANGED, sync);
      void listener.then((handle) => handle.remove()).catch(() => {});
    };
  }, [tasks, loaded]);
}
