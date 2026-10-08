"use client";

// Reads and writes the notification preferences.
//
// `prefs` is null until the stored value has been read, and callers are expected
// to render their loading state while it is. That is deliberate rather than
// defensive: the alternative is seeding state with the default and correcting it
// in an effect, which paints one frame of a switch that says reminders are on
// before flipping it off for anyone who turned them off. Seeding from
// localStorage inside the initialiser would avoid the flash but not the cause —
// this is a static export, so the prerendered HTML always says on and a different
// first client render is a hydration mismatch.
//
// No context and no cross-tab syncing. Nothing else on the web side reads this:
// the switch states an intention, and the mobile app is what consults it when a
// reminder is due. If a second screen ever needs to read it live, this needs a
// provider.

import { useCallback, useEffect, useState } from "react";
import {
  readNotificationPrefs,
  writeNotificationPrefs,
  type NotificationPrefs,
} from "@/lib/notificationPrefs";

export function useNotificationPrefs(): {
  /** null while the stored value is still being read. */
  prefs: NotificationPrefs | null;
  setPrefs: (next: NotificationPrefs) => void;
} {
  const [prefs, setPrefsState] = useState<NotificationPrefs | null>(null);

  useEffect(() => {
    setPrefsState(readNotificationPrefs());
  }, []);

  const setPrefs = useCallback((next: NotificationPrefs) => {
    // Reflected immediately; the write is not something to wait on, and the
    // control that calls this is under the user's finger.
    setPrefsState(next);
    writeNotificationPrefs(next);
  }, []);

  return { prefs, setPrefs };
}
