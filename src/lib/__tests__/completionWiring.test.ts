/**
 * @jest-environment node
 */
// Every path that writes a completion must go through `applyCompletion`.
//
// This test exists because the claim was false once. `recurrence.ts` carried a
// comment saying all three write paths called it; only ListDetailView did, so
// ticking a repeating task on any of the six task screens completed it for good
// instead of moving it to its next date. The headline feature was broken on the
// screens it mattered most on, and nothing failed.
//
// A unit test cannot catch that — each path writes through its own client, and
// mocking all three proves only that the mocks were called. So this asserts the
// wiring itself: the modules that write `is_completed` import the decision rather
// than making their own.

import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..", "..");

/** The three files that write a task's completion state. */
const WRITE_PATHS = [
  "hooks/useTaskActions.ts",
  "components/List/ListDetailView.tsx",
  "components/popupModels/TasksDetails.tsx",
];

const read = (relative: string) => readFileSync(join(ROOT, relative), "utf8");

describe("completion wiring", () => {
  it.each(WRITE_PATHS)("%s decides completion with applyCompletion", (file) => {
    const source = read(file);
    expect(source).toContain("applyCompletion");
  });

  it.each(WRITE_PATHS)(
    "%s does not set is_completed from the raw argument",
    (file) => {
      const source = read(file);

      // The shape the bug had: writing the caller's boolean straight into the
      // payload. `is_completed: completion.is_completed` and
      // `is_completed: patch.is_completed` are the correct forms and are allowed.
      const rawWrites = source.match(/is_completed:\s*isCompleted\b/g) ?? [];
      expect(rawWrites).toEqual([]);
    },
  );

  it("date_completed is never stamped alongside a raw completion flag", () => {
    // The other half of the old payload. A repeating task that is ticked has no
    // completion date, because it was not completed.
    for (const file of WRITE_PATHS) {
      const source = read(file);
      expect(source).not.toMatch(
        /date_completed:\s*isCompleted\s*\?\s*new Date\(\)/,
      );
    }
  });
});
