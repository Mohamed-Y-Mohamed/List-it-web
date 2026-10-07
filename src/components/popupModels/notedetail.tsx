"use client";

// Note Detail, and the edit form behind it. Same two-mode sheet as the task one.
//
// A note is mostly its content, so the view is built around reading it: title,
// date, the text itself on one quiet surface, and nothing wrapped in a box inside
// a box. Pin applies on the tap — it is a property, not a form field, and putting
// it behind Save meant pinning something and then losing it to Cancel. Editing
// the title, the body, the colour or the collection is what the form is for.
//
// The note is re-read from the database on open. The row handed down by a card
// can be a few seconds stale on the fields that matter least and a whole
// collection out of date on the one that matters most, and a sheet that shows the
// wrong collection is worse than one that takes a beat to show the right one.

import React, { useEffect, useRef, useState, useCallback } from "react";
import { X, Check, Trash2, AlertCircle, Pin, Pencil, ChevronLeft } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import BottomSheet from "@/components/BottomSheet";
import ConfirmDialog from "./ConfirmDialog";
import { OperationResult } from "@/types/schema";
import { useAuth } from "@/context/AuthContext";
import { useAppColors } from "@/hooks/useAppColors";
import { apiFetch } from "@/lib/apiFetch";
import SectionLabel from "@/components/ui/SectionLabel";
import InfoRow from "@/components/ui/InfoRow";
import MetaToggle from "@/components/ui/MetaToggle";
import {
  DANGER,
  PRIMARY,
  SUCCESS,
  WARNING,
  collectionTint,
} from "@/components/ui/tokens";

interface NoteSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  note: {
    id: string;
    title: string | null;
    description?: string | null;
    bg_color_hex?: string | null;
    created_at: Date | string;
    collection_id?: string | null;
    is_pinned?: boolean | null;
    is_deleted?: boolean | null;
    list_id?: string | null;
  };
  onColorChange?: (noteId: string, color: string) => Promise<OperationResult>;
  onNoteUpdate?: (
    noteId: string,
    updatedTitle: string,
    updatedDescription?: string
  ) => Promise<OperationResult>;
  onNoteDelete?: (noteId: string) => Promise<OperationResult>;
  onPinToggle?: (noteId: string, isPinned: boolean) => Promise<OperationResult>;
  collections?: { id: string; collection_name: string }[];
  isProcessing?: boolean;
  /** The list this note sits in, for the relationship row. */
  listName?: string | null;
}

interface CollectionOption {
  id: string;
  collection_name: string | null;
  bg_color_hex?: string | null;
}

