"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { IS_NATIVE_BUILD } from "@/lib/platform";
import {
  Plus,
  PlusCircle,
  CheckCircle,
  ClipboardList,
  StickyNote,
  Trash2,
  ChevronsDownUp,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface ListFilterPlusProps {
  onCreateCollection?: () => void;
  onCreateTask?: () => void;
  onCreateNote?: () => void;
  /** Shuts every collection on the page at once. Omitted when none are open. */
  onCollapseAll?: () => void;
  onDeleteCollections?: () => void;
  disabled?: boolean;
  className?: string;
  buttonAriaLabel?: string;
}

/**
 * Plus button with dropdown menu for creating list items and managing collections
 */
const ListFilterPlus: React.FC<ListFilterPlusProps> = ({
  onCreateCollection,
  onCreateTask,
  onCreateNote,
  onCollapseAll,
  onDeleteCollections,
  disabled = false,
  className = "",
  buttonAriaLabel = "Create new item",
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        buttonRef.current &&
        menuRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    // Handle escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Close menu when disabled prop changes to true
  useEffect(() => {
    if (disabled && isOpen) {
      setIsOpen(false);
    }
  }, [disabled, isOpen]);

  // Toggle dropdown menu
  const toggleMenu = useCallback(() => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  }, [isOpen, disabled]);

  // Action handlers
  const handleCreateCollection = useCallback(() => {
    setIsOpen(false);
    if (onCreateCollection) {
      onCreateCollection();
    }
  }, [onCreateCollection]);

  const handleCreateTask = useCallback(() => {
    setIsOpen(false);
    if (onCreateTask) {
      onCreateTask();
    }
  }, [onCreateTask]);

  const handleCreateNote = useCallback(() => {
    setIsOpen(false);
    if (onCreateNote) {
      onCreateNote();
    }
  }, [onCreateNote]);

  const handleCollapseAll = useCallback(() => {
    setIsOpen(false);
    if (onCollapseAll) {
      onCollapseAll();
    }
  }, [onCollapseAll]);

  const handleDeleteCollections = useCallback(() => {
    setIsOpen(false);
    if (onDeleteCollections) {
      onDeleteCollections();
    }
  }, [onDeleteCollections]);

  // Focus first menu item when dropdown opens
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const firstButton = menuRef.current.querySelector("button");
      if (firstButton) {
        setTimeout(() => {
          firstButton.focus();
        }, 100);
      }
    }
  }, [isOpen]);

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        onClick={toggleMenu}
        // On native this is the screen's floating Add, so it takes the same
        // shape as the one on Lists Home — a filled primary circle. The web keeps
        // the quiet icon button it has always had in the header.
        className={`transition-colors ${
          IS_NATIVE_BUILD
            ? "flex h-14 w-14 items-center justify-center rounded-full bg-[#6366F1] text-white shadow-lg shadow-[#6366F1]/30 active:bg-[#4f52d6]"
            : `rounded-full p-2 ${
                isDark
                  ? isOpen
                    ? "bg-gray-700 text-orange-400"
                    : "text-gray-300 hover:bg-gray-700"
                  : isOpen
                    ? "bg-gray-200 text-orange-500"
                    : "text-gray-600 hover:bg-gray-200"
              }`
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        aria-label={buttonAriaLabel}
        aria-expanded={isOpen}
        aria-haspopup="true"
        disabled={disabled}
        title={buttonAriaLabel}
      >
        {IS_NATIVE_BUILD ? (
          <Plus className="h-6 w-6" strokeWidth={2.4} />
        ) : (
          <PlusCircle className="h-6 w-6" />
        )}
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          // Opens upward on native, where this button floats just above the tab
          // bar — a menu hanging below it would be off the bottom of the screen.
          className={`absolute right-0 z-10 w-56 rounded-md shadow-lg ${
            IS_NATIVE_BUILD ? "bottom-full mb-2" : "mt-2"
          } ${
            isDark ? "bg-gray-800" : "bg-white"
          } ring-1 ring-black ring-opacity-5 focus:outline-none`}
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="options-menu"
        >
          <div className="py-1">
            {onCreateCollection && (
              <button
                onClick={handleCreateCollection}
                className={`flex items-center w-full text-left px-4 py-2 text-sm ${
                  isDark
                    ? "text-gray-300 hover:bg-gray-700 focus:bg-gray-700"
                    : "text-gray-700 hover:bg-gray-100 focus:bg-gray-100"
                } focus:outline-none`}
                role="menuitem"
                tabIndex={0}
              >
                <ClipboardList
                  className={`mr-3 h-5 w-5 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                  aria-hidden="true"
                />
                Create Collection
              </button>
            )}

            {onCreateTask && (
              <button
                onClick={handleCreateTask}
                className={`flex items-center w-full text-left px-4 py-2 text-sm ${
                  isDark
                    ? "text-gray-300 hover:bg-gray-700 focus:bg-gray-700"
                    : "text-gray-700 hover:bg-gray-100 focus:bg-gray-100"
                } focus:outline-none`}
                role="menuitem"
                tabIndex={0}
              >
                <CheckCircle
                  className={`mr-3 h-5 w-5 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                  aria-hidden="true"
                />
                Create Task
              </button>
            )}

            {onCreateNote && (
              <button
                onClick={handleCreateNote}
                className={`flex items-center w-full text-left px-4 py-2 text-sm ${
                  isDark
                    ? "text-gray-300 hover:bg-gray-700 focus:bg-gray-700"
                    : "text-gray-700 hover:bg-gray-100 focus:bg-gray-100"
                } focus:outline-none`}
                role="menuitem"
                tabIndex={0}
              >
                <StickyNote
                  className={`mr-3 h-5 w-5 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                  aria-hidden="true"
                />
                Create Note
              </button>
            )}

            {onCollapseAll && (
              <>
                <div
                  className={`my-1 border-t ${
                    isDark ? "border-gray-700" : "border-gray-200"
                  }`}
                  role="separator"
                ></div>
                <button
                  onClick={handleCollapseAll}
                  className={`flex items-center w-full text-left px-4 py-2 text-sm ${
                    isDark
                      ? "text-gray-300 hover:bg-gray-700 focus:bg-gray-700"
                      : "text-gray-700 hover:bg-gray-100 focus:bg-gray-100"
                  } focus:outline-none`}
                  role="menuitem"
                  tabIndex={0}
                >
                  <ChevronsDownUp
                    className={`mr-3 h-5 w-5 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                    aria-hidden="true"
                  />
                  Collapse all
                </button>
              </>
            )}

            {onDeleteCollections && (
              <>
                <div
                  className={`my-1 border-t ${
                    isDark ? "border-gray-700" : "border-gray-200"
                  }`}
                  role="separator"
                ></div>
                <button
                  onClick={handleDeleteCollections}
                  className={`flex items-center w-full text-left px-4 py-2 text-sm ${
                    isDark
                      ? "text-red-400 hover:bg-gray-700 focus:bg-gray-700"
                      : "text-red-600 hover:bg-gray-100 focus:bg-gray-100"
                  } focus:outline-none`}
                  role="menuitem"
                  tabIndex={0}
                >
                  <Trash2
                    className={`mr-3 h-5 w-5 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                    aria-hidden="true"
                  />
                  Delete Collections
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ListFilterPlus;
