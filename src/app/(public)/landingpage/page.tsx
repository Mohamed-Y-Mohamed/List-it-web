"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Clock,
  Folder,
  ListTodo,
  StickyNote,
  Pin,
  ChevronDown,
  ChevronRight,
  Check,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

// Type definitions
interface Task {
  id: string;
  text: string;
  description?: string;
  created_at: Date;
  due_date?: Date;
  is_completed: boolean;
  date_completed?: Date;
  is_pinned: boolean;
  collection_id?: string;
  list_id?: string;
  user_id?: string;
}

interface Note {
  id: string;
  title: string | null;
  description: string | null;
  created_at: Date;
  bg_color_hex: string | null;
  is_pinned: boolean;
  is_deleted?: boolean;
  collection_id?: string;
  list_id?: string;
  user_id?: string;
}

interface Collection {
  id: string;
  collection_name: string;
  bg_color_hex: string;
  created_at: Date;
  isPinned: boolean;
  is_default?: boolean;
  tasks: Task[];
  notes: Note[];
  list_id?: string;
  user_id?: string;
}

// Mock data for the demo
const initialData: { collections: Collection[] } = {
  collections: [
    {
      id: "col1",
      collection_name: "Work Projects",
      bg_color_hex: "#4f46e5",
      created_at: new Date(),
      isPinned: true,
      tasks: [
        {
          id: "task1",
          text: "Finish quarterly report",
          description:
            "Complete analysis and prepare slides for the team meeting",
          created_at: new Date(),
          due_date: new Date(new Date().setDate(new Date().getDate() + 2)),
          is_completed: false,
          is_pinned: true,
        },
        {
          id: "task2",
          text: "Schedule client meeting",
          description: "Coordinate with sales team about new proposal",
          created_at: new Date(),
          due_date: new Date(new Date().setDate(new Date().getDate() + 5)),
          is_completed: false,
          is_pinned: false,
        },
      ],
      notes: [
        {
          id: "note1",
          title: "Project Requirements",
          description:
            "Key deliverables: wireframes, user flows, and technical specs",
          created_at: new Date(),
          bg_color_hex: "#3b82f6",
          is_pinned: true,
          is_deleted: false,
        },
      ],
    },
    {
      id: "col2",
      collection_name: "Personal",
      bg_color_hex: "#10b981",
      created_at: new Date(),
      isPinned: false,
      tasks: [
        {
          id: "task3",
          text: "Grocery shopping",
          description: "Milk, eggs, bread, fruits",
          created_at: new Date(),
          due_date: new Date(new Date().setDate(new Date().getDate() + 1)),
          is_completed: false,
          is_pinned: false,
        },
        {
          id: "task4",
          text: "Gym workout",
          description: "Leg day - squats and lunges",
          created_at: new Date(),
          is_completed: true,
          date_completed: new Date(),
          is_pinned: false,
        },
      ],
      notes: [
        {
          id: "note2",
          title: "Fitness Goals",
          description:
            "Run 5k three times a week, strength training twice weekly",
          created_at: new Date(),
          bg_color_hex: "#f59e0b",
          is_pinned: false,
          is_deleted: false,
        },
      ],
    },
  ],
};

