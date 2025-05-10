"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { Collection, List, Task, Note } from "@/types/schema";
import CollectionComponent from "@/components/Collection/index";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/utils/client";
import { useAuth } from "@/context/AuthContext";

// Import components
import ListFilterPlus from "@/components/popupModels/ListFilter";
import CreateCollectionModal from "@/components/popupModels/CollectionPopup";
import CreateTaskModal from "@/components/popupModels/TaskPopup";
import CreateNoteModal from "@/components/popupModels/notepopup";
import DeleteCollectionModal from "@/components/popupModels/deleteCollectionModal";

// Add a handler for task deletion
const handleTaskDelete = async (taskId: string) => {
  try {
    // Update the task in the database - soft delete
    const { error } = await supabase
      .from("task")
      .update({ is_deleted: true })
      .eq("id", taskId);

    if (error) throw error;

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
  const [isMobile, setIsMobile] = useState(false);

  // State for modals
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isDeleteCollectionModalOpen, setIsDeleteCollectionModalOpen] =
    useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    string | null
  >(null);

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

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Function to trigger a data refresh
  const refreshData = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Get default collection ID
  const defaultCollectionId = useMemo(() => {
    const defaultCollection = collections.find((c) => c.is_default === true);
    return (
      defaultCollection?.id ||
      (collections.length > 0 ? collections[0].id : null)
    );
  }, [collections]);

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
        const { data: listData, error: listError } = await supabase
          .from("list")
          .select("*")
          .eq("id", listId)
          .eq("user_id", user.id)
          .single();

        if (listError) {
          throw listError;
        }

        if (!listData) {
          throw new Error("List not found");
        }

        setListData(listData as List);
        setLoadingMessage("Loading collections and content...");

        // Fetch collections for this list
        const { data: collectionsData, error: collectionsError } =
          await supabase
            .from("collection")
            .select(
              `
              id,
              collection_name,
              bg_color_hex,
              created_at,
              is_default,
              list_id,
              user_id
            `
            )
            .eq("list_id", listId)
            .order("is_default", { ascending: false })
            .order("collection_name", { ascending: true });

        if (collectionsError) {
          throw collectionsError;
        }

        // Initialize collections with tasks and notes arrays
        const collectionsWithData = collectionsData.map((collection) => ({
          ...collection,
          tasks: [] as Task[],
          notes: [] as Note[],
          isPinned: false,
        }));

        setCollections(collectionsWithData as Collection[]);

        // Fetch tasks for each collection
        for (const collection of collectionsWithData) {
          try {
            const { data: tasks, error: tasksError } = await supabase
              .from("task")
              .select("*")
              .eq("collection_id", collection.id)
              .eq("is_deleted", false)
              .order("is_pinned", { ascending: false })
              .order("created_at", { ascending: false });

            if (tasksError) {
              console.error(
                `Error fetching tasks for collection ${collection.id}:`,
                tasksError
              );
              continue;
            }

            // Update the collection with tasks - ensure proper typing
            setCollections((prevCollections) =>
              prevCollections.map((c) =>
                c.id === collection.id
                  ? {
                      ...c,
                      tasks: Array.isArray(tasks) ? (tasks as Task[]) : [],
                    }
                  : c
              )
            );
          } catch (taskError) {
            console.error(
              `Failed to process tasks for collection ${collection.id}:`,
              taskError
            );
          }

          try {
            // Fetch notes for each collection
            const { data: notes, error: notesError } = await supabase
              .from("note")
              .select("*")
              .eq("collection_id", collection.id)
              .eq("is_deleted", false)
              .order("is_pinned", { ascending: false })
              .order("created_at", { ascending: false });

            if (notesError) {
              console.error(
                `Error fetching notes for collection ${collection.id}:`,
                notesError
              );
              continue;
            }

            // Update the collection with notes - ensure proper typing
            setCollections((prevCollections) =>
              prevCollections.map((c) =>
                c.id === collection.id
                  ? {
                      ...c,
                      notes: Array.isArray(notes) ? (notes as Note[]) : [],
                    }
                  : c
              )
            );
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
  }, [listId, user, refreshTrigger]);

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
        const { data, error } = await supabase
          .from("collection")
          .insert([
            {
              list_id: listData.id,
              collection_name: collectionData.collection_name,
              bg_color_hex: collectionData.bg_color_hex,
              is_default: false, // Regular collections are not default
              user_id: user.id, // Include user_id for RLS policy
            },
          ])
          .select();

        if (error) throw error;

        if (data && data.length > 0) {
          // Add the new collection to the state
          const newCollection: Collection = {
            ...(data[0] as Collection),
            tasks: [],
            notes: [],
            isPinned: false,
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
    [listData, user]
  );

  // Open task modal with specific collection pre-selected
  const openTaskModalForCollection = useCallback((collectionId: string) => {
    setSelectedCollectionId(collectionId);
    setIsTaskModalOpen(true);
  }, []);

  // Open note modal with specific collection pre-selected
  const openNoteModalForCollection = useCallback((collectionId: string) => {
    setSelectedCollectionId(collectionId);
    setIsNoteModalOpen(true);
  }, []);

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

        // Create the task in the database
        const { data, error } = await supabase
          .from("task")
          .insert([
            {
              text: taskData.text,
              description: taskData.description || null,
              is_pinned: taskData.is_pinned || false,
              due_date: taskData.due_date || null,
              collection_id: collectionId,
              list_id: listData.id,
              is_completed: false,
              is_deleted: false,
              user_id: user.id,
            },
          ])
          .select();

        if (error) throw error;

        if (data && data.length > 0) {
          const newTask = data[0] as Task;

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
        const { data, error } = await supabase
          .from("task")
          .update({
            is_completed: isCompleted,
            date_completed: isCompleted ? new Date() : null,
          })
          .eq("id", taskId)
          .select();

        if (error) throw error;

        if (data && data.length > 0) {
          const updatedTask = data[0] as Task;

          // Update the task in the collections state
          if (updatedTask.collection_id) {
            setCollections((prevCollections) =>
              prevCollections.map((collection) => {
                if (collection.id === updatedTask.collection_id) {
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
        const { data, error } = await supabase
          .from("task")
          .update({ is_pinned: isPinned })
          .eq("id", taskId)
          .select();

        if (error) throw error;

        if (data && data.length > 0) {
          const updatedTask = data[0] as Task;

          // Update the task in the collections state
          if (updatedTask.collection_id) {
            setCollections((prevCollections) =>
              prevCollections.map((collection) => {
                if (collection.id === updatedTask.collection_id) {
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
        const { data, error } = await supabase
          .from("task")
          .update({
            text: taskData.text,
            description: taskData.description ?? null,
            due_date: taskData.due_date ?? null,
            is_pinned: taskData.is_pinned,
          })
          .eq("id", taskId)
          .select();

        if (error) throw error;

        if (data && data.length > 0) {
          const updatedTask = data[0] as Task;

          // Update the task in the collections state
          if (updatedTask.collection_id) {
            setCollections((prevCollections) =>
              prevCollections.map((collection) => {
                if (collection.id === updatedTask.collection_id) {
                  return {
                    ...collection,
                    tasks: (collection.tasks || []).map((task) =>
                      task.id === taskId ? updatedTask : task
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
        const { data, error } = await supabase
          .from("note")
          .insert([
            {
              title: noteData.title,
              description: noteData.description || null,
              bg_color_hex: noteData.bg_color_hex,
              collection_id: collectionId,
              is_deleted: false,
              is_pinned: false,
              user_id: user.id, // Include user_id for RLS policy
            },
          ])
          .select();

        if (error) throw error;

        if (data && data.length > 0) {
          const newNote = data[0] as Note;

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
        const { data, error } = await supabase
          .from("note")
          .update({ is_pinned: isPinned })
          .eq("id", noteId)
          .select();

        if (error) throw error;

        if (data && data.length > 0) {
          const updatedNote = data[0] as Note;

          // Update the note in the collections state
          if (updatedNote.collection_id) {
            setCollections((prevCollections) =>
              prevCollections.map((collection) => {
                if (collection.id === updatedNote.collection_id) {
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
        const { data, error } = await supabase
          .from("note")
          .update({ bg_color_hex: color })
          .eq("id", noteId)
          .select();

        if (error) throw error;

        if (data && data.length > 0) {
          const updatedNote = data[0] as Note;

          // Update the note in the collections state
          if (updatedNote.collection_id) {
            setCollections((prevCollections) =>
              prevCollections.map((collection) => {
                if (collection.id === updatedNote.collection_id) {
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

        const { data, error } = await supabase
          .from("note")
          .update(updateData)
          .eq("id", noteId)
          .select();

        if (error) throw error;

        if (data && data.length > 0) {
          const updatedNote = data[0] as Note;

          // Update the note in the collections state
          if (updatedNote.collection_id) {
            setCollections((prevCollections) =>
              prevCollections.map((collection) => {
                if (collection.id === updatedNote.collection_id) {
                  return {
                    ...collection,
                    notes: (collection.notes || []).map((note) =>
                      note.id === noteId ? updatedNote : note
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
        console.error("Error updating note:", err);
        return { success: false, error: err };
      }
    },
    []
  );

  // Handler for note deletion
  // Replace the current handleNoteDelete function in paste-4.txt with this improved version:
  // In ListPage component (paste-4.txt), update the handleNoteDelete function:
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

        // Update is_deleted flag in the database
        const { error } = await supabase
          .from("note")
          .update({ is_deleted: true })
          .eq("id", noteId);

        if (error) throw error;

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

  // Handler for collection pinning
  const handleCollectionPin = useCallback(
    async (collectionId: string, isPinned: boolean) => {
      try {
        // Update local state
        setCollections((prevCollections) =>
          prevCollections.map((collection) =>
            collection.id === collectionId
              ? { ...collection, isPinned }
              : collection
          )
        );

        // In a real implementation, you'd save this to the database
        return { success: true };
      } catch (err) {
        console.error("Error pinning collection:", err);
        return { success: false, error: err };
      }
    },
    []
  );

  // Handler for collections deleted from the DeleteCollectionModal
  const handleCollectionsDeleted = useCallback(() => {
    // Refresh data after collections are deleted
    refreshData();
  }, [refreshData]);

  // Open task modal for specific collection
  const handleAddTask = useCallback(
    (collectionId: string) => {
      openTaskModalForCollection(collectionId);
    },
    [openTaskModalForCollection]
  );

  // Open note modal for specific collection
  const handleAddNote = useCallback(
    (collectionId: string) => {
      openNoteModalForCollection(collectionId);
    },
    [openNoteModalForCollection]
  );

  // Memoized sort function to sort collections by pinned status
  const sortedCollections = useMemo(() => {
    if (!collections) return [];

    return [...collections].sort((a, b) => {
      // First sort by pinned status
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      // Then sort by default status
      if (a.is_default && !b.is_default) return -1;
      if (!a.is_default && b.is_default) return 1;

      // Finally sort by name
      return (a.collection_name || "").localeCompare(b.collection_name || "");
    });
  }, [collections]);

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

  return (
    <main
      className={`transition-all duration-300 
      pt-16 lg:pl-16 min-h-screen w-full
      ${isDark ? "text-gray-200" : "text-gray-800"}
      `}
      style={{
        backgroundColor: isDark ? "#2d3748" : "#FAF9F6",
      }}
    >
      <div className="p-4 md:p-6 box-border">
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
                isDark ? "bg-gray-800 text-red-300" : "bg-white/90 text-red-500"
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
                      ? "bg-gray-800 text-gray-300"
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
                      onNotePin={handleNotePin}
                      onNoteColorChange={handleNoteColorChange}
                      onNoteUpdate={handleNoteUpdate}
                      onNoteDelete={handleNoteDelete}
                      onAddTask={() => handleAddTask(collection.id)}
                      onAddNote={() => handleAddNote(collection.id)}
                      isPinned={collection.isPinned ?? false}
                      onCollectionPin={handleCollectionPin}
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
        </>
      )}
    </main>
  );
}
