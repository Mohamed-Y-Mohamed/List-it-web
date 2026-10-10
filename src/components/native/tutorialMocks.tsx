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
  AlertTriangle,
  Bell,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronRight,
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
  Repeat,
  Search,
  Star,
  StickyNote,
  Trash2,
  X,
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
          background: background ?? (isDark ? "#111827" : "#ffffff"),
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

  // Start well clear of the ring, then curve in.
  const startX = right ? x + reach : x - reach;
  const startY = down ? y + reach : y - reach;

  // The arrow lands on the ring along the line it actually travelled.
  //
  // It used to stop at a hand-mixed point — `x ± (radius + 5)` horizontally but
  // only `radius * 0.6` vertically — which is not on the circle at all. For a
  // 22px ring that put the tip around 30px from the centre instead of 22, off to
  // one side of the edge rather than touching it, so every arrow in the
  // walkthrough appeared to miss slightly and point past what it was naming.
  //
  // Resolving the direction properly and stepping back by exactly the radius
  // plus a gap puts the tip on the edge, aimed at the middle, from any angle.
  const toCentreX = x - startX;
  const toCentreY = y - startY;
  const distance = Math.hypot(toCentreX, toCentreY) || 1;
  const unitX = toCentreX / distance;
  const unitY = toCentreY / distance;

  const TIP_GAP = 7;
  const endX = x - unitX * (radius + TIP_GAP);
  const endY = y - unitY * (radius + TIP_GAP);

  // One control point on the perpendicular, so the line bows by the same amount
  // whichever corner it sweeps in from. The old pair were absolute coordinates
  // derived from `reach`, which bowed hard on a long approach and barely at all
  // on a short one.
  const BOW = 16;
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  const controlX = midX - unitY * BOW;
  const controlY = midY + unitX * BOW;

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
          {/* `markerUnits="userSpaceOnUse"` is the fix that matters here.
              Markers scale with stroke width by default, so at strokeWidth 3 this
              7-unit arrowhead was drawn 21px wide and its 5.4 reference point sat
              16px along — the head overshot the end of the line by a third of the
              ring's radius. In user space the numbers mean pixels, and refX at the
              tip puts the point exactly where the path stops. */}
          <marker
            id={`tip-${x}-${y}`}
            markerUnits="userSpaceOnUse"
            markerWidth="9"
            markerHeight="9"
            refX="8"
            refY="4.5"
            orient="auto"
          >
            <path d="M0,0 L9,4.5 L0,9 z" className="fill-blue-500" />
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
      className={`flex h-[104px] w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border px-2 py-3 ${
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
      {/* One line, and the counts line reserved whether or not it is drawn —
          matching ListInfo, where that reservation is what keeps the icons on a
          default card and a user card at the same height. The mocks are flat
          markup rather than the real component, so they do not scroll; none of
          the names here is long enough to. */}
      <span className="flex min-w-0 flex-col items-center">
        <span className="block w-full truncate text-center text-[13.5px] font-semibold leading-snug tracking-[-0.01em]">
          {name}
        </span>
        {counts ? (
          <span className="mt-1 text-[10.5px] font-medium tracking-[0.01em] text-gray-500 dark:text-gray-400">
            {counts}
          </span>
        ) : (
          <span aria-hidden="true" className="mt-1 h-[1.25em] text-[10.5px]" />
        )}
      </span>
    </div>
  );
}

/** A section name on its rule, matching NativeHome's SectionDivider. */
function SectionRule({
  isDark,
  label,
  count,
}: MockProps & { label: string; count?: number }) {
  return (
    <div className="flex items-center gap-2.5 pb-3">
      <span className="shrink-0 text-[13px] font-semibold uppercase tracking-[0.06em] text-gray-500 dark:text-gray-400">
        {label}
      </span>
      {count !== undefined && (
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
          style={{ backgroundColor: "#FF9500" }}
        >
          {count}
        </span>
      )}
      <span
        className={`h-px flex-1 ${isDark ? "bg-white/10" : "bg-black/10"}`}
      />
    </div>
  );
}

/** A full-width row, matching NativeListCard's row variant. */
function RowCard({
  isDark,
  color,
  name,
  counts,
  Icon,
}: MockProps & {
  color: string;
  name: string;
  counts?: string;
  Icon?: typeof ListChecks;
}) {
  const surface = isDark ? "#0b0f17" : "#ffffff";

  return (
    <div
      className={`flex h-[64px] w-full items-center gap-3 overflow-hidden rounded-2xl border px-3.5 ${
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
      <span className="flex min-w-0 flex-1 flex-col items-start">
        <span className="block w-full truncate text-[13.5px] font-semibold leading-snug tracking-[-0.01em]">
          {name}
        </span>
        {counts && (
          <span className="mt-1 text-[10.5px] font-medium tracking-[0.01em] text-gray-500 dark:text-gray-400">
            {counts}
          </span>
        )}
      </span>
      <ChevronRight size={18} className="shrink-0 text-gray-400" />
    </div>
  );
}

