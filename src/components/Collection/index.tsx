"use client";

import React, { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  ClipboardList,
  StickyNote,
} from "lucide-react";
import TaskCard from "@/components/Tasks/index";
import NoteCard from "@/components/Notes/noteCard";
import { Task, Note, Collection } from "@/types/schema";
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
  allCollections?: Collection[];
  onTaskComplete: (taskId: string, is_completed: boolean) => void;
  onTaskPriority: (taskId: string, is_priority: boolean) => void;
  onTaskUpdate?: (
    taskId: string,
    taskData: {
      text: string;
      description?: string;
      due_date?: Date;
      is_priority: boolean;
    }
  ) => void;
  onTaskCollectionChange?: (taskId: string, collectionId: string) => void;
  onNotePin?: (noteId: number, isPinned: boolean) => void;
  onNoteColorChange?: (noteId: number, color: string) => void;
  onNoteUpdate?: (noteId: number, updatedText: string) => void;
  onAddTask?: () => void;
  onAddNote?: () => void;
  className?: string;
}

const Collections = ({
  id,
  collection_name,
  background_color,
  date_created,
  is_default,
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
}: CollectionComponentProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<"tasks" | "notes">("tasks");
  const [tasksSectionExpanded, setTasksSectionExpanded] = useState(true);
  const [notesSectionExpanded, setNotesSectionExpanded] = useState(true);
  const [priorityTasks, setPriorityTasks] = useState<Task[]>([]);
  const [regularTasks, setRegularTasks] = useState<Task[]>([]);
  const [sortedNotes, setSortedNotes] = useState<Note[]>([]);

  const getTextColorForBackground = (color: string) => {
    const lightColors = ["#FFD60A", "#34C759", "#00C7BE"];
    return lightColors.includes(color) ? "text-black" : "text-white";
  };
  const headerTextColor = getTextColorForBackground(background_color);

  useEffect(() => {
    setPriorityTasks(tasks.filter((task) => task.is_priority));
    setRegularTasks(tasks.filter((task) => !task.is_priority));
  }, [tasks]);

  useEffect(() => {
    const activeNotes = notes.filter((note) => !note.is_deleted);
    const sorted = [...activeNotes].sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return (
        new Date(b.date_created).getTime() - new Date(a.date_created).getTime()
      );
    });
    setSortedNotes(sorted);
  }, [notes]);

  const sharedTextColor = isDark ? "text-gray-300" : "text-gray-700";
  const subTextColor = isDark ? "text-gray-400" : "text-gray-500";

  return (
    <div
      className={`relative rounded-xl w-full box-border ${isDark ? "bg-gray-800 shadow-gray-900/20" : "bg-white shadow-lg"} ${className}`}
    >
      <div className="flex flex-col rounded-lg">
        {/* Header */}
        <div
          className="flex items-center justify-between rounded-t-lg p-4"
          style={{ backgroundColor: background_color }}
        >
          <div className="flex items-center space-x-2 min-w-0">
            <ClipboardList
              className={`h-5 w-5 flex-shrink-0 ${headerTextColor}`}
            />
            <span className={`font-semibold truncate ${headerTextColor}`}>
              {collection_name}
            </span>
            {is_default && (
              <span
                className={`ml-2 rounded-full bg-gray-400/20 px-2 py-0.5 text-xs whitespace-nowrap ${headerTextColor}`}
              >
                Default
              </span>
            )}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? "Collapse" : "Expand"}
            className={`rounded-full p-1 hover:bg-white/20 ${headerTextColor}`}
          >
            {isExpanded ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </button>
        </div>

        {isExpanded && (
          <>
            {/* Tabs */}
            <div className={`flex ${isDark ? "bg-gray-800" : "bg-gray-50"}`}>
              {["tasks", "notes"].map((tab) => {
                const isActive = activeTab === tab;
                const label = tab === "tasks" ? "Tasks" : "Notes";
                const count =
                  tab === "tasks"
                    ? tasks.length
                    : notes.filter((n) => !n.is_deleted).length;
                const Icon = tab === "tasks" ? ClipboardList : StickyNote;

                return (
                  <button
                    key={tab}
                    className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors duration-200 ${
                      isActive
                        ? isDark
                          ? "border-orange-500 text-orange-400"
                          : "border-sky-500 text-sky-600"
                        : isDark
                          ? "border-transparent text-gray-400 hover:text-gray-300"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                    onClick={() => setActiveTab(tab as "tasks" | "notes")}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Icon
                        className={`h-4 w-4 ${isActive ? (isDark ? "text-orange-400" : "text-sky-500") : ""}`}
                      />
                      <span>
                        {label} ({count})
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div
              className={`space-y-4 p-5 ${isDark ? "bg-gray-800" : "bg-gray-50"}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="h-3 w-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: background_color }}
                  ></div>

                  <span
                    className={`text-sm font-medium truncate ${sharedTextColor}`}
                  >
                    {activeTab === "tasks"
                      ? tasks.length
                      : notes.filter((n) => !n.is_deleted).length}{" "}
                    {activeTab}
                  </span>
                </div>
              </div>
              {activeTab === "tasks" && (
                <>
                  {tasksSectionExpanded && (
                    <>
                      {priorityTasks.length > 0 && (
                        <div className="space-y-3">
                          {priorityTasks.map((task) => (
                            <TaskCard
                              key={task.id}
                              {...task}
                              onComplete={onTaskComplete}
                              onPriorityChange={onTaskPriority}
                            />
                          ))}
                          <hr
                            className={
                              isDark ? "border-gray-700" : "border-gray-200"
                            }
                          />
                        </div>
                      )}
                      {regularTasks.length > 0 ? (
                        <div className="space-y-3">
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
                          <p
                            className={`text-sm text-center ${isDark ? "text-gray-400" : "text-gray-500"}`}
                          >
                            No tasks in this collection.
                          </p>
                        )
                      )}
                    </>
                  )}
                </>
              )}

              {activeTab === "notes" && (
                <>
                  {notesSectionExpanded &&
                    (sortedNotes.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {sortedNotes.map((note) => (
                          <NoteCard
                            key={note.note_id}
                            {...note}
                            onPinChange={onNotePin}
                            onColorChange={onNoteColorChange}
                            onNoteUpdate={onNoteUpdate}
                          />
                        ))}
                      </div>
                    ) : (
                      <p
                        className={`text-sm text-center ${isDark ? "text-gray-400" : "text-gray-500"}`}
                      >
                        No notes in this collection.
                      </p>
                    ))}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const SectionToggle = ({
  label,
  isExpanded,
  toggle,
  isDark,
}: {
  label: string;
  isExpanded: boolean;
  toggle: () => void;
  isDark: boolean;
}) => (
  <div className="flex justify-between items-center mb-4">
    <h3
      className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
    >
      {label}
    </h3>
    <button
      onClick={toggle}
      className={`p-1 rounded-full ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
    >
      {isExpanded ? (
        <ChevronDown className="h-5 w-5" />
      ) : (
        <ChevronRight className="h-5 w-5" />
      )}
    </button>
  </div>
);

const EmptyMessage = ({
  label,
  onAction,
  isDark,
  actionText,
}: {
  label: string;
  onAction?: () => void;
  isDark: boolean;
  actionText: string;
}) => (
  <div
    className={`text-center py-4 ${isDark ? "text-gray-400" : "text-gray-500"}`}
  >
    <p>{label}</p>
    {onAction && (
      <button
        onClick={onAction}
        className={`mt-2 text-sm font-medium ${isDark ? "text-orange-400 hover:text-orange-300" : "text-orange-500 hover:text-orange-600"}`}
      >
        {actionText}
      </button>
    )}
  </div>
);

export default Collections;
