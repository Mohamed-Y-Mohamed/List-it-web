"use client";

// The REMINDER row, as the iOS app draws it.
//
// This replaces ReminderChips, which offered "1 hour before", "1 day before" and
// the rest as a row of chips over an offset model. The iOS app has never had
// offsets: `TaskDetailView.reminderRow` is a single DatePicker taking a date and
// an hour and minute, bounded to the task's due day, with an ✕ to clear it. The
// two had drifted into different features wearing the same name, and this is the
// one the app is supposed to have.
//
// Shape, matching the Swift:
//
//   set     🔔  [ date and time ]                                    ✕
//   unset   🔔  No reminder                              Add Reminder
//   fired   🔔  Reminded at: 3 Oct, 09:00                Remind Again
//
// The "fired" state is the web's equivalent of iOS's `ReminderStore` lookup. It
// keeps no separate store: a stored absolute reminder whose time has passed *is*
// the record that one was set, so it reads as the receipt rather than as a live
// reminder, and the button offers another.
//
// One reminder per task, because iOS identifies the notification request by the
// task id and so has room for exactly one. See MAX_REMINDERS_PER_TASK.

import React, { useEffect, useRef } from "react";
import { Bell, X } from "lucide-react";
import {
  clampReminderToDueDay,
  isDueDayPast,
  newReminderId,
  reminderBounds,
  type Reminder,
} from "@/lib/reminders";
import { IS_NATIVE_BUILD } from "@/lib/platform";
import { ensureNotificationPermission } from "@/lib/notifications";
import { INFO, WARNING } from "./tokens";

/** `YYYY-MM-DDTHH:MM` in local time, which is what datetime-local speaks. */
function toLocalInput(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

/** Reads one back. Returns null for the empty field and for anything unparseable. */
function fromLocalInput(value: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export default function ReminderPicker({
  reminders,
  onChange,
  /** `YYYY-MM-DD` of the due date, or null. Bounds the picker when present. */
  dueDateKey,
  isDark,
}: {
  reminders: Reminder[];
  onChange: (next: Reminder[]) => void;
  dueDateKey: string | null;
  isDark: boolean;
}) {
  const [permissionBlocked, setPermissionBlocked] = React.useState(false);

  // The one reminder, or null. Legacy offsets are read but not editable here —
  // they have no instant of their own to put in the field, so the row offers to
  // replace them rather than pretending the picker can show one.
  const current = reminders[0] ?? null;
  const absolute = current?.kind === "absolute" ? current : null;
  const at = absolute ? new Date(absolute.at) : null;

  const now = new Date();
  const hasFired = Boolean(at && at <= now);
  const isLive = Boolean(at && at > now);

  const { min, max } = reminderBounds(dueDateKey);
  const overdue = isDueDayPast(dueDateKey);

  // Asking here rather than only on a master switch. A permission revoked in
  // system Settings since the last edit looks exactly like a working reminder
  // and schedules nothing — `syncTaskReminders` bails without the grant. Safe to
  // call repeatedly: it checks first.
  const askPermission = () => {
    void ensureNotificationPermission().then((granted) => {
      setPermissionBlocked(!granted);
    });
  };

  const setAt = (next: Date) => {
    onChange([
      { id: current?.id ?? newReminderId(), kind: "absolute", at: next.toISOString() },
    ]);
  };

  /**
   * Follow the due date — iOS `keepReminderWithinDueDay`.
   *
   * Moving a due date earlier would otherwise leave a reminder sitting past the
   * end of the day it belongs to, which the picker's own bounds say is not
   * allowed. Keyed on the date rather than on every render so it cannot fight
   * the field while someone is typing in it.
   */
  const lastDueKey = useRef(dueDateKey);
  useEffect(() => {
    if (lastDueKey.current === dueDateKey) return;
    lastDueKey.current = dueDateKey;

    if (!absolute) return;
    const stored = new Date(absolute.at);
    if (Number.isNaN(stored.getTime())) return;

    const clamped = clampReminderToDueDay(stored, dueDateKey);
    if (clamped.getTime() !== stored.getTime()) {
      onChange([{ ...absolute, at: clamped.toISOString() }]);
    }
  }, [dueDateKey, absolute, onChange]);

  const fieldClass = isDark
    ? "border-white/[0.08] bg-white/[0.04] text-white"
    : "border-black/[0.08] bg-[var(--surface-card)] text-black";

  const muted = isDark ? "text-gray-300" : "text-gray-500";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2.5">
        <Bell className="h-4 w-4 shrink-0" style={{ color: INFO }} />

        {isLive && at ? (
          <>
            <input
              type="datetime-local"
              value={toLocalInput(at)}
              aria-label="Reminder date and time"
              min={toLocalInput(min)}
              max={max ? toLocalInput(max) : undefined}
              onChange={(event) => {
                const next = fromLocalInput(event.target.value);
                if (next) setAt(next);
              }}
              className={`min-h-[44px] min-w-0 flex-1 rounded-xl border px-3 text-[14px] focus:outline-none focus:ring-1 ${fieldClass}`}
              style={{ ["--tw-ring-color" as string]: INFO }}
            />
            <button
              type="button"
              onClick={() => onChange([])}
              aria-label="Remove reminder"
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                isDark ? "active:bg-white/10" : "active:bg-black/5"
              }`}
            >
              <X className={`h-4 w-4 ${muted}`} />
            </button>
          </>
        ) : (
          <>
            <span className={`min-w-0 flex-1 text-[14px] ${muted}`}>
              {hasFired && at
                ? `Reminded at: ${at.toLocaleString(undefined, {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : current
                  ? // A legacy offset. It still fires; it simply cannot be shown
                    // in a field that holds an instant.
                    "Reminder set"
                  : "No reminder"}
            </span>

            <button
              type="button"
              disabled={overdue}
              onClick={() => {
                askPermission();
                // An hour from now, pulled inside the due day — the same opening
                // position the Swift uses (`Date().addingTimeInterval(60 * 60)`).
                const start = new Date(Date.now() + 60 * 60 * 1000);
                setAt(clampReminderToDueDay(start, dueDateKey));
              }}
              className="shrink-0 text-[13px] font-semibold disabled:opacity-40"
              style={{ color: INFO }}
            >
              {current ? "Remind Again" : "Add Reminder"}
            </button>
          </>
        )}
      </div>

      {/* iOS shows this exact caption under the row, and only in this case. */}
      {overdue && !isLive && (
        <p className={`text-[11px] ${isDark ? "text-gray-400" : "text-gray-500"}`}>
          This Task is overdue, so a reminder can&apos;t be set. Change the due
          date to today or later to set one.
        </p>
      )}

      {!dueDateKey && (
        <p className={`text-[11px] ${isDark ? "text-gray-400" : "text-gray-500"}`}>
          With no due date a reminder can be any time you choose.
        </p>
      )}

      {/* The reminder is saved either way. Saying so beats a row that looks set
          while the OS quietly delivers nothing. */}
      {permissionBlocked && (
        <p className="text-[11px]" style={{ color: WARNING }}>
          Notifications are turned off for List It, so this reminder will not be
          delivered. Turn them on in your device settings.
        </p>
      )}

      {/* Stored and shown on the web, but nothing fires them there: a browser
          cannot schedule a local notification for later, and doing it properly
          needs a push backend this app does not have. */}
      {!IS_NATIVE_BUILD && (
        <p className={`text-[11px] ${isDark ? "text-gray-400" : "text-gray-500"}`}>
          Reminders are delivered by the mobile app. They are saved here and will
          be waiting on your phone.
        </p>
      )}
    </div>
  );
}
