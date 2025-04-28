// components/CreateListModal.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Check } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { LIST_COLORS, ListColor, List } from "@/types/schema";

interface CreateListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    listData: Omit<
      List,
      "id" | "created_at" | "tasks" | "notes" | "collections"
    >
  ) => void;
}

const CreateListModal = ({
  isOpen,
  onClose,
  onSubmit,
}: CreateListModalProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [listName, setListName] = useState("");
  const [selectedColor, setSelectedColor] = useState<ListColor>("#FF3B30");
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setListName("");
      setSelectedColor("#FF3B30");
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (listName.trim()) {
      onSubmit({
        list_name: listName.trim(), // Changed from name to list_name
        bg_color_hex: selectedColor, // Changed from background_color to bg_color_hex
        is_default: false,
        is_pinned: false, // Added new field from database schema
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 backdrop-blur-md" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div
          ref={modalRef}
          className={`w-full max-w-md pointer-events-auto p-6 rounded-lg shadow-xl mx-4 ${
            isDark ? "bg-gray-800" : "bg-white"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h2
              className={`text-xl font-semibold ${
                isDark ? "text-gray-100" : "text-gray-800"
              }`}
            >
              Create New List
            </h2>
            <button
              onClick={onClose}
              className={`p-1 rounded-full ${
                isDark
                  ? "text-gray-400 hover:bg-gray-700"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                className={`block mb-2 text-sm font-medium ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                List Name
              </label>
              <input
                ref={inputRef}
                type="text"
                placeholder="Enter list name"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                className={`w-full px-3 py-2 rounded-md border ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-800 placeholder-gray-400"
                } focus:outline-none ${
                  isDark ? "focus:border-orange-500" : "focus:border-sky-500"
                }`}
                required
                maxLength={50}
              />
            </div>

            <div className="mb-6">
              <label
                className={`block mb-2 text-sm font-medium ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                List Color
              </label>
              <div className="flex flex-wrap gap-2">
                {LIST_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      selectedColor === color
                        ? "ring-2 ring-offset-2 ring-white"
                        : ""
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                    aria-label={`Select ${color}`}
                  >
                    {selectedColor === color && (
                      <Check className="h-4 w-4 text-white" />
                    )}
                  </button>
                ))}
              </div>
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
                    ? "bg-orange-600 hover:bg-orange-700"
                    : "bg-sky-500 hover:bg-sky-600"
                } text-white`}
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

export default CreateListModal;
