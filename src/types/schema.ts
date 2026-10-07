// types/schema.ts

// Generic operation result returned by data-mutation handlers
export interface OperationResult {
  success: boolean;
  error?: unknown;
  data?: unknown;
  warning?: string;
}

// Note Interface
export interface Note {
  id: string;
  created_at: Date;
  title: string | null;
  description: string | null;
  is_deleted: boolean | null;
  bg_color_hex: string | null;
  is_pinned: boolean | null;
  collection_id: string | null;
  user_id: string | null; // Added
  list_id: string | null; // Added
}

// Task Interface
export interface Task {
  id: string;
  text: string | null;
  description: string | null;
  created_at: Date;
  due_date: Date | null;
  is_completed: boolean | null;
  date_completed: Date | null;
  is_deleted: boolean | null;
  collection_id: string | null;
  list_id: string | null;
  is_pinned: boolean | null;
  user_id: string | null;
  /**
   * Whether `due_date`'s clock time means anything. False is the old behaviour and
   * the default: the date is stored at UTC noon as a marker, not an instant, and
   * anything needing a time of day reads 09:00 local. See lib/reminders.ts.
   */
  due_has_time?: boolean | null;
  /**
   * The repeat rule, as jsonb.
   *
   * The feature was removed on 2026-10-03 and nothing reads this now, but the
   * column and every row's value are deliberately intact — the schema is final,
   * and the rebuild uses this same shape. The full contract, the algorithms and
   * the traps are archived in memory under `listit-repeat-feature-archive`.
   */
  repeat_rule?: unknown;
  /** A `Reminder[]`, as jsonb. Narrow it with `parseReminders` before use. */
  reminders?: unknown;
  /**
   * Unused. Added when the Recurring screen was going to be a manually picked
   * list; it is now derived from `repeat_rule` and the due date instead, so
   * nothing reads or writes this. Left declared because the column exists, and
   * dropping a column is a migration rather than a type change.
   */
  my_day_date?: string | null;
}

// Collection Interface
export interface Collection {
  id: string;
  collection_name: string | null;
  bg_color_hex: string | null;
  created_at: Date;
  list_id: string | null;
  user_id: string | null; // Added
  // Note: is_default doesn't exist in your database schema
  // If needed, add it to your database with: ALTER TABLE collection ADD COLUMN is_default boolean;
  is_default?: boolean; // Make optional since it's not in the database
  tasks?: Task[]; // Frontend only
  notes?: Note[]; // Frontend only
  isPinned?: boolean; // Frontend only
}

// List Interface
export interface List {
  id: string;
  created_at: Date;
  list_icon: string | null;
  list_name: string | null;
  is_default: boolean | null;
  bg_color_hex: string | null;
  is_pinned: boolean | null;
  user_id: string | null;
  tasks?: Task[]; // Frontend only
  notes?: Note[]; // Frontend only
  collections?: Collection[]; // Frontend only
}

// User Interface
export interface User {
  id: string;
  created_at: Date;
  full_name: string | null;
  email: string;
  // Note: Your database has a composite primary key (id, email)
  // which is unusual but this interface will work with it
}

// AppSetting Interface (row from the app_settings table)
export interface AppSetting {
  id: string | number;
  color_hex: string;
  color_name: string;
}

// DisplayTask Interface (used in CompletedPage)
export interface DisplayTask {
  id: string;
  title: string;
  description?: string;
  createdDate: Date;
  completedDate: Date;
  isCompleted: boolean;
}
