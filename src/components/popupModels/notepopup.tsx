"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, Check, AlertCircle, ChevronDown } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Collection, LIST_COLORS, Note } from "@/types/schema";
import { supabase } from "@/utils/client";
import { useAuth } from "@/context/AuthContext";

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

  const [noteTitle, setNoteTitle] = useState("");
  const [noteDescription, setNoteDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>(LIST_COLORS[0]);
  const [selectedCollection, setSelectedCollection] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorTimeout, setErrorTimeout] = useState<NodeJS.Timeout | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      // Set default color if not already set
      if (!selectedColor) {
        setSelectedColor(LIST_COLORS[0]);
      }
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, selectedCollectionId, getDefaultCollection, selectedColor]);

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
      setSelectedColor(LIST_COLORS[0]);
      setSelectedCollection("");
      setIsSubmitting(false);
      setError(null);
      if (errorTimeout) clearTimeout(errorTimeout);
    }
  }, [isOpen, errorTimeout]);

  const showError = useCallback(
    (msg: string) => {
      setError(msg);
      if (errorTimeout) clearTimeout(errorTimeout);
      const t = setTimeout(() => setError(null), 5000);
      setErrorTimeout(t);
    },
    [errorTimeout]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) return showError("Title is required");
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      if (!user || !user.id) throw new Error("You must be logged in");

      const collectionId = selectedCollection || getDefaultCollection()?.id;

      // UPDATED: Create a proper Date object with UTC timezone for iOS compatibility
      const createDate = createUTCDate();

      const notePayload = {
        title: noteTitle.trim(),
        description: noteDescription.trim() || null,
        bg_color_hex: selectedColor,
        collection_id: collectionId ?? null,
        user_id: user.id,
        list_id: listId || null,
        is_deleted: false,
        is_pinned: false,
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
            bg_color_hex: selectedColor,
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

  if (!isOpen) return null;

  return (
    <div>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 backdrop-blur-md bg-black/30"
        onClick={!isSubmitting ? onClose : undefined}
        aria-hidden="true"
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div
          ref={modalRef}
          className={`w-full max-w-md rounded-lg ${isDark ? "bg-gray-800" : "bg-white"} shadow-xl transition-all p-6 mx-4 pointer-events-auto`}
        >
          <div className="flex justify-between items-center mb-4">
            <h2
              className={`text-xl font-semibold ${isDark ? "text-gray-100" : "text-gray-800"}`}
            >
              Create New Note
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full"
              disabled={isSubmitting}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                className={`block mb-2 text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                Title
              </label>
              <input
                ref={inputRef}
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                className={`w-full px-3 py-2 rounded-md border ${isDark ? "bg-gray-700 text-white border-gray-600" : "bg-white border-gray-300 text-black"}`}
                required
                maxLength={100}
              />
            </div>

            <div className="mb-4">
              <label
                className={`block mb-2 text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                Description (Optional)
              </label>
              <textarea
                value={noteDescription}
                onChange={(e) => setNoteDescription(e.target.value)}
                className={`w-full px-3 py-2 rounded-md border resize-none ${isDark ? "bg-gray-700 text-white border-gray-600" : "bg-white border-gray-300 text-black"}`}
              />
            </div>

            <div className="mb-4">
              <label
                className={`block mb-2 text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {LIST_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-8 w-8 rounded-full relative ${selectedColor === color ? "ring-2 ring-offset-2 ring-sky-500" : ""}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  >
                    {selectedColor === color && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Check className="text-white w-4 h-4" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label
                className={`block mb-2 text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                Collection
              </label>
              <div className="relative">
                <select
                  value={selectedCollection}
                  onChange={(e) => setSelectedCollection(e.target.value)}
                  className={`w-full px-3 py-2 rounded-md border 
                    ${isDark ? "bg-gray-700 text-white border-gray-600" : "bg-white border-gray-300 text-black"} 
                    appearance-none`}
                  style={{
                    WebkitAppearance: "none",
                    MozAppearance: "none",
                  }}
                >
                  <option value="">Select a collection</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.collection_name || "Unnamed Collection"}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                  <ChevronDown
                    className={`h-4 w-4 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 rounded-md ${
                  isDark
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-md bg-sky-500 hover:bg-sky-600 text-white"
              >
                {isSubmitting ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default React.memo(CreateNoteModal);
