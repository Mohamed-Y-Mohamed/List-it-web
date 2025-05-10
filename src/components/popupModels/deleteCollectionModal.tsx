"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Trash2, AlertTriangle } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Collection } from "@/types/schema";
import { supabase } from "@/utils/client";

interface DeleteCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  collections: Collection[];
  onCollectionsDeleted: () => void; // Callback to refresh data after deletion
}

const DeleteCollectionModal = ({
  isOpen,
  onClose,
  collections,
  onCollectionsDeleted,
}: DeleteCollectionModalProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedCollections([]);
      setIsDeleting(false);
      setShowConfirmation(false);
    }
  }, [isOpen]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle collection selection
  const toggleCollection = (collectionId: string) => {
    setSelectedCollections((prev) =>
      prev.includes(collectionId)
        ? prev.filter((id) => id !== collectionId)
        : [...prev, collectionId]
    );
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (selectedCollections.length > 0) {
      setShowConfirmation(true);
    }
  };

  // Perform the actual deletion
  const handleDelete = async () => {
    if (selectedCollections.length === 0) return;

    setIsDeleting(true);
    try {
      // Delete all tasks and notes in these collections first
      // This is necessary to maintain referential integrity

      // 1. Delete tasks
      const { error: tasksError } = await supabase
        .from("task")
        .delete()
        .in("collection_id", selectedCollections);

      if (tasksError) throw tasksError;

      // 2. Delete notes
      const { error: notesError } = await supabase
        .from("note")
        .delete()
        .in("collection_id", selectedCollections);

      if (notesError) throw notesError;

      // 3. Delete the collections
      const { error: collectionsError } = await supabase
        .from("collection")
        .delete()
        .in("id", selectedCollections);

      if (collectionsError) throw collectionsError;

      // Success - close modal and refresh data
      onCollectionsDeleted();
      onClose();
    } catch (error) {
      console.error("Error deleting collections:", error);
      // You could add error handling UI here
    } finally {
      setIsDeleting(false);
      setShowConfirmation(false);
    }
  };

  if (!isOpen) return null;

  const textColor = isDark ? "text-white" : "text-gray-800";
  const bgColor = isDark ? "bg-gray-800" : "bg-white";
  const borderColor = isDark ? "border-gray-700" : "border-gray-200";
  const secondaryTextColor = isDark ? "text-gray-300" : "text-gray-600";

  // Sort collections by name for better UX
  const sortedCollections = [...collections].sort((a, b) => {
    // Default collections at the top
    if (a.is_default && !b.is_default) return -1;
    if (!a.is_default && b.is_default) return 1;
    // Then sort by name
    return (a.collection_name || "").localeCompare(b.collection_name || "");
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        ref={modalRef}
        className={`w-full max-w-md rounded-lg ${bgColor} shadow-xl transition-all p-6 mx-4`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Trash2
              className={`h-5 w-5 ${isDark ? "text-red-400" : "text-red-600"}`}
            />
            <h2 className={`text-xl font-semibold ${textColor}`}>
              Delete Collections
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-full ${
              isDark
                ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
            aria-label="Close"
            disabled={isDeleting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className={`mb-4 ${secondaryTextColor}`}>
          Select the collections you want to delete. This will also delete all
          tasks and notes within these collections.
        </p>

        {/* Collection list */}
        <div
          className={`max-h-64 overflow-y-auto mb-6 border rounded-md ${borderColor}`}
        >
          {sortedCollections.length > 0 ? (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {sortedCollections.map((collection) => (
                <li key={collection.id} className="p-3">
                  <label
                    className={`flex items-center space-x-3 cursor-pointer ${
                      collection.is_default ? "opacity-50" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      className={`form-checkbox h-5 w-5 rounded ${
                        isDark
                          ? "text-orange-500 bg-gray-700 border-gray-600"
                          : "text-orange-500 bg-white border-gray-300"
                      }`}
                      checked={selectedCollections.includes(collection.id)}
                      onChange={() => toggleCollection(collection.id)}
                      disabled={!!collection.is_default} // Can't delete default collections
                    />
                    <div className="flex items-center flex-1 min-w-0">
                      <div
                        className="w-4 h-4 rounded-full mr-2 flex-shrink-0"
                        style={{
                          backgroundColor: collection.bg_color_hex || "#ccc",
                        }}
                      ></div>
                      <span className={`truncate ${textColor}`}>
                        {collection.collection_name || "Unnamed Collection"}
                        {collection.is_default && " (Default)"}
                      </span>
                    </div>
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <div className={`p-4 text-center ${secondaryTextColor}`}>
              No collections available
            </div>
          )}
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
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDeleteConfirm}
            className={`px-4 py-2 rounded-md flex items-center space-x-1 ${
              isDark
                ? "bg-red-700 text-white hover:bg-red-800"
                : "bg-red-600 text-white hover:bg-red-700"
            } ${
              selectedCollections.length === 0 || isDeleting
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
            disabled={selectedCollections.length === 0 || isDeleting}
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete Selected</span>
          </button>
        </div>

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => !isDeleting && setShowConfirmation(false)}
            ></div>
            <div
              className={`relative w-full max-w-sm p-6 rounded-lg shadow-xl ${bgColor}`}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div
                  className={`p-2 rounded-full ${
                    isDark ? "bg-red-900/30" : "bg-red-100"
                  }`}
                >
                  <AlertTriangle
                    className={`w-6 h-6 ${
                      isDark ? "text-red-300" : "text-red-600"
                    }`}
                  />
                </div>
                <h3 className={`text-lg font-semibold ${textColor}`}>
                  Confirm Deletion
                </h3>
              </div>

              <p className={`mb-6 ${secondaryTextColor}`}>
                Are you sure you want to delete {selectedCollections.length}
                collection{selectedCollections.length > 1 ? "s" : ""}? This will
                also delete all tasks and notes within{" "}
                {selectedCollections.length > 1
                  ? "these collections"
                  : "this collection"}
                . This action cannot be undone.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => !isDeleting && setShowConfirmation(false)}
                  className={`px-4 py-2 rounded-md ${
                    isDark
                      ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  }`}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className={`px-4 py-2 rounded-md ${
                    isDark
                      ? "bg-red-700 hover:bg-red-600 text-white"
                      : "bg-red-600 hover:bg-red-700 text-white"
                  } ${isDeleting ? "opacity-70 cursor-not-allowed" : ""}`}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeleteCollectionModal;
