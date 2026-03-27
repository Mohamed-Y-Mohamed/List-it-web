// types/schema.ts

// Generic operation result returned by data-mutation handlers
export interface OperationResult {
  success: boolean;
  error?: string | Error | Record<string, unknown>;
  data?: Record<string, unknown> | unknown[];
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
  user_id: string | null;
  /** Optional flag used client-side only; not present in the database schema. */
  is_default?: boolean;
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

// Color Constants
export const LIST_COLORS = [
  "#FF3B30",
  "#007AFF",
  "#34C759",
  "#FFD60A",
  "#AF52DE",
  "#FF2D55",
  "#5856D6",
  "#00C7BE",
  "#FF9500",
  "#ff69B4",
] as const;

// Type for List Color
export type ListColor = (typeof LIST_COLORS)[number];

// DisplayTask Interface (used in CompletedPage)
// Uses camelCase intentionally for display/UI layer to distinguish from raw DB row fields.
export interface DisplayTask {
  id: string;
  title: string;
  description?: string;
  createdDate: Date;
  completedDate: Date;
  isCompleted: boolean;
}

// Dashboard-specific types
export interface DashboardTaskStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  dueToday: number;
  completionRate: number;
  todayCompleted: number;
  todayCreated: number;
}

export interface DailyMetric {
  date: string;
  completed: number;
  created: number;
  pending: number;
}

export interface DashboardPriorityTask {
  id: string;
  text: string | null;
  due_date: string | null;
  is_pinned: boolean;
  created_at: string;
}

export interface DashboardActivityItem {
  id: string;
  type: "completed" | "created";
  description: string;
  timestamp: string;
}
