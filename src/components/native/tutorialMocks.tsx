"use client";

// The illustrations for the tutorial: miniatures of the real screens, with an
// arrow pointing at the control each step is about.
//
// Screenshots were the obvious alternative and were rejected — they need
// recapturing in both themes every time the interface moves, they add megabytes
// to the APK, and a stale one teaches the wrong thing with total confidence.
//
// Fidelity comes from building each mock at real phone width and scaling the
// whole thing down, rather than hand-picking tiny font sizes. The markup below
// is lifted from the components it depicts — NativeHome, ListDetailView,
// ListFilter, Collection, TaskCard, NoteCard — so proportions, radii, colours
// and wording match what the user is about to see. Where a value looks oddly
// specific it was copied, not chosen.
//
// If you change one of those components, change its mock. A walkthrough that
// points at a button which has moved is worse than no walkthrough.

import React from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  CheckCircle,
  ChevronDown,
  Clipboard,
  ClipboardList,
  Clock,
  Edit3,
  Folder,
  ListChecks,
  ListTodo,
  Pin,
  Plus,
  PlusCircle,
  Search,
  Star,
  StickyNote,
  Trash2,
} from "lucide-react";

interface MockProps {
  isDark: boolean;
}

// Mocks are laid out at a real phone's width and scaled to fit the tutorial
// card, so every size inside them is the size the real screen uses.
const PHONE_WIDTH = 360;
const FRAME_WIDTH = 296;
const SCALE = FRAME_WIDTH / PHONE_WIDTH;

/**
 * A slab standing in for the phone screen. Children are written at 360px and
 * scaled as one block, which keeps the arrow's coordinates in the same space as
 * the markup it points at.
 */
