"use client";

import { Collection, List, Task, Note } from "@/types/schema";

export type ListsData = {
  [key: number]: List;
};

export const sampleData: { lists: ListsData } = {
  lists: {
    1: {
      id: 1,
      created_at: new Date("2025-01-15"),
      list_name: "Work",
      bg_color_hex: "#007AFF",
      is_default: true,
      collections: [
        {
          id: 101,
          list_id: 1,
          created_at: new Date("2025-01-15"),
          collection_name: "General",
          bg_color_hex: "#5856D6",
          is_default: true,
          content_count: 2,
          tasks: [
            {
              id: 1001,
              created_at: new Date("2025-02-10"),
              list_id: 1,
              collection_id: 101,
              text: "Create project proposal",
              description:
                "Draft a comprehensive proposal for the new client project",
              due_date: new Date("2025-02-20"),
              is_completed: true,
              date_completed: new Date("2025-02-18"),
              is_deleted: false,
              is_pinned: false,
            },
            {
              id: 1002,
              created_at: new Date("2025-02-12"),
              list_id: 1,
              collection_id: 101,
              text: "Schedule team meeting",
              description:
                "Set up weekly progress meeting with the development team",
              due_date: new Date("2025-04-27"),
              is_completed: false,
              is_deleted: false,
              is_pinned: true,
            },
          ],
          notes: [
            {
              id: 2001,
              created_at: new Date("2025-02-10"),
              collection_id: 101,
              title:
                "Project Requirements: Need to include timeline and budget estimates",
              is_deleted: false,
              bg_color_hex: "#00C7BE",
              is_pinned: true,
            },
            {
              id: 2002,
              created_at: new Date("2025-02-14"),
              collection_id: 101,
              title: "Meeting Notes: Discussed project scope and next steps",
              is_deleted: false,
              bg_color_hex: "#AF52DE",
              is_pinned: false,
            },
            {
              id: 2005,
              created_at: new Date("2025-02-10"),
              collection_id: 101,
              title:
                "Project Requirements: Need to include timeline and budget estimates",
              is_deleted: false,
              bg_color_hex: "#FF9500",
              is_pinned: true,
            },
            {
              id: 2003,
              created_at: new Date("2025-02-10"),
              collection_id: 101,
              title:
                "Project Requirements: Need to include timeline and budget estimates",
              is_deleted: false,
              bg_color_hex: "#FF2D55",
              is_pinned: true,
            },
            {
              id: 2004,
              created_at: new Date("2025-02-10"),
              collection_id: 101,
              title:
                "Project Requirements: Need to include timeline and budget estimates",
              is_deleted: false,
              bg_color_hex: "#34C759",
              is_pinned: true,
            },
          ],
        },
        {
          id: 102,
          list_id: 1,
          created_at: new Date("2025-01-18"),
          collection_name: "Meetings",
          bg_color_hex: "#AF52DE",
          is_default: false,
          content_count: 1,
          tasks: [
            {
              id: 1003,
              created_at: new Date("2025-02-15"),
              list_id: 1,
              collection_id: 102,
              text: "Quarterly review",
              description: "Prepare slides for quarterly performance review",
              due_date: new Date("2025-04-28"),
              is_completed: true,
              date_completed: new Date("2025-04-18"),

              is_deleted: false,
              is_pinned: false,
            },
            {
              id: 1004,
              created_at: new Date("2025-02-15"),
              list_id: 1,
              collection_id: 102,
              text: "Quarterly review",
              description: "Prepare slides for quarterly performance review",
              due_date: new Date("2025-04-28"),
              is_completed: true,
              date_completed: new Date("2025-07-18"),

              is_deleted: false,
              is_pinned: false,
            },
            {
              id: 1005,
              created_at: new Date("2025-02-15"),
              list_id: 1,
              collection_id: 102,
              text: "Quarterly review",
              description: "Prepare slides for quarterly performance review",
              due_date: new Date("2025-04-28"),
              is_completed: true,
              date_completed: new Date("2025-06-18"),

              is_deleted: false,
              is_pinned: false,
            },
            {
              id: 1006,
              created_at: new Date("2025-02-15"),
              list_id: 1,
              collection_id: 102,
              text: "Quarterly review",
              description: "Prepare slides for quarterly performance review",
              due_date: new Date("2025-04-28"),
              is_completed: true,
              date_completed: new Date("2025-04-19"),

              is_deleted: false,
              is_pinned: false,
            },
            {
              id: 1007,
              created_at: new Date("2025-02-15"),
              list_id: 1,
              collection_id: 102,
              text: "Quarterly review",
              description: "Prepare slides for quarterly performance review",
              due_date: new Date("2025-04-28"),
              is_completed: true,
              date_completed: new Date("2025-03-18"),

              is_deleted: false,
              is_pinned: false,
            },
            {
              id: 1008,
              created_at: new Date("2025-02-15"),
              list_id: 1,
              collection_id: 102,
              text: "Quarterly review",
              description: "Prepare slides for quarterly performance review",
              due_date: new Date("2025-04-28"),
              is_completed: true,
              date_completed: new Date("2025-03-20"),

              is_deleted: false,
              is_pinned: false,
            },
            {
              id: 1009,
              created_at: new Date("2025-02-25"),
              list_id: 1,
              collection_id: 102,
              text: "Quarterly review",
              description: "Prepare slides for quarterly performance review",
              due_date: new Date("2025-04-28"),
              is_completed: true,
              date_completed: new Date("2025-03-18"),

              is_deleted: false,
              is_pinned: false,
            },
            {
              id: 100,
              created_at: new Date("2025-02-15"),
              list_id: 1,
              collection_id: 102,
              text: "Quarterly review",
              description: "Prepare slides for quarterly performance review",
              due_date: new Date("2025-04-28"),
              is_completed: true,
              date_completed: new Date("2025-04-18"),

              is_deleted: false,
              is_pinned: false,
            },
          ],
          notes: [
            {
              id: 2006,
              created_at: new Date("2025-02-15"),
              collection_id: 102,
              title: "Meeting Agenda: Review Q1 goals and set Q2 priorities",
              is_deleted: false,
              bg_color_hex: "#FFD60A",
              is_pinned: false,
            },
          ],
        },
      ],
    },
    2: {
      id: 2,
      created_at: new Date("2025-01-20"),
      list_name: "Personal",
      bg_color_hex: "#34C759",
      is_default: false,
      collections: [
        {
          id: 201,
          list_id: 2,
          created_at: new Date("2025-01-20"),
          collection_name: "General",
          bg_color_hex: "#FF3B30",
          is_default: true,
          content_count: 2,
          tasks: [],
          notes: [
            {
              id: 2007,
              created_at: new Date("2025-02-13"),
              collection_id: 201,
              title: "Shopping List: Vegetables, fruits, chicken, pasta, sauce",
              is_deleted: false,
              bg_color_hex: "#00C7BE",
              is_pinned: true,
            },
          ],
        },
      ],
    },
    3: {
      id: 3,
      created_at: new Date("2025-01-25"),
      list_name: "Shopping",
      bg_color_hex: "#FF9500",
      is_default: false,
      collections: [
        {
          id: 301,
          list_id: 3,
          created_at: new Date("2025-01-25"),
          collection_name: "General",
          bg_color_hex: "#FFD60A",
          is_default: true,
          content_count: 0,
          tasks: [],
          notes: [],
        },
      ],
    },
  },
};

