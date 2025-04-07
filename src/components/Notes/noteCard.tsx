"use client";

import React from "react";
import { Clock, Pin } from "lucide-react";
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

  // Ensure background_color is properly formatted for use in className
  const bgColorClass = background_color
    ? background_color.startsWith("#")
      ? background_color // If it's a hex code, we'll handle it with inline style
      : background_color // If it's already a class name like 'bg-yellow-100'
    : isDark
    ? "bg-gray-700"
    : "bg-yellow-50";

  // Split text into title and content if it contains a colon
  const [title, content] = text.includes(":")
    ? [text.split(":")[0], text.split(":").slice(1).join(":").trim()]
    : [null, text];

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`;
    }

    return date.toLocaleDateString();
  };

  const handlePinToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPinChange) {
      onPinChange(note_id, !is_pinned);
    }
  };

  // If background_color is a hex code, use inline style, otherwise use as class
  const noteStyle = background_color?.startsWith("#")
    ? { backgroundColor: background_color }
    : {};

  return (
    <div
      className={`rounded-lg p-4 shadow-sm transition-shadow hover:shadow-md ${
        !background_color?.startsWith("#") ? bgColorClass : ""
      } ${className} ${
        isDark && !background_color
          ? "text-gray-200 bg-gray-700"
          : background_color
          ? "" // If there's a background color, don't override text color
          : "text-gray-700"
      }`}
      style={noteStyle}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          {title && (
            <h4
              className={`font-semibold ${
                isDark && !background_color ? "text-gray-100" : "text-gray-800"
              }`}
            >
              {title}
            </h4>
          )}
        </div>
        {/* Pin button */}
        <button
          onClick={handlePinToggle}
          className={`transition-colors -mt-1 -mr-1 p-1 ${
            isDark
              ? is_pinned
                ? "text-orange-400"
                : "text-gray-500 hover:text-gray-300"
              : is_pinned
              ? "text-orange-500"
              : "text-gray-400 hover:text-gray-600"
          }`}
          aria-label={is_pinned ? "Unpin note" : "Pin note"}
        >
          <Pin className={`h-4 w-4 ${is_pinned ? "fill-current" : ""}`} />
        </button>
      </div>

      <p
        className={`text-sm ${
          isDark && !background_color ? "text-gray-300" : "text-gray-700"
        }`}
      >
        {!title ? text : content}
      </p>

      <div
        className={`mt-3 flex items-center text-xs ${
          isDark && !background_color ? "text-gray-400" : "text-gray-500"
        }`}
      >
        <Clock className="mr-1 h-3 w-3" />
        <span>{formatTimeAgo(date_created)}</span>
      </div>
    </div>
  );
};

export default NoteCard;
