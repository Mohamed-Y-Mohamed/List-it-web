"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/client";
import { Collection } from "@/types/schema";
import { useAppColors } from "@/hooks/useAppColors";
import ModalShell from "@/components/ui/ModalShell";
import NameColorForm from "@/components/ui/NameColorForm";
import { PRIMARY } from "@/components/ui/tokens";

// Define a proper result type for submission
interface SubmissionResult {
  success: boolean;
  error?: unknown;
}

interface EditCollectionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    collectionId: string,
    collectionData: { collection_name: string; bg_color_hex: string }
  ) => Promise<SubmissionResult> | void;
  existingCollections?: Collection[];
  currentCollection: Collection | null;
}

/**
 * Modal component for editing an existing collection
 */
const EditCollectionPopup: React.FC<EditCollectionPopupProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingCollections = [],
  currentCollection,
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === "dark";
  const { colors: appColors, loading: colorsLoading } = useAppColors();

  // Form state
  const [collectionName, setCollectionName] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs for UI interactions
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize form with current collection data
  useEffect(() => {
    if (isOpen && currentCollection) {
      setCollectionName(currentCollection.collection_name || "");
      setSelectedColor(currentCollection.bg_color_hex || "");
      setError(null);
      setSuccessMessage(null);
      setIsSubmitting(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, currentCollection]);

  // Validation function for case-insensitive collection name checking (excluding current collection)
  const validateCollectionName = useCallback(
    (name: string): string | null => {
      if (!name.trim()) {
        return "Collection name is required";
      }

      // Check for case-insensitive name match, excluding the current collection
      const caseInsensitiveMatch = existingCollections.find(
        (collection) =>
          collection.id !== currentCollection?.id && // Exclude current collection from validation
          collection.collection_name &&
          collection.collection_name.toLowerCase() === name.trim().toLowerCase()
      );

      if (caseInsensitiveMatch) {
        return `A collection named "${caseInsensitiveMatch.collection_name}" already exists (case-insensitive)`;
      }

      return null; // Validation passed
    },
    [existingCollections, currentCollection?.id]
  );

  // Real-time validation as user types
  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newName = e.target.value;
      setCollectionName(newName);

      // Clear error when user starts typing
      if (error) {
        setError(null);
      }

      // Real-time validation
      if (newName.trim()) {
        const validationError = validateCollectionName(newName);
        if (
          validationError &&
          validationError !== "Collection name is required"
        ) {
          setError(validationError);
        }
      }
    },
    [error, validateCollectionName]
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

  // Update collection - with case-insensitive validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentCollection) {
      setError("No collection selected for editing");
      return;
    }

    // Validation using our new case-insensitive function
    const validationError = validateCollectionName(collectionName);
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
        throw new Error("You must be logged in to edit a collection");
      }

      if (!user.id) {
        throw new Error("User ID is missing");
      }

      // Double-check against database with case-insensitive query (excluding current collection)
      const { data: existingCollections, error: checkError } = await supabase
        .from("collection")
        .select("id, collection_name")
        .eq("user_id", user.id)
        .neq("id", currentCollection.id) // Exclude current collection
        .ilike("collection_name", collectionName.trim());

      if (checkError) {
        console.error("Error checking existing collections:", checkError);
      } else if (existingCollections && existingCollections.length > 0) {
        const existingName = existingCollections[0].collection_name;
        setError(
          `A collection named "${existingName}" already exists (case-insensitive)`
        );
        setIsLoading(false);
        setIsSubmitting(false);
        return;
      }

      // Update the collection
      const { error: updateError } = await supabase
        .from("collection")
        .update({
          collection_name: collectionName.trim(),
          bg_color_hex: selectedColor,
        })
        .eq("id", currentCollection.id)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Error updating collection:", updateError);
        throw new Error(updateError.message || "Failed to update collection");
      }

      setSuccessMessage("Collection updated successfully!");

      // Call the onSubmit callback with the updated data
      await onSubmit(currentCollection.id, {
        collection_name: collectionName.trim(),
        bg_color_hex: selectedColor,
      });

      // Add a slight delay to show success message
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: unknown) {
      console.error("Error in collection update process:", err);

      // Error handling
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to update collection");
      }
    } finally {
      setIsLoading(false);
      // Note: We're not resetting isSubmitting here to prevent multiple submissions
    }
  };

  // Check if form is valid and has changes
  const hasChanges =
    collectionName.trim() !== (currentCollection?.collection_name || "") ||
    selectedColor !== (currentCollection?.bg_color_hex || "");

  const isFormValid =
    collectionName.trim() &&
    !validateCollectionName(collectionName) &&
    hasChanges;


  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Edit collection"
      isDark={isDark}
      canClose={!isLoading}
      footer={
        <div className="space-y-2">
          <button
            type="submit"
            form="edit-collection-form"
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
        formId="edit-collection-form"
        onSubmit={handleSubmit}
        nameLabel="Collection name"
        namePlaceholder="Collection name"
        name={collectionName}
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

export default EditCollectionPopup;
