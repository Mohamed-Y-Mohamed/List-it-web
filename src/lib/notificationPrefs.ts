// lib/notificationPrefs.ts
// Whether this install is allowed to put task reminders in front of the user.
//
// Stored per install rather than per account, next to the theme and the list
// layout. A reminder is delivered by the app holding this storage, so "do not
// interrupt me" is a statement about this phone, not about the account: signing
// in on a second device should not inherit a decision made on the first. It also
// costs no network round trip to read, which matters because the switch has to
// paint its current state the moment Settings opens.
//
// Native only in practice: the Notifications section that writes it is inside the
// native-only part of Settings, and the browser has nothing to deliver. Nothing
// here depends on that, so it stays a plain module rather than a gated one.
//
// Stored as a JSON object rather than a bare flag so a second notification
// choice lands as another field on a key that already parses defensively,
// instead of a second key and a migration.

export interface NotificationPrefs {
  /** The master switch. Off keeps every reminder the user has set, and delivers none. */
  remindersEnabled: boolean;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  remindersEnabled: true,
};

const STORAGE_KEY = "listit.notificationPrefs";

/**
 * Narrows an unknown stored value to a set of preferences, falling back to the
 * default.
 *
 * Worth being strict about rather than casting: the value comes out of
 * localStorage, which is shared with every other key on the origin and survives
 * app updates. A stale or hand-edited value has to land on a real boolean, not be
 * trusted into an `aria-checked` the switch cannot describe and a truthiness test
 * that silently reads "false" as on.
 */
export function parseNotificationPrefs(value: unknown): NotificationPrefs {
  if (typeof value !== "object" || value === null) {
    return DEFAULT_NOTIFICATION_PREFS;
  }

  const { remindersEnabled } = value as { remindersEnabled?: unknown };

  return typeof remindersEnabled === "boolean"
    ? { remindersEnabled }
    : DEFAULT_NOTIFICATION_PREFS;
}

/**
 * The stored preferences, or the default when nothing is stored or storage is
 * barred.
 *
 * Reads are wrapped because localStorage throws rather than returning null when
 * the WebView has site data blocked, and because `JSON.parse` throws on a value
 * that is not JSON at all. One catch covers both: neither is worth taking the
 * screen down over, and both mean the same thing here, which is that there is no
 * usable choice on this device.
 */
export function readNotificationPrefs(): NotificationPrefs {
  if (typeof window === "undefined") return DEFAULT_NOTIFICATION_PREFS;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === null) return DEFAULT_NOTIFICATION_PREFS;

    return parseNotificationPrefs(JSON.parse(stored));
  } catch {
    return DEFAULT_NOTIFICATION_PREFS;
  }
}

/**
 * Fired when the choice changes, so whatever owns the OS's pending reminders
 * can act on it.
 *
 * Writing the flag is not the same as applying it. `syncTaskReminders` is what
 * cancels and schedules, and it only ran on a task change or a Capacitor
 * `resume`. Settings is an in-app tab, so neither happened: turning reminders
 * off left every queued alarm to fire anyway, and turning them back on
 * scheduled nothing until the app had been backgrounded and reopened.
 *
 * A plain window event rather than a provider, because exactly one listener
 * wants it and this module's own note says it is not shared state.
 */
export const NOTIFICATION_PREFS_CHANGED = "listit:notificationPrefsChanged";

/** Records the choice. Silent on failure, for the same reason reads are. */
export function writeNotificationPrefs(prefs: NotificationPrefs): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // The choice then lasts for this session only, which is a better outcome
    // than the switch refusing to move.
  }

  // Outside the try on purpose: a storage failure still leaves the choice live
  // for this session, so the device's reminders should still follow it.
  window.dispatchEvent(new CustomEvent(NOTIFICATION_PREFS_CHANGED));
}
