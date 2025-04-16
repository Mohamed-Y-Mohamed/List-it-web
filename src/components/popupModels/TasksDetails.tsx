"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, Check, Calendar } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Collection } from "@/types/schema";

interface TaskSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  task: {
    id: string;
    text: string;
    description?: string;
    date_created: Date;
    due_date?: Date;
    is_completed: boolean;
    date_completed?: Date;
    is_priority: boolean;
  };
  onComplete: (taskId: string, is_completed: boolean) => void;
  onPriorityChange: (taskId: string, is_priority: boolean) => void;
  onTaskUpdate?: (
    taskId: string,
    taskData: {
      text: string;
      description?: string;
      due_date?: Date;
      is_priority: boolean;
    }
  ) => void;
  collections?: Collection[];
  onCollectionChange?: (taskId: string, collectionId: string) => void;
}

const TaskDetail = ({
  isOpen,
  onClose,
  task,
  onComplete,
  onPriorityChange,
  onTaskUpdate,
  collections,
  onCollectionChange,
}: TaskSidebarProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const sidebarRef = useRef<HTMLDivElement>(null);

  const [taskName, setTaskName] = useState(task.text);
  const [taskDescription, setTaskDescription] = useState(
    task.description || ""
  );
  const [isPriority, setIsPriority] = useState(task.is_priority);
  const [dueDate, setDueDate] = useState(
    task.due_date ? new Date(task.due_date).toISOString().split("T")[0] : ""
  );
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");

  useEffect(() => {
    setTaskName(task.text);
    setTaskDescription(task.description || "");
    setIsPriority(task.is_priority);
    setDueDate(
      task.due_date ? new Date(task.due_date).toISOString().split("T")[0] : ""
    );
  }, [task]);

  const handleSave = () => {
    const hasChanged =
      taskName !== task.text ||
      taskDescription !== (task.description || "") ||
      isPriority !== task.is_priority ||
      (dueDate && new Date(dueDate).toDateString()) !==
        (task.due_date && new Date(task.due_date).toDateString());

    if (hasChanged && onTaskUpdate) {
      onTaskUpdate(task.id, {
        text: taskName,
        description: taskDescription || undefined,
        is_priority: isPriority,
        due_date: dueDate ? new Date(dueDate) : undefined,
      });
    }

    onClose();
  };

  const handlePriorityToggle = () => {
    const newPriority = !isPriority;
    setIsPriority(newPriority);
    onPriorityChange?.(task.id, newPriority);
  };

  const handleCollectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const collectionId = e.target.value;
    setSelectedCollectionId(collectionId);
    onCollectionChange?.(task.id, collectionId);
  };

  const today = new Date().toISOString().split("T")[0];

  if (!isOpen) return null;

  const borderColor = isDark ? "border-gray-700" : "border-gray-200";
  const textColor = isDark ? "text-gray-300" : "text-gray-600";
  const inputBase =
    "w-full p-2 rounded-md border focus:outline-none focus:ring-1";
  const inputStyles = isDark
    ? "bg-gray-700 text-white border-gray-600 focus:border-orange-500 focus:ring-orange-500"
    : "bg-white text-gray-800 border-gray-300 focus:border-blue-500 focus:ring-blue-500";

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end backdrop-blur-md"
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={sidebarRef}
        className={`w-full max-w-md overflow-auto ${isDark ? "bg-gray-800 text-white" : "bg-white text-gray-800"} shadow-xl transform transition-transform duration-300 ease-in-out`}
      >
        <div
          className={`sticky top-0 z-10 flex items-center justify-between p-4 border-b ${borderColor}`}
        >
          <h2 className="text-lg font-semibold">Edit Task</h2>
          <p
            className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
          >
            Created: {task.date_created.toLocaleDateString()}
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              className={`p-2 rounded-full ${isDark ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"}`}
              aria-label="Save and close"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-full ${isDark ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-100 hover:bg-gray-200"}`}
              aria-label="Close without saving"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-6">
          <div>
            <label
              htmlFor="task-name"
              className={`block text-sm font-medium mb-2 ${textColor}`}
            >
              Task Name
            </label>
            <input
              id="task-name"
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className={`${inputBase} ${inputStyles}`}
            />
          </div>

          <div>
            <label
              htmlFor="task-description"
              className={`block text-sm font-medium mb-2 ${textColor}`}
            >
              Description
            </label>
            <textarea
              id="task-description"
              rows={4}
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              className={`${inputBase} ${inputStyles}`}
            />
          </div>

          <div>
            <label
              htmlFor="due-date"
              className={`block text-sm font-medium mb-2 ${textColor}`}
            >
              Due Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-4 w-4 text-gray-400" />
              </div>
              <input
                id="due-date"
                type="date"
                min={today}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`pl-10 pr-3 py-2 ${inputBase} ${inputStyles}`}
              />
            </div>
          </div>

          {collections && collections.length > 0 && (
            <div>
              <label
                htmlFor="collection"
                className={`block text-sm font-medium mb-2 ${textColor}`}
              >
                Collection
              </label>
              <select
                id="collection"
                value={selectedCollectionId}
                onChange={handleCollectionChange}
                className={`${inputBase} ${inputStyles}`}
              >
                <option value="">Select a collection</option>
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.collection_name}
                    {collection.is_default ? " (Default)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            {task.date_completed && (
              <p
                className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
              >
                Completed: {new Date(task.date_completed).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
