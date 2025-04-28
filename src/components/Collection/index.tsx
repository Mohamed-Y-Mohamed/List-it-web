"use client";

import React, { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  ClipboardList,
  StickyNote,
  Pin,
} from "lucide-react";
import TaskCard from "@/components/Tasks/index";
import NoteCard from "@/components/Notes/noteCard";
import { Task, Note, Collection } from "@/types/schema";
import { useTheme } from "@/context/ThemeContext";

interface CollectionComponentProps {
  id: number;
  collection_name: string;
  bg_color_hex: string;
  created_at: Date;
  is_default?: boolean;
  content_count?: number;
  tasks?: Task[];
  notes?: Note[];
  allCollections?: Collection[];
  onTaskComplete: (taskId: number, is_completed: boolean) => void;
  onTaskPriority: (taskId: number, is_pinned: boolean) => void;
  onTaskUpdate?: (
    taskId: number,
    taskData: {
      text: string;
      description?: string;
      due_date?: Date;
      is_pinned: boolean;
    }
  ) => void;
  onTaskCollectionChange?: (taskId: number, collectionId: number) => void;
  onNotePin?: (noteId: number, isPinned: boolean) => void;
  onNoteColorChange?: (noteId: number, color: string) => void;
  onNoteUpdate?: (noteId: number, updatedText: string) => void;
  onAddTask?: () => void;
  onAddNote?: () => void;
  className?: string;
  isPinned?: boolean;
  onCollectionPin?: (collectionId: number, isPinned: boolean) => void;
}

const CollectionComponent = ({
  id,
  collection_name,
  bg_color_hex,
  created_at,
  is_default = false,
  tasks = [],
  notes = [],
  onTaskComplete,
  onTaskPriority,
  onNotePin,
  onNoteColorChange,
  onNoteUpdate,
  onAddTask,
  onAddNote,
  className = "",
  isPinned = false,
  onCollectionPin,
}: CollectionComponentProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<"tasks" | "notes">("tasks");
  const [priorityTasks, setPriorityTasks] = useState<Task[]>([]);
  const [regularTasks, setRegularTasks] = useState<Task[]>([]);
  const [sortedNotes, setSortedNotes] = useState<Note[]>([]);

  // Color utilities
  const bgColor = isDark ? "bg-gray-800" : "bg-white";
  const textColor = isDark ? "text-white" : "text-gray-800";
  const subtextColor = isDark ? "text-gray-400" : "text-gray-600";
  const borderColor = isDark ? "border-gray-700" : "border-gray-200";
  const hoverColor = isDark ? "hover:bg-gray-700" : "hover:bg-gray-50";

  useEffect(() => {
    // Sort tasks
    setPriorityTasks(tasks.filter((task) => task.is_pinned));
    setRegularTasks(tasks.filter((task) => !task.is_pinned));
  }, [tasks]);

  useEffect(() => {
    // Sort notes
    const activeNotes = notes?.filter((note) => !note.is_deleted) || [];
    const sorted = [...activeNotes].sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
    setSortedNotes(sorted);
  }, [notes]);

  // Calculate task and note counts
  const taskCount = tasks?.length || 0;
  const noteCount = notes?.filter((note) => !note.is_deleted).length || 0;

  const handlePinToggle = () => {
    if (onCollectionPin) {
      onCollectionPin(id, !isPinned);
    }
  };

  return (
    <div className={`${className} rounded-lg overflow-hidden shadow-md`}>
      {/* Collection Header */}
      <div
        className={`${bgColor} border-l-4`}
        style={{ borderLeftColor: bg_color_hex }}
      >
        <div
          className="flex items-center p-4 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {/* Icon with collection color */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
            style={{ backgroundColor: bg_color_hex }}
          >
            <ClipboardList className="h-4 w-4 text-white" />
          </div>

          {/* Collection title and info */}
          <div className="flex-1 min-w-0">
            <h3 className={`font-medium ${textColor} truncate`}>
              {collection_name}
            </h3>
            <p className={`text-xs ${subtextColor}`}>
              {taskCount > 0
                ? `${taskCount} task${taskCount !== 1 ? "s" : ""}`
                : "No tasks"}
              {noteCount > 0 &&
                `, ${noteCount} note${noteCount !== 1 ? "s" : ""}`}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            {onCollectionPin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePinToggle();
                }}
                className={`p-1.5 rounded-full ${hoverColor}`}
              >
                <Pin
                  className={`h-4 w-4 ${isPinned ? "text-orange-500" : subtextColor}`}
                  fill={isPinned ? "currentColor" : "none"}
                />
              </button>
            )}

            <button
              className={`p-1.5 rounded-full ${subtextColor} ${hoverColor}`}
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Tabs */}
        {isExpanded && (
          <div className={`flex border-t ${borderColor}`}>
            <button
              className={`flex-1 py-2.5 px-4 text-sm font-medium transition-all relative ${
                activeTab === "tasks" ? textColor : `${subtextColor}`
              }`}
              onClick={() => setActiveTab("tasks")}
            >
              <div className="flex items-center justify-center space-x-1">
                <ClipboardList className="h-4 w-4" />
                <span>Tasks ({taskCount})</span>
              </div>
              {activeTab === "tasks" && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: bg_color_hex }}
                />
              )}
            </button>

            <button
              className={`flex-1 py-2.5 px-4 text-sm font-medium transition-all relative ${
                activeTab === "notes" ? textColor : `${subtextColor}`
              }`}
              onClick={() => setActiveTab("notes")}
            >
              <div className="flex items-center justify-center space-x-1">
                <StickyNote className="h-4 w-4" />
                <span>Notes ({noteCount})</span>
              </div>
              {activeTab === "notes" && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: bg_color_hex }}
                />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Collection Content */}
      {isExpanded && (
        <div className={`${bgColor} p-4`}>
          {activeTab === "tasks" && (
            <div className="space-y-3">
              {/* Priority Tasks Section */}
              {priorityTasks.length > 0 && (
                <>
                  <div className="space-y-2">
                    {priorityTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        {...task}
                        onComplete={onTaskComplete}
                        onPriorityChange={onTaskPriority}
                      />
                    ))}
                  </div>
                  {regularTasks.length > 0 && (
                    <div className={`border-t ${borderColor} pt-2 my-3`}></div>
                  )}
                </>
              )}

              {/* Regular Tasks Section */}
              {regularTasks.length > 0 ? (
                <div className="space-y-2">
                  {regularTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      {...task}
                      onComplete={onTaskComplete}
                      onPriorityChange={onTaskPriority}
                    />
                  ))}
                </div>
              ) : (
                priorityTasks.length === 0 && (
                  <div className={`text-center py-6 ${subtextColor} text-sm`}>
                    No tasks in this collection
                  </div>
                )
              )}
            </div>
          )}

          {activeTab === "notes" && (
            <>
              {sortedNotes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {sortedNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      id={note.id}
                      title={note.title}
                      created_at={note.created_at}
                      is_deleted={note.is_deleted}
                      bg_color_hex={note.bg_color_hex}
                      is_pinned={note.is_pinned}
                      onPinChange={onNotePin}
                      onColorChange={onNoteColorChange}
                      onNoteUpdate={onNoteUpdate}
                    />
                  ))}
                </div>
              ) : (
                <div className={`text-center py-6 ${subtextColor} text-sm`}>
                  No notes in this collection
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CollectionComponent;
