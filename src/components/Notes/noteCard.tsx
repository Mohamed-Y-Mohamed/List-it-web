"use client";

import React from "react";
import { Pin } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface NoteCardProps {
  note_id: number;
  text: string;
  date_created: Date;
  is_deleted?: boolean;
  background_color?: string;
  is_pinned?: boolean;
  onPinChange?: (noteId: number, isPinned: boolean) => void;
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
  className = "",
}: NoteCardProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Extract title from text
  const title = text.includes(":") ? text.split(":")[0] : text;

  // Handle background color
  let cardStyle = {};
  let bgClass = "";

  if (background_color) {
    if (background_color.startsWith("#")) {
      // If it's a hex color, use inline style
      cardStyle = { backgroundColor: background_color };
    } else {
      // If it's a class name like "bg-blue-100", use it directly
      bgClass = background_color;
    }
  } else {
    // Fallback background color
    bgClass = isDark ? "bg-gray-700" : "bg-yellow-50";
  }

  // Text color based on dark mode
  const textColor = isDark ? "text-gray-100" : "text-gray-800";

  const handlePinToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (onPinChange) {
      onPinChange(note_id, !is_pinned);
    }
  };

  return (
    <div
      className={`
        rounded-lg p-4 shadow-sm hover:shadow-md
        w-3/4 h-3/4 mx-auto aspect-square relative
        ${bgClass} ${className}
      `}
      style={cardStyle}
    >
      {/* Pin button */}
      <button
        onClick={handlePinToggle}
        className={`
          absolute top-2 right-2 p-1 transition-colors
          ${
            is_pinned
              ? isDark
                ? "text-orange-400"
                : "text-orange-500"
              : isDark
                ? "text-gray-500 hover:text-gray-300"
                : "text-gray-400 hover:text-gray-600"
          }
        `}
        aria-label={is_pinned ? "Unpin note" : "Pin note"}
      >
        <Pin className={`h-4 w-4 ${is_pinned ? "fill-current" : ""}`} />
      </button>

      {/* Title */}
      <div className="flex items-center justify-center h-full w-full">
        <h4 className={`font-semibold text-center ${textColor}`}>{title}</h4>
      </div>
    </div>
  );
};

export default NoteCard;
