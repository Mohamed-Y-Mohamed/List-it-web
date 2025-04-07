// Note Interface
export interface Note {
  note_id: number;
  text: string;
  date_created: Date;
  is_deleted: boolean;
  background_color?: string;
  is_pinned?: boolean;
}

// Task Interface
export interface Task {
  id: string;
  text: string;
  description?: string;
  date_created: Date;
  due_date?: Date;
  is_completed: boolean;
  date_completed?: Date;
  is_priority: boolean;
}

// Collection Interface
export interface Collection {
  id: string;
  collection_name: string;
  background_color: string;
  date_created: Date;
  is_default: boolean;
  content_count: number;
  tasks: Task[];
  notes?: Note[];
}

// List Interface
export interface List {
  id: string;
  name: string;
  background_color: string;
  date_created: Date;
  is_default: boolean;
  tasks?: Task[];
  notes?: Note[];
  collections: Collection[];
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
