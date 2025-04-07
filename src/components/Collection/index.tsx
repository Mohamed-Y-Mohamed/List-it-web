"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  ClipboardList,
  StickyNote,
} from "lucide-react";
import TaskCard from "@/components/Tasks/index";
import NoteCard from "@/components/Notes/noteCard";
import { Task, Note } from "@/types/schema";
import { useTheme } from "@/context/ThemeContext";

interface CollectionComponentProps {
  id: string;
  collection_name: string;
  background_color: string;
  date_created: Date;
  is_default: boolean;
  content_count: number;
  tasks: Task[];
  notes?: Note[];
  onTaskComplete: (taskId: string, is_completed: boolean) => void;
  onTaskPriority: (taskId: string, is_priority: boolean) => void;
  onNotePin?: (noteId: number, isPinned: boolean) => void;
  onAddTask?: () => void;
  onAddNote?: () => void;
  className?: string;
}

const CollectionComponent = ({
  id,
  collection_name,
  background_color,
  date_created,
  is_default,
  content_count,
  tasks = [],
  notes = [],
  onTaskComplete,
  onTaskPriority,
  onNotePin,
  onAddTask,
  onAddNote,
  className = "",
}: CollectionComponentProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<"tasks" | "notes">("tasks");
  const [priorityTasks, setPriorityTasks] = useState<Task[]>([]);
  const [regularTasks, setRegularTasks] = useState<Task[]>([]);
  const [sortedNotes, setSortedNotes] = useState<Note[]>([]);

  // Update the separated task lists when tasks change
  useEffect(() => {
    const activeTasks = tasks;
    setPriorityTasks(activeTasks.filter((task) => task.is_priority));
    setRegularTasks(activeTasks.filter((task) => !task.is_priority));
  }, [tasks]);

  // Update sorted notes when notes change
  useEffect(() => {
    if (!notes || notes.length === 0) {
      setSortedNotes([]);
      return;
    }

    const sorted = [...notes].sort((a, b) => {
      // Sort by pinned status first (pinned notes come first)
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;

      // Then sort by date (newest first)
      return (
        new Date(b.date_created).getTime() - new Date(a.date_created).getTime()
      );
    });

    setSortedNotes(sorted);
  }, [notes]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleAddTask = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddTask) {
      onAddTask();
    }
  };

  const handleAddNote = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddNote) {
      onAddNote();
    }
  };

  const handleNotePin = (noteId: number, isPinned: boolean) => {
    if (onNotePin) {
      onNotePin(noteId, isPinned);
    }
  };

  return (
    <div
      className={`relative rounded-xl ${
        isDark ? "bg-gray-800 shadow-gray-900/20" : "bg-white shadow-lg"
      } ${className} w-full box-border`}
    >
      <div className="flex flex-col rounded-lg">
        {/* Collection Header */}
        <div
          className={`flex items-center justify-between rounded-t-lg ${background_color} p-4 text-white`}
        >
          <div className="flex items-center space-x-2 min-w-0">
            <ClipboardList className="h-5 w-5 flex-shrink-0" />
            <span className="font-semibold truncate">{collection_name}</span>
            {is_default && (
              <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs whitespace-nowrap">
                Default
              </span>
            )}
          </div>
          <div className="flex space-x-3 flex-shrink-0">
            <button
              className="rounded-full p-1 transition-colors hover:bg-white/20"
              onClick={toggleExpand}
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Collection Content */}
        {isExpanded && (
          <>
            {/* Tabs for switching between tasks and notes */}
            <div className={`flex ${isDark ? "bg-gray-800" : "bg-gray-50"}`}>
              <button
                className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors duration-200 ${
                  activeTab === "tasks"
                    ? isDark
                      ? "border-orange-500 text-orange-400"
                      : "border-sky-500 text-sky-600"
                    : isDark
                    ? "border-transparent text-gray-400 hover:text-gray-300"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("tasks")}
              >
                <div className="flex items-center justify-center space-x-2">
                  <ClipboardList
                    className={`h-4 w-4 ${
                      activeTab === "tasks"
                        ? isDark
                          ? "text-orange-400"
                          : "text-sky-500"
                        : ""
                    }`}
                  />
                  <span>Tasks ({tasks.length})</span>
                </div>
              </button>
              <button
                className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors duration-200 ${
                  activeTab === "notes"
                    ? isDark
                      ? "border-orange-500 text-orange-400"
                      : "border-sky-500 text-sky-600"
                    : isDark
                    ? "border-transparent text-gray-400 hover:text-gray-300"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("notes")}
              >
                <div className="flex items-center justify-center space-x-2">
                  <StickyNote
                    className={`h-4 w-4 ${
                      activeTab === "notes"
                        ? isDark
                          ? "text-orange-400"
                          : "text-sky-500"
                        : ""
                    }`}
                  />
                  <span>Notes ({notes ? notes.length : 0})</span>
                </div>
              </button>
            </div>

            {/* Content Area */}
            <div
              className={`space-y-4 p-5 ${
                isDark ? "bg-gray-800" : "bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`h-3 w-3 rounded-full ${background_color} flex-shrink-0`}
                  ></div>
                  <span
                    className={`text-sm font-medium truncate ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {activeTab === "tasks"
                      ? tasks.length
                      : notes
                      ? notes.length
                      : 0}{" "}
                    {activeTab}
                  </span>
                </div>
                <span
                  className={`text-xs flex-shrink-0 ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Created {date_created.toLocaleDateString()}
                </span>
              </div>

              {/* Tasks Content */}
              {activeTab === "tasks" && (
                <>
                  {/* Priority Tasks section */}
                  {priorityTasks.length > 0 && (
                    <div className="space-y-3">
                      {priorityTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          id={task.id}
                          text={task.text}
                          description={task.description}
                          date_created={task.date_created}
                          due_date={task.due_date}
                          is_completed={task.is_completed}
                          date_completed={task.date_completed}
                          is_priority={task.is_priority}
                          onComplete={onTaskComplete}
                          onPriorityChange={onTaskPriority}
                        />
                      ))}
                      <div
                        className={`border-t ${
                          isDark ? "border-gray-700" : "border-gray-200"
                        }`}
                      ></div>
                    </div>
                  )}

                  {/* Regular Tasks section */}
                  {regularTasks.length > 0 ? (
                    <div className="space-y-3">
                      {regularTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          id={task.id}
                          text={task.text}
                          description={task.description}
                          date_created={task.date_created}
                          due_date={task.due_date}
                          is_completed={task.is_completed}
                          date_completed={task.date_completed}
                          is_priority={task.is_priority}
                          onComplete={onTaskComplete}
                          onPriorityChange={onTaskPriority}
                        />
                      ))}
                    </div>
                  ) : (
                    priorityTasks.length === 0 && (
                      <div
                        className={`text-center py-4 ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        <p>No tasks in this collection yet.</p>
                        <button
                          onClick={handleAddTask}
                          className={`mt-2 text-sm font-medium ${
                            isDark
                              ? "text-orange-400 hover:text-orange-300"
                              : "text-orange-500 hover:text-orange-600"
                          }`}
                        >
                          Add your first task
                        </button>
                      </div>
                    )
                  )}
                </>
              )}

              {/* Notes Content */}
              {activeTab === "notes" && (
                <>
                  {sortedNotes.length > 0 ? (
                    <div className="space-y-3">
                      {sortedNotes.map((note) => (
                        <NoteCard
                          key={note.note_id}
                          note_id={note.note_id}
                          text={note.text}
                          date_created={note.date_created}
                          is_deleted={note.is_deleted}
                          background_color={note.background_color}
                          is_pinned={note.is_pinned}
                          onPinChange={handleNotePin}
                        />
                      ))}
                    </div>
                  ) : (
                    <div
                      className={`text-center py-4 ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      <p>No notes in this collection yet.</p>
                      <button
                        onClick={handleAddNote}
                        className={`mt-2 text-sm font-medium ${
                          isDark
                            ? "text-orange-400 hover:text-orange-300"
                            : "text-orange-500 hover:text-orange-600"
                        }`}
                      >
                        Add your first note
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CollectionComponent;
