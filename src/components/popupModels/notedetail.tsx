"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, Check } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { LIST_COLORS } from "@/types/schema";

interface NoteSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  note: {
    id: number; // Changed from note_id to id
    title: string; // Changed from text to title
    bg_color_hex?: string; // Changed from background_color to bg_color_hex
    created_at: Date; // Changed from date_created to created_at
  };
  onColorChange: (noteId: number, color: string) => void;
  onNoteUpdate?: (noteId: number, updatedText: string) => void;
}

const NoteDetails = ({
  isOpen,
  onClose,
  note,
  onColorChange,
  onNoteUpdate,
}: NoteSidebarProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const sidebarRef = useRef<HTMLDivElement>(null);

  const [noteTitle, setNoteTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    const parts = note.title.split(/:\s(.+)/);
    setNoteTitle(parts.length > 1 ? parts[0] : note.title);
    setContent(parts.length > 1 ? parts[1] : "");
  }, [note.title]);

  const handleSaveNote = () => {
    const updatedText = content ? `${noteTitle}: ${content}` : noteTitle;

    if (updatedText !== note.title && onNoteUpdate) {
      onNoteUpdate(note.id, updatedText);
    }

    onClose();
  };

  const handleColorSelect = (color: string) => {
    onColorChange(note.id, color);
  };

  if (!isOpen) return null;

  const useWhiteText = note.bg_color_hex
    ? !["#FFD60A", "#34C759", "#00C7BE"].includes(note.bg_color_hex)
    : isDark;

  const textInputBase =
    "w-full p-2 rounded-md border focus:outline-none focus:ring-1";
  const textInputStyle = isDark
    ? "bg-gray-700 text-white border-gray-600 focus:border-orange-500 focus:ring-orange-500"
    : "bg-white text-gray-800 border-gray-300 focus:border-blue-500 focus:ring-blue-500";

  const labelColor = isDark ? "text-gray-300" : "text-gray-600";
  const borderColor = isDark ? "border-gray-700" : "border-gray-200";
  const sidebarBg = isDark
    ? "bg-gray-800 text-white"
    : "bg-white text-gray-800";

  const formattedDate = note.created_at
    ? new Date(note.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Unknown date";

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end backdrop-blur-md"
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={sidebarRef}
        className={`w-full max-w-md overflow-auto shadow-xl transition-transform duration-300 ease-in-out transform translate-x-0 ${sidebarBg}`}
      >
        <div
          className={`sticky top-0 z-10 flex items-center justify-between p-4 border-b ${borderColor}`}
        >
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold">Edit Note</h2>
            <p
              className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
            >
              Created: {formattedDate}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSaveNote}
              className={`p-2 rounded-full ${
                isDark
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
              aria-label="Save and close"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-full ${
                isDark
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
              aria-label="Close without saving"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-6">
          <div>
            <label
              htmlFor="note-title"
              className={`block text-sm font-medium mb-2 ${labelColor}`}
            >
              Title
            </label>
            <input
              id="note-title"
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              className={`${textInputBase} ${textInputStyle}`}
            />
          </div>

          <div>
            <label
              htmlFor="note-content"
              className={`block text-sm font-medium mb-2 ${labelColor}`}
            >
              Description
            </label>
            <textarea
              id="note-content"
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={`${textInputBase} ${textInputStyle}`}
            />
          </div>

          <div>
            <h3 className={`text-sm font-medium mb-2 ${labelColor}`}>
              Background Color
            </h3>
            <div className="flex flex-wrap gap-4">
              {LIST_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  className={`h-10 w-10 rounded-full relative shadow-md hover:shadow-lg transition-shadow border-2 ${
                    color === note.bg_color_hex
                      ? isDark
                        ? "border-orange-500"
                        : "border-sky-500"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                >
                  {color === note.bg_color_hex && (
                    <Check className="absolute top-2 left-2 h-5 w-5 text-white drop-shadow-md" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteDetails;
