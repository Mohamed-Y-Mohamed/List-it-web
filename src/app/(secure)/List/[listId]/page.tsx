"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import { Collection, List, Task, Note } from "@/types/schema";
import CollectionComponent from "@/components/Collection/index";
import { useTheme } from "@/context/ThemeContext";
import { dataUtils } from "@/data/data";

// Import our components
import ListFilterPlus from "@/components/popupModels/ListFilter";
import CreateCollectionModal from "@/components/popupModels/CollectionPopup";
import CreateTaskModal from "@/components/popupModels/TaskPopup";
import CreateNoteModal from "@/components/popupModels/notepopup";

export default function ListPage({
  params,
}: {
  params: Promise<{ listId: string }>;
}) {
  const { listId } = use(params); // ✅ unwrapped properly

  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [isMobile, setIsMobile] = useState(false);

  // State for modals
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

  // Local state for the current list
  const [listData, setListData] = useState<List | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  // Effect to fetch list data
  useEffect(() => {
    const fetchListData = async () => {
      setIsLoading(true);

      // Simulate API call with timeout
      setTimeout(() => {
        let retrievedList: List | null = null;

        // Try to get the requested list
        if (listId) {
          const listIdNumber = Number(listId);
          retrievedList = dataUtils.getList(listIdNumber);
        }

        // If list not found, get the first list
        if (!retrievedList) {
          const firstListId = dataUtils.getFirstListId();
          if (firstListId) {
            retrievedList = dataUtils.getList(firstListId);
          }
        }

        // If we have a list, ensure it has a General collection that is default
        if (retrievedList) {
          retrievedList = dataUtils.ensureGeneralCollection(retrievedList);
        }

        setListData(retrievedList);
        setIsLoading(false);
      }, 300);
    };

    fetchListData();
  }, [listId, refreshTrigger]); // Add refreshTrigger dependency to re-fetch data

  // Safely get collections array from list data
  const getCollections = useCallback(() => {
    return listData?.collections || [];
  }, [listData]);

  // Find default collection safely
  const getDefaultCollection = useCallback(() => {
    const collections = getCollections();
    return collections.find((c) => c.is_default);
  }, [getCollections]);

  // Find collection by ID safely
  const getFirstCollection = useCallback(() => {
    const collections = getCollections();
    return collections.length > 0 ? collections[0] : null;
  }, [getCollections]);

  // Safely find an appropriate collection ID
  const getAppropriateCollectionId = useCallback(
    (specifiedId?: number) => {
      if (specifiedId !== undefined) return specifiedId;

      const defaultCollection = getDefaultCollection();
      if (defaultCollection?.id) return defaultCollection.id;

      const firstCollection = getFirstCollection();
      if (firstCollection?.id) return firstCollection.id;

      return null;
    },
    [getDefaultCollection, getFirstCollection]
  );

  // Function to trigger a data refresh
  const refreshData = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Callback handlers for task operations
  const handleTaskComplete = useCallback(
    (collectionId: number, taskId: number, isCompleted: boolean) => {
      if (!listData) return;

      // Update the task directly
      dataUtils.updateTaskCompletion(
        listData.id,
        collectionId,
        taskId,
        isCompleted
      );

      refreshData();
    },
    [listData, refreshData]
  );

  const handleTaskPriority = useCallback(
    (collectionId: number, taskId: number, isPinned: boolean) => {
      if (!listData) return;

      // Update the task directly
      dataUtils.updateTaskPin(listData.id, collectionId, taskId, isPinned);

      refreshData();
    },
    [listData, refreshData]
  );

  const handleNotePin = useCallback(
    (collectionId: number, noteId: number, isPinned: boolean) => {
      if (!listData) return;

      // Update the note directly
      dataUtils.updateNote(noteId, collectionId, {
        is_pinned: isPinned,
      });

      refreshData();
    },
    [listData, refreshData]
  );

  // Handler for creating a new collection
  const handleCreateCollection = useCallback(
    (collectionData: { collection_name: string; bg_color_hex: string }) => {
      if (!listData) return;

      const newCollection: Collection = {
        id: Date.now(), // Generate a unique ID
        list_id: listData.id, // Make sure to include list_id
        created_at: new Date(),
        collection_name: collectionData.collection_name,
        bg_color_hex: collectionData.bg_color_hex,
        is_default: false,
        content_count: 0,
        tasks: [],
        notes: [],
      };

      // Add the collection to the data store
      dataUtils.addCollection(listData.id, newCollection);

      // Explicitly force a refresh
      refreshData();
    },
    [listData, refreshData]
  );

  // Handler for creating a new task
  const handleCreateTask = useCallback(
    (taskData: {
      text: string;
      description: string;
      is_pinned: boolean;
      due_date?: Date;
      collection_id?: number;
    }) => {
      if (!listData) return;

      // Find the target collection
      const collectionId = getAppropriateCollectionId(taskData.collection_id);
      if (!collectionId) return;

      const newTask: Task = {
        id: Date.now(), // Generate a unique ID
        list_id: listData.id, // Include the required list_id property
        collection_id: collectionId,
        text: taskData.text,
        description: taskData.description || "",
        created_at: new Date(),
        due_date: taskData.due_date,
        is_completed: false,
        is_deleted: false,
        is_pinned: taskData.is_pinned,
      };

      // Add the task to the data store
      dataUtils.addTask(collectionId, newTask);

      console.log("Created task:", newTask);

      // Explicitly force a refresh
      refreshData();
    },
    [listData, getAppropriateCollectionId, refreshData]
  );

  // Handler for creating a new note
  const handleCreateNote = useCallback(
    (noteData: {
      title: string;
      bg_color_hex: string;
      collection_id?: number;
    }) => {
      if (!listData) return;

      // Find the target collection
      const collectionId = getAppropriateCollectionId(noteData.collection_id);
      if (!collectionId) return;

      const newNote: Note = {
        id: Date.now(), // Generate a unique ID
        collection_id: collectionId,
        title: noteData.title,
        created_at: new Date(),
        is_deleted: false,
        bg_color_hex: noteData.bg_color_hex,
        is_pinned: false,
      };

      // Add the note to the data store
      dataUtils.addNote(collectionId, newNote);

      console.log("Created note:", newNote);

      // Explicitly force a refresh
      refreshData();
    },
    [listData, getAppropriateCollectionId, refreshData]
  );

  // Handlers for adding tasks and notes to specific collections
  const getAddTaskHandler = useCallback(
    (collectionId: number) => {
      return () => {
        if (!listData) return;

        const newTask: Task = {
          id: Date.now(),
          list_id: listData.id, // Include the required list_id property
          collection_id: collectionId,
          text: "New Task",
          description: "",
          created_at: new Date(),
          is_completed: false,
          is_deleted: false,
          is_pinned: false,
        };

        // Add the task to the data store
        dataUtils.addTask(collectionId, newTask);

        // Explicitly force a refresh
        refreshData();
      };
    },
    [listData, refreshData]
  );

  const getAddNoteHandler = useCallback(
    (collectionId: number) => {
      return () => {
        if (!listData) return;

        const newNote: Note = {
          id: Date.now(),
          collection_id: collectionId,
          title: "New Note",
          created_at: new Date(),
          is_deleted: false,
          bg_color_hex: "#FFD60A",
          is_pinned: false,
        };

        // Add the note to the data store
        dataUtils.addNote(collectionId, newNote);

        // Explicitly force a refresh
        refreshData();
      };
    },
    [listData, refreshData]
  );

  // Safe collection handler for pinning
  const handleCollectionPin = useCallback(
    (collectionId: number, isPinned: boolean) => {
      if (!listData) return;

      // Update the collection in the data store
      dataUtils.updateCollection(listData.id, collectionId, { isPinned });

      // Explicitly force a refresh
      refreshData();
    },
    [listData, refreshData]
  );

  // Get collections safely for UI rendering
  const collections = getCollections();

  return (
    <main
      className={`transition-all duration-300 
  pt-16 pl-20 min-h-screen w-full
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
                  ? "bg-black/70 text-gray-300"
                  : "bg-white/90 text-gray-500"
              } shadow-md border-l-4 border-orange-500`}
            >
              <p className="text-lg">Loading collections...</p>
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
                      ? "bg-black/70 text-gray-300"
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
                  {collections
                    .sort((a, b) => {
                      // Default collection (General) comes first
                      if (a.is_default && !b.is_default) return -1;
                      if (!a.is_default && b.is_default) return 1;
                      // Then sort by name
                      return a.collection_name.localeCompare(b.collection_name);
                    })
                    .map((collection) => (
                      <CollectionComponent
                        key={collection.id}
                        id={collection.id}
                        collection_name={collection.collection_name}
                        bg_color_hex={collection.bg_color_hex}
                        created_at={collection.created_at}
                        is_default={collection.is_default}
                        content_count={collection.content_count || 0}
                        tasks={collection.tasks || []}
                        notes={collection.notes || []}
                        onTaskComplete={(taskId, isCompleted) =>
                          handleTaskComplete(collection.id, taskId, isCompleted)
                        }
                        onTaskPriority={(taskId, isPinned) =>
                          handleTaskPriority(collection.id, taskId, isPinned)
                        }
                        onNotePin={(noteId, isPinned) =>
                          handleNotePin(collection.id, noteId, isPinned)
                        }
                        onAddTask={getAddTaskHandler(collection.id)}
                        onAddNote={getAddNoteHandler(collection.id)}
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
                  ? "bg-black/70 text-gray-300"
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
          <div className="ios-modal-container">
            <CreateCollectionModal
              isOpen={isCollectionModalOpen}
              onClose={() => setIsCollectionModalOpen(false)}
              onSubmit={handleCreateCollection}
            />

            <CreateTaskModal
              isOpen={isTaskModalOpen}
              onClose={() => setIsTaskModalOpen(false)}
              onSubmit={handleCreateTask}
              collections={collections}
            />

            <CreateNoteModal
              isOpen={isNoteModalOpen}
              onClose={() => setIsNoteModalOpen(false)}
              onSubmit={handleCreateNote}
              collections={collections}
            />
          </div>
        </>
      )}
    </main>
  );
}
