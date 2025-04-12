"use client";

import React, { useEffect, useState } from "react";
import { Pin } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import NoteSidebar from "@/components/popupModels/notedetail";

interface NoteCardProps {
  note_id: number;
  text: string;
  date_created: Date;
  is_deleted?: boolean;
  background_color?: string;
  is_pinned?: boolean;
  onPinChange?: (noteId: number, isPinned: boolean) => void;
  onColorChange?: (noteId: number, color: string) => void;
  onNoteUpdate?: (noteId: number, updatedText: string) => void;
  className?: string;
}

const NoteCard = ({
  note_id,
  text,
  date_created,
  is_deleted = false,
  background_color,
  is_pinned = false,
  onPinChange,
  onColorChange,
  onNoteUpdate,
  className = "",
}: NoteCardProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [noteText, setNoteText] = useState(text);
  const [noteBackgroundColor, setNoteBackgroundColor] =
    useState(background_color);

  useEffect(() => {
    setNoteText(text);
    setNoteBackgroundColor(background_color);
  }, [text, background_color]);

  const parts = noteText.split(/:\s(.+)/);
  const title = parts.length > 1 ? parts[0] : noteText;

  const cardStyle = noteBackgroundColor
    ? { backgroundColor: noteBackgroundColor }
    : {};
  const bgClass = !noteBackgroundColor
    ? isDark
      ? "bg-gray-700"
      : "bg-yellow-50"
    : "";

  const useWhiteText = noteBackgroundColor
    ? !["#FFD60A", "#34C759", "#00C7BE"].includes(noteBackgroundColor)
    : isDark;

  const textColor = useWhiteText ? "text-white" : "text-gray-800";

  const handlePinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onPinChange?.(note_id, !is_pinned);
  };

  const openSidebar = () => setIsSidebarOpen(true);
  const closeSidebar = () => setIsSidebarOpen(false);

  const updateNoteColor = (id: number, color: string) => {
    setNoteBackgroundColor(color);
    onColorChange?.(id, color);
  };

  const updateNoteText = (id: number, updatedText: string) => {
    setNoteText(updatedText);
    onNoteUpdate?.(id, updatedText);
  };

  return (
    <>
      <div
        className={`
          rounded-lg p-4 shadow-sm hover:shadow-md
          relative overflow-hidden cursor-pointer
          w-full h-32 md:w-3/4 md:h-40 lg:w-3/4 lg:h-30
          ${bgClass} ${className}
        `}
        style={cardStyle}
        onClick={openSidebar}
      >
        <button
          onClick={handlePinClick}
          className="absolute top-2 right-2 p-1 transition-colors"
          aria-label={is_pinned ? "Unpin note" : "Pin note"}
        >
          <Pin
            className={`h-4 w-4 ${
              is_pinned
                ? useWhiteText
                  ? "text-white fill-orange-400"
                  : "text-black fill-orange-500"
                : useWhiteText
                  ? "text-white stroke-2"
                  : "text-black stroke-2"
            }`}
          />
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-2">
          <h4 className={`font-semibold ${textColor}`}>{title}</h4>
        </div>
      </div>

      <NoteSidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        note={{
          note_id,
          text: noteText,
          background_color: noteBackgroundColor,
          date_created,
        }}
        onColorChange={updateNoteColor}
        onNoteUpdate={updateNoteText}
      />
    </>
  );
};

export default NoteCard;
