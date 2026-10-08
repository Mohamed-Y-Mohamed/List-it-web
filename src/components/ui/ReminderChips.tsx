"use client";

// The REMINDER section: a chip per offset, None, and Custom.
//
// The chips are toggles, not a radio group. A task can hold up to five reminders
// — that is the existing data model and the thing the old picker was built around
// — and presenting them as single-select would have quietly deleted four of them
// the first time someone tapped a chip. Tapping an on chip removes that reminder;
// None removes the lot.
//
// Offsets need something to count back from, so with no due date on the task only
// Custom is offered. That is the honest shape rather than a row of disabled chips
// nobody can explain, and it matches what `reminderFireAt` can actually resolve.

import React, { useState } from "react";
import { Check } from "lucide-react";
import MiniCalendar, { toDateKey } from "./MiniCalendar";
import {
  MAX_REMINDERS_PER_TASK,
  OFFSET_PRESETS,
  describeReminder,
  newReminderId,
  reminderFireAt,
  type Reminder,
} from "@/lib/reminders";
import { IS_NATIVE_BUILD } from "@/lib/platform";
import { ensureNotificationPermission } from "@/lib/notifications";
import { PRIMARY, WARNING } from "./tokens";

export default function ReminderChips({
  reminders,
  onChange,
  /** `YYYY-MM-DD` of the due date, or null. Offsets need it to mean anything. */
  dueDateKey,
  /** The exact instant the task is due, so a custom reminder can be capped at it. */
  dueAt,
  isDark,
}: {
  reminders: Reminder[];
  onChange: (next: Reminder[]) => void;
  dueDateKey: string | null;
  dueAt: Date | null;
  isDark: boolean;
}) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customDate, setCustomDate] = useState<string | null>(null);
  const [customTime, setCustomTime] = useState("09:00");
  const [customError, setCustomError] = useState<string | null>(null);
  /** Set when the OS has refused notifications, so the UI can stop pretending. */
  const [permissionBlocked, setPermissionBlocked] = useState(false);

  const full = reminders.length >= MAX_REMINDERS_PER_TASK;
  const usedOffsets = new Set(
    reminders.filter((r) => r.kind === "offset").map((r) => r.minutes),
  );
  const absolutes = reminders.filter(
    (r): r is Extract<Reminder, { kind: "absolute" }> => r.kind === "absolute",
  );

  // Asking here rather than only on a master switch. A switch already on from a
  // previous edit, or a permission revoked in system Settings since, both look
  // exactly like a working reminder and schedule nothing — `syncTaskReminders`
  // bails without the grant. Safe to call repeatedly: it checks first.
  //
  // The answer is kept, which it was not. A user who has denied notifications
  // for good gets no prompt and no grant, so the chip lit, the reminder saved,
  // and nothing could ever be delivered — with nothing on screen saying so.
  const askPermission = () => {
    void ensureNotificationPermission().then((granted) => {
      setPermissionBlocked(!granted);
    });
  };

  /**
   * Whether an offset would land in the past.
   *
   * The custom field has always refused a time that has already gone; the offset
   * chips did not, so "1 hour before" on a task due in ten minutes lit up, saved,
   * and was then dropped by `planReminders` for being in the past. The chip said
   * one thing and the device did another.
   */
  const now = new Date();
  const offsetHasPassed = (minutes: number): boolean => {
    const fireAt = reminderFireAt({ id: "", kind: "offset", minutes }, dueAt);
    return fireAt !== null && fireAt <= now;
  };

  const toggleOffset = (minutes: number) => {
    if (usedOffsets.has(minutes)) {
      onChange(
        reminders.filter(
          (r) => !(r.kind === "offset" && r.minutes === minutes),
        ),
      );
      return;
    }
    if (full || offsetHasPassed(minutes)) return;
    askPermission();
    onChange([...reminders, { id: newReminderId(), kind: "offset", minutes }]);
  };

  const removeReminder = (id: string) =>
    onChange(reminders.filter((r) => r.id !== id));

  const addCustom = () => {
    if (!customDate) {
      setCustomError("Pick a day first.");
      return;
    }
    const [year, month, day] = customDate.split("-").map(Number);
    const [hour, minute] = (customTime || "09:00").split(":").map(Number);
    const at = new Date(year, month - 1, day, hour || 0, minute || 0, 0, 0);

    if (Number.isNaN(at.getTime())) {
      setCustomError("That is not a valid time.");
      return;
    }
    if (at <= new Date()) {
      setCustomError("That time has already passed.");
      return;
    }
    if (dueAt && at > dueAt) {
      setCustomError("A reminder can't be set after the due date.");
      return;
    }

    askPermission();
    onChange([
      ...reminders,
      { id: newReminderId(), kind: "absolute", at: at.toISOString() },
    ]);
    setCustomOpen(false);
    setCustomDate(null);
    setCustomError(null);
  };

  const chipBase =
    "min-h-[36px] rounded-full px-3.5 text-[13px] font-medium transition-colors disabled:opacity-35";
  const chipIdle = isDark
    ? "bg-white/[0.06] text-gray-300"
    : "bg-black/[0.04] text-gray-700";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            onChange([]);
            setCustomOpen(false);
          }}
          className={`${chipBase} ${reminders.length === 0 ? "text-white" : chipIdle}`}
          style={
            reminders.length === 0 ? { backgroundColor: PRIMARY } : undefined
          }
        >
          None
        </button>

        {dueDateKey &&
          OFFSET_PRESETS.map((preset) => {
            const on = usedOffsets.has(preset.minutes);
            const passed = !on && offsetHasPassed(preset.minutes);
            return (
              <button
                key={preset.minutes}
                type="button"
                disabled={!on && (full || passed)}
                title={passed ? "That moment has already passed" : undefined}
                onClick={() => toggleOffset(preset.minutes)}
                aria-pressed={on}
                className={`${chipBase} ${on ? "text-white" : chipIdle}`}
                style={on ? { backgroundColor: WARNING } : undefined}
              >
                {on && <Check className="mr-1 inline h-3 w-3" />}
                {preset.label}
              </button>
            );
          })}

        <button
          type="button"
          disabled={full}
          onClick={() => {
            setCustomError(null);
            setCustomOpen((open) => !open);
          }}
          aria-expanded={customOpen}
          className={`${chipBase} ${customOpen ? "text-white" : chipIdle}`}
          style={customOpen ? { backgroundColor: PRIMARY } : undefined}
        >
          Custom
        </button>
      </div>

      {!dueDateKey && (
        <p
          className={`text-[11px] ${isDark ? "text-gray-500" : "text-gray-400"}`}
        >
          Add a due date to remind yourself a set time before it, or use Custom
          for a fixed day and time.
        </p>
      )}

      {/* The reminder is saved either way. Saying so beats a chip that looks
          set while the OS quietly delivers nothing. */}
      {permissionBlocked && (
        <p className="text-[11px]" style={{ color: WARNING }}>
          Notifications are turned off for List It, so this reminder will not be
          delivered. Turn them on in your device settings.
        </p>
      )}

      {/* Reminders already set at a fixed time. The offset ones are visible as lit
          chips above, so repeating them here would show the same reminder twice;
          a custom one has no chip of its own and would otherwise be unremovable. */}
      {absolutes.length > 0 && (
        <ul className="space-y-1.5">
          {absolutes.map((reminder) => (
            <li
              key={reminder.id}
              className={`flex min-h-[36px] items-center gap-2 rounded-xl px-3 ${
                isDark ? "bg-white/[0.04]" : "bg-black/[0.03]"
              }`}
            >
              <span className="min-w-0 flex-1 truncate text-[13px]">
                {describeReminder(reminder)}
              </span>
              <button
                type="button"
                onClick={() => removeReminder(reminder.id)}
                aria-label={`Remove reminder ${describeReminder(reminder)}`}
                className={`text-[12px] font-medium ${
                  isDark ? "text-rose-300" : "text-rose-600"
                }`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {customOpen && (
        <div
          className={`space-y-3 rounded-2xl border p-3.5 ${
            isDark
              ? "border-white/[0.08] bg-white/[0.03]"
              : "border-black/[0.06] bg-black/[0.02]"
          }`}
        >
          <MiniCalendar
            value={customDate}
            onChange={(key) => {
              setCustomDate(key);
              setCustomError(null);
            }}
            min={toDateKey(new Date())}
            max={dueDateKey ?? undefined}
            isDark={isDark}
          />

          <input
            type="time"
            value={customTime}
            aria-label="Reminder time"
            onChange={(event) => {
              setCustomTime(event.target.value);
              setCustomError(null);
            }}
            className={`min-h-[44px] w-full rounded-xl border px-3 text-[14px] focus:outline-none ${
              isDark
                ? "border-white/[0.08] bg-white/[0.04] text-gray-100"
                : "border-black/[0.08] bg-white text-gray-900"
            }`}
          />

          <p
            className={`text-[11px] ${isDark ? "text-gray-500" : "text-gray-400"}`}
          >
            A reminder can&apos;t be set after the due date.
          </p>

          {customError && (
            <p className="text-[12px] text-rose-400">{customError}</p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={addCustom}
              className="min-h-[44px] flex-1 rounded-xl text-[14px] font-semibold text-white transition-opacity active:opacity-80"
              style={{ backgroundColor: PRIMARY }}
            >
              Done
            </button>
            <button
              type="button"
              onClick={() => {
                setCustomOpen(false);
                setCustomError(null);
              }}
              className={`min-h-[44px] flex-1 rounded-xl border text-[14px] font-medium ${
                isDark
                  ? "border-white/[0.08] text-gray-300 active:bg-white/10"
                  : "border-black/[0.08] text-gray-700 active:bg-black/5"
              }`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {full && (
        <p
          className={`text-[11px] ${isDark ? "text-gray-500" : "text-gray-400"}`}
        >
          {MAX_REMINDERS_PER_TASK} reminders is the limit for one task.
        </p>
      )}

      {/* Stored and shown on the web, but nothing fires them there: a browser
          cannot schedule a local notification for later, and doing it properly
          needs a push backend this app does not have. Saying so beats a reminder
          that silently never arrives. */}
      {!IS_NATIVE_BUILD && (
        <p
          className={`text-[11px] ${isDark ? "text-gray-500" : "text-gray-400"}`}
        >
          Reminders are delivered by the mobile app. They are saved here and
          will be waiting on your phone.
        </p>
      )}
    </div>
  );
}
