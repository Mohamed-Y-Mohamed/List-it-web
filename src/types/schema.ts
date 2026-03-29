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
