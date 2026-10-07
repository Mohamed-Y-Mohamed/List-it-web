"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/client";
import { List } from "@/types/schema";
import { useAppColors } from "@/hooks/useAppColors";
import ModalShell from "@/components/ui/ModalShell";
import NameColorForm from "@/components/ui/NameColorForm";
import { PRIMARY } from "@/components/ui/tokens";

// Define a proper result type for submission
interface SubmissionResult {
  success: boolean;
  error?: unknown;
}

interface EditListPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    listId: string,
    listData: { list_name: string; bg_color_hex: string },
  ) => Promise<SubmissionResult> | void;
  existingLists?: { id: string; list_name: string | null }[];
  currentList: List | null;
}

/**
 * Modal component for editing an existing list
 */
const EditListPopup: React.FC<EditListPopupProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingLists = [],
  currentList,
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === "dark";
  const { colors: appColors, loading: colorsLoading } = useAppColors();

  // Form state
  const [listName, setListName] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allLists, setAllLists] =
    useState<{ id: string; list_name: string | null }[]>(existingLists);

  // Refs for UI interactions
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize form with current list data
  useEffect(() => {
    if (isOpen && currentList) {
      setListName(currentList.list_name || "");
      setSelectedColor(currentList.bg_color_hex || "");
      setError(null);
      setSuccessMessage(null);
      setIsSubmitting(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, currentList]);

  // Fetch existing lists for validation when modal opens
  useEffect(() => {
    const fetchExistingLists = async () => {
      if (!isOpen || !user) return;

      try {
        const { data: lists, error } = await supabase
          .from("list")
          .select("id, list_name")
          .eq("user_id", user.id);

        if (error) {
          console.error("Error fetching existing lists:", error);
        } else {
          setAllLists(lists || []);
        }
      } catch (err) {
        console.error("Failed to fetch existing lists:", err);
      }
    };

    fetchExistingLists();
  }, [isOpen, user]);

  // Validation function for case-insensitive list name checking (excluding current list)
  const validateListName = useCallback(
    (name: string): string | null => {
      if (!name.trim()) {
        return "List name is required";
      }

      // Check for case-insensitive name match, excluding the current list
      const caseInsensitiveMatch = allLists.find(
        (list) =>
          list.id !== currentList?.id && // Exclude current list from validation
          list.list_name &&
          list.list_name.toLowerCase() === name.trim().toLowerCase(),
      );

      if (caseInsensitiveMatch) {
        return `A list named "${caseInsensitiveMatch.list_name}" already exists (case-insensitive)`;
      }

      return null; // Validation passed
    },
    [allLists, currentList?.id],
  );

  // Real-time validation as user types
  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newName = e.target.value;
      setListName(newName);

      // Clear error when user starts typing
      if (error) {
        setError(null);
      }

      // Real-time validation
      if (newName.trim()) {
        const validationError = validateListName(newName);
        if (validationError && validationError !== "List name is required") {
          setError(validationError);
        }
      }
    },
    [error, validateListName],
  );

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        modalRef.current &&
        !modalRef.current.contains(event.target as Node) &&
        !isLoading
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, isLoading]);

  // Handle the escape key to close the modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, isLoading]);

  // Update list - with case-insensitive validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentList) {
      setError("No list selected for editing");
      return;
    }

    // Validation using our new case-insensitive function
    const validationError = validateListName(listName);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Prevent duplicate submissions
    if (isSubmitting || isLoading) {
      return;
    }

    setIsLoading(true);
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (!user) {
        throw new Error("You must be logged in to edit a list");
      }

      if (!user.id) {
        throw new Error("User ID is missing");
      }

      // Double-check against database with case-insensitive query (excluding current list)
      const { data: existingLists, error: checkError } = await supabase
        .from("list")
        .select("id, list_name")
        .eq("user_id", user.id)
        .neq("id", currentList.id) // Exclude current list
        .ilike("list_name", listName.trim());

      if (checkError) {
        console.error("Error checking existing lists:", checkError);
      } else if (existingLists && existingLists.length > 0) {
        const existingName = existingLists[0].list_name;
        setError(
          `A list named "${existingName}" already exists (case-insensitive)`,
        );
        setIsLoading(false);
        setIsSubmitting(false);
        return;
      }

      // Update the list
      const { error: updateError } = await supabase
        .from("list")
        .update({
          list_name: listName.trim(),
          bg_color_hex: selectedColor,
        })
        .eq("id", currentList.id)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Error updating list:", updateError);
        throw new Error(updateError.message || "Failed to update list");
      }

      // Update any associated collections with the new color
      const { error: collectionsUpdateError } = await supabase
        .from("collection")
        .update({
          bg_color_hex: selectedColor,
        })
        .eq("list_id", currentList.id)
        .eq("user_id", user.id)
        .ilike("collection_name", "general"); // ADD THIS LINE

      if (collectionsUpdateError) {
        console.error(
          "Error updating collections color:",
          collectionsUpdateError,
        );
        // Continue anyway since the list was updated
      }

      setSuccessMessage("List updated successfully!");

      // Call the onSubmit callback with the updated data
      await onSubmit(currentList.id, {
        list_name: listName.trim(),
        bg_color_hex: selectedColor,
      });

      // Add a slight delay to show success message
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: unknown) {
      console.error("Error in list update process:", err);

      // Error handling
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to update list");
      }
    } finally {
      setIsLoading(false);
      // Note: We're not resetting isSubmitting here to prevent multiple submissions
    }
  };

  // Check if form is valid and has changes
  const hasChanges =
    listName.trim() !== (currentList?.list_name || "") ||
    selectedColor !== (currentList?.bg_color_hex || "");

  const isFormValid =
    listName.trim() && !validateListName(listName) && hasChanges;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Edit list"
      isDark={isDark}
      canClose={!isLoading}
      footer={
        <div className="space-y-2">
          <button
            type="submit"
            form="edit-list-form"
            disabled={isLoading || !isFormValid || isSubmitting}
            className="min-h-[48px] w-full rounded-2xl text-[15px] font-semibold text-white transition-opacity active:opacity-85 disabled:opacity-45"
            style={{ backgroundColor: PRIMARY }}
          >
            {isLoading ? "Saving..." : "Save changes"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className={`min-h-[44px] w-full rounded-2xl border text-[14px] font-medium disabled:opacity-45 ${
              isDark
                ? "border-white/[0.08] text-gray-300 active:bg-white/10"
                : "border-black/[0.08] text-gray-700 active:bg-black/5"
            }`}
          >
            Cancel
          </button>
        </div>
      }
    >
      <NameColorForm
        formId="edit-list-form"
        onSubmit={handleSubmit}
        nameLabel="List name"
        namePlaceholder="List name"
        name={listName}
        onNameChange={handleNameChange}
        maxLength={50}
        colors={appColors}
        colorsLoading={colorsLoading}
        selectedColor={selectedColor}
        onSelectColor={setSelectedColor}
        disabled={isLoading}
        error={error}
        successMessage={successMessage}
        inputRef={inputRef}
        isDark={isDark}
      />
    </ModalShell>
  );
};

export default EditListPopup;
