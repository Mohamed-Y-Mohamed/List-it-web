"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ChevronRight,
  Edit3,
  ListTodo,
  StickyNote,
  X,
} from "lucide-react";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

import TaskCard from "@/components/Tasks/index";
import NoteCard from "@/components/Notes/noteCard";
import { Collection, Note, OperationResult, Task } from "@/types/schema";
import { useTheme } from "@/context/ThemeContext";
import { IS_NATIVE_BUILD, isNativeApp } from "@/lib/platform";
import { tabForSwipe } from "@/lib/panelSwipe";

/**
 * Native only: an expanded collection shows about three cards and scrolls for the
 * rest, instead of growing to fit everything it holds.
 *
 * A collection with a dozen tasks used to push the next one entirely off screen,
 * so opening two meant scrolling the page between them and never seeing both at
 * once. Capping the panel keeps several collections reachable in one viewport and
 * turns a long page scroll into a short one inside the card.
 *
 * The height is three cards' worth, measured on device: a task card with a date
 * row is ~70px and `space-y-2.5` puts 10px between them, so 3*70 + 2*10. It is a
 * ceiling, not a height — a collection holding one task is still one task tall.
 *
 * No `overscroll-contain` on purpose. Containment would stop the flick at the end
 * of the inner list and make the user lift and swipe again to carry on down the
 * page; letting it chain is both the platform default and the smoother of the two.
 *
 * `touch-pan-y` is load-bearing, not decoration. This scroller sits inside the
 * draggable Tasks/Notes panel, and a scroll container defaults to
 * `touch-action: auto` — which lets the WebView claim a horizontal gesture that
 * starts on it, fire `pointercancel`, and leave framer having never seen a drag.
 * The panel's own `pan-y` does not cover it, because touch-action is resolved from
 * the element the finger actually landed on. Without this the tab swipe does
 * nothing anywhere a card is, which is most of the panel.
 */
const NATIVE_PANEL_SCROLL = IS_NATIVE_BUILD
  ? "max-h-[232px] touch-pan-y overflow-y-auto"
  : "";

const STAGGER_STEP = 0.055;
const MAX_STAGGERED_ITEMS = 6;

/**
 * The Tasks/Notes panel is draggable but goes nowhere: it springs back to centre
 * and the tab changes instead. Pinning both edges to 0 with a little `dragElastic`
 * is what gives the drag a bit of give without the panel ever coming to rest off
 * to one side.
 *
 * A module constant rather than an inline object so framer sees the same
 * constraints every render instead of a new pair on each one.
 */
const PANEL_DRAG_LOCK = { left: 0, right: 0 } as const;

const entranceDelay = (index: number): number =>
  Math.min(index, MAX_STAGGERED_ITEMS) * STAGGER_STEP;

/**
 * The notes panel shows two rows — four cards — and scrolls for the rest.
 *
 * Unlike the task panel's cap this applies on the web too, because at two cards
 * to a row a collection holding a dozen notes is six rows tall and pushes the
 * next collection off the screen entirely.
 *
 * 220px is two cards and the gap between them. A note card is 104px:
 *
 *   1   border-top
 *   12  pt-3
 *   28  header row — the h-7 pin button, not the 20px title, sets this
 *   8   mt-2 above the body
 *   30  the body preview, NOTE_DESC_HEIGHT in Notes/noteCard
 *   24  pb-6, clearing the 20px folded corner
 *   1   border-bottom
 *
 * so 104 * 2 + 12 (`gap-3`). This only holds because every note card is the
 * same height regardless of its text — see the note on NOTE_DESC_HEIGHT. Change
 * the card's padding or type and this number has to move with it.
 *
 * `touch-pan-y` for the same reason as NATIVE_PANEL_SCROLL: this scroller sits
 * inside the draggable Tasks/Notes panel, and without it the WebView claims any
 * horizontal gesture starting on a card and the tab swipe dies.
 */
const NOTES_ROWS_MAX_H = IS_NATIVE_BUILD
  ? "max-h-[220px] touch-pan-y overflow-y-auto"
  : "max-h-[220px] overflow-y-auto";

/* =======================================================
   DIAGONAL SLICE — settings

   The collection colour as one thick diagonal slab behind the header row,
   swept from a narrow block on the leading edge out to the full width of the
   row when the collection opens. Ported from the SwiftUI `DiagonalSliceShape`
   so the web, the Android WebView and iOS draw the same header.

   This replaced a wave cut into the lower edge of a solid colour block. That
   block was opaque, so the header had to compute its own ink colour from the
   collection's luminance to stay readable — white on a navy collection,
   near-black on a pale yellow one. The slab is translucent over the card
   instead, so the header is part of the card and the text is simply the
   theme's foreground: white in dark, near-black in light. That is why `inkOn`
   and `ON_COLOR` are gone rather than merely unused.
   ======================================================= */

