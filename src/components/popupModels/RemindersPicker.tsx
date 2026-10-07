"use client";

// The body of the Reminders section: a list of reminders, and the ways to add one.
//
// Offsets count back from the moment the task is due, so they need a due date to
// exist at all — without one only a fixed date and time is offered, which is the
// honest answer rather than a disabled section. With a due date but no time, the
// offsets resolve against 09:00 that morning, and the note says so instead of
// leaving "1 hour before" meaning something nobody can see.
//
// The delivery note at the bottom is deliberate. On the web these are stored and
// shown but nothing fires them: browsers cannot schedule a local notification for
// later, and doing it properly needs a push backend this app does not have. Saying
// that is better than a reminder that silently never arrives.

import React, { useState } from "react";
import { Bell, Plus, X } from "lucide-react";
import { IS_NATIVE_BUILD } from "@/lib/platform";
import { ensureNotificationPermission } from "@/lib/notifications";
import {
  MAX_REMINDERS_PER_TASK,
  OFFSET_PRESETS,
  describeReminder,
  newReminderId,
  type Reminder,
} from "@/lib/reminders";

/** `datetime-local` wants local wall-clock with no zone, which toISOString is not. */
function toInputValue(date: Date): string {
  const pad = (n: number) => `${n}`.padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

export default function RemindersPicker({
  reminders,
  onChange,
  hasDueDate,
  hasDueTime,
  dueAtIso,
  isDark,
}: {
  reminders: Reminder[];
  onChange: (next: Reminder[]) => void;
  hasDueDate: boolean;
  hasDueTime: boolean;
  /** The moment the task is due, so a fixed reminder can be held before it. */
  dueAtIso?: string | null;
  isDark: boolean;
}) {
  const [customAt, setCustomAt] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);

  const full = reminders.length >= MAX_REMINDERS_PER_TASK;

  const dueAt = dueAtIso ? new Date(dueAtIso) : null;

  // A reminder after the deadline is not a reminder, it is a note about something
  // already missed — and it is an easy thing to set by accident when typing a date
  // by hand. The input is capped as well, but a cap alone is silently ignored by
  // some Android keyboards, so the check happens on the way in too.
  const latestAllowed = dueAt && !Number.isNaN(dueAt.getTime()) ? dueAt : null;

  const add = (reminder: Reminder) => {
    if (full) return;

    // Adding a reminder is the plainest statement there is that someone wants to
    // be notified, so it is a moment we are allowed to ask on — the rule is that
    // sync never prompts and explicit opt-in does, and this is explicit opt-in.
    //
    // The Reminders switch above also asks, but only on the edge where it flips
    // on. That misses the two ways a task ends up holding a reminder that can
    // never fire: a switch that was already on from a previous edit, and a
    // permission revoked in system Settings since it was granted. Both looked
    // exactly like a working reminder — chip on the card, bell on the task,
    // nothing scheduled — because syncTaskReminders bails without the grant.
    //
    // Safe to call repeatedly: it checks first and only shows the system dialog
    // when the state is still "prompt".
    void ensureNotificationPermission();

    onChange([...reminders, reminder]);
  };

  const remove = (id: string) =>
    onChange(reminders.filter((reminder) => reminder.id !== id));

  // An offset already on the list is not offered again — two reminders at the same
  // moment is a double buzz, not a feature.
  const usedOffsets = new Set(
    reminders.filter((r) => r.kind === "offset").map((r) => r.minutes)
  );

  return (
    <div className="space-y-4">
      {reminders.length > 0 && (
        <ul className="space-y-2">
          {reminders.map((reminder) => (
            <li
              key={reminder.id}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 ${
                isDark ? "bg-gray-700/50" : "bg-gray-100"
              }`}
            >
              <Bell className="h-4 w-4 shrink-0 text-orange-500" />
              <span className="min-w-0 flex-1 truncate text-sm">
                {describeReminder(reminder)}
              </span>
              <button
                type="button"
                onClick={() => remove(reminder.id)}
                aria-label={`Remove reminder ${describeReminder(reminder)}`}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 active:bg-black/10 dark:active:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {hasDueDate && (
        <div>
          <p className={`pb-2 text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            {hasDueTime
              ? "Before it is due"
              : "Before it is due. With no time set, that means 9am on the day."}
          </p>
          <div className="flex flex-wrap gap-2">
            {OFFSET_PRESETS.filter((preset) => !usedOffsets.has(preset.minutes)).map(
              (preset) => (
                <button
                  key={preset.minutes}
                  type="button"
                  disabled={full}
                  onClick={() =>
                    add({ id: newReminderId(), kind: "offset", minutes: preset.minutes })
                  }
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 ${
                    isDark ? "bg-gray-700/60 text-gray-300" : "bg-gray-100 text-gray-700"
                  }`}
                >
                  <Plus className="mr-1 inline h-3 w-3" />
                  {preset.label}
                </button>
              )
            )}
          </div>
        </div>
      )}

      <div>
        <p className={`pb-2 text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
          {hasDueDate ? "Or at a fixed time" : "At a fixed time"}
        </p>
        <div className="flex gap-2">
          {/* No Add button. Picking a date and a time is the whole decision, and
              a separate confirm step is one a picker has already taken: the
              Android dialog closes on OK, which reads as done, so a reminder that
              needed one more tap was simply lost. It commits on change, the same
              as the preset chips beside it, and an entry in the list above is the
              confirmation. */}
          <input
            type="datetime-local"
            value={customAt}
            disabled={full}
            max={latestAllowed ? toInputValue(latestAllowed) : undefined}
            onChange={(event) => {
              const value = event.target.value;
              setCustomAt(value);
              setCustomError(null);
              if (!value) return;

              // The input hands back local wall-clock time with no zone; new Date
              // reads it as local, which is what the user meant by picking it.
              const at = new Date(value);
              if (Number.isNaN(at.getTime())) return;

              if (latestAllowed && at >= latestAllowed) {
                setCustomError("Pick a time before the task is due.");
                return;
              }
              if (at <= new Date()) {
                setCustomError("That time has already passed.");
                return;
              }

              add({ id: newReminderId(), kind: "absolute", at: at.toISOString() });
              setCustomAt("");
            }}
            className={`min-h-[44px] w-full rounded-xl border px-3 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-40 ${
              isDark
                ? "border-gray-700 bg-gray-800 text-white"
                : "border-gray-300 bg-white text-gray-900"
            }`}
          />
        </div>
        {customError && (
          <p className="mt-1 text-xs text-red-400">{customError}</p>
        )}
      </div>

      {full && (
        <p className="text-xs text-gray-500">
          {MAX_REMINDERS_PER_TASK} reminders is the limit for one task.
        </p>
      )}

      {!IS_NATIVE_BUILD && (
        <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
          Reminders are delivered by the mobile app. They are saved here and will be
          waiting on your phone.
        </p>
      )}
    </div>
  );
}
