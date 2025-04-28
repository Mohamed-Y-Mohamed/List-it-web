"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Calendar } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Collection } from "@/types/schema";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: {
    text: string;
    description: string;
    is_pinned: boolean;
    due_date?: Date;
    collection_id?: number;
  }) => void;
  collections: Collection[];
}

const CreateTaskModal = ({
  isOpen,
  onClose,
  onSubmit,
  collections,
}: CreateTaskModalProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [taskName, setTaskName] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [dueDate, setDueDate] = useState<string>("");
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");

  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get default (General) collection
  const defaultCollection = collections.find((c) => c.is_default);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTaskName("");
      setTaskDescription("");
      setIsPinned(false);
      setDueDate("");
      setSelectedCollectionId("");
    }
  }, [isOpen]);

  // Safely convert ID to number
  const safelyGetCollectionId = () => {
    // If user selected a collection, use that
    if (selectedCollectionId) {
      const parsedId = parseInt(selectedCollectionId, 10);
      if (!isNaN(parsedId)) {
        return parsedId;
      }
    }

    // Otherwise try to use default collection
    if (defaultCollection && defaultCollection.id) {
      if (typeof defaultCollection.id === "number") {
        return defaultCollection.id;
      }

      try {
        const parsedId = parseInt(String(defaultCollection.id), 10);
        if (!isNaN(parsedId)) {
          return parsedId;
        }
      } catch (e) {
        console.error("Failed to parse default collection ID:", e);
      }
    }

    // No valid collection ID found
    return undefined;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskName.trim()) {
      onSubmit({
        text: taskName,
        description: taskDescription,
        is_pinned: isPinned,
        due_date: dueDate ? new Date(dueDate) : undefined,
        collection_id: safelyGetCollectionId(),
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  // Format today's date for the min attribute
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md">
      <div
        ref={modalRef}
        className={`w-full max-w-md rounded-lg ${
          isDark ? "bg-gray-800" : "bg-white"
        } shadow-xl transition-all p-6 mx-4`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            className={`text-xl font-semibold ${
              isDark ? "text-gray-100" : "text-gray-800"
            }`}
          >
            Create New Task
          </h2>
          <button
            onClick={onClose}
            className={`p-1 rounded-full ${
              isDark
                ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="task-name"
              className={`block mb-2 text-sm font-medium ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Task Name
            </label>
            <input
              ref={inputRef}
              type="text"
              id="task-name"
              placeholder="Enter task name"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className={`w-full px-3 py-2 rounded-md border ${
                isDark
                  ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
                  : "bg-white border-gray-300 text-gray-800 placeholder-gray-400"
              } focus:outline-none ${
                isDark ? "focus:border-orange-500" : "focus:border-sky-500"
              }`}
              required
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="task-description"
              className={`block mb-2 text-sm font-medium ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Description (Optional)
            </label>
            <textarea
              id="task-description"
              placeholder="Enter task description"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 rounded-md border ${
                isDark
                  ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
                  : "bg-white border-gray-300 text-gray-800 placeholder-gray-400"
              } focus:outline-none resize-none ${
                isDark ? "focus:border-orange-500" : "focus:border-sky-500"
              }`}
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="due-date"
              className={`block mb-2 text-sm font-medium ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Due Date (Optional)
            </label>
            <div
              className={`relative ${
                isDark ? "text-gray-100" : "text-gray-800"
              }`}
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="date"
                id="due-date"
                min={today}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`w-full pl-10 pr-3 py-2 rounded-md border ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-gray-100"
                    : "bg-white border-gray-300 text-gray-800"
                } focus:outline-none ${
                  isDark ? "focus:border-orange-500" : "focus:border-sky-500"
                }`}
              />
            </div>
          </div>

          <div className="mb-4">
            <label
              htmlFor="collection"
              className={`block mb-2 text-sm font-medium ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Collection (Optional)
            </label>
            <select
              id="collection"
              value={selectedCollectionId}
              onChange={(e) => setSelectedCollectionId(e.target.value)}
              className={`w-full px-3 py-2 rounded-md border ${
                isDark
                  ? "bg-gray-700 border-gray-600 text-gray-100"
                  : "bg-white border-gray-300 text-gray-800"
              } focus:outline-none ${
                isDark ? "focus:border-orange-500" : "focus:border-sky-500"
              }`}
            >
              <option value="">
                {defaultCollection
                  ? `Default (${defaultCollection.collection_name})`
                  : "Select a collection (optional)"}
              </option>
              {collections.map((collection) => (
                <option key={collection.id} value={String(collection.id)}>
                  {collection.collection_name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <div className="flex items-center">
              <input
                id="is-pinned"
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className={`h-4 w-4 rounded ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-orange-500"
                    : "bg-white border-gray-300 text-sky-500"
                }`}
              />
              <label
                htmlFor="is-pinned"
                className={`ml-2 text-sm ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Mark as priority
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-md ${
                isDark
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded-md ${
                isDark
                  ? "bg-orange-600 text-white hover:bg-orange-700"
                  : "bg-sky-500 text-white hover:bg-sky-600"
              }`}
              disabled={!taskName.trim()}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;