const NoteDetails = ({
  isOpen,
  onClose,
  note,
  onColorChange,
  onNoteUpdate,
  onNoteDelete,
  onPinToggle,
  collections: externalCollections = [],
  isProcessing: externalProcessing = false,
  listName,
}: NoteSidebarProps) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === "dark";

  const mutedText = isDark ? "text-gray-400" : "text-gray-500";
  const bodyText = isDark ? "text-gray-200" : "text-gray-700";
  const hairline = isDark ? "border-white/[0.08]" : "border-black/[0.06]";
  const fieldClass = isDark
    ? "border-white/[0.08] bg-white/[0.04] text-gray-100 placeholder:text-gray-600"
    : "border-black/[0.08] bg-white text-gray-900 placeholder:text-gray-400";

  const sheetRef = useRef<HTMLDivElement>(null);
  const { colors: appColors, loading: colorsLoading } = useAppColors();

  // --- DB-VERIFIED VALUES ---
  const [verifiedNote, setVerifiedNote] = useState(note);

  const [collections, setCollections] = useState<CollectionOption[]>(
    externalCollections
  );

  // --- FORM STATE ---
  const [noteTitle, setNoteTitle] = useState(verifiedNote.title || "");
  const [noteDescription, setNoteDescription] = useState(
    verifiedNote.description || ""
  );
  const [selectedColor, setSelectedColor] = useState<string>(
    verifiedNote.bg_color_hex || ""
  );
  const [selectedCollection, setSelectedCollection] = useState<string>(
    verifiedNote.collection_id || ""
  );
  const [isPinned, setIsPinned] = useState(verifiedNote.is_pinned || false);
  const [isNoteChanged, setIsNoteChanged] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // --- UI STATE ---
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isProcessing = isSaving || isDeleting || isToggling || externalProcessing;

  const showError = useCallback((message: string) => {
    setError(message);
    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setError(null), 5000);
  }, []);

  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    if (successTimer.current) clearTimeout(successTimer.current);
    successTimer.current = setTimeout(() => setSuccessMessage(null), 2500);
  }, []);

  useEffect(
    () => () => {
      if (errorTimer.current) clearTimeout(errorTimer.current);
      if (successTimer.current) clearTimeout(successTimer.current);
    },
    []
  );

  /** Which discard the dialog is asking about, or null while it is shut. */
  const [pendingDiscard, setPendingDiscard] = useState<null | "close" | "edit">(
    null
  );

  const handleClose = useCallback(() => {
    if (isEditing && isNoteChanged) {
      setPendingDiscard("close");
      return;
    }
    onClose();
  }, [isEditing, isNoteChanged, onClose]);

  const revertForm = useCallback(() => {
    setNoteTitle(verifiedNote.title || "");
    setNoteDescription(verifiedNote.description || "");
    setSelectedColor(verifiedNote.bg_color_hex || "");
    setSelectedCollection(verifiedNote.collection_id || "");
    setIsNoteChanged(false);
    setError(null);
    setIsEditing(false);
  }, [verifiedNote]);

  const handleCancelEdit = useCallback(() => {
    if (isNoteChanged) {
      setPendingDiscard("edit");
      return;
    }
    revertForm();
  }, [isNoteChanged, revertForm]);

  const confirmDiscard = useCallback(() => {
    const intent = pendingDiscard;
    setPendingDiscard(null);
    if (intent === "close") onClose();
    else if (intent === "edit") revertForm();
  }, [pendingDiscard, onClose, revertForm]);

  // --- KEYBOARD ESC ---
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !isOpen) return;
      if (showDeleteConfirmation) setShowDeleteConfirmation(false);
      else if (!isProcessing) handleClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, showDeleteConfirmation, isProcessing, handleClose]);

  // --- VERIFY NOTE DATA DIRECTLY FROM DATABASE ---
  useEffect(() => {
    if (!isOpen || !note.id || !user) return;

    apiFetch(`/api/notes?id=${note.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        const data = payload?.data;
        if (!data) return;
        setVerifiedNote({
          id: data.id,
          title: data.title,
          description: data.description,
          bg_color_hex: data.bg_color_hex,
          created_at: data.created_at,
          collection_id: data.collection_id,
          is_pinned: data.is_pinned,
          is_deleted: data.is_deleted,
          list_id: data.list_id,
        });
      })
      .catch(() => {
        // The row from the card stands in. Falling back to it beats an empty
        // sheet when the network drops.
      });
  }, [isOpen, note.id, note, user]);

  useEffect(() => {
    if (!isOpen || !user) return;
    const params = new URLSearchParams();
    if (verifiedNote.list_id) params.set("list_id", verifiedNote.list_id);
    apiFetch(`/api/collections?${params}`)
      .then((r) => r.json())
      .then(({ data }) => {
        if (data) setCollections(data);
      })
      .catch(() => {});
  }, [isOpen, verifiedNote.list_id, user]);

  // --- RELOAD THE FORM WHEN THE VERIFIED ROW LANDS ---
  //
  // Deliberately not keyed on `collections`: that list arrives on its own
  // schedule and re-running this on it would reset the form under someone's
  // fingers a beat after they started typing.
  useEffect(() => {
    if (!isOpen) return;
    setSelectedCollection(verifiedNote.collection_id || "");
    setNoteTitle(verifiedNote.title || "");
    setNoteDescription(verifiedNote.description || "");
    setSelectedColor(verifiedNote.bg_color_hex || "");
    setIsPinned(verifiedNote.is_pinned || false);
    setError(null);
    setSuccessMessage(null);
    setIsNoteChanged(false);
  }, [verifiedNote, isOpen]);

  // Reopening a note never lands mid-edit from last time.
  //
  // Keyed on `isOpen` alone rather than folded into the effect above: that one
  // also re-runs when the database verification resolves, which happens a beat
  // after opening and again on any refetch — resetting there would throw someone
  // out of the form while they were typing in it.
  useEffect(() => {
    if (isOpen) setIsEditing(false);
  }, [isOpen]);

  // --- TRACK CHANGES ---
  //
  // Pin is absent: it writes on the tap, so counting it here would raise the
  // discard dialog on the way out of a sheet with nothing unsaved in it.
  useEffect(() => {
    const changed =
      noteTitle !== (verifiedNote.title || "") ||
      noteDescription !== (verifiedNote.description || "") ||
      selectedColor !== (verifiedNote.bg_color_hex || "") ||
      selectedCollection !== (verifiedNote.collection_id || "");
    setIsNoteChanged(changed);
  }, [noteTitle, noteDescription, selectedColor, selectedCollection, verifiedNote]);

  // --- IMMEDIATE PIN ---
  //
  // Written here rather than through a parent handler because no screen passes
  // one: `noteCard` wires colour, update and delete and leaves pin to the sheet.
  const togglePinned = async () => {
    const next = !isPinned;
    setIsPinned(next);
    setIsToggling(true);
    try {
      if (onPinToggle) {
        const result = await onPinToggle(verifiedNote.id, next);
        if (!result.success) throw new Error(String(result.error));
      } else {
        const res = await apiFetch("/api/notes", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: verifiedNote.id, is_pinned: next }),
        });
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error || "Failed to pin note");
        }
      }
      setVerifiedNote((prev) => ({ ...prev, is_pinned: next }));
      // So the card behind the sheet redraws with the pin it now has.
      if (onNoteUpdate) {
        await onNoteUpdate(verifiedNote.id, noteTitle, noteDescription);
      }
    } catch {
      setIsPinned(!next);
      showError("Could not update this note.");
    } finally {
      setIsToggling(false);
    }
  };

  // --- SAVE THE FORM FIELDS ---
  const updateNoteInDatabase = async (): Promise<OperationResult> => {
    if (!noteTitle.trim()) {
      showError("Title is required");
      return { success: false, error: "Title is required" };
    }
    if (!user?.id) {
      showError("You must be logged in to update a note");
      return { success: false, error: "Authentication required" };
    }
    try {
      setIsSaving(true);
      const updateData = {
        title: noteTitle.trim(),
        description: noteDescription.trim() || null,
        bg_color_hex: selectedColor,
        is_pinned: isPinned,
      };

      const patchRes = await apiFetch("/api/notes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: verifiedNote.id, ...updateData }),
      });
      if (!patchRes.ok) {
        const errBody = await patchRes.json();
        throw new Error(errBody.error || "Failed to update note");
      }
      const { data } = await patchRes.json();

      if (onNoteUpdate) {
        const r = await onNoteUpdate(verifiedNote.id, noteTitle, noteDescription);
        if (!r.success) throw new Error(String(r.error));
      }
      if (onColorChange && selectedColor !== verifiedNote.bg_color_hex) {
        const r = await onColorChange(verifiedNote.id, selectedColor);
        if (!r.success) throw new Error(String(r.error));
      }

      setVerifiedNote((prev) => ({
        ...prev,
        title: updateData.title,
        description: updateData.description,
        bg_color_hex: updateData.bg_color_hex,
        is_pinned: updateData.is_pinned,
      }));

      return { success: true, data };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      showError(message || "Failed to update note");
      return { success: false, error: err };
    } finally {
      setIsSaving(false);
    }
  };

  const updateCollectionInDatabase = async (): Promise<OperationResult> => {
    if (!user?.id) return { success: false, error: "Authentication required" };

    const collectionIdForDb =
      selectedCollection === "" ? null : selectedCollection;
    const currentCollectionId = verifiedNote.collection_id ?? "";
    if (selectedCollection === currentCollectionId) return { success: true };

    try {
      const patchRes = await apiFetch("/api/notes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: verifiedNote.id,
          collection_id: collectionIdForDb,
        }),
      });
      if (!patchRes.ok) {
        const errBody = await patchRes.json();
        throw new Error(errBody.error || "Failed to update note collection");
      }
      const { data } = await patchRes.json();

      setVerifiedNote((prev) => ({ ...prev, collection_id: collectionIdForDb }));

      if (onNoteUpdate) {
        const updateResult = await onNoteUpdate(
          verifiedNote.id,
          noteTitle,
          noteDescription
        );
        if (!updateResult.success) {
          throw new Error(
            String(updateResult.error || "Failed to refresh note data")
          );
        }
      }
      return { success: true, data };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      showError(message || "Failed to update collection");
      return { success: false, error: err };
    }
  };

  const handleSaveNote = async () => {
    const res = await updateNoteInDatabase();
    if (!res.success) return;

    if (selectedCollection !== (verifiedNote.collection_id ?? "")) {
      const moved = await updateCollectionInDatabase();
      if (!moved.success) return;
    }

    showSuccess("Changes saved");
    // Back to the view rather than out of the sheet, same as the task one.
    setIsEditing(false);
    setIsNoteChanged(false);
  };

  const handleConfirmDelete = async () => {
    if (!user?.id) {
      showError("You must be logged in to delete a note");
      return;
    }
    try {
      setIsDeleting(true);
      const deleteRes = await apiFetch("/api/notes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: verifiedNote.id, hard: true }),
      });
      if (!deleteRes.ok) {
        const errBody = await deleteRes.json();
        throw new Error(errBody.error || "Failed to delete note");
      }
      if (onNoteDelete) await onNoteDelete(verifiedNote.id);
      setShowDeleteConfirmation(false);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      showError(message || "Failed to delete note");
    } finally {
      setIsDeleting(false);
    }
  };

  // --- DERIVED ---
  const createdLabel = verifiedNote.created_at
    ? new Date(verifiedNote.created_at).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Unknown date";

  const resolvedCollectionName =
    collections.find((c) => c.id === (verifiedNote.collection_id || ""))
      ?.collection_name ?? null;

  const colorName =
    appColors.find((c) => c.color_hex === selectedColor)?.color_name ?? null;

  if (!isOpen) return null;

  const primaryButton = (
    label: string,
    onClick: () => void,
    color: string,
    disabled?: boolean
  ) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="min-h-[48px] w-full rounded-2xl text-[15px] font-semibold text-white transition-opacity active:opacity-85 disabled:opacity-45"
      style={{ backgroundColor: color }}
    >
      {label}
    </button>
  );

  const ghostButton = (
    label: string,
    onClick: () => void,
    disabled?: boolean,
    tone?: string
  ) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`min-h-[48px] w-full rounded-2xl border text-[15px] font-medium transition-colors disabled:opacity-45 ${hairline} ${
        isDark ? "active:bg-white/10" : "active:bg-black/5"
      }`}
      style={tone ? { color: tone } : undefined}
    >
      {label}
    </button>
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      label={isEditing ? "Edit note" : "Note details"}
      isDark={isDark}
      canClose={!isProcessing}
      // A note has its own stored colour, so the tint comes from that rather than
      // from the collection — it is the thing the card already showed as a stripe.
      surfaceColor={collectionTint(selectedColor || null, isDark, 6)}
      footer={
        <div className="mx-auto w-full max-w-md space-y-2">
          {!isEditing ? (
            <>
              {primaryButton(
                "Edit note",
                () => setIsEditing(true),
                PRIMARY,
                isProcessing
              )}
              {ghostButton(
                "Delete",
                () => setShowDeleteConfirmation(true),
                isProcessing,
                DANGER
              )}
            </>
          ) : (
            <>
              {primaryButton(
                isSaving ? "Saving..." : "Save changes",
                handleSaveNote,
                PRIMARY,
                isProcessing || !isNoteChanged || !noteTitle.trim()
              )}
              {ghostButton("Cancel", handleCancelEdit, isProcessing)}
            </>
          )}
        </div>
      }
    >
      <div
        ref={sheetRef}
        className={`mx-auto w-full max-w-md px-5 ${
          isDark ? "text-gray-100" : "text-gray-900"
        }`}
      >
        <div className="flex items-center justify-between py-1">
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className={`-ml-2 flex min-h-[44px] items-center gap-1 rounded-full px-2 pr-3 text-[14px] font-medium ${bodyText} ${
              isDark ? "active:bg-white/10" : "active:bg-black/5"
            }`}
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
            Back
          </button>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className={`-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              isDark ? "active:bg-white/10" : "active:bg-black/5"
            }`}
            aria-label="Close"
          >
            <X className={`h-5 w-5 ${mutedText}`} />
          </button>
        </div>

        {successMessage && (
          <div
            className="mb-3 flex items-center gap-2 rounded-xl px-3 py-2 text-[13px]"
            style={{
              backgroundColor: `color-mix(in srgb, ${SUCCESS} 14%, transparent)`,
              color: SUCCESS,
            }}
          >
            <Check className="h-4 w-4 shrink-0" />
            {successMessage}
          </div>
        )}
        {error && (
          <div
            className="mb-3 flex items-center gap-2 rounded-xl px-3 py-2 text-[13px]"
            style={{
              backgroundColor: `color-mix(in srgb, ${DANGER} 14%, transparent)`,
              color: DANGER,
            }}
            role="alert"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {!isEditing ? (
          /* ---------------- VIEW ---------------- */
          <div className="space-y-5 pb-2">
            <div className="space-y-1.5">
              <div className="flex items-start gap-2">
                <span
                  className="mt-1.5 h-4 w-1 shrink-0 rounded-full"
                  style={{ backgroundColor: isPinned ? WARNING : selectedColor || PRIMARY }}
                  aria-hidden="true"
                />
                <h2 className="min-w-0 break-words text-[21px] font-bold leading-tight">
                  {noteTitle || "Untitled note"}
                </h2>
              </div>
              <p className={`text-[13px] ${mutedText}`}>{createdLabel}</p>
            </div>

            {/* The two things a note's view is allowed to do. Editing the text,
                the colour or the collection is behind Edit note. */}
            <div className="grid grid-cols-2 gap-2">
              <MetaToggle
                icon={<Pin className={`h-4 w-4 ${isPinned ? "fill-current" : ""}`} />}
                label="Pin"
                activeLabel="Pinned"
                active={isPinned}
                tone={WARNING}
                onClick={togglePinned}
                disabled={isProcessing}
                isDark={isDark}
              />
              <MetaToggle
                icon={<Pencil className="h-4 w-4" />}
                label="Edit"
                active={false}
                tone={PRIMARY}
                onClick={() => setIsEditing(true)}
                disabled={isProcessing}
                isDark={isDark}
              />
            </div>

            <div className="space-y-1.5">
              <SectionLabel isDark={isDark}>Note</SectionLabel>
              {noteDescription.trim() ? (
                /* One surface, not three. The content is the point of the screen
                   and it reads better on a single quiet panel than inside a card
                   inside a card. */
                <div
                  className={`rounded-2xl border px-3.5 py-3 ${hairline} ${
                    isDark ? "bg-white/[0.03]" : "bg-black/[0.02]"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words text-[14px] leading-[1.65]">
                    {noteDescription}
                  </p>
                </div>
              ) : (
                <p className={`text-[14px] ${mutedText}`}>This note is empty.</p>
              )}
            </div>

            <div className={`space-y-0.5 border-t pt-3 ${hairline}`}>
              <InfoRow
                label="Collection"
                value={resolvedCollectionName}
                isDark={isDark}
              />
              <InfoRow label="List" value={listName} isDark={isDark} />
              <div className="flex min-h-[32px] items-center justify-between gap-4">
                <span className={`text-[13px] ${mutedText}`}>Colour</span>
                <span className="flex items-center gap-2">
                  <span
                    className={`h-3.5 w-3.5 rounded-full border ${hairline}`}
                    style={{ backgroundColor: selectedColor || "transparent" }}
                    aria-hidden="true"
                  />
                  <span className={`text-[13px] ${isDark ? "text-gray-200" : "text-gray-700"}`}>
                    {colorName ?? (selectedColor ? selectedColor : "Default")}
                  </span>
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* ---------------- EDIT ---------------- */
          <div className="space-y-5 pb-2">
            <h2 className="text-[17px] font-semibold">Edit note</h2>

            <div className="space-y-1.5">
              <SectionLabel isDark={isDark}>Title</SectionLabel>
              <input
                id="note-title"
                type="text"
                value={noteTitle}
                onChange={(event) => {
                  setNoteTitle(event.target.value);
                  if (error === "Title is required" && event.target.value.trim()) {
                    setError(null);
                  }
                }}
                maxLength={100}
                disabled={isProcessing}
                placeholder="Note title"
                className={`min-h-[48px] w-full rounded-xl border px-3.5 text-[15px] focus:outline-none focus:ring-1 ${fieldClass}`}
                style={{ ["--tw-ring-color" as string]: PRIMARY }}
              />
              <p className={`text-right text-[11px] ${mutedText}`}>
                {noteTitle.length}/100
              </p>
            </div>

            <div className="space-y-1.5">
              <SectionLabel isDark={isDark}>Content</SectionLabel>
              <textarea
                id="note-description"
                value={noteDescription}
                onChange={(event) => setNoteDescription(event.target.value)}
                disabled={isProcessing}
                placeholder="Write your note"
                className={`min-h-[160px] w-full rounded-xl border px-3.5 py-3 text-[14px] leading-[1.65] focus:outline-none focus:ring-1 ${fieldClass}`}
                style={{ ["--tw-ring-color" as string]: PRIMARY }}
              />
            </div>

            <div className="space-y-2">
              <SectionLabel isDark={isDark}>Colour</SectionLabel>
              {colorsLoading ? (
                <p className={`text-[13px] ${mutedText}`}>Loading colours…</p>
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  {appColors.map(({ color_hex, color_name }) => {
                    const selected = color_hex === selectedColor;
                    return (
                      <button
                        key={color_hex}
                        type="button"
                        onClick={() => setSelectedColor(color_hex)}
                        disabled={isProcessing}
                        aria-pressed={selected}
                        aria-label={`Select ${color_name}`}
                        title={color_name}
                        // A ring outside the swatch rather than a border inside
                        // it: a border eats 2px of a 36px circle and makes the
                        // selected colour read as a slightly smaller, slightly
                        // different colour than the one next to it.
                        className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-shadow disabled:opacity-50 ${
                          selected
                            ? isDark
                              ? "ring-2 ring-white ring-offset-2 ring-offset-[#131A2B]"
                              : "ring-2 ring-gray-900 ring-offset-2 ring-offset-white"
                            : ""
                        }`}
                        style={{ backgroundColor: color_hex }}
                      >
                        {selected && (
                          <Check
                            className={`h-4 w-4 drop-shadow ${
                              isLightHex(color_hex) ? "text-gray-900" : "text-white"
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <SectionLabel isDark={isDark}>Collection</SectionLabel>
              <select
                id="collection-select"
                value={selectedCollection}
                onChange={(event) => setSelectedCollection(event.target.value)}
                disabled={isProcessing}
                className={`min-h-[48px] w-full rounded-xl border px-3 text-[14px] focus:outline-none focus:ring-1 ${fieldClass}`}
                style={{ ["--tw-ring-color" as string]: PRIMARY }}
              >
                <option value="">No collection</option>
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.collection_name || "Unnamed collection"}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <SectionLabel isDark={isDark}>Status</SectionLabel>
              <MetaToggle
                icon={<Pin className={`h-4 w-4 ${isPinned ? "fill-current" : ""}`} />}
                label="Pin"
                activeLabel="Pinned"
                active={isPinned}
                tone={WARNING}
                onClick={togglePinned}
                disabled={isProcessing}
                isDark={isDark}
                className="w-full"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowDeleteConfirmation(true)}
              disabled={isProcessing}
              className={`flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border text-[14px] font-medium disabled:opacity-45 ${hairline}`}
              style={{ color: DANGER }}
            >
              <Trash2 className="h-4 w-4" />
              Delete note
            </button>
          </div>
        )}

        {/* Portalled, so the drag transform on the sheet panel cannot turn
            `fixed inset-0` into "the panel" and clip it. */}
        <ConfirmDialog
          isOpen={showDeleteConfirmation}
          isDark={isDark}
          destructive
          busy={isDeleting}
          title="Delete note"
          message="This cannot be undone and the note will be permanently removed."
          confirmLabel="Delete"
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteConfirmation(false)}
        />

        <ConfirmDialog
          isOpen={pendingDiscard !== null}
          isDark={isDark}
          title="Discard changes?"
          message={
            pendingDiscard === "close"
              ? "You have unsaved changes to this note. Leaving now loses them."
              : "You have unsaved changes to this note. Cancelling loses them."
          }
          confirmLabel="Discard"
          cancelLabel="Keep editing"
          onConfirm={confirmDiscard}
          onCancel={() => setPendingDiscard(null)}
        />
      </div>
    </BottomSheet>
  );
};

/** Whether a tick on this swatch needs to be dark to be visible. */
function isLightHex(hex: string): boolean {
  if (!hex.startsWith("#") || hex.length < 7) return false;
  const sum =
    parseInt(hex.slice(1, 3), 16) +
    parseInt(hex.slice(3, 5), 16) +
    parseInt(hex.slice(5, 7), 16);
  return sum > 384;
}

export default React.memo(NoteDetails);
