"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Collection, List, Task, Note } from "@/types/schema";
import CollectionComponent from "@/components/Collection/index";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/utils/client";
import { useAuth } from "@/context/AuthContext";

// Import our components
import ListFilterPlus from "@/components/popupModels/ListFilter";
import CreateCollectionModal from "@/components/popupModels/CollectionPopup";
import CreateTaskModal from "@/components/popupModels/TaskPopup";
import CreateNoteModal from "@/components/popupModels/notepopup";

// Add a handler for task deletion
const handleTaskDelete = async (taskId: number) => {
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

  // Local state for the current list
  const [listData, setListData] = useState<List | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Effect to fetch list data
  useEffect(() => {
    const fetchListData = async () => {
      if (!listId || !user) return;

      setIsLoading(true);
      setError(null);

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

        setListData(listData);

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
            is_default
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
          isPinned: false, // Default value
        }));

        setCollections(collectionsWithData);

        // Fetch tasks for each collection
        for (const collection of collectionsWithData) {
          const { data: tasks, error: tasksError } = await supabase
            .from("task")
            .select("*")
            .eq("collection_id", collection.id)
            .eq("is_deleted", false)
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

          // Fetch notes for each collection (similar approach)
          const { data: notes, error: notesError } = await supabase
            .from("note")
            .select("*")
            .eq("collection_id", collection.id)
            .eq("is_deleted", false)
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
      if (!listData || !user) return;

      try {
        // Insert the new collection
        const { data, error } = await supabase
          .from("collection")
          .insert([
            {
              list_id: listData.id,
              collection_name: collectionData.collection_name,
              bg_color_hex: collectionData.bg_color_hex,
              is_default: false,
            },
          ])
          .select();

        if (error) throw error;

        if (data && data.length > 0) {
          // Add the new collection to the state
          const newCollection: Collection = {
            ...data[0],
            tasks: [],
            notes: [],
            isPinned: false,
          };

          setCollections((prev) => [...prev, newCollection]);
        }
      } catch (err) {
        console.error("Error creating collection:", err);
      }
    },
    [listData, user]
  );

  // Handler for creating a new task
  const handleTaskSubmit = useCallback(
    async (taskData: {
      text: string;
      description: string;
      is_pinned: boolean;
      due_date?: Date;
      collection_id?: number;
    }) => {
      if (!listData || !user) return;

      try {
        // Create the task in the database
        const { data, error } = await supabase
          .from("task")
          .insert([
            {
              text: taskData.text,
              description: taskData.description || null,
              is_pinned: taskData.is_pinned || false,
              due_date: taskData.due_date || null,
              collection_id: taskData.collection_id || null,
              list_id: listData.id,
              is_completed: false,
              is_deleted: false,
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
                  return {
                    ...collection,
                    tasks: [newTask, ...(collection.tasks || [])],
                  };
                }
                return collection;
              })
            );
          }
        }
      } catch (err) {
        console.error("Error creating task:", err);
      }
    },
    [listData, user]
  );

  // Handler for task completion
  const handleTaskComplete = useCallback(
    async (taskId: number, isCompleted: boolean) => {
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
        }
      } catch (err) {
        console.error("Error completing task:", err);
      }
    },
    []
  );

  // Handler for task priority
  const handleTaskPriority = useCallback(
    async (taskId: number, isPinned: boolean) => {
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
        }
      } catch (err) {
        console.error("Error updating task priority:", err);
      }
    },
    []
  );

  // Handler for task updates
  const handleTaskUpdate = useCallback(
    async (
      taskId: number,
      taskData: {
        text: string;
        description?: string | null; // Add null here
        due_date?: Date | null; // Add null here
        is_pinned: boolean;
      }
    ) => {
      try {
        // Update the task in the database
        const { data, error } = await supabase
          .from("task")
          .update({
            text: taskData.text,
            description: taskData.description ?? null, // Use null coalescing
            due_date: taskData.due_date ?? null, // Use null coalescing
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
        }
      } catch (err) {
        console.error("Error updating task:", err);
      }
    },
    []
  );

  // Handler for task deletion that updates UI state
  const handleTaskDeleteWithUIUpdate = useCallback(async (taskId: number) => {
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
    } catch (err) {
      console.error("Error handling task deletion:", err);
    }
  }, []);

  // Handler for note pinning
  const handleNotePin = useCallback((noteId: number, isPinned: boolean) => {
    // This will be implemented later
    console.log("Note pinned:", noteId, isPinned);
  }, []);

  // Handler for collection pinning
  const handleCollectionPin = useCallback(
    async (collectionId: number, isPinned: boolean) => {
      // Update local state
      setCollections((prevCollections) =>
        prevCollections.map((collection) =>
          collection.id === collectionId
            ? { ...collection, isPinned }
            : collection
        )
      );

      // In a real implementation, you'd save this to the database
      console.log("Collection pinned:", collectionId, isPinned);
    },
    []
  );

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
                <p className="text-lg">Loading collections...</p>
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
                  style={{ color: listData.bg_color_hex }}
                >
                  {listData.list_name}
                </h1>
                <div className="flex-shrink-0">
                  <ListFilterPlus
                    onCreateCollection={() => setIsCollectionModalOpen(true)}
                    onCreateTask={() => setIsTaskModalOpen(true)}
                    onCreateNote={() => setIsNoteModalOpen(true)}
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
                    } shadow-md`}
                  >
                    Create your first collection
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Collection components */}
                  {collections.map((collection) => (
                    <CollectionComponent
                      key={collection.id}
                      id={collection.id}
                      collection_name={collection.collection_name}
                      bg_color_hex={collection.bg_color_hex}
                      created_at={collection.created_at}
                      is_default={collection.is_default || false}
                      tasks={collection.tasks || []}
                      notes={collection.notes || []}
                      onTaskComplete={handleTaskComplete}
                      onTaskPriority={handleTaskPriority}
                      onTaskUpdate={handleTaskUpdate}
                      onTaskDelete={handleTaskDeleteWithUIUpdate}
                      onNotePin={handleNotePin}
                      onAddTask={() =>
                        console.log("Add task to collection", collection.id)
                      }
                      onAddNote={() =>
                        console.log("Add note to collection", collection.id)
                      }
                      isPinned={collection.isPinned || false}
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
            onClose={() => setIsCollectionModalOpen(false)}
            onSubmit={handleCreateCollection}
          />

          {/* Task Modal - Now fully functional */}
          <CreateTaskModal
            isOpen={isTaskModalOpen}
            onClose={() => setIsTaskModalOpen(false)}
            onSubmit={handleTaskSubmit}
            collections={collections}
          />

          <CreateNoteModal
            isOpen={isNoteModalOpen}
            onClose={() => setIsNoteModalOpen(false)}
            onSubmit={() => {}}
            collections={collections}
          />
        </>
      )}
    </main>
  );
}
