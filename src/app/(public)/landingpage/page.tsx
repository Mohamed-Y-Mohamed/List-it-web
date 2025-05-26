"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Folder,
  ListTodo,
  StickyNote,
  Pin,
  ChevronDown,
  Check,
  Calendar,
  Star,
  Target,
  TrendingUp,
  Zap,
  Users,
  Shield,
  Rocket,
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

//  demo data
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

//  Task Card Component
interface TaskCardProps {
  id: string;
  text: string;
  description?: string;
  due_date?: Date;
  is_completed: boolean;
  is_pinned: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
  id,
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2, scale: 1.02 }}
      data-id={id}
      className={`rounded-xl border p-4 transition-all duration-300 cursor-pointer backdrop-blur-sm group
        ${
          isDark
            ? "bg-gray-800/40 border-gray-700/50 hover:bg-gray-800/60 hover:shadow-xl hover:shadow-gray-900/20"
            : "bg-white/40 border-gray-300/50 hover:bg-white/60 hover:shadow-xl hover:shadow-gray-300/20"
        }`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-start space-x-3 overflow-hidden flex-1 min-w-0">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleCompletionToggle}
            className={`flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all duration-200 mt-0.5 ${
              isDark
                ? isCompleted
                  ? "border-green-400 bg-green-500 text-gray-900"
                  : "border-gray-600 bg-gray-700/50 hover:border-green-500"
                : isCompleted
                  ? "border-green-500 bg-green-500 text-white"
                  : "border-gray-300 bg-white/50 hover:border-green-500"
            }`}
            aria-label={isCompleted ? "Mark as incomplete" : "Mark as complete"}
            type="button"
          >
            <AnimatePresence>
              {isCompleted && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Check className="h-3 w-3" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          <div className="flex-1 min-w-0">
            <h4
              className={`font-semibold text-sm sm:text-base truncate ${
                isDark
                  ? isCompleted
                    ? "text-gray-400 line-through"
                    : "text-gray-100"
                  : isCompleted
                    ? "text-gray-500 line-through"
                    : "text-gray-800"
              }`}
            >
              {text || "Untitled Task"}
            </h4>

            <AnimatePresence>
              {isPinned && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`inline-flex items-center text-xs px-2 py-1 rounded-full font-medium mt-1 ${
                    isDark
                      ? "bg-orange-900/30 text-orange-300 border border-orange-500/30"
                      : "bg-orange-100 text-orange-600 border border-orange-200"
                  }`}
                >
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  Priority
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.1, rotate: 15 }}
          whileTap={{ scale: 0.9 }}
          onClick={handlePriorityToggle}
          className={`flex-shrink-0 transition-all duration-200 p-2 rounded-lg ${
            isDark
              ? isPinned
                ? "text-orange-400 bg-orange-900/30"
                : "text-gray-500 hover:text-orange-400 hover:bg-gray-700/50"
              : isPinned
                ? "text-orange-500 bg-orange-100"
                : "text-gray-400 hover:text-orange-500 hover:bg-orange-50"
          }`}
          aria-label={isPinned ? "Unpin task" : "Pin task"}
        >
          <Pin className={`h-4 w-4 ${isPinned ? "fill-current" : ""}`} />
        </motion.button>
      </div>

      <AnimatePresence>
        {description && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className={`mb-3 text-xs sm:text-sm break-words ${
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
          </motion.p>
        )}
      </AnimatePresence>

      {due_date && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className={`flex items-center text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-full w-fit transition-all duration-200 ${
            isDark
              ? "bg-gray-700/50 hover:bg-gray-700 border border-gray-600/50"
              : "bg-gray-100/50 hover:bg-gray-200 border border-gray-200/50"
          }`}
        >
          <Calendar className="mr-1 sm:mr-1.5 h-3 w-3 flex-shrink-0 text-purple-500" />
          <span className="truncate">Due: {formatDate(due_date)}</span>
        </motion.div>
      )}
    </motion.div>
  );
};

//  Note Card Component
interface NoteCardProps {
  id: string;
  title: string | null;
  description: string | null;
  bg_color_hex: string | null;
  is_pinned: boolean;
}

const NoteCard: React.FC<NoteCardProps> = ({
  id,
  title,
  description,
  bg_color_hex,
  is_pinned,
}) => {
  const [isPinned, setIsPinned] = useState<boolean>(!!is_pinned);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const displayTitle = title || "Untitled Note";

  const cardStyle = bg_color_hex
    ? {
        background: `linear-gradient(135deg, ${bg_color_hex}dd 0%, ${bg_color_hex}aa 50%, ${bg_color_hex}bb 100%)`,
        backdropFilter: "blur(10px)",
      }
    : {};

  const bgClass = !bg_color_hex
    ? isDark
      ? "bg-gray-800/50"
      : "bg-yellow-50/50"
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
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className={`
        rounded-xl p-4 shadow-sm hover:shadow-lg
        relative overflow-hidden cursor-pointer
        w-full h-28 sm:h-32 md:h-40 group
        transition-all duration-300 backdrop-blur-sm border
        ${bgClass}
        ${isDark ? "border-gray-700/50" : "border-gray-300/50"}
      `}
      style={cardStyle}
      role="button"
      aria-label={`Open note: ${displayTitle}`}
      data-id={id}
    >
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300 bg-gradient-to-br from-white/20 to-transparent" />

      <motion.button
        whileHover={{ scale: 1.1, rotate: 15 }}
        whileTap={{ scale: 0.9 }}
        onClick={handlePinClick}
        className={`absolute top-3 right-3 p-2 rounded-lg backdrop-blur-sm transition-all duration-200 ${
          isDark
            ? "bg-black/20 hover:bg-black/40"
            : "bg-white/20 hover:bg-white/40"
        }`}
        aria-label={isPinned ? "Unpin note" : "Pin note"}
        type="button"
      >
        <Pin
          className={`h-4 w-4 transition-all duration-200 ${
            isPinned ? "fill-current text-orange-400" : textColor
          }`}
        />
      </motion.button>

      <AnimatePresence>
        {isPinned && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium flex items-center backdrop-blur-sm ${
              isDark
                ? "bg-orange-900/40 text-orange-300 border border-orange-500/30"
                : "bg-orange-100/60 text-orange-700 border border-orange-300/50"
            }`}
          >
            <Star className="h-3 w-3 mr-1 fill-current" />
            Pinned
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-0 left-0 right-0 p-3">
        <h4 className={`font-semibold ${textColor} truncate mb-1`}>
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
    </motion.div>
  );
};

