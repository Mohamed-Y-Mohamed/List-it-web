/**
 * @jest-environment node
 */
// The card, the detail sheet and the reminder must agree which day a task is on.
//
// A date-only due date is stored at UTC noon as a marker. Which getters you read
// it back with decides the answer, and three places were reading it three ways:
// the sheet in UTC, the cards locally, and `dueMoment` locally before setting the
// hour. The visible result was a card saying "Oct 4 12:37 AM" where the sheet
// said "Sat, Oct 3" for the same row, and a reminder that could fire on a
// different day again.

import { formatTaskDue } from "@/utils/dateUtils";
import { composeDue, dueMoment } from "@/lib/reminders";
import { sortTasks } from "@/lib/taskView";
import type { TaskRow } from "@/types/taskView";

describe("date-only due dates", () => {
  const key = "2026-10-08";

  it("composeDue stores the marker at UTC noon", () => {
    const composed = composeDue(key);

    expect(composed).not.toBeNull();
    expect(composed!.hasTime).toBe(false);
    expect(composed!.due.toISOString()).toBe("2026-10-08T12:00:00.000Z");
  });

  it("the card shows the day the marker names, and no time", () => {
    const { due } = composeDue(key)!;
    const shown = formatTaskDue(due, false);

    expect(shown.time).toBeNull();
    expect(shown.date).toContain("8");
  });

  it("a null due_has_time is treated as date-only, as the sheet does", () => {
    // The sheet decides with `Boolean(task.due_has_time)`. A card that treated
    // null as "unknown, read it locally" disagreed with it on every row where
    // the column had never been written.
    const { due } = composeDue(key)!;

    expect(formatTaskDue(due, null)).toEqual(formatTaskDue(due, false));
  });

  it("the reminder anchors to the same calendar day the card shows", () => {
    const { due } = composeDue(key)!;
    const moment = dueMoment({
      due_date: due.toISOString(),
      due_has_time: false,
    });

    expect(moment).not.toBeNull();
    // Local getters here on purpose: the fire time is a local instant, and the
    // point is that its local date matches the UTC day in the marker.
    expect(moment!.getDate()).toBe(8);
    expect(moment!.getMonth()).toBe(9);
    expect(moment!.getFullYear()).toBe(2026);
  });
});

// A due date is a day. `composeDue` no longer takes a time and always writes the
// UTC-noon marker, matching the iOS picker's `displayedComponents: [.date]`.
describe("due dates are date-only", () => {
  it("composeDue never reports a time", () => {
    expect(composeDue("2026-10-08")!.hasTime).toBe(false);
  });
});

// Rows written before the time field was removed still hold a real local
// instant. Nothing creates them any more, but they have to keep reading as the
// day they were saved for — which is why `formatTaskDue` and `dueMoment` keep
// their `due_has_time` branch rather than assuming the marker.
describe("legacy timed rows still read correctly", () => {
  const stored = new Date(2026, 9, 8, 17, 0, 0, 0);

  it("dueMoment uses the stored instant untouched", () => {
    const moment = dueMoment({
      due_date: stored.toISOString(),
      due_has_time: true,
    });

    expect(moment!.getTime()).toBe(stored.getTime());
  });

  it("the card still names the right day for one", () => {
    expect(formatTaskDue(stored, true).date).toContain("8");
  });
});

describe("sortTasks pin ordering", () => {
  const row = (
    id: string,
    is_pinned: boolean | null,
    created_at: string,
  ): TaskRow => ({ id, is_pinned, created_at }) as unknown as TaskRow;

  it("treats a null is_pinned as unpinned, not as its own rank", () => {
    // `null !== false` is true, so the old comparator took the pin branch for a
    // null-against-false pair and returned 1 whichever way round it was asked —
    // contradicting itself, which leaves the result undefined.
    //
    // Asserting the ordering rather than comparing the two directions: equal
    // elements fall through to created_at, and a stable sort is entitled to
    // keep input order when that is equal too.
    const older = row("older", null, "2026-10-01T00:00:00.000Z");
    const newer = row("newer", false, "2026-10-02T00:00:00.000Z");

    // Oldest first once the pin key ties, in both directions.
    expect(sortTasks([older, newer]).map((t) => t.id)).toEqual([
      "older",
      "newer",
    ]);
    expect(sortTasks([newer, older]).map((t) => t.id)).toEqual([
      "older",
      "newer",
    ]);
  });

  it("still puts pinned rows first", () => {
    const pinned = row("pinned", true, "2026-10-02T00:00:00.000Z");
    const plain = row("plain", null, "2026-10-01T00:00:00.000Z");

    expect(sortTasks([plain, pinned])[0].id).toBe("pinned");
  });
});
