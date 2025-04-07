"use client";

import React, { useState, useEffect } from "react";
import { Collection, List } from "@/types/schema";
import CollectionComponent from "@/components/Collection/index";
import { FolderPlus } from "lucide-react";
import Navbar from "@/components/Navbar/top-Navbar";
import Sidebar from "@/components/Navbar/sidebar";
import { useTheme } from "@/context/ThemeContext";
// Define the sample data with a typed index signature
const sampleListData: {
  [key: string]: List;
} = {
  "1": {
    id: "1",
    name: "Work",
    background_color: "#4F46E5",
    date_created: new Date("2025-01-15"),
    is_default: true,
    collections: [
      {
        id: "work-1",
        collection_name: "Projects",
        background_color: "bg-blue-500",
        date_created: new Date("2025-01-15"),
        is_default: true,
        content_count: 3,
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
      },
      {
        id: "work-2",
        collection_name: "Meetings",
        background_color: "bg-purple-500",
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
      },
    ],
  },
  "2": {
    id: "2",
    name: "Personal",
    background_color: "#10B981",
    date_created: new Date("2025-01-20"),
    is_default: false,
    collections: [
      {
        id: "personal-1",
        collection_name: "Home",
        background_color: "bg-green-500",
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
            description: "Pay electricity and water bills before the due date",
            date_created: new Date("2025-02-14"),
            due_date: new Date("2025-02-20"),
            is_completed: false,
            is_priority: false,
          },
        ],
      },
    ],
  },
  "3": {
    id: "3",
    name: "Shopping",
    background_color: "#F59E0B",
    date_created: new Date("2025-01-25"),
    is_default: false,
    collections: [
      {
        id: "shopping-1",
        collection_name: "General",
        background_color: "bg-yellow-500",
        date_created: new Date("2025-01-25"),
        is_default: true,
        content_count: 0,
        tasks: [],
      },
    ],
  },
};

export default function ListPage({ params }: { params: { listId: string } }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [listData, setListData] = useState<List | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate fetching list data from API
  useEffect(() => {
    const fetchListData = async () => {
      setIsLoading(true);
      try {
        // In a real app, you would fetch from an API
        setTimeout(() => {
          const listId = params?.listId;
          console.log("Current listId:", listId);

          if (listId && sampleListData[listId]) {
            setListData(sampleListData[listId]);
          } else {
            // Default to first list if ID isn't found
            const firstListId = Object.keys(sampleListData)[0];
            console.log("Falling back to:", firstListId);
            setListData(sampleListData[firstListId]);
          }
          setIsLoading(false);
        }, 500);
      } catch (error) {
        console.error("Error fetching list data:", error);
        setIsLoading(false);
      }
    };

    fetchListData();
  }, [params?.listId]);

  // Handlers for tasks
  const handleTaskComplete = (
    collectionId: string,
    taskId: string,
    is_completed: boolean
  ) => {
    if (!listData) return;

    setListData({
      ...listData,
      collections: listData.collections.map((collection) =>
        collection.id === collectionId
          ? {
              ...collection,
              tasks: collection.tasks?.map((task) =>
                task.id === taskId
                  ? {
                      ...task,
                      is_completed,
                      date_completed: is_completed ? new Date() : undefined,
                    }
                  : task
              ),
            }
          : collection
      ),
    });
  };

  const handleTaskPriority = (
    collectionId: string,
    taskId: string,
    is_priority: boolean
  ) => {
    if (!listData) return;

    setListData({
      ...listData,
      collections: listData.collections.map((collection) =>
        collection.id === collectionId
          ? {
              ...collection,
              tasks: collection.tasks?.map((task) =>
                task.id === taskId ? { ...task, is_priority } : task
              ),
            }
          : collection
      ),
    });
  };

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
                    {listData.collections.map((collection) => (
                      <CollectionComponent
                        key={collection.id}
                        id={collection.id}
                        collection_name={collection.collection_name}
                        background_color={collection.background_color}
                        date_created={collection.date_created}
                        is_default={collection.is_default}
                        content_count={collection.content_count}
                        tasks={collection.tasks}
                        onTaskComplete={(taskId, is_completed) =>
                          handleTaskComplete(
                            collection.id,
                            taskId,
                            is_completed
                          )
                        }
                        onTaskPriority={(taskId, is_priority) =>
                          handleTaskPriority(collection.id, taskId, is_priority)
                        }
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