/** The Lists screen: greeting, plus button, search, section rule, grid. */
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

      {/* pt-3 here and pt-3 on the grid between them come to the same height the
          24px heading plus its mt-3 hairline plus pt-3 used to occupy, so the
          Pointer coordinates in the steps below still land where they say. */}
      <div className="px-4 pt-3">
        <SectionRule isDark={isDark} label="Your lists" count={3} />
      </div>

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

// The list detail screen paints the same flat field as every other full page
// now, so these are the app surface rather than the gradient that used to be here.
// See components/AppSurface.tsx.
const DETAIL_BG_DARK = "#111827";
const DETAIL_BG_LIGHT = "#ffffff";

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
            isDark
              ? "bg-gray-700 text-orange-400"
              : "bg-gray-200 text-orange-500"
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
        <MenuRow
          isDark={isDark}
          Icon={ClipboardList}
          label="Create Collection"
        />
        <MenuRow isDark={isDark} Icon={CheckCircle} label="Create Task" />
        <MenuRow isDark={isDark} Icon={StickyNote} label="Create Note" />
        <div
          className={`my-1 border-t ${
            isDark ? "border-gray-700" : "border-gray-200"
          }`}
        />
        <MenuRow
          isDark={isDark}
          Icon={Trash2}
          label="Delete Collections"
          danger
        />
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
        isDark
          ? "border-gray-700 bg-gray-800/50"
          : "border-gray-200 bg-white/60"
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

