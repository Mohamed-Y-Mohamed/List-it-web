// Note Interface
export interface Note {
  id: number;
  created_at: Date;
  collection_id?: number;
  title: string; // Represents 'text' in your frontend
  description?: string;
  is_deleted: boolean;
  bg_color_hex?: string;
  is_pinned?: boolean;
}

// Task Interface
export interface Task {
  id: number;
  created_at: Date;
  collection_id?: number;
  text: string;
  list_id: number;
  description?: string;
  due_date?: Date;
  is_completed: boolean;
  date_completed?: Date;
  is_deleted: boolean;
  is_pinned?: boolean;
}

// Collection Interface
export interface Collection {
  id: number;
  list_id?: number;
  created_at: Date;
  collection_name: string;
  bg_color_hex: string;
  is_default?: boolean;
  content_count?: number;
  tasks?: Task[];
  notes?: Note[];
  isPinned?: boolean;
}

// List Interface
export interface List {
  id: number;
  created_at: Date;
  list_icon?: string;
  list_name: string;
  is_default?: boolean;
  bg_color_hex: string;
  type?: string;
  is_pinned?: boolean;
  tasks?: Task[];
  notes?: Note[];
  collections?: Collection[];
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
