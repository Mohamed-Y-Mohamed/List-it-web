// File: /data/data.ts
"use client";

import { Collection, List, Task, Note } from "@/types/schema";
import { v4 as uuidv4 } from "uuid";

// Define a type for our lists object
export type ListsData = {
  [key: string]: List;
};

// Sample data that can be imported by any component
export const sampleData: { lists: ListsData } = {
  lists: {
    "1": {
      id: "1",
      name: "Work",
      background_color: "#007AFF",
      date_created: new Date("2025-01-15"),
      is_default: true,
      collections: [
        {
          id: "work-general",
          collection_name: "General",
          background_color: "#5856D6",
          date_created: new Date("2025-01-15"),
          is_default: true,
          content_count: 2,
          tasks: [
            {
              id: "task1",
              text: "Create project proposal",
              description:
                "Draft a comprehensive proposal for the new client project",
              date_created: new Date("2025-02-10"),
              due_date: new Date("2025-02-20"),
              is_completed: false,
              is_priority: true,
            },
            {
              id: "task2",
              text: "Schedule team meeting",
              description:
                "Set up weekly progress meeting with the development team",
              date_created: new Date("2025-02-12"),
              due_date: new Date("2025-02-14"),
              is_completed: true,
              date_completed: new Date("2025-02-14"),
              is_priority: false,
            },
          ],
          notes: [
            {
              note_id: 1,
              text: "Project Requirements: Need to include timeline and budget estimates",
              date_created: new Date("2025-02-10"),
              is_deleted: false,
              background_color: "#00C7BE",
              is_pinned: true,
            },
            {
              note_id: 2,
              text: "Meeting Notes: Discussed project scope and next steps",
              date_created: new Date("2025-02-14"),
              is_deleted: false,
              background_color: "#AF52DE",
              is_pinned: false,
            },
            {
              note_id: 5,
              text: "Project Requirements: Need to include timeline and budget estimates",
              date_created: new Date("2025-02-10"),
              is_deleted: false,
              background_color: "#FF9500",
              is_pinned: true,
            },
            {
              note_id: 3,
              text: "Project Requirements: Need to include timeline and budget estimates",
              date_created: new Date("2025-02-10"),
              is_deleted: false,
              background_color: "#FF2D55",
              is_pinned: true,
            },
            {
              note_id: 4,
              text: "Project Requirements: Need to include timeline and budget estimates",
              date_created: new Date("2025-02-10"),
              is_deleted: false,
              background_color: "#34C759",
              is_pinned: true,
            },
          ],
        },
        {
          id: "work-meetings",
          collection_name: "Meetings",
          background_color: "#AF52DE",
          date_created: new Date("2025-01-18"),
          is_default: false,
          content_count: 1,
          tasks: [
            {
              id: "task3",
              text: "Quarterly review",
              description: "Prepare slides for quarterly performance review",
              date_created: new Date("2025-02-15"),
              due_date: new Date("2025-02-28"),
              is_completed: false,
              is_priority: false,
            },
          ],
          notes: [
            {
              note_id: 2,
              text: "Meeting Agenda: Review Q1 goals and set Q2 priorities",
              date_created: new Date("2025-02-15"),
              is_deleted: false,
              background_color: "#FFD60A",
              is_pinned: false,
            },
          ],
        },
      ],
    },
    "2": {
      id: "2",
      name: "Personal",
      background_color: "#34C759",
      date_created: new Date("2025-01-20"),
      is_default: false,
      collections: [
        {
          id: "personal-general",
          collection_name: "General",
          background_color: "#FF3B30",
          date_created: new Date("2025-01-20"),
          is_default: true,
          content_count: 2,
          tasks: [
            {
              id: "task4",
              text: "Grocery shopping",
              description: "Buy ingredients for the week's meals",
              date_created: new Date("2025-02-13"),
              due_date: new Date("2025-02-15"),
              is_completed: false,
              is_priority: true,
            },
            {
              id: "task5",
              text: "Pay utility bills",
              description:
                "Pay electricity and water bills before the due date",
              date_created: new Date("2025-02-14"),
              due_date: new Date("2025-02-20"),
              is_completed: false,
              is_priority: false,
            },
          ],
          notes: [
            {
              note_id: 3,
              text: "Shopping List: Vegetables, fruits, chicken, pasta, sauce",
              date_created: new Date("2025-02-13"),
              is_deleted: false,
              background_color: "#00C7BE",
              is_pinned: true,
            },
          ],
        },
      ],
    },
    "3": {
      id: "3",
      name: "Shopping",
      background_color: "#FF9500",
      date_created: new Date("2025-01-25"),
      is_default: false,
      collections: [
        {
          id: "shopping-general",
          collection_name: "General",
          background_color: "#FFD60A",
          date_created: new Date("2025-01-25"),
          is_default: true,
          content_count: 0,
          tasks: [],
          notes: [],
        },
      ],
    },
  },
};

