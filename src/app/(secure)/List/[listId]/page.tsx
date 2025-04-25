"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import { Collection, List } from "@/types/schema";
import CollectionComponent from "@/components/Collection/index";
import { useTheme } from "@/context/ThemeContext";
import { sampleData, dataUtils } from "@/data/data";
import { v4 as uuidv4 } from "uuid";

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

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Local state for the current list
  const [listData, setListData] = useState<List | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Effect to fetch list data
  useEffect(() => {
    const fetchListData = async () => {
      setIsLoading(true);

      // Simulate API call with timeout
      setTimeout(() => {
        let retrievedList: List | null = null;

        // Try to get the requested list
        if (listId) {
          retrievedList = dataUtils.getList(listId);
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
  }, [listId]);

  // Callback handlers for task operations
  const handleTaskComplete = useCallback(
    (collectionId: string, taskId: string, isCompleted: boolean) => {
      if (!listData) return;

      // Use the utility function from data module
      const updatedList = dataUtils.updateTaskCompletion(
        listData,
        collectionId,
        taskId,
        isCompleted
      );

      setListData(updatedList);
    },
    [listData]
  );

  const handleTaskPriority = useCallback(
    (collectionId: string, taskId: string, isPriority: boolean) => {
      if (!listData) return;

      // Use the utility function from data module
      const updatedList = dataUtils.updateTaskPriority(
        listData,
        collectionId,
        taskId,
        isPriority
      );

      setListData(updatedList);
    },
    [listData]
  );

  const handleNotePin = useCallback(
    (collectionId: string, noteId: number, isPinned: boolean) => {
      if (!listData) return;

      // Use the utility function from data module
      const updatedList = dataUtils.updateNotePin(
        listData,
        collectionId,
        noteId,
        isPinned
      );

      setListData(updatedList);
    },
    [listData]
  );

  // Handler for creating a new collection
  const handleCreateCollection = useCallback(
    (collectionData: { collection_name: string; background_color: string }) => {
      if (!listData) return;

      const newCollection: Collection = {
        id: uuidv4(),
        collection_name: collectionData.collection_name,
        background_color: collectionData.background_color,
        date_created: new Date(),
        is_default: false, // Never set new collections as default
        content_count: 0,
        tasks: [],
        notes: [],
      };

      // Use the utility function from data module
      const updatedList = dataUtils.addCollection(listData, newCollection);
      setListData(updatedList);
    },
    [listData]
  );

  // Handler for creating a new task
  const handleCreateTask = useCallback(
    (taskData: {
      text: string;
      description: string;
      is_priority: boolean;
      due_date?: Date;
      collection_id?: string;
    }) => {
      if (!listData) return;

      const newTask = {
        id: uuidv4(),
        text: taskData.text,
        description: taskData.description || "",
        date_created: new Date(),
        due_date: taskData.due_date,
        is_completed: false,
        is_priority: taskData.is_priority,
      };

      // Find the target collection (default to General if not specified)
      const collectionId =
        taskData.collection_id ||
        listData.collections.find((c) => c.is_default)?.id ||
        listData.collections[0]?.id;

      if (!collectionId) return;

      // Use the utility function from data module
      const updatedList = dataUtils.addTask(listData, collectionId, newTask);
      setListData(updatedList);
    },
    [listData]
  );

  // Handler for creating a new note
  const handleCreateNote = useCallback(
    (noteData: {
      text: string;
      background_color: string;
      collection_id?: string;
    }) => {
      if (!listData) return;

      const newNote = {
        note_id: Date.now(), // Simple ID generation
        text: noteData.text,
        date_created: new Date(),
        is_deleted: false,
        background_color: noteData.background_color,
        is_pinned: false,
      };

      // Find the target collection (default to General if not specified)
      const collectionId =
        noteData.collection_id ||
        listData.collections.find((c) => c.is_default)?.id ||
        listData.collections[0]?.id;

      if (!collectionId) return;

      // Use the utility function from data module
      const updatedList = dataUtils.addNote(listData, collectionId, newNote);
      setListData(updatedList);
    },
    [listData]
  );

  // Handlers for adding tasks and notes to specific collections
  const getAddTaskHandler = useCallback(
    (collectionId: string) => {
      return () => {
        if (!listData) return;

        const newTask = {
          id: uuidv4(),
          text: "New Task",
          description: "",
          date_created: new Date(),
          is_completed: false,
          is_priority: false,
        };

        const updatedList = dataUtils.addTask(listData, collectionId, newTask);
        setListData(updatedList);
      };
    },
    [listData]
  );

  const getAddNoteHandler = useCallback(
    (collectionId: string) => {
      return () => {
        if (!listData) return;

        const newNote = {
          note_id: Date.now(), // Simple ID generation
          text: "New Note",
          date_created: new Date(),
          is_deleted: false,
          background_color: "bg-yellow-50",
          is_pinned: false,
        };

        const updatedList = dataUtils.addNote(listData, collectionId, newNote);
        setListData(updatedList);
      };
    },
    [listData]
  );

  return (
    // Updated main container with modern background styling inspired by Swift UI
    <main
      className={`transition-all duration-300 
  pt-16 pl-20 min-h-screen w-full
  ${isDark ? "text-gray-200" : "text-gray-800"}
  `}
      style={{
        background: isDark
          ? "linear-gradient(135deg, #1a202c 0%, #2d3748 100%)"
          : "linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)",
      }}
    >
      <div className="p-4 md:p-6 box-border">
        <div className={`max-w-6xl mx-auto`}>
          {/* Content goes here - moved inside a semi-transparent container */}
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
              <div className="flex items-center justify-between mb-6 px-4">
                <h1
                  className={`text-2xl font-bold truncate mr-2 ${
                    isDark ? "text-gray-100" : "text-gray-800"
                  }`}
                  style={{ color: listData.background_color }}
                >
                  {listData.name}
                </h1>
                <div className="flex-shrink-0">
                  <ListFilterPlus
                    onCreateCollection={() => setIsCollectionModalOpen(true)}
                    onCreateTask={() => setIsTaskModalOpen(true)}
                    onCreateNote={() => setIsNoteModalOpen(true)}
                  />
                </div>
              </div>

              {listData.collections.length === 0 ? (
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
                  {/* Sort collections to show default General collection first */}
                  {listData.collections
                    .sort((a, b) => {
                      // Default collection (General) comes first
                      if (a.is_default && !b.is_default) return -1;
                      if (!a.is_default && b.is_default) return 1;
                      // Then sort by name
                      return a.collection_name.localeCompare(b.collection_name);
                    })
                    .map((collection) => (
                      <div
                        key={collection.id}
                        className={`
                      rounded-xl overflow-hidden
                      ${isDark ? "bg-black/70" : "bg-white/90"}
                      shadow-md
                      border-l-4
                    `}
                        style={{ borderLeftColor: collection.background_color }}
                      >
                        <CollectionComponent
                          id={collection.id}
                          collection_name={collection.collection_name}
                          background_color={collection.background_color}
                          date_created={collection.date_created}
                          is_default={collection.is_default}
                          content_count={collection.content_count}
                          tasks={collection.tasks || []}
                          notes={collection.notes || []}
                          onTaskComplete={(taskId, isCompleted) =>
                            handleTaskComplete(
                              collection.id,
                              taskId,
                              isCompleted
                            )
                          }
                          onTaskPriority={(taskId, isPriority) =>
                            handleTaskPriority(
                              collection.id,
                              taskId,
                              isPriority
                            )
                          }
                          onNotePin={(noteId, isPinned) =>
                            handleNotePin(collection.id, noteId, isPinned)
                          }
                          onAddTask={getAddTaskHandler(collection.id)}
                          onAddNote={getAddNoteHandler(collection.id)}
                        />
                      </div>
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

      {/* Modal Components - Updated with iOS-inspired styling */}
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
              collections={listData.collections}
            />

            <CreateNoteModal
              isOpen={isNoteModalOpen}
              onClose={() => setIsNoteModalOpen(false)}
              onSubmit={handleCreateNote}
              collections={listData.collections}
            />
          </div>
        </>
      )}
    </main>
  );
}
