"use client";

import React, { memo, useEffect, useState } from "react";
import { AlertCircle, Pin, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { useTheme } from "@/context/ThemeContext";
import { useLongPress } from "@/hooks/useLongPress";
import NativeContextMenu, {
  type ContextMenuItem,
} from "@/components/native/NativeContextMenu";
import NoteSidebar from "@/components/popupModels/notedetail";
import { Note, OperationResult } from "@/types/schema";
import { normaliseHex, withAlpha } from "@/lib/colors";

/* =======================================================
   The note card, ported from the iOS `NoteView`.

   Every number here comes from that file rather than being chosen for the web:
   `foldSize: 16`, `cornerRadius: 8`, `.frame(height: 90)`, `.padding(10)`,
   `spacing: 6`, title at 12/semibold and body at 10, both `lineLimit(2)`.
   ======================================================= */

/**
 * The leg of the folded corner, in px — not its hypotenuse. iOS `foldSize`.
 *
 * The card's own `clip-path` cuts this corner away and `NoteFold` draws the flap
 * against the cut, so both read this one value and can never disagree and leave
 * a hairline of card showing past the fold.
 */
const NOTE_FOLD = 16;

/**
 * The card's height, in px. iOS `.frame(height: 90)`.
 *
 * Fixed, which is what makes a note with no description the same height as one
 * with two lines of it — iOS renders the body conditionally and relies on this
 * frame for the same reason. `NOTES_ROWS_MAX_H` in Collection/index.tsx caps
 * the notes panel at two of these plus the gap, so changing it here means
 * changing it there.
 */
const NOTE_HEIGHT = 90;

/** The colour wash over the card, as alpha on the note's own colour. */
const NOTE_WASH = {
  dark: { from: 0.5, to: 0.28 },
  light: { from: 0.4, to: 0.2 },
} as const;

/** The flap's own fill, over an opaque base. iOS: 0.55 dark, 0.45 light. */
const NOTE_FOLD_ALPHA = { dark: 0.55, light: 0.45 } as const;

/**
 * The folded-up corner.
 *
 * A 16x16 box pinned to the bottom-right, clipped to the triangle whose
 * hypotenuse is exactly the diagonal the card's own clip-path cuts — top-left,
 * top-right, bottom-left, which is iOS `FoldFlapShape` vertex for vertex. It
 * therefore sits flush against the cut edge with no seam, which a triangle
 * positioned by eye does not.
 *
 * Two layers like the Swift `ZStack`: an opaque base so the flap is never
 * see-through to whatever is behind the card, then the note's colour over it.
 * The flap is a *stronger* wash than the card, because it is the back of the
 * sheet folded forward.
 *
 * `filter: drop-shadow` rather than `box-shadow`, and this is not a preference:
 * `clip-path` clips an element's box-shadow along with everything else, so a
 * box-shadow here would be invisible. A filter applies to the clipped result,
 * which also means the shadow traces the diagonal rather than a square.
 */
function NoteFold({ color, isDark }: { color: string | null; isDark: boolean }) {
  const alpha = NOTE_FOLD_ALPHA[isDark ? "dark" : "light"];

  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute bottom-0 right-0"
      style={{
        width: NOTE_FOLD,
        height: NOTE_FOLD,
        clipPath: "polygon(0 0, 100% 0, 0 100%)",
        backgroundColor: "var(--surface-field)",
        backgroundImage: color
          ? `linear-gradient(${withAlpha(color, alpha)}, ${withAlpha(color, alpha)})`
          : `linear-gradient(${isDark ? "rgba(255,255,255,0.14)" : "rgba(15,23,42,0.12)"}, ${
              isDark ? "rgba(255,255,255,0.14)" : "rgba(15,23,42,0.12)"
            })`,
        filter: "drop-shadow(-1px -1px 1.5px rgba(0,0,0,0.2))",
      }}
    />
  );
}

interface NoteCardProps {
  id: string;
  title: string | null;
  created_at: Date | string;
  is_deleted?: boolean | null;
  bg_color_hex?: string | null;
  is_pinned?: boolean | null;
  description?: string | null;
  collection_id?: string | null;
  list_id?: string | null;
  user_id?: string | null;

  onPinChange?: (noteId: string, isPinned: boolean) => Promise<OperationResult>;

  onColorChange?: (noteId: string, color: string) => Promise<OperationResult>;

  onNoteUpdate?: (
    noteId: string,
    updatedTitle: string,
    updatedDescription?: string,
  ) => Promise<OperationResult>;

  onNoteDelete?: (noteId: string) => Promise<OperationResult>;

  className?: string;
}

