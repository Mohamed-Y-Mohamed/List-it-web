"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Check } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Collection, LIST_COLORS } from "@/types/schema";

interface CreateNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (noteData: {
    text: string;
    background_color: string;
    collection_id?: string;
  }) => void;
  collections: Collection[];
}

const CreateNoteModal = ({
  isOpen,
  onClose,
  onSubmit,
  collections,
}: CreateNoteModalProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [noteTitle, setNoteTitle] = useState("");
  const [noteDescription, setNoteDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState<
    (typeof LIST_COLORS)[number]
  >(LIST_COLORS[0]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");

  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get default (General) collection
  const defaultCollection = collections.find((c) => c.is_default);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
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

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setNoteTitle("");
      setNoteDescription("");
      setSelectedColor(LIST_COLORS[0]);
      setSelectedCollectionId("");
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (noteTitle.trim()) {
      // Format the note text with title and description
      const formattedText = noteDescription
        ? `${noteTitle}: ${noteDescription}`
        : noteTitle;

      onSubmit({
        text: formattedText,
        background_color: selectedColor,
        collection_id: selectedCollectionId || defaultCollection?.id,
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 backdrop-blur-md"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.25)" }}
        onClick={onClose}
      />

      {/* Modal container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div
          ref={modalRef}
          className={`w-full max-w-md rounded-lg ${
            isDark ? "bg-gray-800" : "bg-white"
          } shadow-xl transition-all p-6 mx-4 pointer-events-auto`}
        >
          <div className="flex items-center justify-between mb-4">
            <h2
              className={`text-xl font-semibold ${
                isDark ? "text-gray-100" : "text-gray-800"
              }`}
            >
              Create New Note
            </h2>
            <button
              onClick={onClose}
              className={`p-1 rounded-full ${
                isDark
                  ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="note-title"
                className={`block mb-2 text-sm font-medium ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Title
              </label>
              <input
                ref={inputRef}
                type="text"
                id="note-title"
                placeholder="Enter note title"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                className={`w-full px-3 py-2 rounded-md border ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-800 placeholder-gray-400"
                } focus:outline-none ${
                  isDark ? "focus:border-orange-500" : "focus:border-sky-500"
                }`}
                required
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="note-description"
                className={`block mb-2 text-sm font-medium ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Description (Optional)
              </label>
              <textarea
                id="note-description"
                placeholder="Enter note description"
                value={noteDescription}
                onChange={(e) => setNoteDescription(e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 rounded-md border ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-800 placeholder-gray-400"
                } focus:outline-none resize-none ${
                  isDark ? "focus:border-orange-500" : "focus:border-sky-500"
                }`}
              />
            </div>

            <div className="mb-6">
              <label
                className={`block mb-2 text-sm font-medium ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Note Color
              </label>
              <div className="flex flex-wrap gap-2">
                {LIST_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    style={{ backgroundColor: color }}
                    className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      selectedColor === color
                        ? isDark
                          ? "ring-2 ring-offset-2 ring-offset-gray-800 ring-white"
                          : "ring-2 ring-offset-2 ring-offset-gray-100 ring-gray-800"
                        : ""
                    }`}
                    onClick={() => setSelectedColor(color)}
                    aria-label={`Select ${color} color`}
                  >
                    {selectedColor === color && (
                      <Check className="h-4 w-4 text-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label
                htmlFor="collection"
                className={`block mb-2 text-sm font-medium ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Collection (Optional)
              </label>
              <select
                id="collection"
                value={selectedCollectionId}
                onChange={(e) => setSelectedCollectionId(e.target.value)}
                className={`w-full px-3 py-2 rounded-md border ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-gray-100"
                    : "bg-white border-gray-300 text-gray-800"
                } focus:outline-none ${
                  isDark ? "focus:border-orange-500" : "focus:border-sky-500"
                }`}
              >
                <option value="">
                  {defaultCollection
                    ? `Default (${defaultCollection.collection_name})`
                    : "Select a collection (optional)"}
                </option>
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.collection_name}
                  </option>
                ))}
              </select>
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
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 rounded-md ${
                  isDark
                    ? "bg-orange-600 text-white hover:bg-orange-700"
                    : "bg-sky-500 text-white hover:bg-sky-600"
                }`}
                disabled={!noteTitle.trim()}
              >
                Create
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreateNoteModal;