// Task Card Component
interface TaskCardProps {
  text: string;
  description?: string;
  due_date?: Date;
  is_completed: boolean;
  is_pinned: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
  text,
  description,
  due_date,
  is_completed,
  is_pinned,
}) => {
  const [isCompleted, setIsCompleted] = useState<boolean>(!!is_completed);
  const [isPinned, setIsPinned] = useState<boolean>(!!is_pinned);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return "No date";
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return dateObj.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  const handleCompletionToggle = (e: React.MouseEvent): void => {
    e.stopPropagation();
    setIsCompleted(!isCompleted);
  };

  const handlePriorityToggle = (e: React.MouseEvent): void => {
    e.stopPropagation();
    setIsPinned(!isPinned);
  };

  return (
    <div
      className={`rounded-xl border p-4 transition-all duration-300 cursor-pointer overflow-hidden ${
        isDark
          ? "bg-gray-800 border-gray-700 hover:shadow-lg hover:shadow-gray-900/30"
          : "bg-white border-gray-300 hover:shadow-lg hover:shadow-gray-300/70"
      }`}
    >
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            <button
              onClick={handleCompletionToggle}
              className={`flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${
                isDark
                  ? isCompleted
                    ? "border-green-400 bg-green-500 text-gray-900"
                    : "border-gray-600 bg-gray-700 hover:border-green-500"
                  : isCompleted
                    ? "border-green-500 bg-green-500 text-white"
                    : "border-gray-300 bg-white hover:border-green-500"
              }`}
              aria-label={
                isCompleted ? "Mark as incomplete" : "Mark as complete"
              }
              type="button"
            >
              {isCompleted && <Check className="h-3 w-3" />}
            </button>

            <h4
              className={`font-semibold truncate ${
                isDark
                  ? isCompleted
                    ? "text-gray-400 line-through"
                    : "text-gray-100"
                  : isCompleted
                    ? "text-gray-500 line-through"
                    : "text-gray-800"
              }`}
            >
              {text || "Unnamed Task"}
            </h4>

            {isPinned && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  isDark
                    ? "bg-orange-900/50 text-orange-300"
                    : "bg-orange-100 text-orange-600"
                }`}
              >
                Priority
              </span>
            )}
          </div>

          <button
            onClick={handlePriorityToggle}
            className={`flex-shrink-0 transition-colors p-1 rounded-full ${
              isDark
                ? isPinned
                  ? "text-orange-400 bg-orange-900/30"
                  : "text-gray-500 hover:text-gray-300 hover:bg-gray-700"
                : isPinned
                  ? "text-orange-500 bg-orange-100"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            }`}
            aria-label={isPinned ? "Unpin task" : "Pin task"}
            type="button"
          >
            <Pin className={`h-4 w-4 ${isPinned ? "fill-current" : ""}`} />
          </button>
        </div>

        {description && (
          <p
            className={`pl-8 text-sm break-words ${
              isDark
                ? isCompleted
                  ? "text-gray-500 line-through"
                  : "text-gray-400"
                : isCompleted
                  ? "text-gray-400 line-through"
                  : "text-gray-600"
            }`}
          >
            {description}
          </p>
        )}

        {due_date && (
          <div className="flex flex-wrap items-center gap-2 pl-8 mt-1">
            <div
              className={`flex items-center text-xs px-2 py-1 rounded-full ${
                isDark ? "bg-gray-700" : "bg-gray-100"
              }`}
            >
              <Clock
                className={`mr-1 h-3 w-3 flex-shrink-0 ${
                  isDark ? "text-purple-400" : "text-purple-600"
                }`}
              />
              <span className="truncate">{formatDate(due_date)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Note Card Component
interface NoteCardProps {
  title: string | null;
  description: string | null;
  bg_color_hex: string | null;
  is_pinned: boolean;
}

const NoteCard: React.FC<NoteCardProps> = ({
  title,
  description,
  bg_color_hex,
  is_pinned,
}) => {
  const [isPinned, setIsPinned] = useState<boolean>(!!is_pinned);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const displayTitle = title || "Untitled Note";

  const cardStyle = bg_color_hex ? { backgroundColor: bg_color_hex } : {};
  const bgClass = !bg_color_hex
    ? isDark
      ? "bg-gray-800"
      : "bg-yellow-50"
    : "";
  const useWhiteText = bg_color_hex
    ? !["#FFD60A", "#34C759", "#00C7BE"].includes(bg_color_hex)
    : isDark;
  const textColor = useWhiteText ? "text-white" : "text-gray-800";

  const handlePinClick = (e: React.MouseEvent): void => {
    e.stopPropagation();
    e.preventDefault();
    setIsPinned(!isPinned);
  };

  return (
    <div
      className={`rounded-lg p-4 shadow-sm hover:shadow-md relative overflow-hidden cursor-pointer w-full h-32 md:h-40 transition-all duration-200 ease-in-out ${bgClass}`}
      style={cardStyle}
      role="button"
      aria-label={`Open note: ${displayTitle}`}
    >
      <button
        onClick={handlePinClick}
        className={`absolute top-2 right-2 p-1 rounded-full transition-colors ${
          isDark ? "hover:bg-gray-600/50" : "hover:bg-gray-200/50"
        }`}
        aria-label={isPinned ? "Unpin note" : "Pin note"}
        type="button"
      >
        <Pin
          className={`h-4 w-4 ${
            isPinned
              ? useWhiteText
                ? "text-white fill-orange-400"
                : "text-black fill-orange-500"
              : useWhiteText
                ? "text-white stroke-2"
                : "text-black stroke-2"
          }`}
        />
      </button>

      <div className="absolute bottom-0 left-0 right-0 p-2">
        <h4 className={`font-semibold ${textColor} truncate`}>
          {displayTitle}
        </h4>
        {description && (
          <p
            className={`text-xs line-clamp-2 ${textColor} opacity-80 break-words`}
            title={description}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

// Collection Component
interface CollectionComponentProps {
  collection_name: string;
  bg_color_hex: string;
  tasks: Task[];
  notes: Note[];
  isPinned: boolean;
}

const CollectionComponent: React.FC<CollectionComponentProps> = ({
  collection_name,
  bg_color_hex,
  tasks = [],
  notes = [],
  isPinned = false,
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"tasks" | "notes">("tasks");

  // Enhanced color utilities
  const bgColor = isDark ? "bg-gray-900" : "bg-white";
  const headerBgColor = isDark ? "bg-gray-850" : "bg-gray-50";
  const textColor = isDark ? "text-gray-100" : "text-gray-800";
  const subtextColor = isDark ? "text-gray-400" : "text-gray-600";
  const borderColor = isDark ? "border-gray-700" : "border-gray-200";
  const hoverColor = isDark ? "hover:bg-gray-800" : "hover:bg-gray-100";
  const tabHoverColor = isDark ? "hover:bg-gray-800" : "hover:bg-gray-100";
  const activeTabBgColor = isDark ? "bg-gray-800" : "bg-gray-100";

  // Filter and sort tasks
  const priorityTasks = tasks.filter((task) => task.is_pinned);
  const regularTasks = tasks.filter((task) => !task.is_pinned);

  // Sort notes
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return 0;
  });

  const taskCount = tasks.length;
  const noteCount = notes.length;

  return (
    <div
      className={`rounded-lg overflow-hidden shadow-lg transition-shadow duration-300 hover:shadow-xl ${bgColor}`}
    >
      {/* Collection Header */}
      <div
        className={`${headerBgColor} border-l-4 transition-colors duration-300`}
        style={{ borderLeftColor: bg_color_hex || "#cccccc" }}
      >
        <div
          className={`flex items-center p-4 cursor-pointer ${hoverColor} transition-colors duration-200`}
          onClick={() => setIsExpanded(!isExpanded)}
          role="button"
          aria-expanded={isExpanded}
        >
          {/* Icon with collection color */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center mr-3 shadow-sm"
            style={{ backgroundColor: bg_color_hex || "#cccccc" }}
            aria-hidden="true"
          >
            <ListTodo className="h-4 w-4 text-white" />
          </div>

          {/* Collection title and info */}
          <div className="flex-1 min-w-0">
            <h3 className={`font-medium ${textColor} truncate`}>
              {collection_name || "Unnamed Collection"}
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
            <button
              className={`p-1.5 rounded-full ${subtextColor} ${hoverColor} transition-colors duration-200`}
              type="button"
              aria-label={isPinned ? "Unpin collection" : "Pin collection"}
            >
              <Pin
                className={`h-4 w-4 ${isPinned ? "text-orange-500" : subtextColor} transition-colors duration-200`}
                fill={isPinned ? "currentColor" : "none"}
              />
            </button>
            <button
              className={`p-1.5 rounded-full ${subtextColor} ${hoverColor} transition-colors duration-200`}
              type="button"
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
          <div className={`flex border-t ${borderColor}`} role="tablist">
            <button
              className={`flex-1 py-2.5 px-4 text-sm font-medium transition-all relative ${
                activeTab === "tasks"
                  ? `${textColor} ${activeTabBgColor}`
                  : `${subtextColor} ${tabHoverColor}`
              }`}
              onClick={() => setActiveTab("tasks")}
              role="tab"
              aria-selected={activeTab === "tasks"}
              type="button"
            >
              <div className="flex items-center justify-center space-x-1">
                <ListTodo className="h-4 w-4" />
                <span>Tasks ({taskCount})</span>
              </div>
              {activeTab === "tasks" && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5 transition-colors duration-300"
                  style={{ backgroundColor: bg_color_hex || "#cccccc" }}
                  aria-hidden="true"
                />
              )}
            </button>

            <button
              className={`flex-1 py-2.5 px-4 text-sm font-medium transition-all relative ${
                activeTab === "notes"
                  ? `${textColor} ${activeTabBgColor}`
                  : `${subtextColor} ${tabHoverColor}`
              }`}
              onClick={() => setActiveTab("notes")}
              role="tab"
              aria-selected={activeTab === "notes"}
              type="button"
            >
              <div className="flex items-center justify-center space-x-1">
                <StickyNote className="h-4 w-4" />
                <span>Notes ({noteCount})</span>
              </div>
              {activeTab === "notes" && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5 transition-colors duration-300"
                  style={{ backgroundColor: bg_color_hex || "#cccccc" }}
                  aria-hidden="true"
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
                        text={task.text}
                        description={task.description}
                        due_date={task.due_date}
                        is_completed={task.is_completed}
                        is_pinned={task.is_pinned}
                      />
                    ))}
                  </div>
                  {regularTasks.length > 0 && (
                    <div
                      className={`border-t ${borderColor} pt-2 my-3`}
                      aria-hidden="true"
                    ></div>
                  )}
                </>
              )}

              {/* Regular Tasks Section */}
              {regularTasks.length > 0 ? (
                <div className="space-y-2">
                  {regularTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      text={task.text}
                      description={task.description}
                      due_date={task.due_date}
                      is_completed={task.is_completed}
                      is_pinned={task.is_pinned}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {sortedNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      title={note.title}
                      description={note.description}
                      bg_color_hex={note.bg_color_hex}
                      is_pinned={note.is_pinned}
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

// Hero Component
const Hero: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <section
      className={`${
        isDark
          ? "bg-gradient-to-r from-gray-900 via-orange-950 to-gray-900"
          : "bg-gradient-to-r from-sky-100 via-orange-50 to-sky-200"
      } pt-28 transition-colors duration-300`}
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between lg:flex-row">
          <div className="mb-12 max-w-xl lg:mb-0 lg:w-1/2">
            <h1
              className={`mb-6 text-4xl font-bold leading-tight tracking-tight ${
                isDark ? "text-gray-100" : "text-gray-900"
              } md:text-5xl`}
            >
              Organize Your Tasks with{" "}
              <span className={isDark ? "text-orange-400" : "text-sky-500"}>
                LIST IT
              </span>
            </h1>
            <p
              className={`mb-8 text-lg ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              A simple yet powerful task management tool to help you organize
              collections, track tasks, and keep important notes all in one
              place.
            </p>
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
              <Link
                href="/register"
                className={`inline-flex items-center justify-center rounded-md ${
                  isDark
                    ? "bg-orange-600 hover:bg-orange-700 text-white"
                    : "bg-sky-500 hover:bg-sky-600 text-white"
                } px-6 py-3 text-base font-medium transition-colors`}
              >
                Get Started Free
              </Link>
              <Link
                href="/aboutus"
                className={`inline-flex items-center justify-center rounded-md border ${
                  isDark
                    ? "border-gray-600 text-gray-300 hover:bg-gray-800"
                    : "border-gray-300 text-gray-700 hover:bg-gray-100"
                } px-6 py-3 text-base font-medium transition-colors`}
              >
                Learn More
              </Link>
            </div>
          </div>
          <div className="w-full lg:w-1/2">
            <div
              className={`relative overflow-hidden rounded-xl ${
                isDark ? "bg-gray-800" : "bg-white"
              } p-4 shadow-2xl`}
            >
              {/* Demo UI preview here */}
              <div className="space-y-4">
                {initialData.collections.map((collection) => (
                  <CollectionComponent
                    key={collection.id}
                    collection_name={collection.collection_name}
                    bg_color_hex={collection.bg_color_hex}
                    tasks={collection.tasks}
                    notes={collection.notes}
                    isPinned={collection.isPinned}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className={`mt-16 w-full ${
          isDark ? "bg-orange-800" : "bg-sky-500"
        } py-10 text-center text-white`}
      >
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="mb-4 text-2xl font-bold md:text-3xl">
            The simplest way to manage your tasks
          </h2>
          <p className="text-lg opacity-90">
            Get organized and boost your productivity with LIST IT
          </p>
        </div>
      </div>
    </section>
  );
};

// Feature Card Component
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      className={`rounded-xl p-6 transition-all duration-200 ${
        isDark ? "bg-gray-800 hover:bg-gray-750" : "bg-white hover:bg-gray-50"
      } shadow-lg hover:shadow-xl`}
    >
      <div className="mb-4">{icon}</div>
      <h3
        className={`mb-2 text-xl font-semibold ${isDark ? "text-gray-100" : "text-gray-900"}`}
      >
        {title}
      </h3>
      <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
        {description}
      </p>
    </div>
  );
};

// How It Works Card
interface HowItWorksCardProps {
  icon: React.FC<{ className?: string }>;
  title: string;
  description: string;
  bgColor: string;
  hoverBorder: string;
  textColor: string;
}

const HowItWorksCard: React.FC<HowItWorksCardProps> = ({
  icon: Icon,
  title,
  description,
  bgColor,
  hoverBorder,
  textColor,
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      className={`rounded-lg p-6 border-2 border-transparent hover:border-2 ${hoverBorder} transition-all duration-300 ${bgColor} shadow-lg`}
    >
      <div className={`inline-flex rounded-full p-3 mb-4 ${textColor}`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3
        className={`mb-3 text-xl font-medium ${isDark ? "text-gray-100" : "text-gray-900"}`}
      >
        {title}
      </h3>
      <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
        {description}
      </p>
    </div>
  );
};

// Section Title Component
interface SectionTitleProps {
  title: string;
  highlight: string;
  description: string;
  highlightColor?: string;
}

const SectionTitle: React.FC<SectionTitleProps> = ({
  title,
  highlight,
  description,
  highlightColor,
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="text-center">
      <h2
        className={`text-3xl font-bold tracking-tight md:text-4xl ${isDark ? "text-gray-100" : "text-gray-900"}`}
      >
        {title}{" "}
        <span
          className={
            highlightColor || (isDark ? "text-orange-400" : "text-sky-500")
          }
        >
          {highlight}
        </span>
      </h2>
      <p
        className={`mt-4 max-w-2xl mx-auto text-xl ${isDark ? "text-gray-300" : "text-gray-600"}`}
      >
        {description}
      </p>
    </div>
  );
};

// Benefit Card Component
interface BenefitCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const BenefitCard: React.FC<BenefitCardProps> = ({
  title,
  description,
  icon,
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      className={`flex items-start p-6 ${isDark ? "bg-gray-800" : "bg-white"} rounded-lg shadow-lg`}
    >
      <div
        className={`flex-shrink-0 p-3 mr-4 rounded-full ${isDark ? "bg-orange-900/40 text-orange-400" : "bg-sky-100 text-sky-600"}`}
      >
        {icon}
      </div>
      <div>
        <h3
          className={`text-xl font-semibold mb-2 ${isDark ? "text-gray-100" : "text-gray-900"}`}
        >
          {title}
        </h3>
        <p className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
          {description}
        </p>
      </div>
    </div>
  );
};

// Landing Page Component
const LandingPage: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const features = [
    {
      icon: (
        <Folder
          className={`h-12 w-12 ${isDark ? "text-orange-400" : "text-orange-500"}`}
        />
      ),
      title: "Collections",
      description:
        "Group related tasks with customizable color-coding for efficient organization.",
    },
    {
      icon: (
        <ListTodo
          className={`h-12 w-12 ${isDark ? "text-sky-400" : "text-sky-500"}`}
        />
      ),
      title: "Task Management",
      description:
        "Create, prioritize, and track tasks with descriptions and deadlines.",
    },
    {
      icon: (
        <Clock
          className={`h-12 w-12 ${isDark ? "text-orange-400" : "text-orange-500"}`}
        />
      ),
      title: "Due Date Tracking",
      description:
        "Assign due dates to tasks and easily identify priority items.",
    },
    {
      icon: (
        <StickyNote
          className={`h-12 w-12 ${isDark ? "text-sky-400" : "text-sky-500"}`}
        />
      ),
      title: "Notes",
      description:
        "Add color-coded, pinnable notes to collections for important information.",
    },
  ];

  const benefits = [
    {
      icon: <StickyNote className="h-8 w-8" />,
      title: "Stay Focused",
      description:
        "Organize your thoughts and tasks visually to maintain clarity and focus on what matters most.",
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: "Save Time",
      description:
        "Reduce time spent organizing and searching for information with our intuitive interface.",
    },
    {
      icon: <Folder className="h-8 w-8" />,
      title: "Flexible Organization",
      description:
        "Customize your workflow with collections that adapt to your unique organizational style.",
    },
  ];

  return (
    <div
      className={`min-h-screen w-full ${isDark ? "bg-gray-900" : "bg-white"} transition-colors duration-300`}
    >
      {/* Hero Section with Live Demo */}
      <Hero />

      {/* How It Works Section */}
      <section className={`py-20 ${isDark ? "bg-gray-900" : ""}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title="How"
            highlight="LIST IT"
            description="A structured approach to task management with hierarchical organization"
            highlightColor={isDark ? "text-orange-400" : "text-sky-500"}
          />

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <HowItWorksCard
              icon={Folder}
              title="Create Collections"
              description="Group related tasks into themed collections with custom colors for visual organization."
              bgColor={isDark ? "bg-gray-800" : "bg-white"}
              hoverBorder={isDark ? "border-orange-700" : "border-orange-200"}
              textColor={
                isDark
                  ? "bg-orange-900 text-orange-500"
                  : "bg-orange-100 text-orange-500"
              }
            />
            <HowItWorksCard
              icon={ListTodo}
              title="Manage Tasks"
              description="Create priority tasks with descriptions, mark tasks as complete, and organize them with due dates."
              bgColor={isDark ? "bg-gray-800" : "bg-white"}
              hoverBorder={isDark ? "border-sky-700" : "border-sky-200"}
              textColor={
                isDark ? "bg-sky-900 text-sky-400" : "bg-sky-100 text-sky-500"
              }
            />
            <HowItWorksCard
              icon={StickyNote}
              title="Add Notes"
              description="Create colorful, pinnable notes for important details and reference information within each collection."
              bgColor={isDark ? "bg-gray-800" : "bg-white"}
              hoverBorder={isDark ? "border-orange-700" : "border-orange-200"}
              textColor={
                isDark
                  ? "bg-orange-900 text-orange-500"
                  : "bg-orange-100 text-orange-500"
              }
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        className={`py-20 ${isDark ? "bg-gradient-to-r from-gray-900 via-orange-950 to-gray-900" : "bg-gradient-to-r from-sky-100 via-orange-50 to-sky-100"}`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title="Everything You Need to"
            highlight="Stay Organized"
            description="Powerful features designed to boost your productivity"
          />

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className={`py-20 ${isDark ? "bg-gray-900" : "bg-white"}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title="See LIST IT in"
            highlight="Action"
            description="Try our interactive demo to experience the app firsthand"
          />

          <div className="mt-16 overflow-hidden rounded-xl shadow-2xl">
            <div className={`p-4 ${isDark ? "bg-gray-800" : "bg-white"}`}>
              <div className="space-y-6">
                {initialData.collections.map((collection) => (
                  <CollectionComponent
                    key={collection.id}
                    collection_name={collection.collection_name}
                    bg_color_hex={collection.bg_color_hex}
                    tasks={collection.tasks}
                    notes={collection.notes}
                    isPinned={collection.isPinned}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section (replacing Testimonials) */}
      <section className={`py-20 ${isDark ? "bg-gray-850" : "bg-gray-50"}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title="Work Smarter"
            highlight="Not Harder"
            description="Discover how LIST IT can transform your productivity"
          />

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {benefits.map((benefit, index) => (
              <BenefitCard key={index} {...benefit} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className={`py-16 text-white ${isDark ? "bg-orange-800" : "bg-sky-500"}`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Ready to boost your productivity?
            </h2>
            <p className="mt-4 text-lg opacity-90">
              Join LIST IT today and start organizing your work life.
            </p>
            <div className="mt-8 flex flex-col justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
              <Link
                href="/register"
                className={`inline-flex items-center justify-center rounded-md ${
                  isDark
                    ? "bg-gray-800 text-orange-400 hover:bg-gray-700"
                    : "bg-white text-orange-500 hover:bg-gray-100"
                } px-6 py-3 text-base font-medium transition-colors`}
              >
                Get Started - It&apos;s Free!
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
    </div>
  );
};

export default LandingPage;
