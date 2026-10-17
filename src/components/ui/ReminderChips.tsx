"use client";

// The REMINDER section: a chip per offset, None, and Custom.
//
// One reminder per task. The chips behave as a radio group — picking any of them
// replaces what was set rather than adding to it, so only ever one is lit and
// only ever one is saved. Tapping the lit chip clears it back to None.
//
// The data model still holds a list, and `parseReminders` still reads up to
// MAX_REMINDERS_PER_TASK of them. That is deliberate: tasks saved by the older
// multi-select picker keep all of their reminders firing instead of being
// truncated on read, and collapse to one the next time this picker touches them.
//
// Offsets need something to count back from, so with no due date on the task only
// Custom is offered. That is the honest shape rather than a row of disabled chips
// nobody can explain, and it matches what `reminderFireAt` can actually resolve.

import React, { useState } from "react";
import { Check } from "lucide-react";
import MiniCalendar, { toDateKey } from "./MiniCalendar";
import {
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

  /**
   * A task carries one reminder, so picking an offset replaces whatever was
   * there rather than adding to it — pick "1 hour before" then "1 day before"
   * and only the day survives, lit on its own. Tapping the lit chip clears it
   * back to None, which is the only way to end up with nothing from here.
   *
   * Replacing covers the custom case for free: a fixed day and time is the same
   * single slot, so choosing an offset drops it and vice versa.
   */
  const toggleOffset = (minutes: number) => {
    if (usedOffsets.has(minutes)) {
      onChange([]);
      return;
    }
    if (offsetHasPassed(minutes)) return;
    askPermission();
    onChange([{ id: newReminderId(), kind: "offset", minutes }]);
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
    // The one slot again: a fixed time replaces any offset that was set.
    onChange([{ id: newReminderId(), kind: "absolute", at: at.toISOString() }]);
    setCustomOpen(false);
    setCustomDate(null);
    setCustomError(null);
  };

  /**
   * None is lit only while nothing is set *and* nothing is being composed.
   *
   * It used to key off `reminders.length === 0` alone, which is still true the
   * moment Custom is tapped — the panel opens before a date exists to save. Both
   * chips then read as active, in the same PRIMARY, so the row showed two
   * mutually exclusive answers at once. Opening Custom is the intent to set one,
   * so None gives up the highlight; closing it with nothing saved takes it back.
   */
  const noneActive = reminders.length === 0 && !customOpen;

  /**
   * The offsets worth showing: the ones that could still fire, plus any already
   * set.
   *
   * They used to render disabled with a title explaining themselves, so a task
   * due in 59 minutes put up a row of grey chips nobody could use and the only
   * live controls were None and Custom. Hiding them says the same thing without
   * the dead row — what is on screen is what can be picked.
   *
   * An offset already set stays visible once its moment has gone, because the
   * lit chip is the only control that clears it. Hiding it would leave a
   * reminder saved on the task with nothing on screen to remove it.
   */
  const visiblePresets = dueDateKey
    ? OFFSET_PRESETS.filter(
        (preset) =>
          usedOffsets.has(preset.minutes) || !offsetHasPassed(preset.minutes),
      )
    : [];

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
          aria-pressed={noneActive}
          className={`${chipBase} ${noneActive ? "text-white" : chipIdle}`}
          style={noneActive ? { backgroundColor: PRIMARY } : undefined}
        >
          None
        </button>

        {visiblePresets.map((preset) => {
          const on = usedOffsets.has(preset.minutes);
          return (
            <button
              key={preset.minutes}
              type="button"
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

      {/* There is a due date, but every offset counted back from it has already
          gone — a task due in the next hour. Without this the chips simply are
          not there and the row looks broken rather than narrowed. */}
      {dueDateKey && visiblePresets.length === 0 && (
        <p
          className={`text-[11px] ${isDark ? "text-gray-500" : "text-gray-400"}`}
        >
          This task is due too soon to be reminded a set time beforehand. Custom
          takes a fixed day and time.
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