//  Collection Component
interface CollectionComponentProps {
  id: string;
  collection_name: string;
  bg_color_hex: string;
  tasks: Task[];
  notes: Note[];
  isPinned: boolean;
}

const CollectionComponent: React.FC<CollectionComponentProps> = ({
  id,
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

  const priorityTasks = tasks.filter((task) => Boolean(task.is_pinned));
  const regularTasks = tasks.filter((task) => !task.is_pinned);
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const taskCount = tasks.length;
  const noteCount = notes.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      data-collection-id={id}
      data-pinned={isPinned}
      className={`rounded-xl overflow-hidden shadow-lg  transition-all duration-300 hover:shadow-xl backdrop-blur-sm border ${
        isDark
          ? "bg-gray-800/50 border-gray-700/50"
          : "bg-white/50 border-gray-300/50"
      }`}
    >
      {/* Collection Header */}
      <div
        className={`backdrop-blur-sm relative  ${isDark ? "bg-gray-800/60" : "bg-white/60"}`}
      >
        <div
          className="absolute top-0 left-0 right-0 h-1 opacity-80"
          style={{ backgroundColor: bg_color_hex || "#fb923c" }}
        />

        <motion.div
          className={`flex items-center p-5 cursor-pointer transition-all duration-200 relative ${
            isDark ? "hover:bg-gray-700/50" : "hover:bg-gray-100/50"
          }`}
          onClick={() => setIsExpanded(!isExpanded)}
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.98 }}
          role="button"
          aria-expanded={isExpanded}
          aria-label={`${collection_name || "Unnamed Collection"} collection`}
        >
          <motion.div
            className="relative mr-4"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-sm"
              style={{
                backgroundColor: bg_color_hex || "#fb923c",
                boxShadow: `0 4px 20px ${bg_color_hex || "#fb923c"}30`,
              }}
            >
              <ListTodo className="h-4 w-4 text-white" />
            </div>
          </motion.div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3">
              <h3
                className={`font-semibold text-base sm:text-lg truncate ${
                  isDark ? "text-gray-100" : "text-gray-800"
                }`}
              >
                {collection_name || "Unnamed Collection"}
              </h3>

              <div className="flex items-center space-x-2 mt-1 sm:mt-0">
                {taskCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isDark
                        ? "bg-orange-900/30 text-orange-300"
                        : "bg-orange-100 text-orange-600"
                    }`}
                  >
                    {taskCount} task{taskCount !== 1 ? "s" : ""}
                  </motion.span>
                )}

                {noteCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isDark
                        ? "bg-blue-900/30 text-blue-400"
                        : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    {noteCount} note{noteCount !== 1 ? "s" : ""}
                  </motion.span>
                )}
              </div>
            </div>

            <p
              className={`text-xs sm:text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              {taskCount + noteCount} total items
            </p>
          </div>

          <motion.button
            className={`p-2 rounded-lg transition-colors duration-200 ${
              isDark
                ? "text-gray-400 hover:bg-gray-700/50"
                : "text-gray-600 hover:bg-gray-100/50"
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            <motion.div
              animate={{ rotate: isExpanded ? 0 : -90 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className="h-5 w-5" />
            </motion.div>
          </motion.button>
        </motion.div>

        {/*  tabs */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex border-t backdrop-blur-sm ${
                isDark ? "border-gray-700" : "border-gray-200"
              }`}
              role="tablist"
            >
              {["tasks", "notes"].map((tab) => (
                <motion.button
                  key={tab}
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-all relative ${
                    activeTab === tab
                      ? isDark
                        ? "text-gray-100 bg-gray-700/60"
                        : "text-gray-800 bg-gray-100/60"
                      : isDark
                        ? "text-gray-400 hover:bg-gray-700/50"
                        : "text-gray-600 hover:bg-gray-100/50"
                  }`}
                  onClick={() => setActiveTab(tab as "tasks" | "notes")}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  role="tab"
                  aria-selected={activeTab === tab}
                  aria-controls={`${tab}-panel`}
                  id={`${tab}-tab`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    {tab === "tasks" ? (
                      <ListTodo className="h-4 w-4" />
                    ) : (
                      <StickyNote className="h-4 w-4" />
                    )}
                    <span className="capitalize">{tab}</span>

                    {((tab === "tasks" && taskCount > 0) ||
                      (tab === "notes" && noteCount > 0)) && (
                      <span
                        className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                          activeTab === tab
                            ? "bg-white/20 text-current"
                            : "bg-gray-500/20 text-gray-500"
                        }`}
                      >
                        {tab === "tasks" ? taskCount : noteCount}
                      </span>
                    )}
                  </div>

                  {activeTab === tab && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                      style={{ backgroundColor: bg_color_hex || "#fb923c" }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Collection Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className={`p-5 backdrop-blur-sm ${isDark ? "bg-gray-800/40" : "bg-white/40"}`}
            role="tabpanel"
            id={activeTab === "tasks" ? "tasks-panel" : "notes-panel"}
            aria-labelledby={activeTab === "tasks" ? "tasks-tab" : "notes-tab"}
          >
            {activeTab === "tasks" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="space-y-4"
              >
                {priorityTasks.length > 0 && (
                  <>
                    <div className="space-y-3">
                      {priorityTasks.map((task, index) => (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          <TaskCard
                            id={task.id}
                            text={task.text}
                            description={task.description}
                            due_date={task.due_date}
                            is_completed={task.is_completed}
                            is_pinned={task.is_pinned}
                          />
                        </motion.div>
                      ))}
                    </div>
                    {regularTasks.length > 0 && (
                      <div
                        className={`border-t pt-4 ${isDark ? "border-gray-700" : "border-gray-200"}`}
                      />
                    )}
                  </>
                )}

                {regularTasks.length > 0 ? (
                  <div className="space-y-3">
                    {regularTasks.map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: (priorityTasks.length + index) * 0.1,
                        }}
                      >
                        <TaskCard
                          id={task.id}
                          text={task.text}
                          description={task.description}
                          due_date={task.due_date}
                          is_completed={task.is_completed}
                          is_pinned={task.is_pinned}
                        />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  priorityTasks.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4 }}
                      className={`text-center py-12 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      <ListTodo className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-lg font-medium mb-1">No tasks yet</p>
                      <p className="text-sm">Add tasks to organize your work</p>
                    </motion.div>
                  )
                )}
              </motion.div>
            )}

            {activeTab === "notes" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                {sortedNotes.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {sortedNotes.map((note, index) => (
                      <motion.div
                        key={note.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <NoteCard
                          id={note.id}
                          title={note.title}
                          description={note.description}
                          bg_color_hex={note.bg_color_hex}
                          is_pinned={note.is_pinned}
                        />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className={`text-center py-12 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
                    <StickyNote className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium mb-1">No notes yet</p>
                    <p className="text-sm">
                      Create notes to capture your ideas
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Animated counter component
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const AnimatedCounter: React.FC<{
  value: number;
  duration?: number;
  suffix?: string;
}> = ({ value, duration = 1000, suffix = "" }) => {
  const [count, setCount] = useState(0);

  React.useEffect(() => {
    let startTime: number;
    const startValue = 0;
    const endValue = value; // Fix: use the 'value' prop instead of 'AnimatedCounter'

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const current = startValue + (endValue - startValue) * progress;
      setCount(Math.floor(current));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return (
    <span>
      {count}
      {suffix}
    </span>
  );
};

// Hero Component
const Hero: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <section className="relative min-h-screen flex items-center">
      {isDark ? (
        <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(135deg,#1a0f12_0%,#2d1b20_50%,#1a0f12_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_center,rgba(59,130,246,0.05)_0%,transparent_70%)] before:content-['']" />
      ) : (
        <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(135deg,#f8f6f7_0%,#ffffff_50%,#f8f6f7_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_center,rgba(59,130,246,0.03)_0%,transparent_70%)] before:content-['']" />
      )}

      <div className="mx-auto max-w-7xl px-4 mb-24 py-16 sm:px-6 lg:px-8 pt-28">
        <div className="flex flex-col items-center justify-between lg:flex-row">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-12 max-w-xl lg:mb-0 lg:w-1/2"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className={`mb-6 text-4xl font-bold leading-tight tracking-tight ${
                isDark ? "text-gray-100" : "text-gray-900"
              } md:text-5xl`}
            >
              Organize Your Tasks with{" "}
              <span
                className={`${isDark ? "text-orange-400" : "text-orange-500"} relative`}
              >
                LIST IT
                <motion.div
                  className="absolute -bottom-2 left-0 h-1 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1, delay: 1 }}
                />
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className={`mb-8 text-lg ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              A simple yet powerful task management tool to help you organize
              collections, track tasks, and keep important notes all in one
              place.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/register"
                  className={`inline-flex items-center justify-center rounded-xl ${
                    isDark
                      ? "bg-orange-600 hover:bg-orange-700 text-white"
                      : "bg-orange-500 hover:bg-orange-600 text-white"
                  } px-8 py-4 text-base font-medium transition-all duration-200 shadow-lg hover:shadow-xl backdrop-blur-sm`}
                >
                  Get Started Free
                  <Rocket className="ml-2 h-5 w-5" />
                </Link>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/aboutus"
                  className={`inline-flex items-center justify-center rounded-xl border backdrop-blur-sm ${
                    isDark
                      ? "border-gray-600 text-gray-300 hover:bg-gray-800/50"
                      : "border-gray-300 text-gray-700 hover:bg-gray-100/50"
                  } px-8 py-4 text-base font-medium transition-all duration-200 shadow-lg hover:shadow-xl`}
                >
                  Learn More
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="w-full lg:w-1/2"
          >
            <div
              className={`relative overflow-hidden rounded-2xl ${
                isDark ? "bg-gray-800/40" : "bg-white/40"
              } p-6 shadow-2xl backdrop-blur-sm border ${isDark ? "border-gray-700/50" : "border-gray-300/50"}`}
            >
              <div className="space-y-6">
                {initialData.collections.map((collection, index) => (
                  <motion.div
                    key={collection.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 + index * 0.2 }}
                  >
                    <CollectionComponent
                      id={collection.id}
                      collection_name={collection.collection_name}
                      bg_color_hex={collection.bg_color_hex}
                      tasks={collection.tasks}
                      notes={collection.notes}
                      isPinned={collection.isPinned}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/*  CTA banner */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.2 }}
        className={`absolute bottom-0  w-full ${
          isDark ? "bg-orange-800/90" : "bg-orange-500/90"
        } py-6 sm:py-8 text-center text-white backdrop-blur-sm`}
      >
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="mb-2 sm:mb-4 text-xl sm:text-2xl md:text-3xl font-bold">
            The simplest way to manage your tasks
          </h2>
          <p className="text-sm sm:text-base md:text-lg opacity-90">
            Get organized and boost your productivity with LIST IT
          </p>
        </div>
      </motion.div>
    </section>
  );
};

//  Feature Card Component
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  delay = 0,
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -5, scale: 1.02 }}
      className={`rounded-xl p-4 sm:p-6 transition-all duration-300 backdrop-blur-sm border group ${
        isDark
          ? "bg-gray-800/50 hover:bg-gray-800/70 border-gray-700/50 hover:shadow-xl hover:shadow-gray-900/20"
          : "bg-white/50 hover:bg-white/70 border-gray-300/50 hover:shadow-xl hover:shadow-gray-300/20"
      }`}
    >
      <motion.div
        className="mb-3 sm:mb-4"
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ duration: 0.2 }}
      >
        {icon}
      </motion.div>
      <h3
        className={`mb-2 sm:mb-3 text-lg sm:text-xl font-semibold ${isDark ? "text-gray-100" : "text-gray-900"}`}
      >
        {title}
      </h3>
      <p
        className={`${isDark ? "text-gray-400" : "text-gray-600"} leading-relaxed text-sm sm:text-base`}
      >
        {description}
      </p>
    </motion.div>
  );
};

