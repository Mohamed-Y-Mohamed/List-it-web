"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/client";
import { List } from "@/types/schema";
import { useAppColors } from "@/hooks/useAppColors";
import { resolveColor } from "@/lib/colors";
import ModalShell from "@/components/ui/ModalShell";
import NameColorForm from "@/components/ui/NameColorForm";
import { PRIMARY } from "@/components/ui/tokens";

// Define a proper result type for submission
interface SubmissionResult {
  success: boolean;
  error?: unknown;
}

interface CreateListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    listData: Omit<
      List,
      "id" | "created_at" | "tasks" | "notes" | "collections"
    >
  ) => Promise<SubmissionResult> | void;
  existingLists?: { id: string; list_name: string | null }[]; // Added for validation
}

// Create a proper UTC Date object for iOS compatibility
const createUTCDate = (): Date => {
  const now = new Date();
  // Create date in UTC to avoid timezone issues
  return new Date(
    Date.UTC(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours(),
      now.getMinutes(),
      now.getSeconds()
    )
  );
};

/**
 * Modal component for creating a new list
 */
const CreateListModal: React.FC<CreateListModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingLists = [], // Default to empty array
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === "dark";

  // Form state
  const [listName, setListName] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const { colors: appColors, loading: colorsLoading } = useAppColors();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allLists, setAllLists] =
    useState<{ id: string; list_name: string | null }[]>(existingLists);

  // Refs for UI interactions
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Tracks whether the initial color has been set for the current modal session
  const colorInitializedRef = useRef(false);

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

  // Validation function for case-insensitive list name checking
  const validateListName = useCallback(
    (name: string): string | null => {
      if (!name.trim()) {
        return "List name is required";
      }

      // Check for case-insensitive name match
      const caseInsensitiveMatch = allLists.find(
        (list) =>
          list.list_name &&
          list.list_name.toLowerCase() === name.trim().toLowerCase()
      );

      if (caseInsensitiveMatch) {
        return `A list named "${caseInsensitiveMatch.list_name}" already exists (case-insensitive)`;
      }

      return null; // Validation passed
    },
    [allLists]
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
    [error, validateListName]
  );

  // Reset, then focus, when the modal opens.
  //
  // This has to be declared *before* the colour-init effect below. React runs
  // effects in declaration order, and these two were the other way round: init set
  // the default colour and flipped the ref, then this one immediately cleared both.
  // `appColors` never changes afterwards — the palette is fetched once on mount and
  // this modal is mounted permanently by NativeHome — so init never got a second
  // chance, and `selectedColor` stayed "" unless the user tapped a swatch.
  //
  // The consequence was not cosmetic: the create handler wrote `bg_color_hex: ""`
  // to the list *and* to the "General" collection it creates alongside it, so every
  // note later added to that collection inherited an empty colour too.
  // CollectionPopup has always had these two in the correct order, which is why
  // collections were unaffected and this went unnoticed.
  useEffect(() => {
    if (isOpen) {
      setListName("");
      setSelectedColor("");
      colorInitializedRef.current = false;
      setError(null);
      setSuccessMessage(null);
      setIsSubmitting(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Set initial color from API when colors load and none is pre-selected
  useEffect(() => {
    if (isOpen && !colorInitializedRef.current && appColors.length > 0) {
      setSelectedColor(appColors[0].color_hex);
      colorInitializedRef.current = true;
    }
  }, [isOpen, appColors]);

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

  // Create a new list - with case-insensitive validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
        throw new Error("You must be logged in to create a list");
      }

      if (!user.id) {
        throw new Error("User ID is missing");
      }

      // Double-check against database with case-insensitive query
      const { data: existingLists, error: checkError } = await supabase
        .from("list")
        .select("id, list_name")
        .eq("user_id", user.id)
        .ilike("list_name", listName.trim());

      if (checkError) {
        console.error("Error checking existing lists:", checkError);
      } else if (existingLists && existingLists.length > 0) {
        const existingName = existingLists[0].list_name;
        setError(
          `A list named "${existingName}" already exists (case-insensitive)`
        );
        setIsLoading(false);
        setIsSubmitting(false);
        return;
      }

      // Create a proper Date object with UTC timezone for iOS compatibility
      const createDate = createUTCDate();

      // A valid colour, guaranteed rather than assumed.
      //
      // The effect above supplies the palette's first entry as a default, but that
      // depends on the fetch having resolved — and useAppColors swallows its
      // errors, so a failed request is indistinguishable from an empty palette.
      // Submitting in that window wrote "" to both rows below. This makes the
      // stored value usable in every case, including the one where the palette
      // never arrives.
      const listColor = resolveColor(selectedColor);

      // Step 1: Create the list
      const { data: insertedList, error: listError } = await supabase
        .from("list")
        .insert([
          {
            list_name: listName.trim(),
            bg_color_hex: listColor,
            is_default: false,
            is_pinned: false,
            user_id: user.id,
            list_icon: "checklist",
            // Use the Date object directly instead of formatting it as a string
            created_at: createDate,
          },
        ])
        .select();

      if (listError) {
        console.error("Error inserting list:", listError);
        throw new Error(listError.message || "Failed to create list");
      }

      if (!insertedList || insertedList.length === 0) {
        throw new Error("No list data returned after creation");
      }

      const newListId = insertedList[0].id;

      // Step 2: Create a default collection linked to the list
      const { error: collectionError } = await supabase
        .from("collection")
        .insert([
          {
            list_id: newListId,
            collection_name: "General",
            bg_color_hex: listColor,
            user_id: user.id,
            // Use the Date object directly for iOS compatibility
            created_at: createDate,
          },
        ]);

      if (collectionError) {
        console.error("Error creating collection:", collectionError);
        // Continue anyway since the list was created
      } else {
        setSuccessMessage("List and collection created successfully!");
      }

      // Step 3: Call the onSubmit callback once with the list data
      onSubmit({
        list_name: listName.trim(),
        bg_color_hex: listColor,
        is_default: false,
        user_id: user.id,
        is_pinned: false,
        list_icon: null,
      });

      // Add a slight delay to show success message
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: unknown) {
      console.error("Error in list creation process:", err);

      // Error handling
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create list");
      }
    } finally {
      setIsLoading(false);
      // Note: We're not resetting isSubmitting here to prevent multiple submissions
    }
  };

  // Check if form is valid for submit button state
  const isFormValid = listName.trim() && !validateListName(listName);


  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="New list"
      isDark={isDark}
      canClose={!isLoading}
      footer={
        <div className="space-y-2">
          <button
            type="submit"
            form="create-list-form"
            disabled={isLoading || !isFormValid || isSubmitting}
            className="min-h-[48px] w-full rounded-2xl text-[15px] font-semibold text-white transition-opacity active:opacity-85 disabled:opacity-45"
            style={{ backgroundColor: PRIMARY }}
          >
            {isLoading ? "Creating..." : "Create list"}
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
        formId="create-list-form"
        onSubmit={handleSubmit}
        nameLabel="List name"
        namePlaceholder="e.g. Work"
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

export default CreateListModal;
