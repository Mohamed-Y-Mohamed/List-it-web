"use client";

import React, { useState, useRef, useEffect } from "react";
import { Plus, FolderPlus, ListTodo, StickyNote, Trash2 } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface ListFilterPlusProps {
  onCreateCollection: () => void;
  onCreateTask: () => void;
  onCreateNote: () => void;
}

const ListFilterPlus = ({
  onCreateCollection,
  onCreateTask,
  onCreateNote,
}: ListFilterPlusProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleCreateCollection = () => {
    setIsMenuOpen(false);
    onCreateCollection();
  };

  const handleCreateTask = () => {
    setIsMenuOpen(false);
    onCreateTask();
  };

  const handleCreateNote = () => {
    setIsMenuOpen(false);
    onCreateNote();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={toggleMenu}
        className={`rounded-full p-2 ${
          isDark
            ? "bg-gray-800 text-gray-300 hover:text-orange-400"
            : "bg-gray-100 text-gray-700 hover:text-orange-500"
        } transition-colors flex items-center justify-center`}
        aria-label="Create new item"
      >
        <Plus className="h-5 w-5" />
      </button>

      {isMenuOpen && (
        <div
          className={`absolute right-0 top-full mt-2 w-48 rounded-md shadow-lg z-50 ${
            isDark
              ? "bg-gray-800 border border-gray-700"
              : "bg-white border border-gray-200"
          } overflow-hidden`}
        >
          <div className={`py-1 ${isDark ? "text-gray-200" : "text-gray-800"}`}>
            <button
              onClick={handleCreateCollection}
              className={`w-full flex items-center px-4 py-2 text-sm ${
                isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
              }`}
            >
              <FolderPlus
                className={`h-4 w-4 mr-2 ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              />
              <span>Create Collection</span>
            </button>
            <button
              onClick={handleCreateTask}
              className={`w-full flex items-center px-4 py-2 text-sm ${
                isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
              }`}
            >
              <ListTodo
                className={`h-4 w-4 mr-2 ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              />
              <span>Create Task</span>
            </button>
            <button
              onClick={handleCreateNote}
              className={`w-full flex items-center px-4 py-2 text-sm ${
                isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
              }`}
            >
              <StickyNote
                className={`h-4 w-4 mr-2 ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              />
              <span>Create Note</span>
            </button>
            <button
              // onClick={handleCreateTask}
              className={`w-full flex items-center px-4 py-2 text-sm ${
                isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
              }`}
            >
              <Trash2
                className={`h-4 w-4 mr-2 ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              />
              <span>Delete Collection</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListFilterPlus;