//  How It Works Card
interface HowItWorksCardProps {
  icon: React.FC<{ className?: string }>;
  title: string;
  description: string;
  step: number;
  delay?: number;
}

const HowItWorksCard: React.FC<HowItWorksCardProps> = ({
  icon: Icon,
  title,
  description,
  step,
  delay = 0,
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -5 }}
      className={`rounded-xl p-4 sm:p-6 border-2 transition-all duration-300 backdrop-blur-sm group relative overflow-hidden ${
        isDark
          ? "bg-gray-800/50 border-gray-700/50 hover:border-orange-500/50"
          : "bg-white/50 border-gray-300/50 hover:border-orange-500/50"
      }`}
    >
      {/* Step number */}
      <div
        className={`absolute top-3 sm:top-4 right-3 sm:right-4 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${
          isDark
            ? "bg-orange-900/50 text-orange-300"
            : "bg-orange-100 text-orange-600"
        }`}
      >
        {step}
      </div>

      {/* Subtle glow effect */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-gradient-to-br from-orange-500/20 to-transparent" />

      <motion.div
        className={`inline-flex rounded-xl p-2 sm:p-3 mb-3 sm:mb-4 relative z-10 ${
          isDark
            ? "bg-orange-900/30 text-orange-400"
            : "bg-orange-100 text-orange-600"
        }`}
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ duration: 0.2 }}
      >
        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
      </motion.div>

      <h3
        className={`mb-2 sm:mb-3 text-lg sm:text-xl font-semibold relative z-10 ${
          isDark ? "text-gray-100" : "text-gray-900"
        }`}
      >
        {title}
      </h3>

      <p
        className={`relative z-10 text-sm sm:text-base ${isDark ? "text-gray-400" : "text-gray-600"} leading-relaxed`}
      >
        {description}
      </p>
    </motion.div>
  );
};