/** How much of the header row the slab covers while the collection is shut. */
const SLICE_SHUT_WIDTH = 30;
/**
 * How far the slab's bottom-trailing corner is pulled back, in px, while shut.
 * 0 when open, which is what squares the slab off as it reaches full width.
 */
const SLICE_SKEW = 24;
/** Leading and trailing gradient stops, as alpha on the collection colour. */
const SLICE_ALPHA = {
  dark: { from: 0.38, to: 0.22 },
  light: { from: 0.28, to: 0.14 },
} as const;

/**
 * How far the edge lock is squeezed while the collection is shut.
 *
 * 0.74 is the Swift's 10px of air at each end of a shut header, as a fraction
 * of this one's 76px: (76 - 20) / 76. A scale rather than an inset because an
 * inset is a layout change and a scale is not — see the note in `EdgeLock`.
 */
const EDGE_SHUT_SCALE = 0.74;

/**
 * `color` at `alpha`, as an rgba() string.
 *
 * Collection colours arrive from the database as 3- or 6-digit hex. The list
 * cards get away with appending a two-digit alpha to the string, which fails
 * silently on a 3-digit value — `#f90` + `61` is not a colour — so this parses
 * instead. Anything it cannot read comes back untouched rather than throwing: a
 * header with a flat slab is survivable, a collection that will not render is
 * not.
 */
function withAlpha(color: string, alpha: number): string {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim());
  if (!match) return color;

  const hex =
    match[1].length === 3
      ? match[1]
          .split("")
          .map((c) => c + c)
          .join("")
      : match[1];

  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));

  return `rgba(${r},${g},${b},${alpha})`;
}

/* =======================================================
   DIAGONAL SLICE — the shape

   The colour is the collection's own `bg_color_hex`, passed in from the
   component: nothing here is made up or hard-coded per collection.
   ======================================================= */

/**
 * The slab.
 *
 * Two animated properties, both paint-only. `clip-path` carries the sweep and
 * the slant together — one property for what SwiftUI does with an animated
 * `.frame(width:)` plus an `animatableData` skew — and `background-size` keeps
 * the gradient sized to the slab rather than to the row, so the shut state
 * shows the whole gradient compressed into 30% instead of the first 30% of it.
 *
 * Animating the width, as the Swift does, would mean a layout pass per frame
 * for every open collection. That is cheap on one card and visibly not on a
 * screenful in the Android WebView. Clipping a layer that is already full width
 * costs nothing to lay out.
 *
 * Both clip paths are emitted in the same `calc(<percentage> - <length>)` shape
 * even when the length is 0, because matching structure is what lets the two
 * interpolate rather than snap.
 */
function DiagonalSlice({
  color,
  isDark,
  isExpanded,
}: {
  color: string;
  isDark: boolean;
  isExpanded: boolean;
}) {
  const { from, to } = SLICE_ALPHA[isDark ? "dark" : "light"];
  const width = isExpanded ? 100 : SLICE_SHUT_WIDTH;
  const skew = isExpanded ? 0 : SLICE_SKEW;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 transition-[clip-path,background-size] duration-[280ms] ease-[var(--ease-out)] motion-reduce:transition-none"
      style={{
        backgroundImage: `linear-gradient(to right, ${withAlpha(
          color,
          from,
        )}, ${withAlpha(color, to)})`,
        backgroundSize: `${width}% 100%`,
        backgroundRepeat: "no-repeat",
        clipPath: `polygon(0 0, ${width}% 0, calc(${width}% - ${skew}px) 100%, 0 100%)`,
      }}
    />
  );
}

/**
 * The leading edge lock.
 *
 * Faint and inset while the collection is shut; solid and the full height of
 * the card once it is open, so the line runs down the side of the expanded
 * content rather than stopping where the header does. It is the one part of the
 * card that states open or shut without anyone reading a word.
 *
 * It sits on the card root rather than inside the header for exactly that
 * reason, and `inset-y-0` is what makes "the full height" follow the content as
 * it grows. The shut inset is a `scaleY` rather than real insets so the only
 * animated properties here are transform and opacity.
 */
function EdgeLock({
  color,
  isDark,
  isExpanded,
}: {
  color: string;
  isDark: boolean;
  isExpanded: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 left-0 z-20 w-1 origin-center transition-[transform,opacity] duration-[280ms] ease-[var(--ease-out)] motion-reduce:transition-[opacity]"
      style={{
        backgroundColor: color,
        opacity: isExpanded ? 1 : isDark ? 0.16 : 0.14,
        transform: isExpanded ? "scaleY(1)" : `scaleY(${EDGE_SHUT_SCALE})`,
      }}
    />
  );
}