let listCounter = 1000;
let collectionCounter = 2000;
let taskCounter = 3000;
let noteCounter = 4000;

// Utility functions
export const dataUtils = {
  // Get a list by ID
  getList: (listId: number): List | null => {
    return sampleData.lists[listId] || null;
  },

  // Get all list IDs
  getListIds: (): number[] => {
    return Object.keys(sampleData.lists).map((id) => Number(id));
  },

  // Get first list ID
  getFirstListId: (): number | null => {
    const keys = Object.keys(sampleData.lists);
    return keys.length > 0 ? Number(keys[0]) : null;
  },

  // Get all collections (for use in TodayPage)
  getAllCollections: (): Collection[] => {
    const collections: Collection[] = [];
    Object.values(sampleData.lists).forEach((list) => {
      if (list.collections) {
        collections.push(...list.collections);
      }
    });
    return collections;
  },

  // Get tasks for a specific collection
  getTasksByCollection: (collectionId: number): Task[] => {
    let tasks: Task[] = [];

    // Find the collection and return its tasks
    Object.values(sampleData.lists).some((list) => {
      if (list.collections) {
        const collection = list.collections.find((c) => c.id === collectionId);
        if (collection && collection.tasks) {
          tasks = collection.tasks;
          return true;
        }
      }
      return false;
    });

    return tasks;
  },

  // Create a new list with a default "General" collection
  createList: (name: string, backgroundColor: string): List => {
    const listId = ++listCounter;

    const newList: List = {
      id: listId,
      created_at: new Date(),
      list_name: name,
      bg_color_hex: backgroundColor,
      is_default: false,
      collections: [
        {
          id: ++collectionCounter,
          list_id: listId,
          created_at: new Date(),
          collection_name: "General",
          bg_color_hex: backgroundColor,
          is_default: true,
          content_count: 0,
          tasks: [],
          notes: [],
        },
      ],
    };

    sampleData.lists[listId] = newList;

    return newList;
  },

  // Ensure a list has a General collection
  ensureGeneralCollection: (list: List): List => {
    if (
      !list.collections ||
      list.collections.length === 0 ||
      !list.collections.some((c) => c.is_default)
    ) {
      // Add a General collection that is default
      return {
        ...list,
        collections: [
          ...(list.collections || []),
          {
            id: ++collectionCounter,
            list_id: list.id,
            created_at: new Date(),
            collection_name: "General",
            bg_color_hex: list.bg_color_hex,
            is_default: true,
            content_count: 0,
            tasks: [],
            notes: [],
          },
        ],
      };
    }
    return list;
  },

  // Add a new collection to a list
  addCollection: (listId: number, collection: Collection): void => {
    const list = sampleData.lists[listId];
    if (list) {
      list.collections = [...(list.collections || []), collection];
    }
  },

  // Update a collection
  updateCollection: (
    listId: number,
    collectionId: number,
    updates: Partial<Collection>
  ): void => {
    const list = sampleData.lists[listId];
    if (list && list.collections) {
      list.collections = list.collections.map((collection) =>
        collection.id === collectionId
          ? { ...collection, ...updates }
          : collection
      );
    }
  },

  // Update a task
  updateTask: (
    taskId: number,
    collectionId: number,
    updates: Partial<Task>
  ): void => {
    Object.values(sampleData.lists).forEach((list) => {
      if (list.collections) {
        list.collections.forEach((collection) => {
          if (collection.id === collectionId && collection.tasks) {
            collection.tasks = collection.tasks.map((task) =>
              task.id === taskId ? { ...task, ...updates } : task
            );
          }
        });
      }
    });
  },

  // Update a note
  updateNote: (
    noteId: number,
    collectionId: number,
    updates: Partial<Note>
  ): void => {
    Object.values(sampleData.lists).forEach((list) => {
      if (list.collections) {
        list.collections.forEach((collection) => {
          if (collection.id === collectionId && collection.notes) {
            collection.notes = collection.notes.map((note) =>
              note.id === noteId ? { ...note, ...updates } : note
            );
          }
        });
      }
    });
  },

  // Update task completion status
  updateTaskCompletion: (
    listId: number,
    collectionId: number,
    taskId: number,
    isCompleted: boolean
  ): void => {
    const list = sampleData.lists[listId];
    if (list && list.collections) {
      list.collections.forEach((collection) => {
        if (collection.id === collectionId && collection.tasks) {
          collection.tasks = collection.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  is_completed: isCompleted,
                  date_completed: isCompleted ? new Date() : undefined,
                }
              : task
          );
        }
      });
    }
  },

  // Update task pin status
  updateTaskPin: (
    listId: number,
    collectionId: number,
    taskId: number,
    isPinned: boolean
  ): void => {
    const list = sampleData.lists[listId];
    if (list && list.collections) {
      list.collections.forEach((collection) => {
        if (collection.id === collectionId && collection.tasks) {
          collection.tasks = collection.tasks.map((task) =>
            task.id === taskId ? { ...task, is_pinned: isPinned } : task
          );
        }
      });
    }
  },

  // Update note pin status
  updateNotePin: (
    listId: number,
    collectionId: number,
    noteId: number,
    isPinned: boolean
  ): void => {
    const list = sampleData.lists[listId];
    if (list && list.collections) {
      list.collections.forEach((collection) => {
        if (collection.id === collectionId && collection.notes) {
          collection.notes = collection.notes.map((note) =>
            note.id === noteId ? { ...note, is_pinned: isPinned } : note
          );
        }
      });
    }
  },

  // Add a new task to a collection
  addTask: (collectionId: number, task: Task): void => {
    Object.values(sampleData.lists).forEach((list) => {
      if (list.collections) {
        list.collections.forEach((collection) => {
          if (collection.id === collectionId) {
            if (!collection.tasks) collection.tasks = [];
            collection.tasks.push(task);
            collection.content_count = (collection.content_count || 0) + 1;
          }
        });
      }
    });
  },

  // Add a new note to a collection
  addNote: (collectionId: number, note: Note): void => {
    Object.values(sampleData.lists).forEach((list) => {
      if (list.collections) {
        list.collections.forEach((collection) => {
          if (collection.id === collectionId) {
            if (!collection.notes) collection.notes = [];
            collection.notes.push(note);
            collection.content_count = (collection.content_count || 0) + 1;
          }
        });
      }
    });
  },
};
