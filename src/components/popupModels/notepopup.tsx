"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Check, AlertCircle, Pin } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Collection, Note } from "@/types/schema";
import { supabase } from "@/utils/client";
import { useAuth } from "@/context/AuthContext";
import { useAppColors } from "@/hooks/useAppColors";
import { isLightColor, resolveColor } from "@/lib/colors";
import ModalShell from "@/components/ui/ModalShell";
import SectionLabel from "@/components/ui/SectionLabel";
import MetaToggle from "@/components/ui/MetaToggle";
import { DANGER, PRIMARY, WARNING } from "@/components/ui/tokens";

interface CreateNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (
    noteData: {
      title: string;
      description?: string;
      bg_color_hex: string;
      collection_id?: string;
    },
    newNoteData?: Note
  ) => Promise<{ success: boolean; error?: unknown }> | void;
  collections: Collection[];
  listId?: string;
  selectedCollectionId?: string;
}

// Create a proper UTC Date object for iOS compatibility
const createUTCDate = (): Date => {
  const now = new Date();
  // Create date in UTC to avoid timezone issues
  return new Date(
    Date.UTC(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours(),
      now.getMinutes(),
      now.getSeconds()
    )
  );
};

const CreateNoteModal = ({
  isOpen,
  onClose,
  onSubmit,
  collections,
  listId,
  selectedCollectionId,
}: CreateNoteModalProps) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === "dark";
  const { colors: appColors, loading: colorsLoading } = useAppColors();

  const [noteTitle, setNoteTitle] = useState("");
  const [noteDescription, setNoteDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const [isPinned, setIsPinned] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorTimeout, setErrorTimeout] = useState<NodeJS.Timeout | null>(null);
  const [shouldFocusInput, setShouldFocusInput] = useState(true);

  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const colorSectionRef = useRef<HTMLDivElement>(null);

  const getDefaultCollection = useCallback(() => {
    const general = collections.find(
      (c) => c.collection_name?.toLowerCase().trim() === "general"
    );
    if (general) return general;
    if (listId) {
      const listMatch = collections.find((c) => c.list_id === listId);
      if (listMatch) return listMatch;
    }
    return collections.length > 0 ? collections[0] : null;
  }, [collections, listId]);

  useEffect(() => {
    if (isOpen) {
      if (selectedCollectionId) {
        setSelectedCollection(selectedCollectionId);
      } else {
        const def = getDefaultCollection();
        setSelectedCollection(def?.id ?? "");
      }
      // Only focus the input field when modal first opens
      if (shouldFocusInput) {
        setTimeout(() => inputRef.current?.focus(), 100);
        setShouldFocusInput(false);
      }
    } else {
      // Reset shouldFocusInput when modal closes
      setShouldFocusInput(true);
    }
  }, [
    isOpen,
    selectedCollectionId,
    getDefaultCollection,
    selectedColor,
    shouldFocusInput,
  ]);

  useEffect(() => {
    const click = (e: MouseEvent) => {
      if (
        isOpen &&
        modalRef.current &&
        !modalRef.current.contains(e.target as Node) &&
        !isSubmitting
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", click);
    return () => document.removeEventListener("mousedown", click);
  }, [isOpen, isSubmitting, onClose]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) onClose();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [isOpen, isSubmitting, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setNoteTitle("");
      setNoteDescription("");
      setSelectedColor(null);
      setSelectedCollection("");
      setIsPinned(false);
      setIsSubmitting(false);
      setError(null);
      if (errorTimeout) clearTimeout(errorTimeout);
    }
  }, [isOpen, errorTimeout]);

  // A colour is selected the moment the sheet opens, rather than leaving the
  // picker blank until the user taps a swatch. The palette's first entry is the
  // default, matching the list and collection sheets.
  //
  // No ordering hazard like the one ListPopup had: the reset above runs on
  // *close*, so selectedColor is already null by the time this fires for the next
  // open. The null check also means a colour the user picked is never overwritten,
  // and nothing here can deselect — handleColorSelect only ever sets.
  useEffect(() => {
    if (!isOpen || selectedColor !== null || appColors.length === 0) return;
    setSelectedColor(appColors[0].color_hex);
  }, [isOpen, selectedColor, appColors]);

  const showError = useCallback(
    (msg: string) => {
      setError(msg);
      if (errorTimeout) clearTimeout(errorTimeout);
      const t = setTimeout(() => setError(null), 5000);
      setErrorTimeout(t);
    },
    [errorTimeout]
  );

  const handleColorSelect = (color: string) => {
    // Prevent default to avoid any focus changes
    setSelectedColor(color);
    // Make sure we don't focus on title after selecting color
    setShouldFocusInput(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) return showError("Title is required");
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      if (!user || !user.id) throw new Error("You must be logged in");

      const collectionId = selectedCollection || getDefaultCollection()?.id;

      // The colour to store. Normally the swatch the sheet pre-selected, then the
      // parent collection's colour, then the palette's first entry.
      //
      // resolveColor closes the last hole: every link in that chain can be empty
      // or malformed — an unloaded palette, or a collection created before the
      // ListPopup effect-order bug was fixed, which stored "". The final `|| ""`
      // used to let that reach the database, and a note with an unusable colour
      // renders with no background at all.
      const collection = collections.find((c) => c.id === collectionId);
      const finalColor = resolveColor(
        selectedColor || collection?.bg_color_hex || appColors[0]?.color_hex
      );

      // UPDATED: Create a proper Date object with UTC timezone for iOS compatibility
      const createDate = createUTCDate();

      const notePayload = {
        title: noteTitle.trim(),
        description: noteDescription.trim() || null,
        bg_color_hex: finalColor,
        collection_id: collectionId ?? null,
        user_id: user.id,
        list_id: listId || null,
        is_deleted: false,
        is_pinned: isPinned,
        // Use the Date object directly instead of formatting it as a string
        created_at: createDate,
      };

      const { data, error } = await supabase
        .from("note")
        .insert([notePayload])
        .select("*");
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("No data returned");

      if (onSubmit) {
        await onSubmit(
          {
            title: notePayload.title,
            description: notePayload.description ?? undefined,
            bg_color_hex: finalColor,
            collection_id: collectionId ?? undefined,
          },
          data[0] as Note
        );
      }

      onClose();
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Failed to create note");
    } finally {
      setIsSubmitting(false);
    }
  };


  const mutedText = isDark ? "text-gray-400" : "text-gray-500";
  const fieldClass = isDark
    ? "border-white/[0.08] bg-white/[0.04] text-gray-100 placeholder:text-gray-600"
    : "border-black/[0.08] bg-white text-gray-900 placeholder:text-gray-400";

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="New note"
      isDark={isDark}
      canClose={!isSubmitting}
      footer={
        <div className="space-y-2">
          <button
            type="submit"
            form="create-note-form"
            disabled={isSubmitting || !noteTitle.trim()}
            className="min-h-[48px] w-full rounded-2xl text-[15px] font-semibold text-white transition-opacity active:opacity-85 disabled:opacity-45"
            style={{ backgroundColor: PRIMARY }}
          >
            {isSubmitting ? "Creating..." : "Create note"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className={`min-h-[44px] w-full rounded-2xl border text-[14px] font-medium disabled:opacity-45 ${
              isDark
                ? "border-white/[0.08] text-gray-300 active:bg-white/10"
                : "border-black/[0.08] text-gray-700 active:bg-black/5"
            }`}
          >
            Cancel
          </button>
        </div>
      }
    >
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

      <form id="create-note-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <SectionLabel isDark={isDark}>
            Title <span style={{ color: DANGER }}>*</span>
          </SectionLabel>
          <input
            ref={inputRef}
            id="note-title"
            type="text"
            value={noteTitle}
            onChange={(event) => setNoteTitle(event.target.value)}
            maxLength={100}
            disabled={isSubmitting}
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
            disabled={isSubmitting}
            placeholder="Write your note"
            className={`min-h-[140px] w-full rounded-xl border px-3.5 py-3 text-[14px] leading-[1.65] focus:outline-none focus:ring-1 ${fieldClass}`}
            style={{ ["--tw-ring-color" as string]: PRIMARY }}
          />
        </div>

        {collections.length > 0 && (
          <div className="space-y-1.5">
            <SectionLabel isDark={isDark}>Collection</SectionLabel>
            <select
              value={selectedCollection}
              onChange={(event) => setSelectedCollection(event.target.value)}
              disabled={isSubmitting}
              className={`min-h-[48px] w-full rounded-xl border px-3 text-[14px] focus:outline-none focus:ring-1 ${fieldClass}`}
              style={{ ["--tw-ring-color" as string]: PRIMARY }}
            >
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.collection_name || "Unnamed collection"}
                </option>
              ))}
            </select>
          </div>
        )}

        <div ref={colorSectionRef} className="space-y-2">
          <SectionLabel isDark={isDark}>Colour</SectionLabel>
          {colorsLoading ? (
            <p className={`text-[13px] ${mutedText}`}>Loading colours...</p>
          ) : (
            <div className="flex flex-wrap gap-2.5">
              {appColors.map(({ color_hex, color_name }) => {
                const selected = color_hex === selectedColor;
                return (
                  <button
                    key={color_hex}
                    type="button"
                    onClick={() => handleColorSelect(color_hex)}
                    disabled={isSubmitting}
                    aria-pressed={selected}
                    aria-label={`Select ${color_name}`}
                    title={color_name}
                    // A ring outside the swatch rather than a border inside it: a
                    // border eats 2px of a 36px circle, so the selected colour
                    // reads as a slightly smaller, slightly different colour than
                    // the one beside it.
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
                          isLightColor(color_hex) ? "text-gray-900" : "text-white"
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <SectionLabel isDark={isDark}>Pin</SectionLabel>
          <MetaToggle
            icon={<Pin className={`h-4 w-4 ${isPinned ? "fill-current" : ""}`} />}
            label="Pin this note"
            activeLabel="Pinned"
            active={isPinned}
            tone={WARNING}
            onClick={() => setIsPinned((pinned) => !pinned)}
            disabled={isSubmitting}
            isDark={isDark}
            className="w-full"
          />
        </div>
      </form>
    </ModalShell>
  );
};

export default React.memo(CreateNoteModal);