const NoteCard = ({
  id,
  title,
  created_at,
  is_deleted = false,
  bg_color_hex,
  is_pinned = false,
  description,
  collection_id,
  list_id,
  user_id,
  onPinChange,
  onColorChange,
  onNoteUpdate,
  onNoteDelete,
  className = "",
}: NoteCardProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  /** Press position for the hold menu, or null when it is shut. */
  const [menuOrigin, setMenuOrigin] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [noteTitle, setNoteTitle] = useState(title || "");
  const [noteDescription, setNoteDescription] = useState(description || "");
  const [noteBackgroundColor, setNoteBackgroundColor] = useState(
    bg_color_hex || "",
  );

  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setNoteTitle(title || "");
    setNoteDescription(description || "");
    setNoteBackgroundColor(bg_color_hex || "");
  }, [title, description, bg_color_hex]);

  const displayTitle = noteTitle || "Untitled Note";
  const safeColor = normaliseHex(noteBackgroundColor);

  /* -------------------------------------------------------
     CARD COLOUR
     ------------------------------------------------------- */

  /**
   * One colour, the same in both themes.
   *
   * It used to be the note's colour at `22` (13%) over whatever was behind it,
   * with the border at `45` (27%). Two problems. A 13% wash is barely visible at
   * all — which is the whole complaint — and because it is a wash, the same stored
   * hex came out as two different colours depending on the ground under it, so a
   * note that was clearly green in dark mode was a pale mint in light. A colour
   * the user picked should be the colour they see.
   *
   * It then became the colour itself at `A6` (65%) to fix that, which was
   * unmistakably the chosen colour but opaque enough that the type on top had
   * to be picked by luminance. The wash below is the iOS treatment and the
   * middle ground: strong enough to be the colour you chose, light enough that
   * the theme's own foreground reads on it.
   */
  const wash = NOTE_WASH[isDark ? "dark" : "light"];

  /**
   * An opaque base with the note's colour washed over it, which is the iOS
   * `ZStack` — `systemBackground` filled, then a topLeading-to-bottomTrailing
   * gradient of the colour. `--surface-field` is this app's equivalent base:
   * the task and note cards inside a collection drop back to the field colour,
   * which is what makes a collection read as a container.
   *
   * The card used to be the colour itself at `A6` (65%), opaque enough that the
   * type on top had to be chosen by luminance — dark on a yellow note, white on
   * a navy one. A 40% wash over the field does not need that: the result is
   * always close enough to the ground that the theme's own foreground reads on
   * it, which is why `titleColour` no longer branches on the colour and
   * `isLightColor` is no longer imported here.
   */
  const cardStyle: React.CSSProperties = {
    backgroundColor: "var(--surface-field)",
    backgroundImage: safeColor
      ? `linear-gradient(to bottom right, ${withAlpha(
          safeColor,
          wash.from,
        )}, ${withAlpha(safeColor, wash.to)})`
      : undefined,
    // iOS `noteShape.stroke(note.bgColor.opacity(0.35), lineWidth: 0.8)`.
    borderWidth: 0.8,
    borderColor: safeColor
      ? withAlpha(safeColor, 0.35)
      : "var(--surface-border)",
    // `clip-path` clips box-shadow too, so the card's shadow has to be a
    // filter. It traces the folded outline rather than a rectangle as a result,
    // which is what the Swift shadow-on-the-shape does.
    filter: `drop-shadow(0 2px 3px rgba(0,0,0,${isDark ? 0.35 : 0.12}))`,
  };

  const titleColour = isDark ? "text-white" : "text-gray-900";
  const secondaryColour = isDark ? "text-gray-300" : "text-gray-600";

  /* -------------------------------------------------------
     ERROR
     ------------------------------------------------------- */

  const showError = (message: string) => {
    setError(message);

    window.setTimeout(() => {
      setError(null);
    }, 3000);
  };

  /* -------------------------------------------------------
     PIN
     ------------------------------------------------------- */

  /**
   * The pin toggle.
   *
   * The hold menu is the only caller now. It used to be split out of a
   * `handlePinClick` that swallowed the button's own event, but the card face
   * no longer carries a pin button — the pin there is an indicator, as it is on
   * iOS, and the action lives in the menu.
   */
  const togglePin = async () => {
    if (!onPinChange || isProcessing) return;

    setIsProcessing(true);

    try {
      const result = await onPinChange(id, !is_pinned);

      if (!result.success) {
        throw new Error(
          result.error ? String(result.error) : "Failed to update pin",
        );
      }
    } catch (err) {
      console.error("Error updating note pin:", err);
      showError("Failed to update pin");
    } finally {
      setIsProcessing(false);
    }
  };

  /* -------------------------------------------------------
     COLOUR
     ------------------------------------------------------- */

  const updateNoteColor = async (
    noteId: string,
    color: string,
  ): Promise<OperationResult> => {
    if (!onColorChange) {
      return {
        success: false,
        error: "Color handler not provided",
      };
    }

    setIsProcessing(true);

    try {
      const result = await onColorChange(noteId, color);

      if (!result.success) {
        throw new Error(
          result.error ? String(result.error) : "Failed to update colour",
        );
      }

      setNoteBackgroundColor(color);

      return { success: true };
    } catch (err) {
      console.error("Error updating note colour:", err);
      showError("Failed to update colour");

      return {
        success: false,
        error: err,
      };
    } finally {
      setIsProcessing(false);
    }
  };

  /* -------------------------------------------------------
     UPDATE
     ------------------------------------------------------- */

  const updateNote = async (
    noteId: string,
    updatedTitle: string,
    updatedDescription?: string,
  ): Promise<OperationResult> => {
    if (!onNoteUpdate) {
      return {
        success: false,
        error: "Update handler not provided",
      };
    }

    setIsProcessing(true);

    try {
      const result = await onNoteUpdate(
        noteId,
        updatedTitle,
        updatedDescription,
      );

      if (!result.success) {
        throw new Error(
          result.error ? String(result.error) : "Failed to update note",
        );
      }

      setNoteTitle(updatedTitle);

      if (updatedDescription !== undefined) {
        setNoteDescription(updatedDescription);
      }

      return { success: true };
    } catch (err) {
      console.error("Error updating note:", err);
      showError("Failed to update note");

      return {
        success: false,
        error: err,
      };
    } finally {
      setIsProcessing(false);
    }
  };

  /* -------------------------------------------------------
     DELETE

     No router.refresh().
     Parent removes the note locally and updates cache.
     ------------------------------------------------------- */

  const deleteNote = async (noteId: string): Promise<OperationResult> => {
    if (!onNoteDelete) {
      return {
        success: false,
        error: "Delete handler not provided",
      };
    }

    setIsProcessing(true);

    try {
      const result = await onNoteDelete(noteId);

      if (!result.success) {
        throw new Error(
          result.error ? String(result.error) : "Failed to delete note",
        );
      }

      setIsSidebarOpen(false);

      return { success: true };
    } catch (err) {
      console.error("Error deleting note:", err);
      showError("Failed to delete note");

      return {
        success: false,
        error: err,
      };
    } finally {
      setIsProcessing(false);
    }
  };

  /* -------------------------------------------------------
     HOLD MENU

     Tap opens the note. Hold opens pin and delete.

     These two were a swipe: drag the card aside and tap a revealed panel. That
     gesture is gone, because the Tasks/Notes panel now takes a horizontal swipe
     to switch between the two — a card that also answered to a horizontal drag
     would be competing with the container it sits in for the same movement, and
     the card would win, since it is what the finger is actually on.

     Hold is the gesture that was already here for everything else: both task
     cards carry their own, the list cards use the shared useLongPress, and the
     walkthrough has told users to hold a list since the first release. This is
     the same hook the list cards use, so the timing and the haptic match rather
     than being a third implementation with its own feel.
     ------------------------------------------------------- */

  const gestureHandlers = useLongPress({
    onLongPress: (position) => {
      if (!isProcessing) setMenuOrigin(position);
    },
    onTap: () => {
      if (!isProcessing) setIsSidebarOpen(true);
    },
  });

  /**
   * Only the actions this card was actually given.
   *
   * Both props are optional, and a menu row that silently does nothing is worse
   * than a shorter menu — so an absent handler means an absent row rather than a
   * disabled one. With neither, nothing is rendered and the hold does nothing.
   */
  const menuItems: ContextMenuItem[] = [
    ...(onPinChange
      ? [
          {
            label: is_pinned ? "Unpin Note" : "Pin Note",
            icon: <Pin size={18} />,
            onSelect: () => void togglePin(),
          },
        ]
      : []),
    ...(onNoteDelete
      ? [
          {
            label: "Delete Note",
            icon: <Trash2 size={18} />,
            destructive: true,
            onSelect: () => void deleteNote(id),
          },
        ]
      : []),
  ];

  /* -------------------------------------------------------
     SIDEBAR DATA
     ------------------------------------------------------- */

  const noteData: Note = {
    id,
    title: noteTitle || null,
    description: noteDescription || null,
    bg_color_hex: noteBackgroundColor || null,

    created_at:
      typeof created_at === "string" ? new Date(created_at) : created_at,

    collection_id: collection_id || null,
    list_id: list_id || null,
    user_id: user_id || null,
    is_pinned: Boolean(is_pinned),
    is_deleted: Boolean(is_deleted),
  };

  if (is_deleted) return null;

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        {...gestureHandlers}
        /* iOS `FoldedNoteShape`: a rounded rect whose bottom-right corner is cut
           off at 45 degrees. `rounded-lg` is the Swift's `cornerRadius: 8` and
           still rounds the other three — border-radius paints the background,
           clip-path then cuts it — while the polygon takes the corner off.
           `NoteFold` fills the cut. The 16px cut is wider than the 8px radius,
           so no stub of the old curve survives on the diagonal.

           A fixed 90px rather than stretching to its grid row, matching the
           Swift `.frame(height: 90)`. That is what makes a note with no
           description exactly as tall as one with two lines of it, and it is
           what `NOTES_ROWS_MAX_H` counts to cap the panel at two rows. */
        style={{
          ...cardStyle,
          height: NOTE_HEIGHT,
          clipPath: `polygon(0 0, 100% 0, 100% calc(100% - ${NOTE_FOLD}px), calc(100% - ${NOTE_FOLD}px) 100%, 0 100%)`,
        }}
        className={`
          group
          relative
          w-full
          cursor-pointer
          overflow-hidden
          rounded-lg
          border
          p-2.5
          duration-200
          transition-[background-color,border-color]

          ${isDark ? "hover:border-white/20" : "hover:border-black/20"}

          ${isProcessing ? "pointer-events-none opacity-60" : ""}

          ${className}
        `}
        role="button"
        tabIndex={0}
        /* The pinned state is on the label because the marker that shows it is
           `aria-hidden` decoration now rather than a button announcing itself. */
        aria-label={`Open note: ${displayTitle}${is_pinned ? " (pinned)" : ""}`}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setIsSidebarOpen(true);
          }
        }}
      >
        {/* The 3px colour bar that used to run down the leading edge is gone.
            iOS has none: the card's own wash is the colour, so a bar beside it
            was the same fact stated twice — and on a 90px card it was the
            loudest thing on it. */}

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="
                absolute
                left-2
                right-2
                top-2
                z-20
                flex
                items-center
                gap-1.5
                rounded-md
                bg-red-500
                px-2
                py-1.5
                text-[11px]
                text-white
                shadow
              "
            >
              <AlertCircle className="h-3 w-3 shrink-0" />

              <span className="truncate">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Title and body — the iOS `VStack(alignment: .leading, spacing: 6)`.
            12/semibold over 10/secondary, both clamped to two lines, both
            left-aligned. `pr-3` only when pinned, which is the Swift's
            `.padding(.trailing, note.isPinned ? 12 : 0)`: it keeps the title
            off the pin rather than reserving the space on every card.

            The created date used to sit between them. A note's own first line
            says more about it than the day it was made, and at 90px there is
            room for one of the two. The date is still in the detail sidebar.

            The body is rendered conditionally, as iOS does, because the card's
            fixed height means an absent body cannot change it. */}
        <div className="flex flex-col gap-1.5">
          <h4
            className={`
              line-clamp-2
              text-[12px]
              font-semibold
              leading-[15px]
              ${is_pinned ? "pr-3" : ""}
              ${titleColour}
            `}
            title={displayTitle}
          >
            {displayTitle}
          </h4>

          {noteDescription && (
            <p
              title={noteDescription}
              className={`
                line-clamp-2
                text-[10px]
                leading-[13px]
                ${secondaryColour}
              `}
            >
              {noteDescription}
            </p>
          )}
        </div>

        {/* Pinned marker. An indicator, not a control — iOS puts the pin action
            in the context menu and shows only the state here, and the hold menu
            on this card already carries Pin/Unpin. A button on a 90px card was
            a 28px target competing with the card's own tap, and the amber it
            used had nothing to do with the note's colour. */}
        {is_pinned && (
          <span
            aria-hidden="true"
            className={`absolute right-0 top-0 p-2 ${secondaryColour}`}
          >
            <Pin className="h-2.5 w-2.5 fill-current" />
          </span>
        )}

        {/* Processing. Bottom-*left*: the fold occupies the bottom-right, and
            the card's clip-path would cut a spinner there clean out of the card
            rather than merely overlapping it. */}
        {isProcessing && (
          <div className="absolute bottom-1.5 left-2">
            <div
              className="
                h-3.5
                w-3.5
                animate-spin
                rounded-full
                border-2
                border-slate-400/30
                border-t-slate-400
              "
            />
          </div>
        )}

        {/* Last, so the flap paints over anything that reaches the corner. */}
        <NoteFold color={safeColor} isDark={isDark} />
      </motion.article>

      {/* Hold menu. Rendered outside the card so its backdrop covers the screen
          rather than the card it was opened from. */}
      {menuItems.length > 0 && (
        <NativeContextMenu
          origin={menuOrigin}
          items={menuItems}
          onClose={() => setMenuOrigin(null)}
        />
      )}

      {/* Note details */}
      <AnimatePresence>
        {isSidebarOpen && (
          <NoteSidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            note={noteData}
            onColorChange={updateNoteColor}
            onNoteUpdate={updateNote}
            onNoteDelete={onNoteDelete ? deleteNote : undefined}
            isProcessing={isProcessing}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default memo(NoteCard);
