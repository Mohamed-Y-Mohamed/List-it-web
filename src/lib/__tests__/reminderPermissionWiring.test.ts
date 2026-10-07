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
// RemindersPicker.add is the one funnel every reminder passes through — the
// offset chips and the fixed-time field both call it — so the ask belongs there.
//
// A unit test cannot catch this: the component asks through a Capacitor plugin
// that does not exist under jsdom, and mocking it proves only that the mock was
// called. So this asserts the wiring, in the same spirit as completionWiring.

import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..", "..");

const read = (relative: string) => readFileSync(join(ROOT, relative), "utf8");

const PICKER = "components/popupModels/RemindersPicker.tsx";
const CHIPS = "components/ui/ReminderChips.tsx";

/** The surfaces a user turns reminders on from. Each must be able to ask. */
const OPT_IN_PATHS = [
  PICKER,
  CHIPS,
  "app/(secure)/setting/page.tsx",
];

/**
 * The two task sheets no longer ask directly. They render `ReminderChips`, which
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

  it.each(DELEGATING_HOSTS)("%s routes reminders through the chips", (file) => {
    expect(read(file)).toContain("ReminderChips");
  });

  it("asks from the chips add path, not only on render", () => {
    const source = read(CHIPS);

    // `toggleOffset` is the add branch for the presets; `addCustom` is the
    // fixed-time field. Both converge on `askPermission`, and the declaration
    // alone is not enough — the bug was live while the import sat unused.
    expect(source).toContain("const askPermission =");

    const calls = source.match(/askPermission\(\)/g) ?? [];
    expect(calls.length).toBeGreaterThanOrEqual(2);
  });

  it("asks inside the add funnel, not only on the switch", () => {
    const source = read(PICKER);

    // `add` is where both the offset presets and the fixed-time field converge.
    // Matching the call inside that function body is the point: an import alone
    // satisfied the check above while the bug was live.
    const addBody = source.slice(
      source.indexOf("const add = "),
      source.indexOf("const remove = ")
    );

    expect(addBody).toContain("ensureNotificationPermission");
  });

  it("never asks from the sync path", () => {
    // The rule that stops the permission loop the user hit: dismissing the
    // system screen returns to the app, which resyncs on resume and would ask
    // again immediately. Sync checks; only explicit opt-in requests.
    const notifications = read("lib/notifications.ts");
    const syncBody = notifications.slice(
      notifications.indexOf("export async function syncTaskReminders")
    );

    expect(syncBody).toContain("hasNotificationPermission");
    expect(syncBody).not.toContain("ensureNotificationPermission");
  });

  it("keeps the hook that drives sync free of permission requests", () => {
    expect(read("hooks/useTaskReminders.ts")).not.toContain(
      "ensureNotificationPermission"
    );
  });
});