interface CollectionComponentProps {
  id: string;
  collection_name: string;
  bg_color_hex: string;
  created_at: Date;
  is_default?: boolean;
  content_count?: number;
  tasks?: Task[];
  notes?: Note[];

  /**
   * Bumped by the list screen's "Collapse all". A counter rather than a
   * boolean: the same instruction has to be able to fire twice, and a flag
   * that is already `true` cannot say "again".
   */
  collapseNonce?: number;

  /**
   * Open this collection without the user touching it. Set only for the
   * collection holding the task behind a tapped reminder, so everything else
   * on the screen stays shut.
   */
  autoExpand?: boolean;

  onTaskComplete: (
    taskId: string,
    is_completed: boolean,
  ) => Promise<OperationResult>;

  onTaskPriority: (
    taskId: string,
    is_pinned: boolean,
  ) => Promise<OperationResult>;

  onTaskDelete?: (taskId: string) => Promise<OperationResult>;

  onTaskUpdate?: (
    taskId: string,
    taskData: {
      text: string;
      description?: string | null;
      due_date?: Date | null;
      is_pinned: boolean;
    },
  ) => Promise<OperationResult>;

  onCollectionChange?: (
    taskId: string,
    collectionId: string,
  ) => Promise<OperationResult>;

  onNotePin?: (noteId: string, isPinned: boolean) => Promise<OperationResult>;

  onNoteColorChange?: (
    noteId: string,
    color: string,
  ) => Promise<OperationResult>;

  onNoteUpdate?: (
    noteId: string,
    updatedTitle: string,
    updatedDescription?: string,
  ) => Promise<OperationResult>;

  onNoteDelete?: (noteId: string) => Promise<OperationResult>;

  onCollectionEdit?: (collection: Collection) => Promise<OperationResult>;

  collections?: Collection[];
  className?: string;
}

type Tab = "tasks" | "notes";

