/**
 * @jest-environment node
 */
// A task write must carry the fields the editor collected.
//
// This bug landed twice, in the same shape, in two different places:
//
//   1. Both task cards rebuilt a partial `task` object for the detail sheet and
//      left out `due_has_time` and `reminders`. The sheet then read a timed due
//      date as date-only, showed the wrong day, and reported "Reminder: None"
//      for a task that had several.
//
//   2. `ListDetailView.handleTaskSubmit` typed its parameter with four fields
//      and forwarded four, while `TaskPopup` sent six. Creating a task with a
//      reminder stored `reminders` null and no `due_has_time`: the time the user
//      picked was discarded and nothing was ever scheduled. No error, anywhere.
//
// Both are invisible to a unit test — the data is correct right up until the
// object is rebuilt by hand — and both were found by eye on a device. So this
// asserts the wiring by reading the source, in the same spirit as
// completionWiring and reminderPermissionWiring.

import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..", "..");

const read = (relative: string) => readFileSync(join(ROOT, relative), "utf8");

/** Every file that hands a task object to the detail sheet or to the API. */
const WRITE_PATHS = [
  "components/Tasks/index.tsx",
  "components/Tasks/customcard.tsx",
  "components/List/ListDetailView.tsx",
];

describe("task write wiring", () => {
  it.each(WRITE_PATHS)("%s carries due_has_time", (file) => {
    expect(read(file)).toContain("due_has_time");
  });

  it.each(WRITE_PATHS)("%s carries reminders", (file) => {
    expect(read(file)).toContain("reminders");
  });

  it("the create payload forwards both, not just the four it used to", () => {
    const source = read("components/List/ListDetailView.tsx");

    // The POST body for a new task. Anchored on `is_deleted: false`, which only
    // the create payload sets, so this cannot accidentally match the PATCH.
    const createBody = source.slice(
      source.indexOf("const handleTaskSubmit"),
      source.indexOf("is_deleted: false"),
    );

    expect(createBody).toContain("due_has_time");
    expect(createBody).toContain("reminders");
  });

  it("no write path builds a zone-less timestamp", () => {
    // `YYYY-MM-DD HH:MM:SS` from the local getters carries no offset, so
    // Postgres read it in the server's zone: a task due 17:00 BST was stored as
    // 17:00Z and read back an hour out, and the UTC-noon date-only marker was
    // shifted off noon entirely. ISO, with its offset, is the only safe form.
    const source = read("components/List/ListDetailView.tsx");

    expect(source).not.toContain("formatDateForPostgres");
    expect(source).toContain("toISOString");
  });
});
