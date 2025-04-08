"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Check } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { LIST_COLORS } from "@/types/schema";

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (collectionData: {
    collection_name: string;
    background_color: string;
  }) => void;
}

const CreateCollectionModal = ({
  isOpen,
  onClose,
  onSubmit,
}: CreateCollectionModalProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [collectionName, setCollectionName] = useState("");
  const [selectedColor, setSelectedColor] = useState<
    (typeof LIST_COLORS)[number]
  >(LIST_COLORS[0]); // Default to first color
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      setCollectionName("");
      setSelectedColor(LIST_COLORS[0]);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (collectionName.trim()) {
      onSubmit({
        collection_name: collectionName,
        background_color: selectedColor,
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
              Create New Collection
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
                htmlFor="collection-name"
                className={`block mb-2 text-sm font-medium ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Collection Name
              </label>
              <input
                ref={inputRef}
                type="text"
                id="collection-name"
                placeholder="Enter collection name"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
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

            <div className="mb-6">
              <label
                className={`block mb-2 text-sm font-medium ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Collection Color
              </label>
              <div className="flex flex-wrap gap-2">
                {LIST_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    style={{ backgroundColor: color }}
                    className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      selectedColor === color
                        ? "ring-2 ring-offset-2 ring-offset-gray-100"
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
                disabled={!collectionName.trim()}
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

export default CreateCollectionModal;
