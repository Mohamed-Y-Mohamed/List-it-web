/**
 * @jest-environment node
 */
// A reminder the user adds must be able to ask for notification permission.
//
// This test exists because the feature shipped broken in a way nothing caught.
// POST_NOTIFICATIONS was never granted, so syncTaskReminders returned 0 without
// scheduling anything — while the UI showed the switch on, the reminder chip in
// the sheet and the bell on the task card. Every signal said "set", and no
// notification could ever arrive.
//
// The ask was wired only to the Reminders switch flipping on, which misses the
// two realistic routes to a reminder that cannot fire: a switch already on from
// an earlier edit, and a permission revoked in system Settings after the fact.
// `ReminderPicker` is the one funnel every reminder passes through, so the ask
// belongs there. (It replaced `ReminderChips`, whose offset presets have gone
// with the model behind them; before that, `RemindersPicker`.)
//
// A unit test cannot catch this: the component asks through a Capacitor plugin
// that does not exist under jsdom, and mocking it proves only that the mock was
// called. So this asserts the wiring, in the same spirit as completionWiring.

import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..", "..");

const read = (relative: string) => readFileSync(join(ROOT, relative), "utf8");

const PICKER = "components/ui/ReminderPicker.tsx";

/** The surfaces a user turns reminders on from. Each must be able to ask. */
const OPT_IN_PATHS = [PICKER, "app/(secure)/setting/page.tsx"];

/**
 * The two task sheets no longer ask directly. They render `ReminderPicker`, which
 * owns the add funnel and the ask, so the grant still happens on the one route a
 * reminder can be created from. They are checked for that delegation instead: a
 * sheet that hand-rolled its own reminder UI would bypass the ask and rebuild the
 * original bug, and listing them here is what stops that passing silently.
 */
const DELEGATING_HOSTS = [
  "components/popupModels/TasksDetails.tsx",
  "components/popupModels/TaskPopup.tsx",
];

describe("reminder permission wiring", () => {
  it.each(OPT_IN_PATHS)("%s can request notification permission", (file) => {
    expect(read(file)).toContain("ensureNotificationPermission");
  });

  it.each(DELEGATING_HOSTS)("%s routes reminders through the picker", (file) => {
    expect(read(file)).toContain("ReminderPicker");
  });

  it("asks from the add path, not only on render", () => {
    const source = read(PICKER);

    // There is one add branch now — the Add Reminder / Remind Again button —
    // and it has to converge on `askPermission`. The declaration alone is not
    // enough: the original bug was live while the import sat unused.
    expect(source).toContain("const askPermission =");
    expect(source).toMatch(/askPermission\(\)/);
  });

  it("keeps the answer rather than discarding it", () => {
    // `void ensureNotificationPermission()` threw the boolean away, so a user
    // who had denied notifications for good got a lit chip, a saved reminder,
    // and nothing delivered — with nothing on screen saying so.
    const source = read(PICKER);

    expect(source).toContain("setPermissionBlocked");
    expect(source).not.toMatch(/void ensureNotificationPermission\(\);/);
  });

  it("refuses a reminder once the due day has gone", () => {
    // iOS disables the button and explains why rather than letting someone set
    // a reminder that planReminders would then drop for being in the past.
    const source = read(PICKER);

    expect(source).toContain("isDueDayPast");
    expect(source).toContain("disabled={overdue}");
  });

  it("bounds the picker to the due day", () => {
    // `reminderRange` on iOS. Without the max, a reminder could be set days
    // after the task it is reminding about.
    const source = read(PICKER);

    expect(source).toContain("reminderBounds");
    expect(source).toContain("clampReminderToDueDay");
  });

  it("never asks from the sync path", () => {
    // The rule that stops the permission loop the user hit: dismissing the
    // system screen returns to the app, which resyncs on resume and would ask
    // again immediately. Sync checks; only explicit opt-in requests.
    const notifications = read("lib/notifications.ts");
    const syncBody = notifications.slice(
      notifications.indexOf("export async function syncTaskReminders"),
    );

    expect(syncBody).toContain("hasNotificationPermission");
    expect(syncBody).not.toContain("ensureNotificationPermission");
  });

  it("keeps the hook that drives sync free of permission requests", () => {
    expect(read("hooks/useTaskReminders.ts")).not.toContain(
      "ensureNotificationPermission",
    );
  });
});