function Screen({
  isDark,
  height,
  background,
  children,
}: MockProps & {
  /** Unscaled height, in the same 360px-wide space as the children. */
  height: number;
  background?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`overflow-hidden rounded-[18px] border ${
        isDark ? "border-white/10" : "border-black/10 shadow-sm"
      }`}
      style={{ width: FRAME_WIDTH, height: height * SCALE }}
    >
      <div
        className="relative"
        style={{
          width: PHONE_WIDTH,
          height,
          transform: `scale(${SCALE})`,
          transformOrigin: "top left",
          background:
            background ?? (isDark ? "#030712" : "#ffffff"),
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * The arrow, plus a ring around whatever it lands on.
 *
 * Coordinates are the centre of the target in unscaled phone space. `from` says
 * which side the arrow sweeps in from, so it can always approach across empty
 * screen rather than over the thing it is trying to show.
 */
function Pointer({
  x,
  y,
  from,
  radius = 22,
}: {
  x: number;
  y: number;
  from: "bottom-left" | "bottom-right" | "top-left" | "left";
  radius?: number;
}) {
  const reach = 74;
  const down = from.startsWith("bottom");
  const right = from.endsWith("right");

  // Start well clear of the ring, then curve in. The control point is pushed out
  // sideways so the line arcs rather than arriving as a straight poke.
  const startX = right ? x + reach : x - reach;
  const startY = down ? y + reach : y - reach;
  const endX = right ? x + radius + 5 : x - radius - 5;
  const endY = down ? y + radius * 0.6 : y - radius * 0.6;
  const controlX = right ? x + reach * 0.95 : x - reach * 0.95;
  const controlY = down ? y + radius * 0.4 : y - radius * 0.4;

  return (
    <>
      <motion.span
        className="pointer-events-none absolute rounded-full border-[3px] border-blue-500"
        style={{
          left: x - radius,
          top: y - radius,
          width: radius * 2,
          height: radius * 2,
        }}
        animate={{ opacity: [0.35, 1, 0.35], scale: [0.94, 1.06, 0.94] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <svg
        className="pointer-events-none absolute inset-0"
        width={PHONE_WIDTH}
        height="100%"
        aria-hidden="true"
      >
        <defs>
          <marker
            id={`tip-${x}-${y}`}
            markerWidth="7"
            markerHeight="7"
            refX="5.4"
            refY="3.5"
            orient="auto"
          >
            <path d="M0,0 L7,3.5 L0,7 z" className="fill-blue-500" />
          </marker>
        </defs>
        <motion.path
          d={`M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`}
          className="stroke-blue-500"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          markerEnd={`url(#tip-${x}-${y})`}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
        />
      </svg>
    </>
  );
}

// ---------------------------------------------------------------------------
// Home — copied from NativeHome
// ---------------------------------------------------------------------------

/** The squircle icon chip from listVisuals.ListIcon, at its real 34px. */
function ListIconChip({
  color,
  size = 34,
  Icon = ListChecks,
}: {
  color: string;
  size?: number;
  Icon?: typeof ListChecks;
}) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-[11px]"
      style={{
        width: size,
        height: size,
        backgroundImage: `linear-gradient(140deg, ${color} 0%, ${color}cc 100%)`,
        boxShadow: `0 2px 6px ${color}40`,
      }}
    >
      <Icon
        size={Math.round(size * 0.5)}
        className="text-white"
        strokeWidth={2.2}
      />
    </span>
  );
}

/** A grid card, matching NativeListCard's grid variant. */
function GridCard({
  isDark,
  color,
  name,
  counts,
  Icon,
}: MockProps & {
  color: string;
  name: string;
  /** Default lists hide their counts, exactly as ListInfo does. */
  counts?: string;
  Icon?: typeof ListChecks;
}) {
  const surface = isDark ? "#0b0f17" : "#ffffff";

  return (
    <div
      className={`flex h-[112px] w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border px-2 py-3 ${
        isDark ? "text-white" : "text-gray-900"
      }`}
      style={{
        backgroundImage: `linear-gradient(${surface}, ${surface}), linear-gradient(160deg, ${color}${
          isDark ? "26" : "14"
        }, ${color}00 65%)`,
        backgroundOrigin: "border-box",
        backgroundClip: "padding-box, border-box",
        borderColor: `${color}${isDark ? "3d" : "2e"}`,
        boxShadow: isDark
          ? "0 1px 2px rgba(0,0,0,0.5)"
          : "0 1px 2px rgba(16,24,40,0.05), 0 4px 10px -4px rgba(16,24,40,0.08)",
      }}
    >
      <ListIconChip color={color} Icon={Icon} />
      <span className="flex min-w-0 flex-col items-center">
        <span className="line-clamp-2 text-center text-[13.5px] font-semibold leading-snug tracking-[-0.01em]">
          {name}
        </span>
        {counts && (
          <span className="mt-1 text-[10.5px] font-medium tracking-[0.01em] text-gray-500 dark:text-gray-400">
            {counts}
          </span>
        )}
      </span>
    </div>
  );
}

/** The Lists screen: greeting, plus button, search, heading, grid. */
function HomeScreen({ isDark }: MockProps) {
  return (
    <div className={isDark ? "text-white" : "text-gray-900"}>
      <div className="flex items-start justify-between gap-3 px-4 pt-3">
        <div className="min-w-0">
          <p
            className={`text-[13px] font-medium ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Welcome back 👋
          </p>
          <h1 className="truncate text-[24px] font-bold leading-tight tracking-[-0.02em]">
            Sam
          </h1>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full">
          <Plus size={24} strokeWidth={2.2} />
        </span>
      </div>

      <div className="px-4 pb-3 pt-3">
        <div
          className={`flex items-center gap-2 rounded-[10px] px-3 py-2 ${
            isDark ? "bg-gray-800" : "bg-gray-100"
          }`}
        >
          <Search size={17} className="shrink-0 text-gray-500" />
          <span className="text-[14px] text-gray-500">Search lists</span>
        </div>
      </div>

      <div className="flex items-center gap-2 px-4">
        <h2 className="text-[24px] font-bold">Your Lists</h2>
        <span
          className="rounded-full px-2.5 py-1 text-[14px] font-semibold text-white"
          style={{ backgroundColor: "#FF9500" }}
        >
          3
        </span>
      </div>

      <div className={`mx-4 mt-3 h-px ${isDark ? "bg-white/10" : "bg-black/10"}`} />

      <div className="grid grid-cols-3 gap-2.5 px-4 pt-3">
        <GridCard
          isDark={isDark}
          color="#007AFF"
          name="Work"
          counts="4 tasks · 2 notes"
        />
        <GridCard
          isDark={isDark}
          color="#34C759"
          name="Home"
          counts="2 tasks · 1 note"
        />
        <GridCard
          isDark={isDark}
          color="#5856D6"
          name="Shopping"
          counts="6 tasks · 0 notes"
        />
      </div>
    </div>
  );
}

/** Step 1 — where a list comes from. */
export function MockCreateList({ isDark }: MockProps) {
  return (
    <Screen isDark={isDark} height={330}>
      <HomeScreen isDark={isDark} />
      {/* The plus in the header, at 336,26 in phone space. */}
      <Pointer x={336} y={26} from="bottom-left" radius={21} />
    </Screen>
  );
}

/** Step 2 — opening one. */
export function MockOpenList({ isDark }: MockProps) {
  return (
    <Screen isDark={isDark} height={330}>
      <HomeScreen isDark={isDark} />
      {/* Centre of the first grid card. */}
      <Pointer x={70} y={253} from="bottom-right" radius={38} />
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// List detail — copied from ListDetailView and ListFilter
// ---------------------------------------------------------------------------

const DETAIL_BG_DARK =
  "linear-gradient(45deg,#000000 0%,#090c10 20%,#13161a 40%,#0e1115 70%,#000000 100%)";
const DETAIL_BG_LIGHT =
  "linear-gradient(45deg,#f8f9fb 0%,#f1f4f7 25%,#e2e6ea 50%,#f3f4f6 75%,#ffffff 100%)";

/** One row of the create menu, matching ListFilter's menu items. */
function MenuRow({
  isDark,
  Icon,
  label,
  danger,
}: MockProps & {
  Icon: typeof ClipboardList;
  label: string;
  danger?: boolean;
}) {
  return (
    <div
      className={`flex w-full items-center px-4 py-2 text-sm ${
        danger
          ? isDark
            ? "text-red-400"
            : "text-red-600"
          : isDark
            ? "text-gray-300"
            : "text-gray-700"
      }`}
    >
      <Icon
        className={`mr-3 h-5 w-5 ${isDark ? "text-gray-400" : "text-gray-500"}`}
      />
      {label}
    </div>
  );
}

/** The list header with its create menu open. */
function DetailWithMenu({ isDark }: MockProps) {
  return (
    <div className="p-4 pt-5">
      <div className="mb-6 flex items-center justify-between px-4">
        <h1
          className="mr-2 truncate text-2xl font-bold"
          style={{ color: "#007AFF" }}
        >
          Work
        </h1>
        <span
          className={`rounded-full p-2 ${
            isDark ? "bg-gray-700 text-orange-400" : "bg-gray-200 text-orange-500"
          }`}
        >
          <PlusCircle className="h-6 w-6" />
        </span>
      </div>

      {/* The dropdown, right-aligned under the button. */}
      <div
        className={`absolute right-8 top-[60px] w-56 rounded-md py-1 shadow-lg ring-1 ring-black/5 ${
          isDark ? "bg-gray-800" : "bg-white"
        }`}
      >
        <MenuRow isDark={isDark} Icon={ClipboardList} label="Create Collection" />
        <MenuRow isDark={isDark} Icon={CheckCircle} label="Create Task" />
        <MenuRow isDark={isDark} Icon={StickyNote} label="Create Note" />
        <div
          className={`my-1 border-t ${
            isDark ? "border-gray-700" : "border-gray-200"
          }`}
        />
        <MenuRow isDark={isDark} Icon={Trash2} label="Delete Collections" danger />
      </div>
    </div>
  );
}

/** Step 3 — the one menu everything is created from. */
export function MockCreateMenu({ isDark }: MockProps) {
  return (
    <Screen
      isDark={isDark}
      height={230}
      background={isDark ? DETAIL_BG_DARK : DETAIL_BG_LIGHT}
    >
      <DetailWithMenu isDark={isDark} />
      {/* The plus-circle that opens it. */}
      <Pointer x={323} y={40} from="bottom-left" radius={22} />
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// Collection — copied from Collection/index.tsx
// ---------------------------------------------------------------------------

/** A collection card with its Tasks / Notes tabs. */
function CollectionCard({
  isDark,
  activeTab = "tasks",
  children,
}: MockProps & {
  activeTab?: "tasks" | "notes";
  children?: React.ReactNode;
}) {
  const color = "#007AFF";

  return (
    <div
      className={`relative overflow-hidden rounded-xl border shadow-lg ${
        isDark ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-white/60"
      }`}
    >
      {/* The accent bar across the top, in the collection's colour. */}
      <div
        className="absolute left-0 right-0 top-0 h-1 opacity-80"
        style={{ backgroundColor: color }}
      />

      <div className="flex items-center p-5">
        <div className="relative mr-4">
          <div
            className="h-10 w-10 rounded-xl"
            style={{
              backgroundColor: color,
              boxShadow: `0 4px 20px ${color}30`,
            }}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-3">
            <h3
              className={`truncate text-lg font-semibold ${
                isDark ? "text-gray-100" : "text-gray-800"
              }`}
            >
              General
            </h3>
            <div className="flex items-center space-x-2">
              <span
                className={`rounded-full px-2 py-1 text-xs font-medium ${
                  isDark
                    ? "bg-orange-900/30 text-orange-400"
                    : "bg-orange-100/50 text-orange-600"
                }`}
              >
                2 tasks
              </span>
              <span
                className={`rounded-full px-2 py-1 text-xs font-medium ${
                  isDark
                    ? "bg-blue-900/30 text-blue-400"
                    : "bg-blue-100/50 text-blue-600"
                }`}
              >
                1 note
              </span>
            </div>
          </div>
          <p
            className={`mt-1 text-sm ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            3 total items
          </p>
        </div>

        <div className="ml-4 flex items-center space-x-2">
          <span className={`p-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            <Edit3 className="h-4 w-4" />
          </span>
          <span className={`p-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            <ChevronDown className="h-4 w-4" />
          </span>
        </div>
      </div>

      <div
        className={`flex border-t ${
          isDark ? "border-gray-700" : "border-gray-200"
        }`}
      >
        {(["tasks", "notes"] as const).map((tab) => {
          const active = tab === activeTab;
          return (
            <div
              key={tab}
              className={`relative flex-1 px-4 py-3 text-sm font-medium ${
                active
                  ? isDark
                    ? "text-gray-100"
                    : "text-gray-800"
                  : "text-gray-500"
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                {tab === "tasks" ? (
                  <ListTodo className="h-4 w-4" />
                ) : (
                  <StickyNote className="h-4 w-4" />
                )}
                <span className="capitalize">{tab}</span>
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                    active ? "bg-white/20" : "bg-gray-500/20 text-gray-500"
                  }`}
                >
                  {tab === "tasks" ? 2 : 1}
                </span>
              </div>
              {active && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                  style={{ backgroundColor: color }}
                />
              )}
            </div>
          );
        })}
      </div>

      {children && (
        <div className={`p-5 ${isDark ? "bg-gray-800/40" : "bg-white/50"}`}>
          {children}
        </div>
      )}
    </div>
  );
}

/** Step 4 — what a collection is. */
export function MockCollections({ isDark }: MockProps) {
  return (
    <Screen
      isDark={isDark}
      height={210}
      background={isDark ? DETAIL_BG_DARK : DETAIL_BG_LIGHT}
    >
      <div className="p-4 pt-6">
        <CollectionCard isDark={isDark} />
      </div>
      {/* The tab row, which is how tasks and notes are reached. */}
      <Pointer x={180} y={152} from="bottom-left" radius={30} />
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// Task — copied from Tasks/customcard.tsx
// ---------------------------------------------------------------------------

function TaskCard({ isDark }: MockProps) {
  const chip = `flex items-center rounded-full px-3 py-1.5 text-xs ${
    isDark
      ? "border border-gray-600/50 bg-gray-700/50"
      : "border border-gray-200/50 bg-gray-100/50"
  }`;

  return (
    <div
      className={`rounded-xl border p-5 ${
        isDark
          ? "border-gray-700 bg-gray-800/50 text-gray-100"
          : "border-gray-200 bg-white/50 text-gray-800"
      }`}
    >
      <div className="flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-1 items-center space-x-3 overflow-hidden">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                isDark
                  ? "border-gray-600 bg-gray-800/50"
                  : "border-gray-300 bg-white"
              }`}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <h4 className="truncate font-semibold">Send the invoice</h4>
                <span
                  className={`flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    isDark
                      ? "border border-orange-500/30 bg-orange-900/30 text-orange-300"
                      : "border border-orange-200 bg-orange-100 text-orange-600"
                  }`}
                >
                  <Star className="mr-1 h-3 w-3 fill-current" />
                  Priority
                </span>
              </div>
            </div>
          </div>
          <span
            className={`shrink-0 rounded-lg p-2 ${
              isDark ? "text-gray-500" : "text-gray-400"
            }`}
          >
            <Pin className="h-4 w-4" />
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 pl-9">
          <span className={chip}>
            <Folder className="mr-1.5 h-3 w-3 text-orange-500" />
            <span className="font-medium">General</span>
          </span>
          <span className={chip}>
            <Clock
              className={`mr-1.5 h-3 w-3 ${
                isDark ? "text-purple-400" : "text-purple-600"
              }`}
            />
            <span>Today at 17:00</span>
          </span>
        </div>
      </div>
    </div>
  );
}

/** Step 5 — a task, and the due date that turns it into a reminder. */
export function MockTask({ isDark }: MockProps) {
  return (
    <Screen
      isDark={isDark}
      height={190}
      background={isDark ? DETAIL_BG_DARK : DETAIL_BG_LIGHT}
    >
      <div className="p-4 pt-8">
        <TaskCard isDark={isDark} />
      </div>
      {/* The due-date chip: the one field that changes what the app does. */}
      <Pointer x={205} y={120} from="bottom-left" radius={26} />
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// Note — copied from Notes/noteCard.tsx
// ---------------------------------------------------------------------------

/** A note tile. Colour fills the card and the text sits along the bottom. */
function NoteTile({
  color,
  title,
  body,
}: {
  color: string;
  title: string;
  body: string;
}) {
  return (
    <div
      className="relative h-40 w-full overflow-hidden rounded-xl border border-black/5 p-5 shadow-sm"
      style={{ backgroundColor: color }}
    >
      <span className="absolute right-3 top-3 rounded-lg bg-white/20 p-2 text-gray-900/80">
        <Pin className="h-5 w-5" />
      </span>

      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h4 className="mb-2 truncate text-lg font-semibold text-gray-900">
          {title}
        </h4>
        <p className="line-clamp-2 text-sm leading-relaxed text-gray-900 opacity-80">
          {body}
        </p>
        <div className="mt-3 flex items-center justify-between border-t border-gray-600/20 pt-2">
          <span className="flex items-center text-xs text-gray-900 opacity-70">
            <Calendar className="mr-1 h-3 w-3" />
            12 Mar
          </span>
        </div>
      </div>
    </div>
  );
}

/** Step 6 — notes, in the same collection as the tasks. */
export function MockNote({ isDark }: MockProps) {
  return (
    <Screen
      isDark={isDark}
      height={230}
      background={isDark ? DETAIL_BG_DARK : DETAIL_BG_LIGHT}
    >
      <div className="grid grid-cols-2 gap-4 p-4 pt-8">
        <NoteTile
          color="#FFD60A"
          title="Supplier numbers"
          body="Ring the warehouse before ten, they close the desk at noon."
        />
        <NoteTile
          color="#00C7BE"
          title="Wi-Fi code"
          body="In the drawer under the router."
        />
      </div>
      <Pointer x={95} y={150} from="bottom-right" radius={42} />
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// Built-in views
// ---------------------------------------------------------------------------

/** Step 7 — the views that gather from every list. */
export function MockDefaultViews({ isDark }: MockProps) {
  return (
    <Screen isDark={isDark} height={290}>
      <div className="px-4 pt-4">
        <div className="flex items-center gap-2 pb-3">
          <h2
            className={`text-[24px] font-bold ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Your Lists
          </h2>
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
            style={{ backgroundColor: "#FF9500" }}
          >
            3
          </span>
        </div>

        {/* Built-in views never show counts, exactly as ListInfo decides. */}
        <div className="grid grid-cols-3 gap-2.5">
          <GridCard
            isDark={isDark}
            color="#007AFF"
            name="Today"
            Icon={Calendar}
          />
          <GridCard
            isDark={isDark}
            color="#FF9500"
            name="Priority"
            Icon={Star}
          />
          <GridCard
            isDark={isDark}
            color="#FF3B30"
            name="Overdue"
            Icon={Clipboard}
          />
        </div>

        <div
          className={`my-5 h-px ${isDark ? "bg-white/10" : "bg-black/10"}`}
        />

        <div className="grid grid-cols-3 gap-2.5">
          <GridCard
            isDark={isDark}
            color="#007AFF"
            name="Work"
            counts="4 tasks · 2 notes"
          />
          <GridCard
            isDark={isDark}
            color="#34C759"
            name="Home"
            counts="2 tasks · 1 note"
          />
          <GridCard
            isDark={isDark}
            color="#5856D6"
            name="Shopping"
            counts="6 tasks · 0 notes"
          />
        </div>
      </div>
      <Pointer x={70} y={105} from="bottom-right" radius={38} />
    </Screen>
  );
}
