// types/schema.ts

// Note Interface
export interface Note {
  id: string; // Changed from number to string (UUID)
  created_at: Date;
  title: string | null; // Changed from string to string | null
  description: string | null; // Changed from string? to string | null
  is_deleted: boolean | null; // Changed from boolean to boolean | null
  bg_color_hex: string | null; // Changed from string? to string | null
  is_pinned: boolean | null; // Changed from boolean? to boolean | null
  collection_id: string | null; // Changed from number? to string | null (UUID)
}

// Task Interface
export interface Task {
  id: string;
  text: string | null; // Changed from string to string | null
  description: string | null;
  created_at: Date;
  due_date: Date | null;
  is_completed: boolean | null; // Changed from boolean to boolean | null
  date_completed: Date | null;
  is_deleted: boolean | null; // Changed from boolean to boolean | null
  collection_id: string | null; // Changed from number? to string | null (UUID)
  list_id: string | null; // Changed from number to string | null (UUID)
  is_pinned: boolean | null; // Changed from boolean to boolean | null
  user_id: string | null; // Changed from string? to string | null (UUID)
}

// Collection Interface
export interface Collection {
  id: string; // Changed from number to string (UUID)
  collection_name: string | null; // Changed from string to string | null
  bg_color_hex: string | null; // Changed from string to string | null
  created_at: Date;
  is_default: boolean | null; // Changed from boolean? to boolean | null
  list_id: string | null; // Added list_id field from the database
  tasks?: Task[]; // Kept as optional array for frontend usage
  notes?: Note[]; // Kept as optional array for frontend usage
  isPinned?: boolean; // Kept for frontend usage
}

// List Interface
export interface List {
  id: string; // Changed from number to string (UUID)
  created_at: Date;
  list_icon: string | null; // Changed from string? to string | null
  list_name: string | null; // Changed from string to string | null
  is_default: boolean | null; // Changed from boolean? to boolean | null
  bg_color_hex: string | null; // Changed from string to string | null
  is_pinned: boolean | null; // Changed from boolean? to string | null
  user_id: string | null; // Changed from string? to string | null (UUID)
  tasks?: Task[]; // Kept as optional array for frontend usage
  notes?: Note[]; // Kept as optional array for frontend usage
  collections?: Collection[]; // Kept as optional array for frontend usage
}

// User Interface (Added based on the database schema)
export interface User {
  id: string; // UUID
  created_at: Date;
  full_name: string | null;
  email: string;
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
] as const;

// Type for List Color
export type ListColor = (typeof LIST_COLORS)[number];

// DisplayTask Interface (used in CompletedPage)
export interface DisplayTask {
  id: string;
  title: string;
  description?: string;
  createdDate: Date;
  completedDate: Date;
  isCompleted: boolean;
}
