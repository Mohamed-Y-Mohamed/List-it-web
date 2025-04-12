"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, Check } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { LIST_COLORS } from "@/types/schema";

interface NoteSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  note: {
    note_id: number;
    text: string;
    background_color?: string;
    date_created: Date;
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

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    const parts = note.text.split(/:\s(.+)/);
    setTitle(parts.length > 1 ? parts[0] : note.text);
    setContent(parts.length > 1 ? parts[1] : "");
  }, [note.text]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target as Node)
      ) {
        handleSaveNote();
      }
    };

    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleSaveNote();
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscKey);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [isOpen, title, content]);

  const handleSaveNote = () => {
    const updatedText = content ? `${title}: ${content}` : title;

    if (updatedText !== note.text && onNoteUpdate) {
      onNoteUpdate(note.note_id, updatedText);
    }

    onClose();
  };

  const handleColorSelect = (color: string) => {
    onColorChange(note.note_id, color);
  };

  if (!isOpen) return null;

  const useWhiteText = note.background_color
    ? !["#FFD60A", "#34C759", "#00C7BE"].includes(note.background_color)
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
          <h2 className="text-lg font-semibold">Edit Note</h2>
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
          {/* Title input */}
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`${textInputBase} ${textInputStyle}`}
            />
          </div>

          {/* Content textarea */}
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

          {/* Background Color Picker */}
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
                    color === note.background_color
                      ? isDark
                        ? "border-orange-500"
                        : "border-sky-500"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                >
                  {color === note.background_color && (
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
