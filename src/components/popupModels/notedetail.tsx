"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  X,
  Check,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Pin,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { LIST_COLORS } from "@/types/schema";
import { supabase } from "@/utils/client";
import { useAuth } from "@/context/AuthContext";

interface OperationResult {
  success: boolean;
  error?: unknown;
  data?: unknown;
  warning?: string;
}

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
}: NoteSidebarProps) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === "dark";
  const sidebarRef = useRef<HTMLDivElement>(null);

  // --- STATE FOR DB-VERIFIED VALUES ---
  const [verifiedNote, setVerifiedNote] = useState(note);

  // --- FETCH COLLECTIONS FOR THIS NOTE'S LIST_ID OR USER ---
  const [collections, setCollections] =
    useState<{ id: string; collection_name: string | null }[]>(
      externalCollections
    );

  // --- FORM STATE ---
  const [noteTitle, setNoteTitle] = useState(verifiedNote.title || "");
  const [noteDescription, setNoteDescription] = useState(
    verifiedNote.description || ""
  );
  const [selectedColor, setSelectedColor] = useState<string>(
    verifiedNote.bg_color_hex || LIST_COLORS[0]
  );
  const [selectedCollection, setSelectedCollection] = useState<string>(
    verifiedNote.collection_id || ""
  );
  const [isPinned, setIsPinned] = useState(verifiedNote.is_pinned || false);

  const [titleCharCount, setTitleCharCount] = useState(
    (verifiedNote.title || "").length
  );
  const [descriptionCharCount, setDescriptionCharCount] = useState(
    (verifiedNote.description || "").length
  );
  const [isNoteChanged, setIsNoteChanged] = useState(false);

  // --- UI STATE ---
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorTimeout, setErrorTimeout] = useState<NodeJS.Timeout | null>(null);
  const [successTimeout, setSuccessTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  const isProcessing = isSaving || isDeleting || externalProcessing;

  // --- DISPLAY HELPERS ---
  const showError = useCallback(
    (message: string) => {
      setError(message);
      if (errorTimeout) clearTimeout(errorTimeout);
      const t = setTimeout(() => setError(null), 5000);
      setErrorTimeout(t);
    },
    [errorTimeout]
  );

  const showSuccess = useCallback(
    (message: string) => {
      setSuccessMessage(message);
      if (successTimeout) clearTimeout(successTimeout);
      const t = setTimeout(() => setSuccessMessage(null), 3000);
      setSuccessTimeout(t);
    },
    [successTimeout]
  );

  // --- AUTO-RESIZE TEXTAREA ---
  const autoResizeTextarea = useCallback((el: HTMLTextAreaElement) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, []);

  // --- HANDLE CLOSE WITH UNSAVED ---
  // This needs to be defined before the useEffect that uses it
  const handleClose = useCallback(() => {
    if (isNoteChanged) {
      if (
        window.confirm(
          "You have unsaved changes. Are you sure you want to discard them?"
        )
      ) {
        onClose();
      }
    } else {
      onClose();
    }
  }, [isNoteChanged, onClose]);

  // --- KEYBOARD ESC ---
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        if (showDeleteConfirmation) {
          setShowDeleteConfirmation(false);
        } else if (!isProcessing) {
          handleClose();
        }
      }
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
    const verifyNoteData = async () => {
      if (!isOpen || !note.id || !user) return;

      try {
        // Get the most current data from database
        const { data, error } = await supabase
          .from("note")
          .select("*")
          .eq("id", note.id)
          .single();

        if (error) {
          console.error("Error verifying note data:", error);
          return;
        }

        if (data) {
          console.log("Direct DB verification for note:", {
            collection_id: data.collection_id,
          });

          // If database has different values than what was passed in props
          if (data.collection_id !== note.collection_id) {
            console.log("Collection ID mismatch between props and DB!", {
              "props collection_id": note.collection_id,
              "database collection_id": data.collection_id,
            });

            // Use the database version as the source of truth
            setVerifiedNote({
              ...note,
              collection_id: data.collection_id,
            });
          }
        }
      } catch (err) {
        console.error("Failed to verify note data:", err);
      }
    };

    verifyNoteData();
  }, [isOpen, note, user]);

  useEffect(() => {
    if (!isOpen || !user) return;
    let query = supabase.from("collection").select("id,collection_name");
    if (verifiedNote.list_id) {
      query = query.eq("list_id", verifiedNote.list_id);
    } else {
      query = query.eq("user_id", user.id);
    }
    query.order("collection_name", { ascending: true }).then(({ data }) => {
      if (data) {
        setCollections(data);

        // Log collection data for debugging
        console.log(
          "Loaded collections:",
          data.map((c) => ({
            id: c.id,
            name: c.collection_name,
          }))
        );
      }
    });
  }, [isOpen, verifiedNote.list_id, user]);

  // --- UPDATE FORM WHEN VERIFIED NOTE CHANGES ---
  useEffect(() => {
    if (isOpen) {
      // Correctly set selectedCollection to the verified note's collection_id
      const collectionId = verifiedNote.collection_id || "";
      setSelectedCollection(collectionId);

      // Find and log the current collection for debugging
      const currentCollection = collections.find(
        (c) => c.id === verifiedNote.collection_id
      );

      console.log("Initializing form with verified note data:", {
        "verified note.collection_id": verifiedNote.collection_id,
        "selectedCollection set to": collectionId,
        currentCollectionName: currentCollection?.collection_name,
      });

      // Reset other form fields
      setNoteTitle(verifiedNote.title || "");
      setNoteDescription(verifiedNote.description || "");
      setSelectedColor(verifiedNote.bg_color_hex || LIST_COLORS[0]);
      setTitleCharCount((verifiedNote.title || "").length);
      setDescriptionCharCount((verifiedNote.description || "").length);
      setIsPinned(verifiedNote.is_pinned || false);
      setError(null);
      setSuccessMessage(null);
      setIsNoteChanged(false);
    }
  }, [verifiedNote, isOpen, collections]);

  // --- TRACK CHANGES ---
  useEffect(() => {
    const changed =
      noteTitle !== (verifiedNote.title || "") ||
      noteDescription !== (verifiedNote.description || "") ||
      selectedColor !== (verifiedNote.bg_color_hex || LIST_COLORS[0]) ||
      isPinned !== (verifiedNote.is_pinned || false) ||
      selectedCollection !== verifiedNote.collection_id;
    setIsNoteChanged(changed);
  }, [
    noteTitle,
    noteDescription,
    selectedColor,
    isPinned,
    selectedCollection,
    verifiedNote,
  ]);

  // --- CLEANUP TIMEOUTS ---
  useEffect(() => {
    return () => {
      if (errorTimeout) clearTimeout(errorTimeout);
      if (successTimeout) clearTimeout(successTimeout);
    };
  }, [errorTimeout, successTimeout]);

  // --- MESSAGES RESET ON OPEN/CLOSE ---
  useEffect(() => {
    setError(null);
    setSuccessMessage(null);
  }, [isOpen]);

  // Define the handler outside of the conditional return to avoid React Hook issues
  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const v = e.target.value;
      setNoteDescription(v);
      setDescriptionCharCount(v.length);
      autoResizeTextarea(e.target);
    },
    [autoResizeTextarea]
  );

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setNoteTitle(v);
    setTitleCharCount(v.length);
    if (error === "Title is required" && v.trim()) setError(null);
  };

  const handleColorSelect = (c: string) => setSelectedColor(c);
  const handlePinToggle = () => setIsPinned((p) => !p);

  const handleCollectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    console.log("Collection dropdown changed:", {
      from: selectedCollection,
      to: newValue,
      "note.collection_id": verifiedNote.collection_id,
    });

    setSelectedCollection(newValue);
    setIsNoteChanged(true);
  };

  // --- UPDATE NOTE FIELDS (title/desc/color/pin) ---
  const updateNoteInDatabase = async (): Promise<OperationResult> => {
    if (!noteTitle.trim()) {
      showError("Title is required");
      return { success: false, error: "Title is required" };
    }
    if (!user || !user.id) {
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

      console.log("Updating note basic fields:", updateData);

      const { data, error: dbError } = await supabase
        .from("note")
        .update(updateData)
        .eq("id", verifiedNote.id)
        .select("*");

      if (dbError) {
        if (
          dbError.code === "42501" ||
          dbError.message?.includes("row-level security")
        ) {
          throw new Error(
            "Permission denied. Make sure you're authorized to update this note."
          );
        }
        throw new Error(dbError.message);
      }

      // parent callbacks to refresh note card
      if (onNoteUpdate) {
        const r = await onNoteUpdate(
          verifiedNote.id,
          noteTitle,
          noteDescription
        );
        if (!r.success) throw new Error(String(r.error));
      }
      if (onColorChange && selectedColor !== verifiedNote.bg_color_hex) {
        const r = await onColorChange(verifiedNote.id, selectedColor);
        if (!r.success) throw new Error(String(r.error));
      }
      if (onPinToggle && isPinned !== verifiedNote.is_pinned) {
        const r = await onPinToggle(verifiedNote.id, isPinned);
        if (!r.success) throw new Error(String(r.error));
      }
      showSuccess("Note updated successfully");
      return { success: true, data };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      showError(errorMessage || "Failed to update note");
      return { success: false, error };
    } finally {
      setIsSaving(false);
    }
  };

  // --- UPDATE COLLECTION ONLY ---
  const updateCollectionInDatabase = async (): Promise<OperationResult> => {
    if (!user || !user.id) {
      showError("You must be logged in to update a note");
      return { success: false, error: "Authentication required" };
    }

    // Convert empty string to null for database
    const collectionIdForDb =
      selectedCollection === "" ? null : selectedCollection;

    // Skip if collection hasn't changed (comparing with proper null handling)
    const currentCollectionId =
      verifiedNote.collection_id === null ? "" : verifiedNote.collection_id;

    if (selectedCollection === currentCollectionId) {
      console.log("Collection hasn't changed, skipping update");
      return { success: true };
    }

    try {
      console.log(
        "Updating note collection from",
        currentCollectionId,
        "to",
        selectedCollection
      );

      // Update the collection_id in the database
      const { data, error: dbError } = await supabase
        .from("note")
        .update({ collection_id: collectionIdForDb })
        .eq("id", verifiedNote.id)
        .select("*");

      if (dbError) {
        if (
          dbError.code === "42501" ||
          dbError.message?.includes("row-level security")
        ) {
          throw new Error(
            "Permission denied. Make sure you're authorized to update this note."
          );
        }
        throw new Error(dbError.message);
      }

      // Update our verified note data with the new collection
      setVerifiedNote((prev) => ({
        ...prev,
        collection_id: collectionIdForDb,
      }));

      // Trigger refresh in parent component to reflect the change
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

      showSuccess("Collection updated successfully");
      // Close after a brief delay to show success message and trigger refresh in parent
      setTimeout(onClose, 1000);
      return { success: true, data };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      showError(errorMessage || "Failed to update collection");
      return { success: false, error };
    }
  };

  // --- DELETE NOTE ---
  const deleteNoteFromDatabase = async (): Promise<OperationResult> => {
    if (!user || !user.id) {
      showError("You must be logged in to delete a note");
      return { success: false, error: "Authentication required" };
    }
    try {
      setIsDeleting(true);
      const { error: dbError } = await supabase
        .from("note")
        .delete()
        .eq("id", verifiedNote.id);
      if (dbError) {
        if (
          dbError.code === "42501" ||
          dbError.message?.includes("row-level security")
        ) {
          throw new Error(
            "Permission denied. Make sure you're authorized to delete this note."
          );
        }
        throw new Error(dbError.message);
      }
      if (onNoteDelete) await onNoteDelete(verifiedNote.id);
      showSuccess("Note permanently deleted");
      setTimeout(() => {
        setShowDeleteConfirmation(false);
        onClose();
      }, 1000);
      return { success: true };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      showError(errorMessage || "Failed to delete note");
      return { success: false, error };
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveNote = async () => {
    // First handle basic note fields update
    const res = await updateNoteInDatabase();
    if (!res.success) return;

    // Handle collection change separately
    const currentCollectionId =
      verifiedNote.collection_id === null ? "" : verifiedNote.collection_id;

    if (selectedCollection !== currentCollectionId) {
      console.log("Collection changed, updating database...");
      await updateCollectionInDatabase();
      // updateCollectionInDatabase already handles closing
      return;
    }

    // Close after a brief delay to show success message
    setTimeout(onClose, 1000);
  };

  const handleConfirmDelete = async () => {
    await deleteNoteFromDatabase();
  };

  // --- FORMATTED DATE ---
  const formattedDate = verifiedNote.created_at
    ? new Date(
        typeof verifiedNote.created_at === "string"
          ? verifiedNote.created_at
          : verifiedNote.created_at
      ).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Unknown date";

  // Find the current collection for display
  const currentCollection = collections.find(
    (c) => c.id === verifiedNote.collection_id
  );

  console.log("Rendering with collection state:", {
    "dropdown value": selectedCollection,
    "note collection_id": verifiedNote.collection_id,
    "current collection": currentCollection?.collection_name,
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end backdrop-blur-md bg-black/20"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) handleClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={sidebarRef}
        className={`w-full max-w-md overflow-auto shadow-xl text-white ${isDark ? "bg-black/50" : "bg-gray-600/50"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col items-center px-6 py-4 relative">
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="absolute top-4 right-4 p-2 bg-gray-700 rounded-full"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-300" />
          </button>
          <h2 className="text-2xl font-bold mb-1">Note Details</h2>
        </div>

        {/* Success */}
        {successMessage && (
          <div className="mx-6 mb-4 p-3 bg-green-900/30 border border-green-700 rounded-lg text-green-400 flex items-center">
            <Check className="w-5 h-5 mr-2" />
            {successMessage}
          </div>
        )}
        {/* Error */}
        {error && (
          <div className="mx-6 mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-400 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {/* Form */}
        <div className="px-6 py-4 space-y-8">
          {/* Title */}
          <div>
            <label
              htmlFor="note-title"
              className="block text-xl font-semibold mb-2"
            >
              Title
            </label>
            <input
              id="note-title"
              type="text"
              value={noteTitle}
              onChange={handleTitleChange}
              maxLength={100}
              disabled={isProcessing}
              placeholder="Note title"
              className="w-full p-4 rounded-2xl bg-gray-800 text-white border border-gray-700 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            <div className="text-right text-gray-500 text-xs mt-1">
              {titleCharCount}/100
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="note-description"
              className="block text-xl font-semibold mb-2"
            >
              Description
            </label>
            <textarea
              id="note-description"
              value={noteDescription}
              onChange={handleDescriptionChange}
              maxLength={500}
              disabled={isProcessing}
              placeholder="Add a description (optional)"
              className="w-full p-4 rounded-2xl bg-gray-800 text-white border border-gray-700 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 min-h-[120px]"
            />
            <div className="text-right text-gray-500 text-xs mt-1">
              {descriptionCharCount}/500
            </div>
          </div>

          {/* Color */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Note Color</h3>
            <div className="flex flex-wrap gap-4">
              {LIST_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => handleColorSelect(c)}
                  disabled={isProcessing}
                  aria-pressed={c === selectedColor}
                  aria-label={`Select color ${c}`}
                  className={`h-10 w-10 rounded-full relative shadow-md hover:shadow-lg transition-all duration-200 border-2 ${
                    c === selectedColor
                      ? "border-orange-500"
                      : "border-transparent"
                  } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
                  style={{ backgroundColor: c }}
                  type="button"
                >
                  {c === selectedColor && (
                    <Check className="absolute top-2 left-2 h-5 w-5 text-white drop-shadow-md" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Note Info */}
          <div className="p-6 bg-gray-800 rounded-2xl">
            <h3 className="text-2xl font-bold mb-4">Note Information</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Created</span>
                <span className="text-white">{formattedDate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Collection</span>
                <select
                  id="collection-select"
                  value={selectedCollection} // This value needs to match one of the option values
                  onChange={handleCollectionChange}
                  disabled={isProcessing}
                  className="bg-gray-700 border border-gray-600 text-white p-2 rounded-lg focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  {/* Option for "No Collection" */}
                  <option value="">No Collection</option>

                  {/* List all collections */}
                  {collections.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.collection_name || "Unnamed Collection"}
                      {col.id === verifiedNote.collection_id ? " " : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-4">
                <button
                  onClick={handlePinToggle}
                  disabled={isProcessing}
                  className={`flex items-center justify-center w-full p-3 rounded-2xl transition-colors duration-200 ${
                    isPinned
                      ? "bg-orange-600 text-white"
                      : "bg-gray-700 text-orange-400 border border-orange-500"
                  }`}
                  type="button"
                >
                  <Pin
                    className={`w-5 h-5 mr-2 ${isPinned ? "fill-white" : ""}`}
                  />
                  {isPinned ? "Pinned" : "Pin this Note"}
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col space-y-4">
            <button
              onClick={handleSaveNote}
              disabled={isProcessing || !isNoteChanged}
              className={`w-full py-4 px-6 rounded-2xl font-semibold text-lg transition-colors duration-200 ${
                isProcessing || !isNoteChanged
                  ? isDark
                    ? "bg-orange-900/50 text-white/70 cursor-not-allowed"
                    : "bg-sky-700/50 text-white/70 cursor-not-allowed"
                  : isDark
                    ? "bg-orange-900 hover:bg-orange-600 text-white"
                    : "bg-sky-700 hover:bg-sky-500 text-white"
              }`}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={() => setShowDeleteConfirmation(true)}
              disabled={isProcessing}
              className="w-full py-3 px-6 rounded-2xl bg-transparent border border-red-500 text-red-400 hover:bg-red-900/30 font-medium transition-colors duration-200 flex items-center justify-center"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Delete Note
            </button>
          </div>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirmation && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fadeIn">
            <div
              className="absolute inset-0 bg-black/70"
              onClick={
                !isDeleting ? () => setShowDeleteConfirmation(false) : undefined
              }
            />
            <div className="relative w-full max-w-sm p-6 rounded-lg shadow-xl bg-gray-800 animate-scaleIn">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 rounded-full bg-red-900/30">
                  <AlertTriangle className="w-6 h-6 text-red-300" />
                </div>
                <h3 className="text-lg font-semibold">Delete Note</h3>
              </div>
              <p className="mb-6 text-gray-300">
                Are you sure you want to delete this note? This action cannot be
                undone and the note will be permanently removed.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirmation(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-md flex items-center justify-center min-w-[90px] bg-red-700 hover:bg-red-600 text-white transition-colors duration-200"
                >
                  {isDeleting ? (
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    "Delete Permanently"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(NoteDetails);