function TaskCard({
  isDark,
  title = "Send the invoice",
  collection = "General",
  due = "Today at 17:00",
  priority = true,
  repeats = false,
  className = "",
}: MockProps & {
  title?: string;
  collection?: string;
  due?: string;
  /** The Priority badge, which only a pinned task carries. */
  priority?: boolean;
  /** The icon-only repeat marker a repeating task carries. */
  repeats?: boolean;
  /** The accent bar TaskList passes down, so a banded screen can tint its rows. */
  className?: string;
}) {
  const chip = `flex items-center rounded-full px-3 py-1.5 text-xs ${
    isDark
      ? "border border-gray-600/50 bg-gray-700/50"
      : "border border-gray-200/50 bg-gray-100/50"
  }`;

  return (
    <div
      className={`rounded-xl border p-5 ${className} ${
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
                <h4 className="truncate font-semibold">{title}</h4>
                {priority && (
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
                )}
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
            <span className="font-medium">{collection}</span>
          </span>
          {/* A marker, not a control, and icon-only for the reason the real card
              gives: the words would push the date onto a second line. */}
          {repeats && (
            <span
              className={`flex items-center rounded-full px-2.5 py-1.5 text-xs ${
                isDark
                  ? "border border-gray-600/50 bg-gray-700/50"
                  : "border border-gray-200/50 bg-gray-100/50"
              }`}
            >
              <Repeat
                className={`h-3 w-3 ${
                  isDark ? "text-emerald-400" : "text-emerald-600"
                }`}
              />
            </span>
          )}
          <span className={chip}>
            <Clock
              className={`mr-1.5 h-3 w-3 ${
                isDark ? "text-purple-400" : "text-purple-600"
              }`}
            />
            <span>{due}</span>
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
        <SectionRule isDark={isDark} label="Default lists" />

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

        <div className="pt-5">
          <SectionRule isDark={isDark} label="Your lists" count={3} />
        </div>

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
      {/* Centre of the first built-in card, which now sits under its own rule
          rather than under a heading that named the group below it. */}
      <Pointer x={70} y={102} from="bottom-right" radius={38} />
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// Added after the original seven steps. The walkthrough shows these last, in the
// order features arrived; the help sheet shows them first. See lib/helpTopics.ts.
// ---------------------------------------------------------------------------

/** The List layout: built-in views two to a row, the user's own lists as rows. */
export function MockListLayout({ isDark }: MockProps) {
  return (
    <Screen isDark={isDark} height={300}>
      <div className="px-4 pt-4">
        <SectionRule isDark={isDark} label="Default lists" />

        <div className="grid grid-cols-2 gap-2.5">
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
        </div>

        <div className="pt-5">
          <SectionRule isDark={isDark} label="Your lists" count={3} />
        </div>

        <div className="flex flex-col gap-2">
          <RowCard
            isDark={isDark}
            color="#007AFF"
            name="Work"
            counts="4 tasks · 2 notes"
          />
          <RowCard
            isDark={isDark}
            color="#34C759"
            name="Home"
            counts="2 tasks · 1 note"
          />
        </div>
      </div>
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// Reminders — copied from ToggleSection and
// RemindersPicker
// ---------------------------------------------------------------------------

/**
 * One of the task sheet's switch sections, open or shut.
 *
 * Repeat and Reminders are the same component in the real sheet, so they are one
 * component here as well. Its header is 68px tall — 16px of padding either side of
 * a 36px two-line label — and both steps below put a Pointer on the switch inside
 * it, so that height is load-bearing rather than incidental.
 *
 * The switch is a span, like every other control in these mocks: nothing here can
 * be operated and a real button would invite the tap.
 */
function ToggleCard({
  isDark,
  Icon,
  title,
  summary,
  enabled = false,
  children,
}: MockProps & {
  Icon: typeof ListChecks;
  title: string;
  /** What it is set to, which the real row shows whether open or shut. */
  summary: string;
  enabled?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border ${
        isDark ? "border-gray-700 bg-gray-800/40" : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-center gap-3 p-4">
        <span className={isDark ? "text-gray-400" : "text-gray-500"}>
          <Icon className="h-5 w-5" />
        </span>

        <span className="min-w-0 flex-1">
          <span
            className={`block text-sm font-medium ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            {title}
          </span>
          <span
            className={`block truncate text-xs ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {summary}
          </span>
        </span>

        {/* Carrying the real switch's `left-0` anchor, without which the knob's
            translate pushes it outside the pill. */}
        <span
          className={`relative block h-7 w-12 shrink-0 rounded-full ${
            enabled ? "bg-orange-500" : isDark ? "bg-gray-600" : "bg-gray-300"
          }`}
        >
          <span
            className={`absolute left-0 top-1 h-5 w-5 rounded-full bg-white shadow ${
              enabled ? "translate-x-[26px]" : "translate-x-1"
            }`}
          />
        </span>
      </div>

      {children && (
        <div
          className={`border-t px-4 py-4 ${
            isDark ? "border-gray-700" : "border-gray-200"
          }`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/** The pill both pickers use, styled the same way in each. */
const pillClass = (isDark: boolean, active = false) =>
  `rounded-full px-3 py-1.5 text-xs font-medium ${
    active
      ? "bg-orange-500 text-white"
      : isDark
        ? "bg-gray-700/60 text-gray-300"
        : "bg-gray-100 text-gray-700"
  }`;


/** Reminders, switched on, with one set and the offsets still on offer. */
export function MockReminders({ isDark }: MockProps) {
  return (
    <Screen
      isDark={isDark}
      height={297}
      background={isDark ? DETAIL_BG_DARK : DETAIL_BG_LIGHT}
    >
      <div className="px-4 pt-5">
        <ToggleCard
          isDark={isDark}
          Icon={Bell}
          title="Reminders"
          summary="1 hour before"
          enabled
        >
          <div className="space-y-4">
            {/* What is already set, with the X that takes it off again. There is no
                Add button anywhere in this section and the mock must not invent
                one: a chip commits the moment it is tapped, and this row is the
                confirmation that it did. */}
            <ul className="space-y-2">
              <li
                className={`flex items-center gap-2 rounded-xl px-3 py-2 ${
                  isDark ? "bg-gray-700/50" : "bg-gray-100"
                }`}
              >
                <Bell className="h-4 w-4 shrink-0 text-orange-500" />
                <span className="min-w-0 flex-1 truncate text-sm">
                  1 hour before
                </span>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400">
                  <X className="h-4 w-4" />
                </span>
              </li>
            </ul>

            <div>
              <p
                className={`pb-2 text-xs ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Before it is due
              </p>
              {/* The offsets still on offer, in OFFSET_PRESETS order and minus the
                  one already on the list above, which the real picker stops
                  offering twice. Four of the five remaining: the fifth opens a
                  third row that teaches nothing the first two have not. */}
              <div className="flex flex-wrap gap-2">
                {[
                  "When it's due",
                  "1 day before",
                  "2 days before",
                  "1 week before",
                ].map((label) => (
                  <span key={label} className={pillClass(isDark)}>
                    <Plus className="mr-1 inline h-3 w-3" />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </ToggleCard>
      </div>
      {/* The first offset chip. The body starts at 106 (card top 20, border, 68px
          header, border, 16px of padding); the reminder row is 48 tall and the note
          above the chips 24, with space-y-4 between the two, which puts the first
          row of chips at 194 and its middle at 208. The ring sits 28px in from the
          content edge at 33, well inside the chip whatever its text measures to. */}
      <Pointer x={61} y={208} from="bottom-right" radius={20} />
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// Recurring and Scheduled — copied from TaskScreen, TaskSectionHeader and the
// two pages
// ---------------------------------------------------------------------------

/** One band's heading, from TaskSectionHeader. */
function BandHeader({
  isDark,
  Icon,
  title,
  count,
  color,
}: MockProps & {
  Icon: typeof ListChecks;
  title: string;
  count: number;
  /** Text class tinting the glyph to the band's colour, as the bands pass it. */
  color: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <Icon className={`h-4 w-4 shrink-0 ${color}`} />
      <h2
        className={`shrink-0 text-[13px] font-semibold uppercase tracking-[0.06em] ${
          isDark ? "text-gray-400" : "text-gray-500"
        }`}
      >
        {title}
      </h2>
      <span
        className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
        style={{ backgroundColor: "#FF9500" }}
      >
        {count}
      </span>
      <span
        className={`h-px flex-1 ${isDark ? "bg-white/10" : "bg-black/10"}`}
      />
    </div>
  );
}

/** Scheduled: what has slipped above what lands today. */
export function MockScheduled({ isDark }: MockProps) {
  return (
    <Screen
      isDark={isDark}
      height={496}
      background={isDark ? DETAIL_BG_DARK : DETAIL_BG_LIGHT}
    >
      {/* No screen header here, unlike the Recurring step above. A band plus its
          task comes to 220px and the step needs two of them, so the title, its
          count line and four figure tiles on top would push this miniature past
          what a short phone can show. The bands carry the screen's own words. */}
      <div className="px-4 pt-3">
        {/* space-y-8 between bands, as the page sets. */}
        <div className="space-y-8">
          <div>
            <BandHeader
              isDark={isDark}
              Icon={AlertTriangle}
              title="Overdue"
              count={1}
              color="text-red-600 dark:text-red-400"
            />
            <TaskCard
              isDark={isDark}
              className="border-l-4 border-red-600"
              title="Pay the window cleaner"
              collection="Bills"
              due="3 days ago"
              priority={false}
            />
          </div>

          <div>
            <BandHeader
              isDark={isDark}
              Icon={Clock}
              title="Today"
              count={1}
              color="text-orange-600 dark:text-orange-400"
            />
            <TaskCard
              isDark={isDark}
              className="border-l-4 border-orange-500"
              title="Ring the dentist"
              collection="Admin"
              due="Today at 14:00"
              priority={false}
            />
          </div>
        </div>
      </div>
      {/* The Overdue heading. Its band starts at 12, and the border plus 16px of
          padding put the 48px text block at 29, where the 28px title line centres
          at 43. The glyph chip is 36 wide from 33, so the words start at 81. */}
      <Pointer x={110} y={43} from="bottom-right" radius={26} />
    </Screen>
  );
}

