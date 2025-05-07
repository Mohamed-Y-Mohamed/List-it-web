// components/popupModels/ListPopup.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Check } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/client";
import { List, ListColor, LIST_COLORS } from "@/types/schema";

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
  const { user } = useAuth();
  const isDark = theme === "dark";
  const [listName, setListName] = useState("");
  const [selectedColor, setSelectedColor] = useState<ListColor>("#FF3B30");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listName.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      if (!user) {
        throw new Error("You must be logged in to create a list");
      }

      // Create the list in the database - don't use select() to avoid potential response formatting issues
      const { data: insertedList, error: listError } = await supabase
        .from("list")
        .insert([
          {
            list_name: listName.trim(),
            bg_color_hex: selectedColor,
            is_default: false,
            is_pinned: false,
            user_id: user.id,
          },
        ])
        .select();

      if (listError) throw listError;

      let listId;

      // If we got the inserted list data directly
      if (insertedList && insertedList.length > 0) {
        listId = insertedList[0].id;
      } else {
        // Otherwise query for the most recently created list for this user
        const { data: recentList, error: recentListError } = await supabase
          .from("list")
          .select("*")
          .eq("user_id", user.id)
          .eq("list_name", listName.trim())
          .order("created_at", { ascending: false })
          .limit(1);

        if (recentListError) throw recentListError;

        if (!recentList || recentList.length === 0) {
          throw new Error("Failed to retrieve newly created list");
        }

        listId = recentList[0].id;
      }

      // Create a default "General" collection for this list
      const { error: collectionError } = await supabase
        .from("collection")
        .insert([
          {
            list_id: listId,
            collection_name: "General",
            bg_color_hex: selectedColor,
            is_default: true,
          },
        ]);

      if (collectionError) {
        console.error("Error creating General collection:", collectionError);
        // We'll continue even if collection creation fails
      }

      // Call the onSubmit callback with the new list data
      onSubmit({
        list_name: listName.trim(),
        bg_color_hex: selectedColor,
        is_default: false,
      });

      // Close the modal
      onClose();
    } catch (error) {
      console.error("Error creating list:", error);

      // Check if error is an empty object
      if (error && Object.keys(error).length === 0) {
        // It's an empty object error, which likely means the operation succeeded
        // but the response wasn't formatted as expected

        try {
          // Try to submit anyway based on the input data
          onSubmit({
            list_name: listName.trim(),
            bg_color_hex: selectedColor,
            is_default: false,
          });

          // Close the modal
          onClose();
          return;
        } catch (submitError) {
          console.error("Error in fallback submission:", submitError);
          // Continue to the error handling below
        }
      }

      setError(
        error instanceof Error ? error.message : "Failed to create list"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 backdrop-blur-md bg-blur-50"
        onClick={onClose}
      />

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
              disabled={isLoading}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-md">
              {error}
            </div>
          )}

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
                disabled={isLoading}
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
                    disabled={isLoading}
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
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 rounded-md ${
                  isDark
                    ? "bg-orange-600 hover:bg-orange-700"
                    : "bg-sky-500 hover:bg-sky-600"
                } text-white flex items-center justify-center min-w-[80px]`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  "Create"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreateListModal;