const EnhancedCollectionComponent = ({
  id,
  collection_name,
  bg_color_hex,
  created_at,
  tasks = [],
  notes = [],
  onTaskComplete,
  onTaskPriority,
  onTaskUpdate,
  onTaskDelete,
  onCollectionChange,
  onNotePin,
  onNoteColorChange,
  onNoteUpdate,
  onNoteDelete,
  onCollectionEdit,
  collections = [],
  className = "",
  collapseNonce,
  autoExpand = false,
}: CollectionComponentProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  /* Text and button tones for anything drawn on the collection colour. */

  /* All collections begin collapsed. */
  const [isExpanded, setIsExpanded] = useState(false);

  /*
   * Collapse all.
   *
   * Keyed on the nonce alone, and deliberately not on mount: the initial run
   * is skipped by the ref so arriving on the screen does not count as an
   * instruction to collapse something the user has just been sent to.
   */
  const lastCollapseNonce = useRef(collapseNonce);
  useEffect(() => {
    if (collapseNonce === lastCollapseNonce.current) return;
    lastCollapseNonce.current = collapseNonce;
    setIsExpanded(false);
  }, [collapseNonce]);

  /*
   * Opened from a tapped reminder.
   *
   * Runs when the flag turns on rather than on every render, so the user can
   * still close the collection afterwards and have it stay closed.
   */
  useEffect(() => {
    if (autoExpand) setIsExpanded(true);
  }, [autoExpand]);
  const [activeTab, setActiveTab] = useState<Tab>("tasks");

  /**
   * Whether the Tasks/Notes panel answers to a horizontal drag.
   *
   * Touch only, decided in JS rather than CSS. A mouse drag across a panel full
   * of task titles is how text gets selected, and framer's pointer capture would
   * take that away from anyone using the web app with a trackpad — for a gesture
   * they have no reason to try, since the tabs are right there.
   *
   * `(pointer: coarse)` rather than IS_NATIVE_BUILD on purpose: a phone browser
   * on the web app deserves the gesture just as much as the Android shell does,
   * and that is what "both platforms" means here. It starts false so the server
   * render and the first client render agree, and the listener keeps it honest on
   * a device that has both, like a touchscreen laptop.
   */
  const [canSwipe, setCanSwipe] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const query = window.matchMedia("(pointer: coarse)");
    setCanSwipe(query.matches);

    const onChange = (event: MediaQueryListEvent) => setCanSwipe(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const [priorityTasks, setPriorityTasks] = useState<Task[]>([]);
  const [regularTasks, setRegularTasks] = useState<Task[]>([]);
  const [sortedNotes, setSortedNotes] = useState<Note[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isGeneralCollection = useCallback(
    () => collection_name?.toLowerCase().trim() === "general",
    [collection_name],
  );

  const getEffectiveColor = useCallback(
    () => bg_color_hex || "#fb923c",
    [bg_color_hex],
  );

  // Three levels, each a step from the one behind it: the page is the field, a
  // collection is a card on it, and the task and note cards inside drop back to
  // the field colour. That alternation is what makes a collection visible as a
  // container — both surfaces used to be translucent whites, which over a white
  // field left the whole screen one flat sheet.
  //
  // `outer` and `header` are the same in both themes now, because the ramp already
  // carries the right value for the theme *and* the chosen background. A branch
  // here could only disagree with it.
  const SURFACE = {
    outer: "border-[var(--surface-border)] bg-[var(--surface-card)]",
    // Transparent rather than a tint. The card underneath is opaque now, so a
    // translucent wash over it just drew a band across the top of the collection.
    header: "bg-transparent",
  } as const;

  const colors = isDark
    ? {
        textPrimary: "text-slate-100",
        textSecondary: "text-slate-400",
        textMuted: "text-slate-500",
        outer: SURFACE.outer,
        header: SURFACE.header,
        content: "bg-transparent",
        border: "border-white/[0.06]",
        buttonHover: "hover:bg-white/[0.055]",
        activeTab: "text-slate-100",
        inactiveTab: "text-slate-500 hover:text-slate-300",
        count: "text-slate-500",
        errorBg: "bg-rose-500/[0.08]",
        errorText: "text-rose-300",
      }
    : {
        textPrimary: "text-slate-900",
        textSecondary: "text-slate-600",
        textMuted: "text-slate-400",
        outer: SURFACE.outer,
        header: SURFACE.header,
        content: "bg-transparent",
        border: "border-slate-200/70",
        buttonHover: "hover:bg-slate-100/70",
        activeTab: "text-slate-900",
        inactiveTab: "text-slate-400 hover:text-slate-700",
        count: "text-slate-400",
        errorBg: "bg-rose-50/70",
        errorText: "text-rose-700",
      };

  /* =======================================================
     SORTING
     ======================================================= */

  const sortTasks = useCallback((taskList: Task[] = []) => {
    try {
      const validTasks = taskList.filter(
        (task) => task && !task.is_deleted && !task.is_completed,
      );

      return {
        priority: validTasks.filter((task) => Boolean(task.is_pinned)),
        regular: validTasks.filter((task) => !task.is_pinned),
      };
    } catch (err) {
      console.error("Error sorting tasks:", err);
      setError("Failed to process tasks");

      return {
        priority: [],
        regular: [],
      };
    }
  }, []);

  const sortNotes = useCallback((noteList: Note[] = []) => {
    try {
      const validNotes = noteList.filter((note) => note && !note.is_deleted);

      return [...validNotes].sort((a, b) => {
        if (Boolean(a.is_pinned) && !Boolean(b.is_pinned)) return -1;
        if (!Boolean(a.is_pinned) && Boolean(b.is_pinned)) return 1;

        const dateA =
          a.created_at instanceof Date ? a.created_at : new Date(a.created_at);

        const dateB =
          b.created_at instanceof Date ? b.created_at : new Date(b.created_at);

        return dateB.getTime() - dateA.getTime();
      });
    } catch (err) {
      console.error("Error sorting notes:", err);
      setError("Failed to process notes");
      return [];
    }
  }, []);

  useEffect(() => {
    const { priority, regular } = sortTasks(tasks);

    setPriorityTasks(priority);
    setRegularTasks(regular);
  }, [tasks, sortTasks]);

  useEffect(() => {
    setSortedNotes(sortNotes(notes));
  }, [notes, sortNotes]);

  useEffect(() => {
    if (!error) return;

    const timeout = setTimeout(() => {
      setError(null);
    }, 5000);

    return () => clearTimeout(timeout);
  }, [error]);

  /* =======================================================
     COUNTS
     ======================================================= */

  const taskCount = tasks.filter(
    (task) => task && !task.is_deleted && !task.is_completed,
  ).length;

  const noteCount = notes.filter((note) => note && !note.is_deleted).length;

  /* =======================================================
     SAFE OPERATION
     ======================================================= */

  const safelyHandleOperation = async (
    operation: () => Promise<OperationResult>,
    errorMessage: string,
  ): Promise<OperationResult> => {
    try {
      const result = await operation();

      if (!result.success) {
        throw new Error(result.error ? String(result.error) : errorMessage);
      }

      return { success: true };
    } catch (err) {
      console.error(`${errorMessage}:`, err);
      setError(errorMessage);

      return {
        success: false,
        error: err,
      };
    }
  };

  /* =======================================================
     COLLECTION
     ======================================================= */

  const handleCollectionEdit = async () => {
    if (!onCollectionEdit) return;

    const collectionData: Collection = {
      id,
      collection_name: collection_name || "",
      bg_color_hex: bg_color_hex || "",
      created_at,
      list_id: "",
      user_id: "",
      tasks: tasks || [],
      notes: notes || [],
    };

    try {
      await onCollectionEdit(collectionData);
    } catch (err) {
      console.error("Error editing collection:", err);
      setError("Failed to edit collection");
    }
  };

  /* =======================================================
     TASK OPERATIONS
     ======================================================= */

  const handleTaskCompleteWithErrorHandling = async (
    taskId: string,
    isCompleted: boolean,
  ): Promise<OperationResult> => {
    const result = await safelyHandleOperation(
      () => onTaskComplete(taskId, isCompleted),
      "Failed to update task status",
    );

    if (result.success && isCompleted) {
      const updatedTasks = tasks.filter((task) => task.id !== taskId);
      const { priority, regular } = sortTasks(updatedTasks);

      setPriorityTasks(priority);
      setRegularTasks(regular);
    }

    return result;
  };

  const handleTaskPriorityWithErrorHandling = async (
    taskId: string,
    isPinned: boolean,
  ): Promise<OperationResult> =>
    safelyHandleOperation(
      () => onTaskPriority(taskId, isPinned),
      "Failed to update task priority",
    );

  const handleTaskUpdateWithErrorHandling = async (
    taskId: string,
    taskData: {
      text: string;
      description?: string | null;
      due_date?: Date | null;
      is_pinned: boolean;
    },
  ): Promise<OperationResult> => {
    if (!onTaskUpdate) {
      return {
        success: false,
        error: "Task update handler not available",
      };
    }

    return safelyHandleOperation(
      () => onTaskUpdate(taskId, taskData),
      "Failed to update task",
    );
  };

  const handleTaskDeleteWithErrorHandling = async (
    taskId: string,
  ): Promise<OperationResult> => {
    if (!onTaskDelete) {
      return {
        success: false,
        error: "Task delete handler not available",
      };
    }

    const result = await safelyHandleOperation(
      () => onTaskDelete(taskId),
      "Failed to delete task",
    );

    if (result.success) {
      const { priority, regular } = sortTasks(
        tasks.filter((task) => task.id !== taskId),
      );

      setPriorityTasks(priority);
      setRegularTasks(regular);
    }

    return result;
  };

  /* =======================================================
     NOTE OPERATIONS
     ======================================================= */

  const handleNotePinWithErrorHandling = async (
    noteId: string,
    isPinned: boolean,
  ): Promise<OperationResult> => {
    if (!onNotePin) {
      return {
        success: false,
        error: "Pin handler not available",
      };
    }

    const result = await safelyHandleOperation(
      () => onNotePin(noteId, isPinned),
      "Failed to pin note",
    );

    if (result.success) {
      setSortedNotes(sortNotes(notes));
    }

    return result;
  };

  const handleNoteColorChangeWithErrorHandling = async (
    noteId: string,
    color: string,
  ): Promise<OperationResult> => {
    if (!onNoteColorChange) {
      return {
        success: false,
        error: "Color change handler not available",
      };
    }

    return safelyHandleOperation(
      () => onNoteColorChange(noteId, color),
      "Failed to change note color",
    );
  };

  const handleNoteUpdateWithErrorHandling = async (
    noteId: string,
    updatedTitle: string,
    updatedDescription?: string,
  ): Promise<OperationResult> => {
    if (!onNoteUpdate) {
      return {
        success: false,
        error: "Update handler not available",
      };
    }

    return safelyHandleOperation(
      () => onNoteUpdate(noteId, updatedTitle, updatedDescription),
      "Failed to update note",
    );
  };

  const handleNoteDeleteWithErrorHandling = async (
    noteId: string,
  ): Promise<OperationResult> => {
    if (!onNoteDelete) {
      return {
        success: false,
        error: "Delete handler not available",
      };
    }

    const result = await safelyHandleOperation(
      () => onNoteDelete(noteId),
      "Failed to delete note",
    );

    if (result.success) {
      setSortedNotes(sortNotes(notes.filter((note) => note.id !== noteId)));
    }

    return result;
  };

  /* =======================================================
     TASKS / NOTES SWIPE

     A second way into the same two tabs, for a thumb rather than a tap. The
     tablist above is unchanged and still the primary control: this adds a route,
     it does not replace one.
     ======================================================= */

  const handlePanelSwipe = useCallback(
    (_event: unknown, info: PanInfo) => {
      // The direction and the thresholds live in lib/panelSwipe, which is tested.
      // Which way a negative offset points is the one part of a drag gesture that
      // can be wrong while still looking like it works.
      const next = tabForSwipe(info.offset.x, info.velocity.x, activeTab);
      if (!next) return;

      setActiveTab(next);

      // The panel springs back to centre whatever happens, so a gesture with no
      // tap in it needs something that confirms it landed. Same weight the hold
      // menus use.
      if (isNativeApp()) {
        Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
      }
    },
    [activeTab],
  );

  /* =======================================================
     CARD ACTIONS

     There are no swipe actions here any more. The cards carry their own hold
     menus — both task cards have had one since before swipe existed, and the
     note card now uses the same shared useLongPress the list cards do — and the
     horizontal drag belongs to the Tasks/Notes panel below, which uses it to
     switch between the two.

     The handlers the swipe panels called are unchanged and still passed to the
     cards; only the second route to them is gone.
     ======================================================= */

  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        y: -8,
      }}
      transition={{
        duration: 0.25,
      }}
      data-collection-id={id}
      className={`
        ${className}
        overflow-hidden
        rounded-[18px]
        border
        backdrop-blur-[14px]
        transition-colors
        duration-200
        ${colors.outer}
      `}
      /* The containment stroke, from the Swift: 0.8px of the collection's own
         colour instead of the neutral hairline. Same convention and the same
         two opacities as the list cards in native/NativeListCard, where it is
         `${color}40` / `${color}29` — 0.25 and 0.16 as hex alpha. */
      style={{
        borderWidth: 0.8,
        borderColor: withAlpha(getEffectiveColor(), isDark ? 0.25 : 0.16),
      }}
    >
      {/* The edge lock spans header *and* expanded content, so it lives here
          rather than in the header below. `overflow-hidden` above is what
          clips it to the card's corners. */}
      <EdgeLock
        color={getEffectiveColor()}
        isDark={isDark}
        isExpanded={isExpanded}
      />

      {/* ===================================================
          HEADER
         =================================================== */}

      <div
        className={`
          relative
          ${colors.header}
        `}
      >
        {/* DIAGONAL SLICE — title block.

            A translucent diagonal slab of the collection colour over the card,
            narrow while shut and the full width of the row once open. The
            colour is the background and the edge, which is why there is no dot
            or bar beside the name. */}
        <div className="relative">
          {/* DIAGONAL SLICE — drawn here. Geometry: top of file. */}
          <DiagonalSlice
            color={getEffectiveColor()}
            isDark={isDark}
            isExpanded={isExpanded}
          />

          {/* pl-4 is the Swift's 12px of leading air plus the 4px the edge lock
              occupies. The right side keeps its own padding for the buttons. */}
          <div className="relative z-10 flex min-h-[76px] items-center gap-3 py-3.5 pl-4 pr-4 sm:pr-5">
            <button
              type="button"
              onClick={() => setIsExpanded((previous) => !previous)}
              aria-expanded={isExpanded}
              className="min-w-0 flex-1 text-left"
            >
              <h3
                className={`truncate text-[17px] font-semibold leading-6 tracking-[-0.015em] ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                {collection_name || "Unnamed Collection"}
              </h3>

              {/* The counts stay a step down from the title. "White everywhere"
                  is the title's job; a sub-line at full white has no hierarchy
                  left to give. */}
              <span
                className={`mt-0.5 block text-[12px] font-medium leading-4 tabular-nums ${
                  isDark ? "text-white/70" : "text-gray-600"
                }`}
              >
                {taskCount} {taskCount === 1 ? "task" : "tasks"}
                <span className="mx-1.5 opacity-60">·</span>
                {noteCount} {noteCount === 1 ? "note" : "notes"}
              </span>
            </button>

            {/* Actions: round, translucent, 36px */}
            <div className="flex shrink-0 items-center gap-1.5">
              {!isGeneralCollection() && onCollectionEdit && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    void handleCollectionEdit();
                  }}
                  aria-label="Edit collection"
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                    isDark
                      ? "bg-white/10 text-white hover:bg-white/20"
                      : "bg-black/[0.06] text-gray-900 hover:bg-black/[0.1]"
                  }`}
                >
                  <Edit3 className="h-4 w-4" strokeWidth={1.75} />
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsExpanded((previous) => !previous)}
                aria-label={
                  isExpanded ? "Collapse collection" : "Expand collection"
                }
                aria-expanded={isExpanded}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                  isDark
                    ? "bg-white/10 text-white hover:bg-white/20"
                    : "bg-black/[0.06] text-gray-900 hover:bg-black/[0.1]"
                }`}
              >
                <motion.span
                  initial={false}
                  animate={{ rotate: isExpanded ? 90 : 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex h-5 w-5 items-center justify-center"
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={2} />
                </motion.span>
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div
                role="alert"
                className={`
                  mx-4
                  mb-3
                  mt-3
                  flex
                  items-center
                  justify-between
                  gap-3
                  rounded-lg
                  px-3
                  py-2.5
                  text-[12px]
                  sm:mx-5
                  ${colors.errorBg}
                  ${colors.errorText}
                `}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />

                  <span className="truncate">{error}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setError(null)}
                  aria-label="Dismiss error"
                  className="
                    shrink-0
                    rounded-md
                    p-1
                    hover:bg-black/5
                  "
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* =================================================
            EXPANDED CONTROLS
           ================================================= */}

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{
                opacity: 0,
                height: 0,
              }}
              animate={{
                opacity: 1,
                height: "auto",
              }}
              exit={{
                opacity: 0,
                height: 0,
              }}
              transition={{
                duration: 0.2,
              }}
              className="overflow-hidden"
            >
              <div
                className="
                  px-4
                  pb-1
                  pt-3
                  sm:px-5
                "
              >
                {/* Tasks / Notes.

                    Two plain tabs on a rule, the active one marked by a 2px
                    underline in the collection colour. It was a pill with the
                    selected half filled in that colour and a spring sliding the
                    fill between the two; with the header now a slab of the same
                    colour, two things on one card were competing to be the
                    coloured element. The underline states which tab is live and
                    nothing else.

                    Full width on a phone so each half is a thumb-sized target,
                    shrinking to fit from `sm` up so it does not stretch across a
                    wide card. */}
                <div
                  role="tablist"
                  aria-label="Collection content"
                  className={`flex border-b ${colors.border}`}
                >
                  {(
                    [
                      { key: "tasks", label: "Tasks", count: taskCount },
                      { key: "notes", label: "Notes", count: noteCount },
                    ] as const
                  ).map((tab) => {
                    const active = activeTab === tab.key;

                    return (
                      <button
                        key={tab.key}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        aria-controls={`${tab.key}-panel`}
                        id={`${tab.key}-tab`}
                        onClick={() => setActiveTab(tab.key)}
                        className={`relative flex h-10 flex-1 items-center justify-center gap-1.5 text-[13px] font-medium transition-colors duration-150 sm:flex-none sm:px-7 ${
                          active
                            ? isDark
                              ? "text-white"
                              : "text-gray-900"
                            : colors.inactiveTab
                        }`}
                      >
                        <span>{tab.label}</span>

                        <span className="text-[11px] tabular-nums opacity-70">
                          {tab.count}
                        </span>

                        {/* Always rendered, faded rather than mounted: an
                            opacity transition retargets mid-flight if the tabs
                            are tapped twice quickly, where a mount cannot. */}
                        <span
                          aria-hidden="true"
                          className="absolute inset-x-0 -bottom-px h-0.5 rounded-full transition-opacity duration-150 ease-[var(--ease-out)]"
                          style={{
                            backgroundColor: getEffectiveColor(),
                            opacity: active ? 1 : 0,
                          }}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* =========================================
                    TASK STATUS LEGEND
                   ========================================= */}

                {/* The status legend used to sit here, under the tab switch. It
                    is now the info button beside the screen's name: with two
                    collections open it was drawn twice, and it is a thing you
                    read once rather than permanent chrome on every list. See
                    components/ui/TaskStatusInfo. */}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===================================================
          CONTENT
         =================================================== */}

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{
              opacity: 0,
              height: 0,
            }}
            animate={{
              opacity: 1,
              height: "auto",
            }}
            exit={{
              opacity: 0,
              height: 0,
            }}
            transition={{
              duration: 0.2,
            }}
            className="overflow-hidden"
          >
            <motion.div
              role="tabpanel"
              id={activeTab === "tasks" ? "tasks-panel" : "notes-panel"}
              aria-labelledby={
                activeTab === "tasks" ? "tasks-tab" : "notes-tab"
              }
              // Swipe sideways to change tab, as well as tapping one. Touch only
              // — see `canSwipe`. The panel springs back to centre either way;
              // what moves is which tab is selected, and the content's own
              // entrance animation is what shows the change.
              drag={canSwipe ? "x" : false}
              dragConstraints={PANEL_DRAG_LOCK}
              dragElastic={0.18}
              dragMomentum={false}
              onDragEnd={handlePanelSwipe}
              // pan-y leaves vertical scrolling to the browser. Without it a drag
              // on a tall panel captures the pointer and the page stops
              // scrolling, which is the same trap the old row swipe had.
              style={{ touchAction: "pan-y" }}
              className={`
                px-3
                pb-4
                sm:px-4
                sm:pb-5

                ${activeTab === "notes" ? "pt-4 sm:pt-5" : "pt-1"}

                ${colors.content}
              `}
            >
              {/* =================================================
                  TASKS
                 ================================================= */}

              {activeTab === "tasks" && (
                <motion.div
                  key="tasks"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.18 }}
                >
                  {priorityTasks.length > 0 || regularTasks.length > 0 ? (
                    <div className={`space-y-2.5 ${NATIVE_PANEL_SCROLL}`}>
                      {priorityTasks.map((task, index) => (
                        <motion.div
                          key={task.id}
                          initial={{
                            opacity: 0,
                            y: 6,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          transition={{
                            duration: 0.2,
                            delay: entranceDelay(index),
                          }}
                        >
                          <TaskCard
                            {...task}
                            onComplete={handleTaskCompleteWithErrorHandling}
                            onPriorityChange={
                              handleTaskPriorityWithErrorHandling
                            }
                            onTaskUpdate={handleTaskUpdateWithErrorHandling}
                            onTaskDelete={handleTaskDeleteWithErrorHandling}
                            onCollectionChange={onCollectionChange}
                            collections={collections}
                          />
                        </motion.div>
                      ))}

                      {regularTasks.map((task, index) => (
                        <motion.div
                          key={task.id}
                          initial={{
                            opacity: 0,
                            y: 6,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          transition={{
                            duration: 0.2,
                            delay: entranceDelay(priorityTasks.length + index),
                          }}
                        >
                          <TaskCard
                            {...task}
                            onComplete={handleTaskCompleteWithErrorHandling}
                            onPriorityChange={
                              handleTaskPriorityWithErrorHandling
                            }
                            onTaskUpdate={handleTaskUpdateWithErrorHandling}
                            onTaskDelete={handleTaskDeleteWithErrorHandling}
                            onCollectionChange={onCollectionChange}
                            collections={collections}
                          />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`
                        flex
                        min-h-[150px]
                        flex-col
                        items-center
                        justify-center
                        px-6
                        py-8
                        text-center
                        ${colors.textMuted}
                      `}
                    >
                      <div
                        className={`
                          mb-3
                          flex
                          h-9
                          w-9
                          items-center
                          justify-center
                          rounded-xl
                          ${isDark ? "bg-white/[0.035]" : "bg-slate-100/70"}
                        `}
                      >
                        <ListTodo className="h-4 w-4" />
                      </div>

                      <p
                        className={`
                          text-[13px]
                          font-medium
                          ${colors.textSecondary}
                        `}
                      >
                        No tasks yet
                      </p>

                      <p className="mt-1 text-[11px]">
                        Tasks added to this collection will appear here.
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* =================================================
                  NOTES

                  Extra top padding is applied to the content
                  wrapper whenever Notes is active so the note
                  cards do not sit directly against the switch.
                 ================================================= */}

              {activeTab === "notes" && (
                <motion.div
                  key="notes"
                  initial={{
                    opacity: 0,
                    y: 3,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: 0.18,
                  }}
                >
                  {sortedNotes.length > 0 ? (
                    /* Two across at every width, rather than a 1/2/3/4 ladder.
                       A note is a title and a few lines of its body, so at four
                       to a row on a wide screen the body clamped to almost
                       nothing and the grid read as a row of chips. Two keeps
                       each card wide enough for the preview to be worth showing.

                       `items-stretch` with `h-full` on the cards is what stops
                       the pair in a row from being different heights, which is
                       the thing that makes a two-column grid look unfinished. */
                    <div
                      className={`
                        grid
                        grid-cols-2
                        items-stretch
                        gap-3
                        ${NOTES_ROWS_MAX_H}
                      `}
                    >
                      {sortedNotes.map((note, index) => (
                        <motion.div
                          key={note.id}
                          className="h-full"
                          initial={{
                            opacity: 0,
                            y: 6,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          transition={{
                            duration: 0.2,
                            delay: entranceDelay(index),
                          }}
                        >
                          <NoteCard
                            id={note.id}
                            title={note.title}
                            description={note.description}
                            created_at={note.created_at}
                            is_deleted={note.is_deleted}
                            bg_color_hex={note.bg_color_hex}
                            is_pinned={note.is_pinned}
                            collection_id={note.collection_id}
                            list_id={note.list_id}
                            user_id={note.user_id}
                            onPinChange={handleNotePinWithErrorHandling}
                            onColorChange={
                              handleNoteColorChangeWithErrorHandling
                            }
                            onNoteUpdate={handleNoteUpdateWithErrorHandling}
                            onNoteDelete={handleNoteDeleteWithErrorHandling}
                          />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`
                        flex
                        min-h-[150px]
                        flex-col
                        items-center
                        justify-center
                        px-6
                        py-8
                        text-center
                        ${colors.textMuted}
                      `}
                    >
                      <div
                        className={`
                          mb-3
                          flex
                          h-9
                          w-9
                          items-center
                          justify-center
                          rounded-xl
                          ${isDark ? "bg-white/[0.035]" : "bg-slate-100/70"}
                        `}
                      >
                        <StickyNote className="h-4 w-4" />
                      </div>

                      <p
                        className={`
                          text-[13px]
                          font-medium
                          ${colors.textSecondary}
                        `}
                      >
                        No notes yet
                      </p>

                      <p className="mt-1 text-[11px]">
                        Notes added to this collection will appear here.
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
};

export default EnhancedCollectionComponent;
