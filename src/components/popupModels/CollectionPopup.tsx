"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "@/context/ThemeContext";
import { Collection, OperationResult } from "@/types/schema";
import { useAuth } from "@/context/AuthContext";
import { useAppColors } from "@/hooks/useAppColors";
import { resolveColor } from "@/lib/colors";
import ModalShell from "@/components/ui/ModalShell";
import NameColorForm from "@/components/ui/NameColorForm";
import { PRIMARY } from "@/components/ui/tokens";

type SubmissionResult = OperationResult;

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (collectionData: {
    collection_name: string;
    bg_color_hex: string;
  }) => Promise<SubmissionResult> | void;
  initialName?: string;
  initialColor?: string;
  listId?: string;
  existingCollections?: Collection[]; // Added to check for duplicates
}

const CreateCollectionModal: React.FC<CreateCollectionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialName = "",
  initialColor = "",
  existingCollections = [], // Default to empty array
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === "dark";
  const { colors: appColors, loading: colorsLoading } = useAppColors();

  const [collectionName, setCollectionName] = useState(initialName);
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const colorInitializedRef = useRef(false);

  // Validation function to check for duplicate names (case-insensitive)
  const validateCollectionName = useCallback(
    (name: string): string | null => {
      if (!name.trim()) {
        return "Collection name is required";
      }

      // Check for case-insensitive name match (prevents both exact and case variations)
      const caseInsensitiveMatch = existingCollections.some(
        (collection) =>
          collection.collection_name &&
          collection.collection_name.toLowerCase() ===
            name.trim().toLowerCase(),
      );

      if (caseInsensitiveMatch) {
        // Find the existing name to show user what already exists
        const existingName = existingCollections.find(
          (collection) =>
            collection.collection_name &&
            collection.collection_name.toLowerCase() ===
              name.trim().toLowerCase(),
        )?.collection_name;

        return `A collection named "${existingName}" already exists (case-insensitive)`;
      }

      return null; // Validation passed
    },
    [existingCollections],
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
    [error, validateCollectionName],
  );

  useEffect(() => {
    if (isOpen) {
      setCollectionName(initialName);
      setSelectedColor(initialColor || "");
      colorInitializedRef.current = !!initialColor;
      setError(null);
      setIsSubmitting(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, initialName, initialColor]);

  // Set initial color from API when colors load and no color is pre-selected
  useEffect(() => {
    if (isOpen && !colorInitializedRef.current && appColors.length > 0) {
      setSelectedColor(appColors[0].color_hex);
      colorInitializedRef.current = true;
    }
  }, [isOpen, appColors]);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, isLoading]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate collection name before submission
      const validationError = validateCollectionName(collectionName);
      if (validationError) {
        setError(validationError);
        return;
      }

      if (isSubmitting || isLoading) return;

      setIsLoading(true);
      setIsSubmitting(true);
      setError(null);

      try {
        if (!user || !user.id) throw new Error("User not authenticated");

        if (onSubmit) {
          const result = await onSubmit({
            collection_name: collectionName.trim(),
            // The effect above pre-selects the palette's first colour, and the
            // user is free to pick another. resolveColor only covers the case
            // where neither happened — the palette failed to load, and
            // useAppColors swallows that error — so an unusable value can never
            // be stored.
            bg_color_hex: resolveColor(selectedColor),
          });

          // Check if onSubmit returned an error
          if (
            result &&
            typeof result === "object" &&
            "success" in result &&
            !result.success
          ) {
            throw result.error || new Error("Failed to submit collection");
          }
        }

        onClose();
      } catch (err: unknown) {
        console.error("Error submitting collection:", err);
        setError(
          err instanceof Error ? err.message : "Failed to create collection",
        );
      } finally {
        setIsLoading(false);
        setIsSubmitting(false);
      }
    },
    [
      validateCollectionName,
      collectionName,
      selectedColor,
      isSubmitting,
      isLoading,
      onSubmit,
      onClose,
      user,
    ],
  );

  // Check if form is valid for submit button state
  const isFormValid =
    collectionName.trim() && !validateCollectionName(collectionName);

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="New collection"
      isDark={isDark}
      canClose={!isLoading}
      footer={
        <div className="space-y-2">
          <button
            type="submit"
            form="create-collection-form"
            disabled={isLoading || !isFormValid}
            className="min-h-[48px] w-full rounded-2xl text-[15px] font-semibold text-white transition-opacity active:opacity-85 disabled:opacity-45"
            style={{ backgroundColor: PRIMARY }}
          >
            {isLoading ? "Creating..." : "Create collection"}
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
        formId="create-collection-form"
        onSubmit={handleSubmit}
        nameLabel="Collection name"
        namePlaceholder="e.g. University"
        name={collectionName}
        onNameChange={handleNameChange}
        maxLength={100}
        colors={appColors}
        colorsLoading={colorsLoading}
        selectedColor={selectedColor}
        onSelectColor={setSelectedColor}
        disabled={isLoading}
        error={error}
        inputRef={inputRef}
        isDark={isDark}
      />
    </ModalShell>
  );
};

export default React.memo(CreateCollectionModal);
