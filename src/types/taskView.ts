// types/taskView.ts
// The task shape the six task screens actually work with.
//
// Deliberately not the `Task` in schema.ts. That one models the domain, with
// real Date objects; these screens read rows straight off Supabase, where dates
// arrive as ISO strings, and they carry two joined names that no table holds.
// Converting to the domain type and back at every boundary would cost more than
// it explains, so the raw shape gets a name of its own.
//
// Every one of the six pages had its own private copy of this. They had already
// drifted — some declared `description`, some did not — which is how a shared
// component ends up with a prop that only works on four screens out of six.

export interface TaskRow {
  id: string;
  text: string;
  description: string | null;
  created_at: string;
  due_date: string | null;
  is_completed: boolean;
  date_completed: string | null;
  is_pinned: boolean;
  collection_id: string | null;
  list_id: string | null;
  user_id: string;
  /** See the matching fields on `Task` in schema.ts; same columns, raw. */
  due_has_time?: boolean | null;
  repeat_rule?: unknown;
  reminders?: unknown;
  my_day_date?: string | null;
  /** Joined from `collection`, for the chip on the task card. */
  collection_name?: string;
  /** Joined from `list` via the collection, for the chip beside it. */
  list_name?: string;
}

/** What every task mutation resolves to, success or failure. */
export interface TaskActionResult {
  success: boolean;
  error?: unknown;
}
