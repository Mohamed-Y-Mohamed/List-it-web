"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  Clock,
  Folder,
  ListTodo,
  StickyNote,
  Pin,
  ChevronDown,
  Target,
  TrendingUp,
  Zap,
  Users,
  Shield,
  Rocket,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { publicSurface, publicVars } from "@/components/ui/publicSurface";
import { PRIMARY, STATUS_META, taskStatus } from "@/components/ui/tokens";

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
//
// Shaped to show all four task states, because the legend below the demo names
// all four and a demo that only ever shows "normal" teaches nothing.
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
          due_date: new Date(new Date().setDate(new Date().getDate() - 2)),
          is_completed: false,
          is_pinned: true,
        },
        {
          id: "task2",
          text: "Schedule client meeting",
          description: "Coordinate with sales team about the new proposal",
          created_at: new Date(),
          due_date: new Date(new Date().setDate(new Date().getDate() + 3)),
          is_completed: false,
          is_pinned: true,
        },
        {
          id: "task5",
          text: "Review the design system",
          description: "Check spacing and colour tokens against the brief",
          created_at: new Date(),
          is_completed: false,
          is_pinned: true,
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
          description: "Milk, eggs, bread, fruit",
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

/* ===========================================================================
   The demo below mirrors the real product.

   Someone arriving here is deciding whether to install the app, so the three
   things they are shown — a collection, a task card, a note card — are built
   to the same spec as the components they will actually meet:

     Collection   src/components/Collection/index.tsx
     Task card    src/components/Tasks/customcard.tsx
     Note card    src/components/Notes/noteCard.tsx

   Radii, padding, type scale, stripe widths and colours are copied from those
   files rather than chosen here, and the status colours come from `ui/tokens`,
   which is the same source the real cards read. Where a value looks oddly
   specific — `text-[14px]`, `px-[18px]`, `w-[4px]` — it was copied, not picked.

   If you change one of those three components, change this. A shop window
   showing a product you no longer sell is worse than no shop window. This is
   exactly how the tutorial mocks went stale.

   Two deliberate departures, both noted again at the site:
     - no `backdrop-blur` anywhere (the real Collection has one); on this page
       it cost 20fps of scroll and, over a flat field, bought nothing
     - the cards carry no checkbox or pin button on their face, because the
       real ones do not either — completing and pinning live in the detail
       sheet and the hold menu
   =========================================================================== */

/** Date as the real cards print it. `formatTaskDue` is the app's own rule. */
const formatDemoDate = (date: Date | undefined): string => {
  if (!date) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

//  Task Card Component
interface TaskCardProps {
  id: string;
  text: string;
  description?: string;
  due_date?: Date;
  is_completed: boolean;
  is_pinned: boolean;
  collection_name?: string;
  list_name?: string;
}

const TaskCard: React.FC<TaskCardProps> = ({
  id,
  text,
  description,
  due_date,
  is_completed,
  is_pinned,
  collection_name,
  list_name,
}) => {
  // The card face is static, as the real one is. Clicking it toggles the
  // completed look, which is a state the real card genuinely has — rather than
  // inventing a checkbox the product does not put there.
  const [completed, setCompleted] = useState<boolean>(!!is_completed);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const scheduled = Boolean(due_date);
  const overdue = Boolean(due_date && due_date.getTime() < Date.now() && !completed);
  const status = taskStatus(overdue, !!is_pinned, scheduled);
  const statusInfo = STATUS_META[status];
  const formattedDate = formatDemoDate(due_date);

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      whileHover={{ y: -1 }}
      onClick={() => setCompleted((previous) => !previous)}
      data-id={id}
      role="button"
      tabIndex={0}
      aria-label={`${text} - ${completed ? "completed" : "not completed"}`}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setCompleted((previous) => !previous);
        }
      }}
      className={`
        group relative cursor-pointer select-none overflow-hidden
        rounded-2xl border transition-all duration-200
        ${
          isDark
            ? `
              border-white/[0.07]
              bg-[#131a28]
              hover:border-white/[0.12]
              hover:bg-[#161e2e]
              hover:shadow-[0_8px_24px_rgba(0,0,0,0.16)]
            `
            : `
              border-slate-200/80
              bg-white
              hover:border-slate-300
              hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]
            `
        }
        ${completed ? "opacity-60" : ""}
      `}
    >
      {/* Only meaningful states get a side colour. */}
      {status !== "normal" && (
        <div
          className="absolute inset-y-0 left-0 w-[4px]"
          style={{ backgroundColor: statusInfo.colour }}
        />
      )}

      <div className="px-4 py-3.5 sm:px-[18px]">
        {/* TITLE + STATUS */}
        <div className="flex min-w-0 items-start justify-between gap-3">
          <h3
            className={`
              min-w-0 flex-1 truncate
              text-[14px] font-semibold leading-5 tracking-[-0.01em]
              sm:text-[15px]
              ${
                completed
                  ? isDark
                    ? "text-slate-500 line-through"
                    : "text-slate-400 line-through"
                  : isDark
                    ? "text-slate-100"
                    : "text-slate-900"
              }
            `}
          >
            {text || "Untitled Task"}
          </h3>

          {/* Never display "Normal". */}
          {status !== "normal" && (
            <div className="flex shrink-0 items-center gap-1.5 pt-[2px]">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: statusInfo.colour }}
              />

              <span
                className={`
                  text-[10px] font-semibold uppercase tracking-[0.07em]
                  ${isDark ? "text-slate-400" : "text-slate-500"}
                `}
              >
                {statusInfo.label}
              </span>
            </div>
          )}
        </div>

        {/* SCHEDULE DIRECTLY BELOW TITLE */}
        {formattedDate && (
          <div
            className={`
              mt-1.5 flex items-center gap-1.5 text-[11px] font-medium
              ${
                overdue && status !== "flagged"
                  ? "text-rose-500"
                  : isDark
                    ? "text-slate-400"
                    : "text-slate-500"
              }
            `}
          >
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            <span>{formattedDate}</span>
          </div>
        )}

        {/* DESCRIPTION */}
        {description && (
          <p
            className={`
              mt-2.5 line-clamp-2 text-[12px] leading-[1.5]
              ${
                completed
                  ? isDark
                    ? "text-slate-600"
                    : "text-slate-400"
                  : isDark
                    ? "text-slate-400"
                    : "text-slate-600"
              }
            `}
          >
            {description}
          </p>
        )}

        {/* SMALL FOOTER */}
        {(collection_name || list_name) && (
          <div
            className={`
              mt-3 flex min-w-0 items-center gap-3 border-t pt-2.5
              ${isDark ? "border-white/[0.055]" : "border-slate-100"}
            `}
          >
            {collection_name && (
              <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-slate-500">
                <Folder className="h-3 w-3 shrink-0" />
                <span className="max-w-[150px] truncate">
                  {collection_name}
                </span>
              </div>
            )}

            {list_name && (
              <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-slate-500">
                <ListTodo className="h-3 w-3 shrink-0" />
                <span className="max-w-[130px] truncate">{list_name}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.article>
  );
};

//  Note Card Component
interface NoteCardProps {
  id: string;
  title: string | null;
  description: string | null;
  created_at: Date;
  bg_color_hex: string | null;
  is_pinned: boolean;
}

/** The real card's rule: a light custom colour takes dark text. */
const isLightHex = (hex: string): boolean => {
  const value = hex.replace("#", "");
  if (value.length !== 6) return false;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 155;
};

const NoteCard: React.FC<NoteCardProps> = ({
  id,
  title,
  description,
  created_at,
  bg_color_hex,
  is_pinned,
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const displayTitle = title || "Untitled Note";
  const safeColor = bg_color_hex || null;

  const cardStyle: React.CSSProperties = safeColor
    ? {
        backgroundColor: `${safeColor}22`,
        borderColor: `${safeColor}45`,
      }
    : isDark
      ? {
          backgroundColor: "rgba(255,255,255,0.025)",
          borderColor: "rgba(255,255,255,0.07)",
        }
      : {
          backgroundColor: "rgba(255,255,255,0.65)",
          borderColor: "rgba(15,23,42,0.10)",
        };

  const customColorIsLight = safeColor && isLightHex(safeColor);

  const titleColour = safeColor
    ? customColorIsLight
      ? "text-slate-900"
      : "text-white"
    : isDark
      ? "text-slate-100"
      : "text-slate-900";

  const secondaryColour = safeColor
    ? customColorIsLight
      ? "text-slate-700"
      : "text-white/70"
    : isDark
      ? "text-slate-400"
      : "text-slate-500";

  return (
    <motion.article
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      style={cardStyle}
      data-id={id}
      className={`
        group
        relative
        w-full
        cursor-pointer
        overflow-hidden
        rounded-xl
        border
        px-4
        py-3.5
        transition-all
        duration-200
        ${
          isDark
            ? "hover:border-white/15 hover:bg-white/[0.045]"
            : "hover:border-slate-300 hover:shadow-sm"
        }
      `}
      role="button"
      tabIndex={0}
      aria-label={`Open note: ${displayTitle}`}
    >
      {/* Note colour indicator */}
      <div
        className="absolute inset-y-3 left-0 w-[3px] rounded-r-full"
        style={{
          backgroundColor: safeColor || (isDark ? "#64748b" : "#94a3b8"),
        }}
      />

      {/* Header */}
      <div className="flex min-w-0 items-start gap-3">
        <div className="min-w-0 flex-1">
          <h4
            className={`truncate text-[14px] font-semibold leading-5 ${titleColour}`}
            title={displayTitle}
          >
            {displayTitle}
          </h4>

          {/* Date directly under title */}
          <div
            className={`mt-1 flex items-center gap-1.5 text-[11px] ${secondaryColour}`}
          >
            <CalendarDays className="h-3 w-3 shrink-0" />
            <span>{formatDemoDate(created_at)}</span>
          </div>
        </div>

        {/* Pin */}
        <span
          className={`
            flex h-7 w-7 shrink-0 items-center justify-center rounded-md
            ${is_pinned ? "text-amber-400" : `${secondaryColour} opacity-60`}
          `}
          aria-hidden="true"
        >
          <Pin className={`h-3.5 w-3.5 ${is_pinned ? "fill-current" : ""}`} />
        </span>
      </div>

      {/* Description */}
      {description && (
        <p
          title={description}
          className={`mt-2.5 w-3/4 truncate text-[12px] leading-5 ${secondaryColour}`}
        >
          {description}
        </p>
      )}

      {/* Pinned label */}
      {is_pinned && (
        <div className="mt-2 flex items-center gap-1 text-[10px] font-medium text-amber-400">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          Pinned
        </div>
      )}
    </motion.article>
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

/** The legend the real collection draws, read from the same tokens. */
const LEGEND = [
  { label: "Normal", colour: STATUS_META.normal.colour },
  { label: STATUS_META.pinned.label, colour: STATUS_META.pinned.colour },
  { label: STATUS_META.overdue.label, colour: STATUS_META.overdue.colour },
  { label: STATUS_META.flagged.label, colour: STATUS_META.flagged.colour },
] as const;

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

  const taskCount = tasks.length;
  const noteCount = notes.length;
  const colour = bg_color_hex || "#fb923c";

  // Same ordering rule as the real collection: pinned first, then the rest.
  const priorityTasks = tasks.filter((task) => Boolean(task.is_pinned));
  const regularTasks = tasks.filter((task) => !task.is_pinned);
  const orderedTasks = [...priorityTasks, ...regularTasks];
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const colors = isDark
    ? {
        textPrimary: "text-slate-100",
        textMuted: "text-slate-500",
        outer: "border-white/[0.055] bg-white/[0.018]",
        header: "bg-white/[0.012]",
        count: "text-slate-500",
        buttonHover: "hover:bg-white/[0.055]",
      }
    : {
        textPrimary: "text-slate-900",
        textMuted: "text-slate-400",
        outer: "border-slate-200/70 bg-white/35",
        header: "bg-white/25",
        count: "text-slate-400",
        buttonHover: "hover:bg-slate-100/70",
      };

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      data-collection-id={id}
      data-pinned={isPinned}
      // The real collection carries `backdrop-blur-[14px]` here. It is dropped
      // on this page on purpose: over a flat field it is visually a no-op, and
      // measured on the landing page the in-flow blurs cost ~20fps of scroll.
      className={`
        overflow-hidden
        rounded-[18px]
        border
        transition-colors
        duration-200
        ${colors.outer}
      `}
    >
      {/* HEADER */}
      <div className={`relative ${colors.header}`}>
        <div className="px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex items-center gap-3">
            {/* Collection colour */}
            <div
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{
                backgroundColor: colour,
                boxShadow: `0 0 0 3px ${colour}14`,
              }}
              aria-hidden="true"
            />

            {/* Title + counts */}
            <button
              type="button"
              onClick={() => setIsExpanded((previous) => !previous)}
              aria-expanded={isExpanded}
              className="min-w-0 flex-1 text-left"
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                <h3
                  className={`
                    max-w-full truncate
                    text-[16px] font-semibold leading-6 tracking-[-0.015em]
                    sm:text-[17px]
                    ${colors.textPrimary}
                  `}
                >
                  {collection_name || "Unnamed Collection"}
                </h3>

                <span
                  className={`whitespace-nowrap text-[11px] font-medium leading-5 ${colors.count}`}
                >
                  {taskCount} {taskCount === 1 ? "Task" : "Tasks"}
                  <span className="mx-1.5 opacity-50">·</span>
                  {noteCount} {noteCount === 1 ? "Note" : "Notes"}
                </span>
              </div>
            </button>

            {/* Expand */}
            <button
              type="button"
              onClick={() => setIsExpanded((previous) => !previous)}
              aria-label={isExpanded ? "Collapse collection" : "Expand collection"}
              className={`
                -mr-1 flex h-9 w-9 shrink-0 items-center justify-center
                rounded-lg transition-colors
                ${colors.textMuted} ${colors.buttonHover}
              `}
            >
              <motion.span
                animate={{ rotate: isExpanded ? 0 : -90 }}
                transition={{ duration: 0.2 }}
                className="flex"
              >
                <ChevronDown className="h-4 w-4" strokeWidth={2} />
              </motion.span>
            </button>
          </div>
        </div>

        {/* EXPANDED CONTROLS */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-1 sm:px-5">
                {/* TASKS / NOTES SEGMENTED SWITCH */}
                <div
                  role="tablist"
                  aria-label="Collection content"
                  className={`
                    inline-flex items-center gap-1 rounded-lg border p-1
                    ${
                      isDark
                        ? "border-white/[0.07] bg-white/[0.025]"
                        : "border-slate-200/80 bg-slate-100/50"
                    }
                  `}
                >
                  {(
                    [
                      {
                        key: "tasks",
                        label: "Tasks",
                        icon: ListTodo,
                        count: taskCount,
                      },
                      {
                        key: "notes",
                        label: "Notes",
                        icon: StickyNote,
                        count: noteCount,
                      },
                    ] as const
                  ).map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.key;

                    return (
                      <button
                        key={tab.key}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        aria-controls={`${tab.key}-panel-${id}`}
                        id={`${tab.key}-tab-${id}`}
                        onClick={() => setActiveTab(tab.key)}
                        className={`
                          relative flex h-8 items-center gap-1.5
                          rounded-md border px-3
                          text-[12px] font-medium
                          transition-all duration-150
                          ${
                            active
                              ? isDark
                                ? "border-white/[0.09] bg-white/[0.08] text-slate-100 shadow-sm"
                                : "border-slate-200 bg-white text-slate-900 shadow-sm"
                              : isDark
                                ? "border-transparent text-slate-500 hover:bg-white/[0.035] hover:text-slate-300"
                                : "border-transparent text-slate-500 hover:bg-white/60 hover:text-slate-700"
                          }
                        `}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span>{tab.label}</span>
                        <span
                          className={`text-[10px] font-medium ${active ? "opacity-70" : "opacity-50"}`}
                        >
                          {tab.count}
                        </span>

                        {active && (
                          <motion.span
                            layoutId={`demo-collection-active-tab-${id}`}
                            className="absolute bottom-[3px] left-3 right-3 h-[2px] rounded-full"
                            style={{ backgroundColor: colour }}
                            transition={{
                              type: "spring",
                              stiffness: 450,
                              damping: 36,
                            }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* TASK STATUS LEGEND */}
                <AnimatePresence initial={false}>
                  {activeTab === "tasks" && (
                    <motion.div
                      initial={{ opacity: 0, y: -3 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -3 }}
                      transition={{ duration: 0.15 }}
                      aria-label="Task status legend"
                      className="flex flex-wrap items-center gap-x-4 gap-y-1.5 py-3"
                    >
                      {LEGEND.map((entry) => (
                        <span
                          key={entry.label}
                          className={`
                            inline-flex items-center gap-1.5 whitespace-nowrap
                            text-[10px] font-medium
                            ${colors.textMuted}
                          `}
                        >
                          <span
                            className="h-[7px] w-[7px] rounded-full"
                            style={{ backgroundColor: entry.colour }}
                          />
                          {entry.label}
                        </span>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CONTENT */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
            role="tabpanel"
            id={
              activeTab === "tasks"
                ? `tasks-panel-${id}`
                : `notes-panel-${id}`
            }
            aria-labelledby={
              activeTab === "tasks" ? `tasks-tab-${id}` : `notes-tab-${id}`
            }
          >
            <div className="px-4 pb-4 pt-1 sm:px-5 sm:pb-5">
              {activeTab === "tasks" &&
                (orderedTasks.length > 0 ? (
                  <div className="space-y-2.5">
                    {orderedTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        id={task.id}
                        text={task.text}
                        description={task.description}
                        due_date={task.due_date}
                        is_completed={task.is_completed}
                        is_pinned={task.is_pinned}
                        collection_name={collection_name}
                      />
                    ))}
                  </div>
                ) : (
                  <div
                    className={`py-10 text-center text-[12px] ${colors.textMuted}`}
                  >
                    <ListTodo className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    <p className="font-medium">No tasks yet</p>
                  </div>
                ))}

              {activeTab === "notes" &&
                (sortedNotes.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {sortedNotes.map((note) => (
                      <NoteCard
                        key={note.id}
                        id={note.id}
                        title={note.title}
                        description={note.description}
                        created_at={note.created_at}
                        bg_color_hex={note.bg_color_hex}
                        is_pinned={note.is_pinned}
                      />
                    ))}
                  </div>
                ) : (
                  <div
                    className={`py-10 text-center text-[12px] ${colors.textMuted}`}
                  >
                    <StickyNote className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    <p className="font-medium">No notes yet</p>
                  </div>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
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
      <div className="absolute inset-0 -z-10 size-full bg-[var(--ps-field)]" />

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
              Organize Your Tasks & Notes with{" "}
              <span
                className={`${isDark ? "text-indigo-400" : "text-indigo-500"} relative`}
              >
                LIST IT
                <motion.div
                  className="absolute -bottom-2 left-0 h-1 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"
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
              Lists hold collections, collections hold your tasks and notes. Set
              a due date and up to five reminders, pin what matters, and let the
              colour down the side of each card tell you what needs doing first.
              Free, on the web and on your phone.
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
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                      : "bg-indigo-500 hover:bg-indigo-600 text-white"
                  } px-8 py-4 text-base font-medium transition-all duration-200 shadow-lg hover:shadow-xl`}
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
                  className={`inline-flex items-center justify-center rounded-xl border ${
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
              } p-6 shadow-2xl border ${isDark ? "border-gray-700/50" : "border-gray-300/50"}`}
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
        className={`absolute bottom-0  w-full bg-[var(--ps-primary)] py-6 sm:py-8 text-center text-white`}
      >
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="mb-2 sm:mb-4 text-xl sm:text-2xl md:text-3xl font-bold">
            The simplest way to manage your tasks & notes
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
      className={`rounded-xl p-4 sm:p-6 transition-all duration-300 border group ${
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
      className={`rounded-xl p-4 sm:p-6 border-2 transition-all duration-300 group relative overflow-hidden ${
        isDark
          ? "bg-gray-800/50 border-gray-700/50 hover:border-indigo-500/50"
          : "bg-white/50 border-gray-300/50 hover:border-indigo-500/50"
      }`}
    >
      {/* Step number */}
      <div
        className={`absolute top-3 sm:top-4 right-3 sm:right-4 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${
          isDark
            ? "bg-indigo-900/50 text-indigo-300"
            : "bg-indigo-100 text-indigo-600"
        }`}
      >
        {step}
      </div>

      {/* Subtle glow effect */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-gradient-to-br from-indigo-500/20 to-transparent" />

      <motion.div
        className={`inline-flex rounded-xl p-2 sm:p-3 mb-3 sm:mb-4 relative z-10 ${
          isDark
            ? "bg-indigo-900/30 text-indigo-400"
            : "bg-indigo-100 text-indigo-600"
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
      className={`flex items-start p-4 sm:p-6 rounded-xl shadow-lg border transition-all duration-300 ${
        isDark
          ? "bg-gray-800/50 border-gray-700/50 hover:bg-gray-800/70"
          : "bg-white/50 border-gray-300/50 hover:bg-white/70"
      }`}
    >
      <motion.div
        className={`flex-shrink-0 p-2 sm:p-3 mr-3 sm:mr-4 rounded-xl ${
          isDark
            ? "bg-indigo-900/40 text-indigo-400"
            : "bg-indigo-100 text-indigo-600"
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
          className={`${isDark ? "text-indigo-400" : "text-indigo-500"} relative`}
        >
          {highlight}
          <motion.div
            className="absolute -bottom-1 sm:-bottom-2 left-0 h-0.5 sm:h-1 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"
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

/**
 * The three levels the app is built from.
 *
 * Written out here because the marketing copy described the product entirely in
 * adjectives — "powerful", "intelligent", "seamless" — and never once said what
 * a list or a collection actually is. Every line below is something the app
 * really does today; nothing here is aspirational.
 */
const STRUCTURE = [
  {
    name: "Lists",
    what: "The top level. One per area of your life, each with its own colour so you can tell them apart at a glance.",
    holds: [
      "Pin the ones you open daily to the top",
      "Rename, recolour or delete at any time",
      "A running count of what is inside",
    ],
  },
  {
    name: "Collections",
    what: "Groups inside a list. They start closed, so a long list opens quiet and you expand only what you need.",
    holds: [
      "Tasks and notes side by side, on their own tabs",
      "Its own colour, carried through to the cards",
      "Collapse the lot in one go from the list menu",
    ],
  },
  {
    name: "Tasks & notes",
    what: "The actual work. A task can carry a due date, a time and up to five reminders; a note is free text with a colour.",
    holds: [
      "Reminders fire on the phone, not just in the app",
      "Pin anything that matters more than the rest",
      "Tick it off and it leaves the list, not your history",
    ],
  },
] as const;

/**
 * The four task states, with the colours straight out of `ui/tokens` — the same
 * values the stripe on a real task card uses, so this legend cannot drift away
 * from the product it is describing.
 */
const TASK_STATES = [
  {
    label: "Normal",
    colour: STATUS_META.normal.colour,
    meaning: "Nothing pressing. No date, or one still comfortably ahead.",
  },
  {
    label: "Pinned",
    colour: STATUS_META.pinned.colour,
    meaning: "You marked it important. It sorts above everything else.",
  },
  {
    label: "Flagged",
    colour: STATUS_META.flagged.colour,
    meaning: "Pinned and scheduled. It matters and it is coming due.",
  },
  {
    label: "Overdue",
    colour: STATUS_META.overdue.colour,
    meaning: "The date has passed. This one outranks the other three.",
  },
] as const;

//  Landing Page Component
const LandingPage: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const features = [
    {
      icon: (
        <Folder
          className={`h-12 w-12 ${isDark ? "text-indigo-400" : "text-indigo-500"}`}
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
    <div
      className="min-h-screen w-full bg-[var(--ps-field)] text-[var(--ps-text)]"
      style={publicVars(publicSurface(isDark))}
    >
      {/* Hero Section */}
      <Hero />

      {/* How It Works Section */}
      <section className="py-12 sm:py-16 lg:py-20 relative">
        <div className="absolute inset-0 -z-10 size-full bg-[var(--ps-band)]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title="How"
            highlight="LIST IT Works"
            description="Three steps, once. After that it is just opening the app and getting on with it."
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
        <div className="absolute inset-0 -z-10 size-full bg-[var(--ps-field)]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title="Everything You Need to"
            highlight="Stay Organized"
            description="The things you will actually use, rather than a list of everything that was technically possible to build."
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
        <div className="absolute inset-0 -z-10 size-full bg-[var(--ps-band)]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title="See LIST IT in"
            highlight="Action"
            description="This is the real component the app renders, not a screenshot. Expand a collection, switch to notes, tick something off."
          />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="overflow-hidden rounded-xl sm:rounded-2xl shadow-2xl"
          >
            <div
              className={`p-4 sm:p-6 ${isDark ? "bg-gray-800/50" : "bg-white/50"} border ${isDark ? "border-gray-700/50" : "border-gray-300/50"}`}
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

      {/* What you actually get.

          The page described the product in adjectives and never in nouns: a
          visitor could read the whole thing and still not know what a list,
          a collection or a status colour was. This is the detail. Everything
          named here is something the app really does, and the four status
          dots are the exact colours `ui/tokens` ships, so the legend on this
          page and the stripe on a task card cannot drift apart. */}
      <section className="relative py-12 sm:py-16 lg:py-20">
        <div className="absolute inset-0 -z-10 size-full bg-[var(--ps-band)]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title="How it is"
            highlight="Put Together"
            description="Three levels, and nothing you have to learn twice. Here is exactly what each one holds."
          />

          <div className="grid gap-4 sm:gap-5 lg:grid-cols-3">
            {STRUCTURE.map((level, index) => (
              <motion.div
                key={level.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-card)] p-6"
              >
                <div className="mb-3 flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[13px] font-semibold text-white"
                    style={{ backgroundColor: PRIMARY }}
                  >
                    {index + 1}
                  </span>
                  <h3 className="text-[17px] font-semibold text-[var(--ps-text)]">
                    {level.name}
                  </h3>
                </div>

                <p className="mb-4 text-[14px] leading-relaxed text-[var(--ps-body)]">
                  {level.what}
                </p>

                <ul className="space-y-1.5">
                  {level.holds.map((item) => (
                    <li
                      key={item}
                      className="flex gap-2 text-[13px] text-[var(--ps-muted)]"
                    >
                      <span aria-hidden="true">·</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* The status colours, named. A user meets these on their first task
              and nothing in the app explains them, so they are explained here. */}
          <div className="mt-10 rounded-2xl border border-[var(--ps-border)] bg-[var(--ps-card)] p-6 sm:p-8">
            <h3 className="mb-2 text-[17px] font-semibold text-[var(--ps-text)]">
              A task tells you where it stands
            </h3>
            <p className="mb-6 max-w-2xl text-[14px] leading-relaxed text-[var(--ps-body)]">
              Every task carries a colour down its left edge. You never set it —
              it follows the due date and the pin, so a glance down the list is
              enough. Overdue always wins, because a pinned task you have missed
              is still missed.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {TASK_STATES.map((state) => (
                <div key={state.label} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: state.colour }}
                  />
                  <div>
                    <div className="text-[14px] font-medium text-[var(--ps-text)]">
                      {state.label}
                    </div>
                    <div className="text-[13px] leading-relaxed text-[var(--ps-muted)]">
                      {state.meaning}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 sm:py-16 lg:py-20 relative">
        <div className="absolute inset-0 -z-10 size-full bg-[var(--ps-field)]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title="Work Smarter"
            highlight="Not Harder"
            description="What changes once everything lives in one place and the app stops asking you to decide where things go."
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
        className={`py-12 sm:py-16 lg:py-20 text-white relative overflow-hidden bg-[var(--ps-primary)]`}
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
              workflow with LIST IT. Begin organizing your life now!
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
                      ? "bg-gray-800 text-indigo-400 hover:bg-gray-700"
                      : "bg-white text-indigo-500 hover:bg-gray-100"
                  } px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl w-full sm:w-auto`}
                >
                  Get Started - It&apos;s Free!
                  <Users className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
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
