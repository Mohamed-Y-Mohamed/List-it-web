"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { Collection, List, Task, Note, ListColor, OperationResult } from "@/types/schema";
import CollectionComponent from "@/components/Collection/index";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";

// Import components
import ListFilterPlus from "@/components/popupModels/ListFilter";
import CreateCollectionModal from "@/components/popupModels/CollectionPopup";
import CreateTaskModal from "@/components/popupModels/TaskPopup";
import CreateNoteModal from "@/components/popupModels/NotePopup";
import DeleteCollectionModal from "@/components/popupModels/DeleteCollectionModal";
import EditCollectionPopup from "@/components/popupModels/EditCollectionPopup";

// Format date to yyyy-MM-dd'T'HH:mm:ss
const formatDateForPostgres = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  // Return format without 'T': YYYY-MM-DD HH:mm:ss
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// Add a handler for task deletion
const handleTaskDelete = async (taskId: string) => {
  try {
    const res = await fetch("/api/tasks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId }),
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to delete task");
    }
    return { success: true };
  } catch (err) {
    console.error("Error deleting task:", err);
    return { success: false, error: err };
  }
};

export default function ListPage() {
  const params = useParams();
  const listId = params?.listId as string;

  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === "dark";

  // State for modals
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isDeleteCollectionModalOpen, setIsDeleteCollectionModalOpen] =
    useState(false);
  const [isEditCollectionModalOpen, setIsEditCollectionModalOpen] =
    useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    string | null
  >();
  const [collectionToEdit, setCollectionToEdit] = useState<Collection | null>(
    null
  );

  // Local state for the current list
  const [listData, setListData] = useState<List | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>(
    "Loading collections..."
  );

  // Add a refresh trigger to force re-fetch of data
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Function to trigger a data refresh
  const refreshData = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Function to check if a collection name is "General"
  const isGeneralCollection = useCallback(
    (collectionName: string | null): boolean => {
      if (!collectionName) return false;
      return collectionName.trim().toLowerCase() === "general";
    },
    []
  );

  // Get default collection ID (prioritize "General" collection)
  const defaultCollectionId = useMemo(() => {
    // First try to find "General" collection
    const generalCollection = collections.find((c) =>
      isGeneralCollection(c.collection_name)
    );
    if (generalCollection) {
      return generalCollection.id;
    }

    // If no General collection, return the first collection
    return collections.length > 0 ? collections[0].id : null;
  }, [collections, isGeneralCollection]);

  // Effect to fetch list data
  useEffect(() => {
    const fetchListData = async () => {
      if (!listId || !user) {
        setIsLoading(false);
        setError("List ID or user not available");
        return;
      }

      setIsLoading(true);
      setError(null);
      setLoadingMessage("Loading collections...");

      try {
        // Fetch the list data
        const listRes = await fetch(`/api/lists?id=${listId}`);
        if (!listRes.ok) {
          const errData = await listRes.json();
          throw new Error(errData.error || "Failed to fetch list");
        }
        const { data: listData } = await listRes.json();

        if (!listData) {
          throw new Error("List not found");
        }

        setListData(listData as List);
        setLoadingMessage("Loading collections and content...");

        // Fetch collections for this list
        const collectionsRes = await fetch(
          `/api/collections?list_id=${listId}`
        );
        if (!collectionsRes.ok) {
          const errData = await collectionsRes.json();
          throw new Error(errData.error || "Failed to fetch collections");
        }
        const { data: collectionsData } = await collectionsRes.json();

        // Initialize collections with tasks and notes arrays
        const collectionsWithData = (collectionsData || []).map(
          (collection: Collection) => ({
            ...collection,
            tasks: [] as Task[],
            notes: [] as Note[],
            isPinned: false,
            is_default: isGeneralCollection(collection.collection_name),
          })
        );

        setCollections(collectionsWithData as Collection[]);

        // Fetch tasks and notes for each collection
        for (const collection of collectionsWithData) {
          try {
            const tasksRes = await fetch(
              `/api/tasks?collection_id=${collection.id}&is_deleted=false&is_completed=false`
            );
            if (!tasksRes.ok) {
              console.error(
                `Error fetching tasks for collection ${collection.id}`
              );
            } else {
              const { data: tasks } = await tasksRes.json();
              const sorted = ((tasks as Task[]) || []).sort((a, b) => {
                if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
                return (
                  new Date(b.created_at).getTime() -
                  new Date(a.created_at).getTime()
                );
              });
              setCollections((prev) =>
                prev.map((c) =>
                  c.id === collection.id ? { ...c, tasks: sorted } : c
                )
              );
            }
          } catch (taskError) {
            console.error(
              `Failed to process tasks for collection ${collection.id}:`,
              taskError
            );
          }

          try {
            const notesRes = await fetch(
              `/api/notes?collection_id=${collection.id}&is_deleted=false`
            );
            if (!notesRes.ok) {
              console.error(
                `Error fetching notes for collection ${collection.id}`
              );
            } else {
              const { data: notes } = await notesRes.json();
              const sorted = ((notes as Note[]) || []).sort((a, b) => {
                if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
                return (
                  new Date(b.created_at).getTime() -
                  new Date(a.created_at).getTime()
                );
              });
              setCollections((prev) =>
                prev.map((c) =>
                  c.id === collection.id ? { ...c, notes: sorted } : c
                )
              );
            }
          } catch (noteError) {
            console.error(
              `Failed to process notes for collection ${collection.id}:`,
              noteError
            );
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchListData();
  }, [listId, user, refreshTrigger, isGeneralCollection]);

  // Handler for editing a collection
  const handleEditCollection = useCallback(async (collection: Collection) => {
    setCollectionToEdit(collection);
    setIsEditCollectionModalOpen(true);
    return { success: true };
  }, []);
  useEffect(() => {
    const handleListUpdated = (event: CustomEvent) => {
      const { listId: updatedListId, newColor } = event.detail;

      // Check if the updated list is the current list being displayed
      if (updatedListId === listId) {
        console.log(
          `List ${updatedListId} was updated with new color ${newColor}, refreshing collections...`
        );

        // Refresh the data to reflect the updated list and collections
        refreshData();
      }
    };

    // Add event listener for list updates
    window.addEventListener("listUpdated", handleListUpdated as EventListener);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener(
        "listUpdated",
        handleListUpdated as EventListener
      );
    };
  }, [listId, refreshData]);
  // Handler for submitting collection edits
  const handleEditCollectionSubmit = useCallback(
    async (
      collectionId: string,
      collectionData: { collection_name: string; bg_color_hex: ListColor }
    ): Promise<{ success: boolean; error?: unknown }> => {
      try {
        // Update the local state immediately for better UX
        setCollections((prevCollections) =>
          prevCollections.map((collection) =>
            collection.id === collectionId
              ? {
                  ...collection,
                  collection_name: collectionData.collection_name,
                  bg_color_hex: collectionData.bg_color_hex,
                }
              : collection
          )
        );

        // Close the edit modal
        setIsEditCollectionModalOpen(false);
        setCollectionToEdit(null);

        // Refresh the data from the server to ensure consistency
        await refreshData();

        return { success: true };
      } catch (err) {
        console.error("Error handling collection edit:", err);
        return { success: false, error: err };
      }
    },
    [refreshData]
  );

  // Handler for creating a new collection
  const handleCreateCollection = useCallback(
    async (collectionData: {
      collection_name: string;
      bg_color_hex: string;
    }) => {
      if (!listData || !user) {
        console.error(
          "Cannot create collection: List data or user not available"
        );
        return { success: false, error: "Missing list data or user" };
      }

      try {
        // Insert the new collection
        const res = await fetch("/api/collections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            list_id: listData.id,
            collection_name: collectionData.collection_name,
            bg_color_hex: collectionData.bg_color_hex,
            created_at: formatDateForPostgres(new Date()),
          }),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to create collection");
        }
        const { data } = await res.json();

        if (data) {
          // Add the new collection to the state
          const newCollection: Collection = {
            ...(data as Collection),
            tasks: [],
            notes: [],
            isPinned: false,
            // Check if the new collection is "General"
            is_default: isGeneralCollection(collectionData.collection_name),
          };

          setCollections((prev) => [...prev, newCollection]);
          return { success: true };
        }
        return { success: false, error: "No data returned from creation" };
      } catch (err) {
        console.error("Error creating collection:", err);
        return { success: false, error: err };
      }
    },
    [listData, user, isGeneralCollection]
  );

  // Handler for creating a new task
  const handleTaskSubmit = useCallback(
    async (taskData: {
      text: string;
      description: string;
      is_pinned: boolean;
      due_date?: Date;
      collection_id?: string;
    }) => {
      if (!listData || !user) {
        console.error("Cannot create task: List data or user not available");
        return { success: false, error: "Missing list data or user" };
      }

      try {
        // Use the selected collection ID from the modal or default if available
        const collectionId =
          taskData.collection_id || selectedCollectionId || defaultCollectionId;

        // Create the task in the database with all required fields
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: taskData.text,
            description: taskData.description || null,
            is_pinned: taskData.is_pinned || false,
            due_date: taskData.due_date
              ? formatDateForPostgres(taskData.due_date)
              : null,
            collection_id: collectionId,
            list_id: listData.id,
            is_completed: false,
            is_deleted: false,
            created_at: formatDateForPostgres(new Date()),
          }),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to create task");
        }
        const { data } = await res.json();

        if (data) {
          const newTask = data as Task;

          // Get the collection this task belongs to
          if (newTask.collection_id) {
            // Update the collection with the new task - ensure proper typing
            setCollections((prevCollections) =>
              prevCollections.map((collection) => {
                if (collection.id === newTask.collection_id) {
                  // Add the task to the beginning of the collection's tasks array
                  return {
                    ...collection,
                    tasks: [newTask, ...(collection.tasks || [])],
                  };
                }
                return collection;
              })
            );
          }

          // Reset selected collection
          setSelectedCollectionId(null);
          return { success: true };
        }
        return { success: false, error: "No data returned from creation" };
      } catch (err) {
        console.error("Error creating task:", err);
        return { success: false, error: err };
      }
    },
    [listData, user, selectedCollectionId, defaultCollectionId]
  );

  // Handler for task completion
  const handleTaskComplete = useCallback(
    async (taskId: string, isCompleted: boolean) => {
      try {
        // Update the task in the database
        const res = await fetch("/api/tasks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: taskId,
            is_completed: isCompleted,
            date_completed: isCompleted
              ? formatDateForPostgres(new Date())
              : null,
          }),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to update task");
        }
        const { data: updatedTask } = await res.json();

        if (updatedTask) {
          // If task is completed, remove it from the UI entirely
          if (isCompleted) {
            setCollections((prevCollections) =>
              prevCollections.map((collection) => {
                if (collection.id === (updatedTask as Task).collection_id) {
                  return {
                    ...collection,
                    tasks: (collection.tasks || []).filter(
                      (task) => task.id !== taskId
                    ),
                  };
                }
                return collection;
              })
            );
          } else {
            // If task is uncompleted, update it in place
            setCollections((prevCollections) =>
              prevCollections.map((collection) => {
                if (collection.id === (updatedTask as Task).collection_id) {
                  return {
                    ...collection,
                    tasks: (collection.tasks || []).map((task) =>
                      task.id === taskId
                        ? ({
                            ...task,
                            is_completed: isCompleted,
                            date_completed: isCompleted ? new Date() : null,
                          } as Task)
                        : task
                    ),
                  };
                }
                return collection;
              })
            );
          }
          return { success: true };
        }
        return { success: false, error: "No data returned from update" };
      } catch (err) {
        console.error("Error completing task:", err);
        return { success: false, error: err };
      }
    },
    []
  );

  // Handler for task priority
  const handleTaskPriority = useCallback(
    async (taskId: string, isPinned: boolean) => {
      try {
        // Update the task in the database
        const res = await fetch("/api/tasks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: taskId, is_pinned: isPinned }),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to update task");
        }
        const { data: updatedTask } = await res.json();

        if (updatedTask) {
          // Update the task in the collections state
          if ((updatedTask as Task).collection_id) {
            setCollections((prevCollections) =>
              prevCollections.map((collection) => {
                if (collection.id === (updatedTask as Task).collection_id) {
                  return {
                    ...collection,
                    tasks: (collection.tasks || []).map((task) =>
                      task.id === taskId
                        ? ({ ...task, is_pinned: isPinned } as Task)
                        : task
                    ),
                  };
                }
                return collection;
              })
            );
          }
          return { success: true };
        }
        return { success: false, error: "No data returned from update" };
      } catch (err) {
        console.error("Error updating task priority:", err);
        return { success: false, error: err };
      }
    },
    []
  );

  // Handler for task updates
  const handleTaskUpdate = useCallback(
    async (
      taskId: string,
      taskData: {
        text: string;
        description?: string | null;
        due_date?: Date | null;
        is_pinned: boolean;
      }
    ) => {
      try {
        // Update the task in the database
        const res = await fetch("/api/tasks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: taskId,
            text: taskData.text,
            description: taskData.description ?? null,
            due_date: taskData.due_date
              ? formatDateForPostgres(taskData.due_date)
              : null,
            is_pinned: taskData.is_pinned,
          }),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to update task");
        }
        const { data: updatedTask } = await res.json();

        if (updatedTask) {
          // Update the task in the collections state
          if ((updatedTask as Task).collection_id) {
            setCollections((prevCollections) =>
              prevCollections.map((collection) => {
                if (collection.id === (updatedTask as Task).collection_id) {
                  return {
                    ...collection,
                    tasks: (collection.tasks || []).map((task) =>
                      task.id === taskId ? (updatedTask as Task) : task
                    ),
                  };
                }
                return collection;
              })
            );
          }
          return { success: true };
        }
        return { success: false, error: "No data returned from update" };
      } catch (err) {
        console.error("Error updating task:", err);
        return { success: false, error: err };
      }
    },
    []
  );

  // Handler for task deletion that updates UI state
  const handleTaskDeleteWithUIUpdate = useCallback(async (taskId: string) => {
    try {
      // Call the delete function
      const { success, error } = await handleTaskDelete(taskId);

      if (!success) throw error;

      // Update UI by removing the deleted task from all collections
      setCollections((prevCollections) =>
        prevCollections.map((collection) => ({
          ...collection,
          tasks: (collection.tasks || []).filter((task) => task.id !== taskId),
        }))
      );
      return { success: true };
    } catch (err) {
      console.error("Error handling task deletion:", err);
      return { success: false, error: err };
    }
  }, []);

  // Handler for creating a new note
  const handleNoteSubmit = useCallback(
    async (
      noteData: {
        title: string;
        description?: string;
        bg_color_hex: string;
        collection_id?: string;
      },
      newNoteData?: Note // Receive back the complete note data from modal
    ) => {
      if (!listData || !user) {
        console.error("Cannot create note: List data or user not available");
        return { success: false, error: "Missing list data or user" };
      }

      try {
        // If we already have the complete note data from the modal, use it directly
        if (newNoteData) {
          // Check if the note has a collection ID
          if (newNoteData.collection_id) {
            // Find the collection this note belongs to and add it to the UI
            setCollections((prevCollections) =>
              prevCollections.map((collection) => {
                if (collection.id === newNoteData.collection_id) {
                  // Add the new note to the beginning of the collection's notes array
                  return {
                    ...collection,
                    notes: [newNoteData, ...(collection.notes || [])],
                  };
                }
                return collection;
              })
            );
          }

          // Reset selected collection
          setSelectedCollectionId(null);
          return { success: true };
        }

        // Use the selected collection ID from the modal or default if available
        const collectionId =
          noteData.collection_id || selectedCollectionId || defaultCollectionId;

        // Create the note in the database if we don't have newNoteData
        const res = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: noteData.title,
            description: noteData.description || null,
            bg_color_hex: noteData.bg_color_hex,
            collection_id: collectionId,
            list_id: listData.id,
            is_deleted: false,
            is_pinned: false,
          }),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to create note");
        }
        const { data } = await res.json();

        if (data) {
          const newNote = data as Note;

          // Get the collection this note belongs to
          if (newNote.collection_id) {
            // Update the collection with the new note
            setCollections((prevCollections) =>
              prevCollections.map((collection) => {
                if (collection.id === newNote.collection_id) {
                  return {
                    ...collection,
                    notes: [newNote, ...(collection.notes || [])],
                  };
                }
                return collection;
              })
            );
          }

          // Reset selected collection
          setSelectedCollectionId(null);
          return { success: true };
        }
        return { success: false, error: "No data returned from creation" };
      } catch (err) {
        console.error("Error creating note:", err);
        return { success: false, error: err };
      }
    },
    [listData, user, selectedCollectionId, defaultCollectionId]
  );

  // Handler for note pinning
  const handleNotePin = useCallback(
    async (noteId: string, isPinned: boolean) => {
      try {
        // Update the note in the database
        const res = await fetch("/api/notes", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: noteId, is_pinned: isPinned }),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to update note");
        }
        const { data: updatedNote } = await res.json();

        if (updatedNote) {
          // Update the note in the collections state
          if ((updatedNote as Note).collection_id) {
            setCollections((prevCollections) =>
              prevCollections.map((collection) => {
                if (collection.id === (updatedNote as Note).collection_id) {
                  return {
                    ...collection,
                    notes: (collection.notes || []).map((note) =>
                      note.id === noteId
                        ? ({ ...note, is_pinned: isPinned } as Note)
                        : note
                    ),
                  };
                }
                return collection;
              })
            );
          }
          return { success: true };
        }
        return { success: false, error: "No data returned from update" };
      } catch (err) {
        console.error("Error updating note pin status:", err);
        return { success: false, error: err };
      }
    },
    []
  );

  // Handler for note color change
  const handleNoteColorChange = useCallback(
    async (noteId: string, color: string) => {
      try {
        // Update the note in the database
        const res = await fetch("/api/notes", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: noteId, bg_color_hex: color }),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to update note");
        }
        const { data: updatedNote } = await res.json();

        if (updatedNote) {
          // Update the note in the collections state
          if ((updatedNote as Note).collection_id) {
            setCollections((prevCollections) =>
              prevCollections.map((collection) => {
                if (collection.id === (updatedNote as Note).collection_id) {
                  return {
                    ...collection,
                    notes: (collection.notes || []).map((note) =>
                      note.id === noteId
                        ? ({ ...note, bg_color_hex: color } as Note)
                        : note
                    ),
                  };
                }
                return collection;
              })
            );
          }
          return { success: true };
        }
        return { success: false, error: "No data returned from update" };
      } catch (err) {
        console.error("Error updating note color:", err);
        return { success: false, error: err };
      }
    },
    []
  );

  // Handler for note updates
  const handleNoteUpdate = useCallback(
    async (
      noteId: string,
      updatedTitle: string,
      updatedDescription?: string
    ) => {
      try {
        // Update the note in the database
        const updateData: { title: string; description?: string | null } = {
          title: updatedTitle,
        };

        // Only include description if it's provided (allows clearing the description)
        if (updatedDescription !== undefined) {
          updateData.description = updatedDescription || null;
        }

        const res = await fetch("/api/notes", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: noteId, ...updateData }),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to update note");
        }
        const { data: updatedNote } = await res.json();

        if (updatedNote) {
          // Update the note in the collections state
          if ((updatedNote as Note).collection_id) {
            setCollections((prevCollections) =>
              prevCollections.map((collection) => {
                if (collection.id === (updatedNote as Note).collection_id) {
                  return {
                    ...collection,
                    notes: (collection.notes || []).map((note) =>
                      note.id === noteId ? (updatedNote as Note) : note
                    ),
                  };
                }
                return collection;
              })
            );
          }

          // Refresh all data when a note is updated to ensure collection changes are reflected
          refreshData();

          return { success: true };
        }
        return { success: false, error: "No data returned from update" };
      } catch (err) {
        console.error("Error updating note:", err);
        return { success: false, error: err };
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Handler for changing a task's collection
  const handleTaskCollectionChange = useCallback(
    async (
      taskId: string,
      newCollectionId: string
    ): Promise<OperationResult> => {
      try {
        // First find the task and its current collection
        let taskToMove = null;
        let oldCollectionId = null;

        for (const collection of collections) {
          if (!collection.tasks) continue;

          const foundTask = collection.tasks.find((task) => task.id === taskId);
          if (foundTask) {
            taskToMove = { ...foundTask };
            oldCollectionId = collection.id;
            break;
          }
        }

        if (!taskToMove) {
          return { success: false, error: "Task not found" };
        }

        // Update the collection_id in the database
        const res = await fetch("/api/tasks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: taskId, collection_id: newCollectionId }),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to update task collection");
        }

        // Update local state to move the task between collections
        setCollections((prevCollections) => {
          // Create a copy of the collections
          const updatedCollections = [...prevCollections];

          // Remove the task from its old collection
          if (oldCollectionId) {
            const oldCollectionIndex = updatedCollections.findIndex(
              (c) => c.id === oldCollectionId
            );
            if (
              oldCollectionIndex >= 0 &&
              updatedCollections[oldCollectionIndex].tasks
            ) {
              updatedCollections[oldCollectionIndex] = {
                ...updatedCollections[oldCollectionIndex],
                tasks:
                  updatedCollections[oldCollectionIndex].tasks?.filter(
                    (t) => t.id !== taskId
                  ) || [],
              };
            }
          }

          // Add the task to its new collection with updated collection_id
          const newCollectionIndex = updatedCollections.findIndex(
            (c) => c.id === newCollectionId
          );
          if (newCollectionIndex >= 0) {
            // Update the task's collection_id
            const updatedTask = {
              ...taskToMove,
              collection_id: newCollectionId,
            };

            // Add the task to the new collection
            updatedCollections[newCollectionIndex] = {
              ...updatedCollections[newCollectionIndex],
              tasks: [
                updatedTask,
                ...(updatedCollections[newCollectionIndex].tasks || []),
              ],
            };
          }

          return updatedCollections;
        });

        return { success: true };
      } catch (err) {
        console.error("Error changing task collection:", err);
        return { success: false, error: err };
      }
    },
    [collections]
  );

  // Handler for note deletion
  const handleNoteDelete = useCallback(
    async (noteId: string) => {
      try {
        // First, find which collection contains this note
        let noteCollectionId = null;
        let foundNote = null;

        // Find the note and its collection
        for (const collection of collections) {
          foundNote = collection.notes?.find((note) => note.id === noteId);
          if (foundNote) {
            noteCollectionId = collection.id;
            break;
          }
        }

        // Hard-delete the note
        const res = await fetch("/api/notes", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: noteId, hard: true }),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to delete note");
        }

        // Immediately update the UI to remove the note
        if (noteCollectionId) {
          setCollections((prevCollections) =>
            prevCollections.map((collection) => {
              if (collection.id === noteCollectionId) {
                return {
                  ...collection,
                  notes: (collection.notes || []).filter(
                    (note) => note.id !== noteId
                  ),
                };
              }
              return collection;
            })
          );
        } else {
          // If we can't find the specific collection, update all collections
          setCollections((prevCollections) =>
            prevCollections.map((collection) => ({
              ...collection,
              notes: (collection.notes || []).filter(
                (note) => note.id !== noteId
              ),
            }))
          );
        }

        // Finally, force a refresh after a short delay to ensure DB and UI are synced
        setTimeout(() => {
          refreshData();
        }, 500);

        return { success: true };
      } catch (err) {
        console.error("Error deleting note:", err);
        return { success: false, error: err };
      }
    },
    [collections, refreshData]
  );

  // Handler for collections deleted from the DeleteCollectionModal
  const handleCollectionsDeleted = useCallback(() => {
    // Refresh data after collections are deleted
    refreshData();
  }, [refreshData]);

  // Memoized sort function to sort collections by pinned status
  const sortedCollections = useMemo(() => {
    if (!collections) return [];

    return [...collections].sort((a, b) => {
      const aIsGeneral = isGeneralCollection(a.collection_name);
      const bIsGeneral = isGeneralCollection(b.collection_name);

      // General first
      if (aIsGeneral && !bIsGeneral) return -1;
      if (!aIsGeneral && bIsGeneral) return 1;

      // Then by creation date ascending (oldest first, newest last)
      return (
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });
  }, [collections, isGeneralCollection]);

  // Close modal handlers with proper cleanup
  const handleCloseCollectionModal = useCallback(() => {
    setIsCollectionModalOpen(false);
  }, []);

  const handleCloseTaskModal = useCallback(() => {
    setIsTaskModalOpen(false);
    setSelectedCollectionId(null);
  }, []);

  const handleCloseNoteModal = useCallback(() => {
    setIsNoteModalOpen(false);
    setSelectedCollectionId(null);
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    setIsDeleteCollectionModalOpen(false);
  }, []);

  const handleCloseEditCollectionModal = useCallback(() => {
    setIsEditCollectionModalOpen(false);
    setCollectionToEdit(null);
  }, []);

  return (
    <main
      className={`transition-all min-h-screen duration-300 
     pb-20 w-full relative
    ${isDark ? "text-gray-200" : "text-gray-800"}
    `}
    >
      {isDark ? (
        <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(45deg,#000000_0%,#090c10_20%,#13161a_40%,#0e1115_70%,#000000_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_bottom_left,rgba(71,85,105,0.16)_0%,transparent_58%)] after:absolute after:inset-0 after:[background:radial-gradient(ellipse_at_top_right,rgba(100,116,139,0.09)_0%,transparent_50%)] before:content-[''] after:content-['']" />
      ) : (
        <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(45deg,#f8f9fb_0%,#f1f4f7_25%,#e2e6ea_50%,#f3f4f6_75%,#ffffff_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_bottom_left,rgba(71,85,105,0.08)_0%,transparent_58%)] after:absolute after:inset-0 after:[background:radial-gradient(ellipse_at_top_right,rgba(100,116,139,0.06)_0%,transparent_50%)] before:content-[''] after:content-['']" />
      )}
      <div className="p-4  pt-20 box-border">
        <div className={`max-w-6xl mx-auto`}>
          {/* Loading state */}
          {isLoading ? (
            <div
              className={`text-center py-10 rounded-xl ${
                isDark
                  ? "bg-gray-800 text-gray-300"
                  : "bg-white/90 text-gray-500"
              } shadow-md border-l-4 border-orange-500`}
            >
              <div className="animate-pulse">
                <p className="text-lg">{loadingMessage}</p>
              </div>
            </div>
          ) : error ? (
            <div
              className={`text-center py-10 rounded-xl ${
                isDark ? "bg-gray-800 text-red-300" : "bg-white/90 text-red-700"
              } shadow-md border-l-4 border-red-500`}
            >
              <p className="text-lg">{error}</p>
            </div>
          ) : listData ? (
            <>
              {/* Header with list name */}
              <div className="flex items-center justify-between mb-6 px-4">
                <h1
                  className={`text-2xl font-bold truncate mr-2 ${
                    isDark ? "text-gray-100" : "text-gray-800"
                  }`}
                  style={{ color: listData.bg_color_hex ?? "#ffffff" }}
                >
                  {listData.list_name}
                </h1>
                <div className="flex-shrink-0">
                  <ListFilterPlus
                    onCreateCollection={() => setIsCollectionModalOpen(true)}
                    onCreateTask={() => {
                      setSelectedCollectionId(null);
                      setIsTaskModalOpen(true);
                    }}
                    onCreateNote={() => {
                      setSelectedCollectionId(null);
                      setIsNoteModalOpen(true);
                    }}
                    onDeleteCollections={() =>
                      setIsDeleteCollectionModalOpen(true)
                    }
                  />
                </div>
              </div>

              {/* Empty state or collections list */}
              {collections.length === 0 ? (
                <div
                  className={`text-center py-16 rounded-xl ${
                    isDark
                      ? "bg-gray-900/80 text-gray-300"
                      : "bg-white/90 text-gray-500"
                  } shadow-md`}
                >
                  <p className="text-lg mb-4">
                    No collections in this list yet.
                  </p>
                  <button
                    onClick={() => setIsCollectionModalOpen(true)}
                    className={`px-4 py-2 rounded-md ${
                      isDark
                        ? "bg-orange-600 hover:bg-orange-700 text-white"
                        : "bg-orange-500 hover:bg-orange-600 text-white"
                    } shadow-md transition-colors duration-200`}
                  >
                    Create your first collection
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Collection components */}
                  {sortedCollections.map((collection) => (
                    <CollectionComponent
                      key={collection.id}
                      id={collection.id}
                      collection_name={collection.collection_name || ""}
                      bg_color_hex={collection.bg_color_hex || ""}
                      created_at={collection.created_at}
                      is_default={collection.is_default ?? false}
                      tasks={collection.tasks || []}
                      notes={collection.notes || []}
                      onTaskComplete={handleTaskComplete}
                      onTaskPriority={handleTaskPriority}
                      onTaskUpdate={handleTaskUpdate}
                      onTaskDelete={handleTaskDeleteWithUIUpdate}
                      onCollectionChange={handleTaskCollectionChange}
                      onNotePin={handleNotePin}
                      onNoteColorChange={handleNoteColorChange}
                      onNoteUpdate={handleNoteUpdate}
                      onNoteDelete={handleNoteDelete}
                      onCollectionEdit={handleEditCollection}
                      collections={collections} // Pass all collections
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div
              className={`text-center py-10 rounded-xl ${
                isDark
                  ? "bg-gray-800 text-gray-300"
                  : "bg-white/90 text-gray-500"
              } shadow-md border-l-4 border-orange-500`}
            >
              <p className="text-lg">List not found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Components */}
      {listData && (
        <>
          <CreateCollectionModal
            isOpen={isCollectionModalOpen}
            onClose={handleCloseCollectionModal}
            onSubmit={handleCreateCollection}
            existingCollections={collections} // Pass existing collections for validation
          />

          {/* Task Modal */}
          <CreateTaskModal
            isOpen={isTaskModalOpen}
            onClose={handleCloseTaskModal}
            onSubmit={handleTaskSubmit}
            collections={collections}
            // Pass selectedCollectionId but make it optional
            selectedCollectionId={selectedCollectionId ?? undefined}
          />

          {/* Note Modal */}
          <CreateNoteModal
            isOpen={isNoteModalOpen}
            onClose={handleCloseNoteModal}
            onSubmit={handleNoteSubmit}
            collections={collections}
            listId={listId}
            // Pass selectedCollectionId but make it optional
            selectedCollectionId={selectedCollectionId ?? undefined}
          />

          {/* Delete Collections Modal */}
          <DeleteCollectionModal
            isOpen={isDeleteCollectionModalOpen}
            onClose={handleCloseDeleteModal}
            collections={collections}
            onCollectionsDeleted={handleCollectionsDeleted}
          />

          {/* Edit Collection Modal */}
          <EditCollectionPopup
            isOpen={isEditCollectionModalOpen}
            onClose={handleCloseEditCollectionModal}
            onSubmit={handleEditCollectionSubmit}
            existingCollections={collections}
            currentCollection={collectionToEdit}
          />
        </>
      )}
    </main>
  );
}