// Utility functions that can be used by any component
export const dataUtils = {
  // Get a list by ID
  getList: (listId: string): List | null => {
    // Check if the list exists before returning
    return sampleData.lists[listId] || null;
  },

  // Get all list IDs
  getListIds: (): string[] => {
    return Object.keys(sampleData.lists);
  },

  // Get first list ID
  getFirstListId: (): string | null => {
    const keys = Object.keys(sampleData.lists);
    return keys.length > 0 ? keys[0] : null;
  },

  // Create a new list with a default "General" collection
  createList: (name: string, backgroundColor: string): List => {
    const listId = uuidv4();

    const newList: List = {
      id: listId,
      name: name,
      background_color: backgroundColor,
      date_created: new Date(),
      is_default: false,
      collections: [
        {
          id: `${listId}-general`,
          collection_name: "General",
          background_color: backgroundColor, // Use the same color as the list or adjust as needed
          date_created: new Date(),
          is_default: true,
          content_count: 0,
          tasks: [],
          notes: [],
        },
      ],
    };

    // Add to sample data (in a real app, this would save to database)
    sampleData.lists[listId] = newList;

    return newList;
  },

  // Create a new collection (ensuring only one default per list)
  createCollection: (
    list: List,
    collectionName: string,
    backgroundColor: string,
    isDefault: boolean = false
  ): List => {
    // If this collection will be default, make sure no other collection is default
    let updatedCollections = [...list.collections];

    if (isDefault) {
      // Remove default status from any other collection
      updatedCollections = updatedCollections.map((collection) => ({
        ...collection,
        is_default: false,
      }));
    }

    // Create the new collection
    const newCollection: Collection = {
      id: uuidv4(),
      collection_name: collectionName,
      background_color: backgroundColor,
      date_created: new Date(),
      is_default: isDefault,
      content_count: 0,
      tasks: [],
      notes: [],
    };

    // Add the new collection to the list
    return {
      ...list,
      collections: [...updatedCollections, newCollection],
    };
  },

  // Add a new collection with default settings - NOT as default
  addCollection: (list: List, collection: Collection): List => {
    // Make sure the new collection is not set as default
    const newCollection = {
      ...collection,
      is_default: false,
    };

    return {
      ...list,
      collections: [...list.collections, newCollection],
    };
  },

  // Update task completion status
  updateTaskCompletion: (
    list: List,
    collectionId: string,
    taskId: string,
    isCompleted: boolean
  ): List => {
    return {
      ...list,
      collections: list.collections.map((collection) =>
        collection.id === collectionId
          ? {
              ...collection,
              tasks: collection.tasks.map((task) =>
                task.id === taskId
                  ? {
                      ...task,
                      is_completed: isCompleted,
                      date_completed: isCompleted ? new Date() : undefined,
                    }
                  : task
              ),
            }
          : collection
      ),
    };
  },

  // Update task priority status
  updateTaskPriority: (
    list: List,
    collectionId: string,
    taskId: string,
    isPriority: boolean
  ): List => {
    return {
      ...list,
      collections: list.collections.map((collection) =>
        collection.id === collectionId
          ? {
              ...collection,
              tasks: collection.tasks.map((task) =>
                task.id === taskId ? { ...task, is_priority: isPriority } : task
              ),
            }
          : collection
      ),
    };
  },

  // Update note pin status
  updateNotePin: (
    list: List,
    collectionId: string,
    noteId: number,
    isPinned: boolean
  ): List => {
    return {
      ...list,
      collections: list.collections.map((collection) =>
        collection.id === collectionId && collection.notes
          ? {
              ...collection,
              notes: collection.notes.map((note) =>
                note.note_id === noteId
                  ? { ...note, is_pinned: isPinned }
                  : note
              ),
            }
          : collection
      ),
    };
  },

  // Add a new task to a collection
  addTask: (list: List, collectionId: string, task: Task): List => {
    return {
      ...list,
      collections: list.collections.map((collection) =>
        collection.id === collectionId
          ? {
              ...collection,
              tasks: [...collection.tasks, task],
              content_count: collection.content_count + 1,
            }
          : collection
      ),
    };
  },

  // Add a new note to a collection
  addNote: (list: List, collectionId: string, note: Note): List => {
    return {
      ...list,
      collections: list.collections.map((collection) =>
        collection.id === collectionId
          ? {
              ...collection,
              notes: collection.notes ? [...collection.notes, note] : [note],
              content_count: collection.content_count + 1,
            }
          : collection
      ),
    };
  },

  // Ensure a list has a General collection
  ensureGeneralCollection: (list: List): List => {
    // Check if there's already a General collection
    const hasGeneral = list.collections.some(
      (collection) =>
        collection.collection_name === "General" && collection.is_default
    );

    if (hasGeneral) {
      return list; // Already has a General collection
    }

    // Create a new General collection
    const generalCollection: Collection = {
      id: `${list.id}-general`,
      collection_name: "General",
      background_color: list.background_color,
      date_created: new Date(),
      is_default: true,
      content_count: 0,
      tasks: [],
      notes: [],
    };

    // Add the General collection and make sure no other collection is default
    return {
      ...list,
      collections: [
        generalCollection,
        ...list.collections.map((collection) => ({
          ...collection,
          is_default: false, // Make sure no other collection is default
        })),
      ],
    };
  },
};
