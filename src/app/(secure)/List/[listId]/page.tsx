"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Collection, List } from "@/types/schema";
import CollectionComponent from "@/components/Collection/index";
import { FolderPlus } from "lucide-react";
import Navbar from "@/components/Navbar/top-Navbar";
import Sidebar from "@/components/Navbar/sidebar";
import { useTheme } from "@/context/ThemeContext";
import { sampleData, dataUtils } from "@/data/data"; // Make sure the path is correct
import { v4 as uuidv4 } from "uuid"; // Add uuid if not already installed

export default function Page({ params }: { params: { listId: string } }) {
  // Get the listId directly from params
  const { listId } = params;

  const { theme } = useTheme();
  const isDark = theme === "dark";

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

  // Handler for adding a new collection - never set as default
  const handleAddCollection = useCallback(() => {
    if (!listData) return;

    const collectionNumber = listData.collections.length + 1;
    const newCollection: Collection = {
      id: uuidv4(),
      collection_name: `Collection ${collectionNumber}`, // More descriptive name
      background_color: "bg-sky-500", // Default color
      date_created: new Date(),
      is_default: false, // Never set new collections as default
      content_count: 0,
      tasks: [],
      notes: [],
    };

    // Use the utility function from data module
    const updatedList = dataUtils.addCollection(listData, newCollection);
    setListData(updatedList);
  }, [listData]);

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
    <>
      <Navbar />
      <Sidebar />
      <main
        className={`transition-all duration-300 
        md:ml-16 pt-16 min-h-screen w-full
        ${isDark ? "bg-gray-850 text-gray-200" : "bg-gray-50 text-gray-800"}`}
      >
        <div className="p-4 md:p-6">
          <div className="max-w-6xl mx-auto">
            {isLoading ? (
              <div
                className={`text-center py-10 ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                <p className="text-lg">Loading collections...</p>
              </div>
            ) : listData ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h1
                    className={`text-2xl font-bold ${
                      isDark ? "text-gray-100" : "text-gray-800"
                    }`}
                    style={{ color: listData.background_color }}
                  >
                    {listData.name}
                  </h1>
                  <button
                    onClick={handleAddCollection}
                    className={`rounded-md p-2 ${
                      isDark
                        ? "bg-gray-800 text-gray-300 hover:text-orange-400"
                        : "bg-gray-100 text-gray-700 hover:text-orange-500"
                    } transition-colors flex items-center`}
                    aria-label="Add new collection"
                  >
                    <FolderPlus className="h-5 w-5 mr-2" />
                    <span className="hidden sm:inline">Add Collection</span>
                  </button>
                </div>

                {listData.collections.length === 0 ? (
                  <div
                    className={`text-center py-16 ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    <p className="text-lg mb-4">
                      No collections in this list yet.
                    </p>
                    <button
                      onClick={handleAddCollection}
                      className={`px-4 py-2 rounded-md ${
                        isDark
                          ? "bg-orange-600 hover:bg-orange-700 text-white"
                          : "bg-orange-500 hover:bg-orange-600 text-white"
                      }`}
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
                        return a.collection_name.localeCompare(
                          b.collection_name
                        );
                      })
                      .map((collection) => (
                        <CollectionComponent
                          key={collection.id}
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
                      ))}
                  </div>
                )}
              </>
            ) : (
              <div
                className={`text-center py-10 ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                <p className="text-lg">List not found.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