//  Benefit Card Component
interface BenefitCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  delay?: number;
}

const BenefitCard: React.FC<BenefitCardProps> = ({
  title,
  description,
  icon,
  delay = 0,
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ x: 5 }}
      className={`flex items-start p-4 sm:p-6 rounded-xl shadow-lg backdrop-blur-sm border transition-all duration-300 ${
        isDark
          ? "bg-gray-800/50 border-gray-700/50 hover:bg-gray-800/70"
          : "bg-white/50 border-gray-300/50 hover:bg-white/70"
      }`}
    >
      <motion.div
        className={`flex-shrink-0 p-2 sm:p-3 mr-3 sm:mr-4 rounded-xl ${
          isDark
            ? "bg-orange-900/40 text-orange-400"
            : "bg-orange-100 text-orange-600"
        }`}
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ duration: 0.2 }}
      >
        {icon}
      </motion.div>
      <div>
        <h3
          className={`text-lg sm:text-xl font-semibold mb-1 sm:mb-2 ${isDark ? "text-gray-100" : "text-gray-900"}`}
        >
          {title}
        </h3>
        <p
          className={`${isDark ? "text-gray-400" : "text-gray-600"} leading-relaxed text-sm sm:text-base`}
        >
          {description}
        </p>
      </div>
    </motion.div>
  );
};

