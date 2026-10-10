"use client";

import React, { memo, useEffect, useState } from "react";
import { AlertCircle, CalendarDays, Pin, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { useTheme } from "@/context/ThemeContext";
import { useLongPress } from "@/hooks/useLongPress";
import NativeContextMenu, {
  type ContextMenuItem,
} from "@/components/native/NativeContextMenu";
import NoteSidebar from "@/components/popupModels/notedetail";
import { Note, OperationResult } from "@/types/schema";
import { formatDisplayDate } from "@/utils/dateUtils";
import { isLightColor, normaliseHex } from "@/lib/colors";

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
   * `A6` is 65%: unmistakably the chosen colour, while a grid of notes still reads
   * as cards rather than as a sheet of swatches. The border takes the same hex at
   * full strength, so the edge is the colour rather than a lighter shade of it.
   *
   * Neither value branches on the theme. The text does — `isLightColor` already
   * decides dark or white type from the fill, and that is the only thing here that
   * has to care which colour was picked.
   */
  const cardStyle: React.CSSProperties = safeColor
    ? {
        backgroundColor: `${safeColor}A6`,
        borderColor: safeColor,
      }
    : {
        // No colour chosen: the same field the task cards take, so an uncoloured
        // note sits in the collection exactly as a task does. These were
        // translucent whites, which is why an uncoloured note was invisible on a
        // white background.
        backgroundColor: "var(--surface-field)",
        borderColor: "var(--surface-border)",
      };

  const customColorIsLight = safeColor && isLightColor(safeColor);

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
   * The pin toggle, with no event to stop.
   *
   * Split out of `handlePinClick` so the hold menu can call it too — a menu item
   * has no DOM event of its own to propagate, and the button on the card face
   * still needs to swallow one.
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

  const handlePinClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    void togglePin();
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
        style={cardStyle}
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

          ${isProcessing ? "pointer-events-none opacity-60" : ""}

          ${className}
        `}
        role="button"
        tabIndex={0}
        aria-label={`Open note: ${displayTitle}`}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setIsSidebarOpen(true);
          }
        }}
      >
        {/* Note colour indicator */}
        <div
          className="absolute inset-y-3 left-0 w-[3px] rounded-r-full"
          style={{
            backgroundColor: safeColor || (isDark ? "#64748b" : "#94a3b8"),
          }}
        />

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="
                absolute
                left-3
                right-3
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

        {/* Header */}
        <div className="flex min-w-0 items-start gap-3">
          <div className="min-w-0 flex-1">
            <h4
              className={`
                truncate
                text-[14px]
                font-semibold
                leading-5
                ${titleColour}
              `}
              title={displayTitle}
            >
              {displayTitle}
            </h4>

            {/* Date directly under title */}
            <div
              className={`
                mt-1
                flex
                items-center
                gap-1.5
                text-[11px]
                ${secondaryColour}
              `}
            >
              <CalendarDays className="h-3 w-3 shrink-0" />

              <span>{formatDisplayDate(created_at)}</span>
            </div>
          </div>

          {/* Pin */}
          <button
            type="button"
            onClick={handlePinClick}
            // Keeps the card's hold from arming when the press lands on this
            // button. `onClick`'s stopPropagation is too late: the parent's
            // pointerdown has already fired by then, so the release would count
            // as a tap on the card and open the note behind the pin.
            onPointerDown={(event) => event.stopPropagation()}
            disabled={isProcessing}
            aria-label={is_pinned ? "Unpin note" : "Pin note"}
            className={`
              flex
              h-7
              w-7
              shrink-0
              items-center
              justify-center
              rounded-md
              transition-colors

              ${
                is_pinned
                  ? "text-amber-400"
                  : `${secondaryColour} opacity-60 hover:opacity-100`
              }
            `}
          >
            <Pin
              className={`
                h-3.5
                w-3.5
                ${is_pinned ? "fill-current" : ""}
              `}
            />
          </button>
        </div>

        {/* Description */}
        {noteDescription && (
          <p
            title={noteDescription}
            className={`
              mt-2.5
              w-3/4
              truncate
              text-[12px]
              leading-5
              ${secondaryColour}
            `}
          >
            {noteDescription}
          </p>
        )}

        {/* Pinned label */}
        {is_pinned && (
          <div
            className="
              mt-2
              flex
              items-center
              gap-1
              text-[10px]
              font-medium
              text-amber-400
            "
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Pinned
          </div>
        )}

        {/* Processing */}
        {isProcessing && (
          <div className="absolute bottom-2 right-3">
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
