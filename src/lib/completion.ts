// lib/completion.ts
// What to write when a task's completion is toggled.
//
// This is all that remains of lib/recurrence.ts. Repeating tasks were removed on
// 2026-10-03 — the full design, the algorithms and the seven things worth
// changing before rebuilding it are archived in memory under
// `listit-repeat-feature-archive`, and the `repeat_rule` column and its data are
// deliberately untouched in the database.
//
// What repeat did here: a task carrying a rule never completed. Ticking it moved
// the same row to its next date and left it open. That branch is gone, so a
// repeating task now completes like any other — which is the behaviour change the
// user chose knowingly when the feature came out.
//
// The function kept its name and signature on purpose. Three paths write a
// completion — `useTaskActions`, `ListDetailView` and `TasksDetails` — and they
// each write through their own client, so the only thing stopping them drifting
// is that they all ask the same function what to write. `completionWiring.test.ts`
// asserts that by reading the source, because mocking three clients only proves
// the mocks were called.

/** The subset of a task this module reads. Keeps it off the full schema type. */
export interface CompletableTask {
  due_date?: Date | string | null;
  repeat_rule?: unknown;
}

export interface CompletionPatch {
  is_completed: boolean;
  date_completed: string | null;
}

/**
 * What to write when a task's completion is toggled.
 *
 * `task` is unused now that repeat is gone, but it stays in the signature: the
 * three call sites pass it, and the next thing to need it is the rebuilt repeat.
 */
export function applyCompletion(
  _task: CompletableTask,
  isCompleted: boolean,
  now: Date = new Date()
): CompletionPatch {
  return isCompleted
    ? { is_completed: true, date_completed: now.toISOString() }
    : { is_completed: false, date_completed: null };
}
