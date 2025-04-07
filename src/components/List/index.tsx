"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import type { Collection, List } from "@/types/schema";
import CollectionComponent from "@/components/Collection/index";
import { FolderPlus } from "lucide-react";

interface ListComponentProps {
  list: List;
  onAddCollection?: () => void;
}

const List = ({ list, onAddCollection }: ListComponentProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [collections, setCollections] = useState<Collection[]>(
    list.collections
  );

  // Update collections when list changes
  useEffect(() => {
    setCollections(list.collections);
  }, [list]);

  // Handlers for tasks
  const handleTaskComplete = (
    collectionId: string,
    taskId: string,
    is_completed: boolean
  ) => {
    setCollections((prevCollections) =>
      prevCollections.map((collection) =>
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
      )
    );
  };

  const handleTaskPriority = (
    collectionId: string,
    taskId: string,
    is_priority: boolean
  ) => {
    setCollections((prevCollections) =>
      prevCollections.map((collection) =>
        collection.id === collectionId
          ? {
              ...collection,
              tasks: collection.tasks?.map((task) =>
                task.id === taskId ? { ...task, is_priority } : task
              ),
            }
          : collection
      )
    );
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h1
          className={`text-2xl font-bold ${
            isDark ? "text-gray-100" : "text-gray-800"
          }`}
          style={{ color: list.background_color }}
        >
          {list.name}
        </h1>
        <button
          onClick={onAddCollection}
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

      {collections.length === 0 ? (
        <div
          className={`text-center py-16 ${
            isDark ? "text-gray-400" : "text-gray-500"
          }`}
        >
          <p className="text-lg mb-4">No collections in this list yet.</p>
          <button
            onClick={onAddCollection}
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
          {collections.map((collection) => (
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
                handleTaskComplete(collection.id, taskId, is_completed)
              }
              onTaskPriority={(taskId, is_priority) =>
                handleTaskPriority(collection.id, taskId, is_priority)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default List;
