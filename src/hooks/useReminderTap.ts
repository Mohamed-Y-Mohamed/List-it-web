"use client";

// Where a tapped reminder takes you.
//
// The notification already carried `extra: { taskId, listId }` (see
// `syncTaskReminders` in lib/notifications.ts), but nothing listened for the
// tap — so a reminder opened the app on whatever screen it was last showing,
// which is rarely the task it was reminding you about.
//
// Mounted in AppDataProvider alongside useTaskReminders, for the same reason:
// it sits above the navigation boundary, so the listener is registered wherever
// the user happens to be.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LocalNotifications } from "@capacitor/local-notifications";
import { isNativeApp, IS_NATIVE_BUILD } from "@/lib/platform";
import { appPath, listHref } from "@/lib/routes";

/** The `?task=` the list screen reads to decide which collection to open. */
export function listHrefForTask(
  listId: string,
  taskId: string | undefined,
  isNative: boolean,
): string {
  const href = listHref(listId, isNative);
  if (!taskId) return href;

  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}task=${encodeURIComponent(taskId)}`;
}

export function useReminderTap(): void {
  const router = useRouter();

  useEffect(() => {
    if (!isNativeApp()) return;

    let cancelled = false;

    const handle = LocalNotifications.addListener(
      "localNotificationActionPerformed",
      (event) => {
        if (cancelled) return;

        const extra = event.notification.extra as
          | { taskId?: string; listId?: string }
          | undefined;

        // A reminder with no list is nothing to navigate to. Bail rather than
        // pushing a broken URL.
        if (!extra?.listId) return;

        // `router.replace`, and the path run through `appPath` first: the
        // native build is a static export with trailingSlash, and a slash-less
        // push falls back to a full document load that remounts the auth
        // provider and bounces through /login.
        router.replace(
          appPath(listHrefForTask(extra.listId, extra.taskId, IS_NATIVE_BUILD)),
        );
      },
    );

    return () => {
      cancelled = true;
      void handle.then((h) => h.remove()).catch(() => {});
    };
  }, [router]);
}