// Section Title Component
interface SectionTitleProps {
  title: string;
  highlight: string;
  description: string;
}

const SectionTitle: React.FC<SectionTitleProps> = ({
  title,
  highlight,
  description,
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="text-center mb-12 sm:mb-16"
    >
      <h2
        className={`text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3 sm:mb-4 ${
          isDark ? "text-gray-100" : "text-gray-900"
        }`}
      >
        {title}{" "}
        <span
          className={`${isDark ? "text-orange-400" : "text-orange-500"} relative`}
        >
          {highlight}
          <motion.div
            className="absolute -bottom-1 sm:-bottom-2 left-0 h-0.5 sm:h-1 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
            initial={{ width: 0 }}
            whileInView={{ width: "100%" }}
            transition={{ duration: 0.8, delay: 0.3 }}
          />
        </span>
      </h2>
      <p
        className={`max-w-2xl mx-auto text-base sm:text-lg md:text-xl px-4 ${isDark ? "text-gray-300" : "text-gray-600"}`}
      >
        {description}
      </p>
    </motion.div>
  );
};

//  Landing Page Component
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
      title: "Smart Collections",
      description:
        "Group related tasks with customizable color-coding for efficient organization and visual clarity.",
    },
    {
      icon: (
        <ListTodo
          className={`h-12 w-12 ${isDark ? "text-blue-400" : "text-blue-500"}`}
        />
      ),
      title: "Advanced Task Management",
      description:
        "Create, prioritize, and track tasks with rich descriptions, deadlines, and priority levels.",
    },
    {
      icon: (
        <Clock
          className={`h-12 w-12 ${isDark ? "text-purple-400" : "text-purple-500"}`}
        />
      ),
      title: "Smart Due Date Tracking",
      description:
        "Never miss deadlines with intelligent due date tracking and priority-based organization.",
    },
    {
      icon: (
        <StickyNote
          className={`h-12 w-12 ${isDark ? "text-green-400" : "text-green-500"}`}
        />
      ),
      title: "Rich Notes System",
      description:
        "Create color-coded, pinnable notes with rich formatting for important information and ideas.",
    },
  ];

  const benefits = [
    {
      icon: <Target className="h-8 w-8" />,
      title: "Stay Focused",
      description:
        "Organize your thoughts and tasks visually to maintain clarity and focus on what matters most.",
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Boost Productivity",
      description:
        "Streamline your workflow with intuitive organization tools that adapt to your working style.",
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Track Progress",
      description:
        "Monitor your achievements and productivity trends with intelligent analytics and insights.",
    },
  ];

  return (
    <div className="min-h-screen w-full">
      {/* Hero Section */}
      <Hero />

      {/* How It Works Section */}
      <section className="py-12 sm:py-16 lg:py-20 relative">
        {isDark ? (
          <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(135deg,#1a1a1a_0%,#232323_50%,#2a1810_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_center,rgba(251,146,60,0.05)_0%,transparent_70%)] before:content-['']" />
        ) : (
          <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(135deg,#f9fafb_0%,#ffffff_50%,#f3f4f6_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_center,rgba(251,146,60,0.03)_0%,transparent_70%)] before:content-['']" />
        )}

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title="How"
            highlight="LIST IT Works"
            description="A structured approach to task management with hierarchical organization"
          />

          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
            <HowItWorksCard
              icon={ListTodo}
              title="Create Lists"
              description="Start by creating lists to organize your workflow. Lists serve as containers that hold multiple collections for different projects or areas of your life."
              step={1}
              delay={0}
            />
            <HowItWorksCard
              icon={Folder}
              title="Add Collections"
              description="Within each list, create themed collections with custom colors. Collections group related tasks and notes for better visual organization."
              step={2}
              delay={0.2}
            />
            <HowItWorksCard
              icon={StickyNote}
              title="Manage Tasks & Notes"
              description="Inside collections, add priority tasks with due dates and create colorful notes for important information and reference materials."
              step={3}
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-20 relative">
        {isDark ? (
          <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(135deg,#1a0f12_0%,#2d1b20_50%,#1a0f12_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_center,rgba(59,130,246,0.05)_0%,transparent_70%)] before:content-['']" />
        ) : (
          <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(135deg,#f8f6f7_0%,#ffffff_50%,#f8f6f7_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_center,rgba(59,130,246,0.03)_0%,transparent_70%)] before:content-['']" />
        )}

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title="Everything You Need to"
            highlight="Stay Organized"
            description="Powerful features designed to boost your productivity and streamline your workflow"
          />

          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} delay={index * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="py-12 sm:py-16 lg:py-20 relative">
        {isDark ? (
          <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(135deg,#1a1a1a_0%,#232323_50%,#2a1810_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_center,rgba(59,130,246,0.05)_0%,transparent_70%)] before:content-['']" />
        ) : (
          <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(135deg,#f0f9ff_0%,#ffffff_50%,#f8fafc_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_center,rgba(59,130,246,0.03)_0%,transparent_70%)] before:content-['']" />
        )}

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title="See LIST IT in"
            highlight="Action"
            description="Experience our interactive demo to see how LIST IT can transform your productivity"
          />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="overflow-hidden rounded-xl sm:rounded-2xl shadow-2xl"
          >
            <div
              className={`p-4 sm:p-6 ${isDark ? "bg-gray-800/50" : "bg-white/50"} backdrop-blur-sm border ${isDark ? "border-gray-700/50" : "border-gray-300/50"}`}
            >
              <div className="space-y-4 sm:space-y-6">
                {initialData.collections.map((collection, index) => (
                  <motion.div
                    key={collection.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.2 }}
                  >
                    <CollectionComponent
                      id={collection.id}
                      collection_name={collection.collection_name}
                      bg_color_hex={collection.bg_color_hex}
                      tasks={collection.tasks}
                      notes={collection.notes}
                      isPinned={collection.isPinned}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 sm:py-16 lg:py-20 relative">
        {isDark ? (
          <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(135deg,#1a0f12_0%,#2d1b20_50%,#1a0f12_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_center,rgba(59,130,246,0.05)_0%,transparent_70%)] before:content-['']" />
        ) : (
          <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(135deg,#f8f6f7_0%,#ffffff_50%,#f8f6f7_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_center,rgba(59,130,246,0.03)_0%,transparent_70%)] before:content-['']" />
        )}

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title="Work Smarter"
            highlight="Not Harder"
            description="Discover how LIST IT can transform your productivity and simplify your workflow"
          />

          <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
            {benefits.map((benefit, index) => (
              <BenefitCard key={index} {...benefit} delay={index * 0.2} />
            ))}
          </div>
        </div>
      </section>

      {/*  CTA Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className={`py-12 sm:py-16 lg:py-20 text-white relative overflow-hidden ${
          isDark ? "bg-orange-800/90" : "bg-orange-500/90"
        } backdrop-blur-sm`}
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-white/10 to-transparent rounded-full"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-white/10 to-transparent rounded-full"
          />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mx-auto max-w-3xl text-center"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4 sm:mb-6">
              Ready to Transform Your Productivity?
            </h2>
            <p className="text-base sm:text-lg md:text-xl opacity-90 mb-6 sm:mb-8 px-4">
              Join thousands of users who have already streamlined their
              workflow with LIST IT. Start organizing your tasks today!
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col justify-center space-y-4 sm:flex-row sm:space-x-6 sm:space-y-0"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/register"
                  className={`inline-flex items-center justify-center rounded-xl ${
                    isDark
                      ? "bg-gray-800 text-orange-400 hover:bg-gray-700"
                      : "bg-white text-orange-500 hover:bg-gray-100"
                  } px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl backdrop-blur-sm w-full sm:w-auto`}
                >
                  Get Started - It&apos;s Free!
                  <Users className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/aboutus"
                  className="inline-flex items-center justify-center rounded-xl border-2 border-white/30 text-white hover:bg-white/10 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold transition-all duration-200 backdrop-blur-sm w-full sm:w-auto"
                >
                  Learn More
                  <Shield className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </motion.div>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-sm opacity-80"
            >
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Secure & Private
              </div>
              <div className="flex items-center">
                <Rocket className="h-4 w-4 mr-2" />
                Always Free
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
};

export default LandingPage;
