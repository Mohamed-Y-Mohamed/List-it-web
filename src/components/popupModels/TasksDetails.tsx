"use client";

// Task Detail, and the edit form behind it. One sheet, two modes.
//
// The sheet opens as something to read. A task's title is the heading, its state
// is a line under it, and the two things you are most likely to want — tick it
// off, pin it — are the controls directly below. Everything else is a labelled
// section of text. Edit swaps the same window for the form, and Cancel comes back
// here rather than closing, because reading a task and changing it are two modes
// of one place, not two places.
//
// Completion and pin apply the moment they are tapped, in both modes. They are
// single-tap state rather than form fields, and routing them through Save meant
// ticking a task off and then pressing Cancel silently un-ticked it. They go
// through the parent's own handlers — `onComplete` and `onPriorityChange` already
// write to the database on every screen that mounts this — so there is one
// completion path, not a second one living in here. Everything that genuinely is
// a field (title, description, schedule, reminders, collection) still commits on
// Save, which is what the unsaved-changes guard protects.

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  X,
  Check,
  Trash2,
  AlertCircle,
  Pin,
  Pencil,
  CalendarPlus,
  ChevronLeft,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Collection, OperationResult } from "@/types/schema";
import { formatDetailDate } from "@/utils/dateUtils";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/apiFetch";
import { applyCompletion } from "@/lib/completion";
import {
  composeDue,
  describeReminders,
  dueMoment,
  parseReminders,
  type Reminder,
} from "@/lib/reminders";
import ConfirmDialog from "./ConfirmDialog";
import BottomSheet from "@/components/BottomSheet";
import { useOptionalAppData } from "@/components/native/AppDataProvider";
import SectionLabel from "@/components/ui/SectionLabel";
import InfoRow from "@/components/ui/InfoRow";
import MetaToggle from "@/components/ui/MetaToggle";
import DateChip from "@/components/ui/DateChip";
import DueDateEditor from "@/components/ui/DueDateEditor";
import ReminderChips from "@/components/ui/ReminderChips";
import { formatDateKey, toDateKey } from "@/components/ui/MiniCalendar";
import {
  DANGER,
  INFO,
  PRIMARY,
  SUCCESS,
  WARNING,
  collectionTint,
} from "@/components/ui/tokens";

interface TaskSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  task: {
    id: string;
    text: string;
    description?: string | null;
    created_at: Date;
    due_date?: Date | null;
    is_completed: boolean;
    date_completed?: Date | null;
    is_pinned: boolean;
    collection_id?: string | null;
    list_id?: string | null;
    user_id?: string | null;
    due_has_time?: boolean | null;
    repeat_rule?: unknown;
    reminders?: unknown;
    my_day_date?: string | null;
  };
  onComplete: (
    taskId: string,
    is_completed: boolean
  ) => Promise<OperationResult> | void;
  onPriorityChange: (
    taskId: string,
    is_pinned: boolean
  ) => Promise<OperationResult> | void;
  onTaskUpdate?: (
    taskId: string,
    taskData: {
      text: string;
      description?: string | null;
      due_date?: Date | null;
      is_pinned: boolean;
    }
  ) => Promise<OperationResult> | void;
  collections?: Collection[];
  onCollectionChange?: (
    taskId: string,
    collectionId: string
  ) => Promise<OperationResult> | void;
  onTaskDelete?: (taskId: string) => Promise<OperationResult> | void;
  /** The list this task sits in, for the relationship row. */
  listName?: string | null;
  /** Falls back to a lookup against the fetched collections when omitted. */
  collectionName?: string | null;
}

/** One row of the collection list fetched for the Collection picker. */
interface CollectionOption {
  id: string;
  collection_name: string | null;
  bg_color_hex?: string | null;
}

const TaskSidebar = ({
  isOpen,
  onClose,
  task,
  onComplete,
  onPriorityChange,
  onTaskUpdate,
  collections: externalCollections = [],
  onCollectionChange,
  onTaskDelete,
  listName,
  collectionName,
}: TaskSidebarProps) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === "dark";

  const bodyText = isDark ? "text-gray-200" : "text-gray-700";
  const mutedText = isDark ? "text-gray-400" : "text-gray-500";
  const fieldClass = isDark
    ? "border-white/[0.08] bg-white/[0.04] text-gray-100 placeholder:text-gray-600"
    : "border-black/[0.08] bg-white text-gray-900 placeholder:text-gray-400";
  const hairline = isDark ? "border-white/[0.08]" : "border-black/[0.06]";

  const sheetRef = useRef<HTMLDivElement>(null);

  // --- COLLECTIONS FOR THIS TASK'S LIST ---
  const [collections, setCollections] = useState<CollectionOption[]>(
    externalCollections
  );

  useEffect(() => {
    if (!isOpen || !user) return;
    const params = new URLSearchParams();
    if (task.list_id) params.set("list_id", task.list_id);
    apiFetch(`/api/collections?${params}`)
      .then((r) => r.json())
      .then(({ data }) => {
        if (data) setCollections(data);
      })
      .catch(() => {
        // The picker falls back to whatever the parent passed in. A failed
        // lookup should not blank the Collection row on a sheet someone opened
        // to read a description.
      });
  }, [isOpen, task.list_id, user]);

  // --- FORM STATE ---
  const [taskText, setTaskText] = useState<string>(task.text || "");
  const [taskDescription, setTaskDescription] = useState<string>(
    task.description || ""
  );
  const [dueDate, setDueDate] = useState<string>(
    task.due_date ? formatDateForInput(task.due_date, Boolean(task.due_has_time)) : ""
  );
  const [dueTime, setDueTime] = useState<string>(
    task.due_has_time && task.due_date ? formatTimeForInput(task.due_date) : ""
  );
  const [reminders, setReminders] = useState<Reminder[]>(
    parseReminders(task.reminders)
  );
  const [selectedCollection, setSelectedCollection] = useState<string>(
    task.collection_id || ""
  );
  const [isPinned, setIsPinned] = useState<boolean>(task.is_pinned || false);
  const [isCompleted, setIsCompleted] = useState<boolean>(
    task.is_completed || false
  );

  const [isTaskChanged, setIsTaskChanged] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  /** The due-date editor is open. Shown inline in the form, not as a second sheet. */
  const [dueEditorOpen, setDueEditorOpen] = useState<boolean>(false);

  // --- UI STATE ---
  const [showDeleteConfirmation, setShowDeleteConfirmation] =
    useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  /** A complete/pin write is in flight. Keeps the two from racing each other. */
  const [isToggling, setIsToggling] = useState<boolean>(false);

  // The shared native cache. Null on the web, where no provider is mounted.
  // Saving refreshes it so reminder scheduling sees the change.
  const appData = useOptionalAppData();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isProcessing = isSaving || isDeleting || isToggling;

  // --- INIT FORM ON OPEN ---
  useEffect(() => {
    if (!isOpen) return;

    setTaskText(task.text || "");
    setTaskDescription(task.description || "");
    setDueDate(
      task.due_date ? formatDateForInput(task.due_date, Boolean(task.due_has_time)) : ""
    );
    setDueTime(
      task.due_has_time && task.due_date ? formatTimeForInput(task.due_date) : ""
    );
    setReminders(parseReminders(task.reminders));
    setSelectedCollection(task.collection_id || "");
    setIsPinned(task.is_pinned || false);
    setIsCompleted(task.is_completed || false);
    setError(null);
    setSuccessMessage(null);
    setIsTaskChanged(false);
    setIsEditing(false);
    setDueEditorOpen(false);

    // Keyed on the task's identity, not the object.
    //
    // AppDataProvider refetches on every Capacitor "resume", which hands down a
    // brand-new task object with identical contents. Depending on `task` meant
    // this reset ran on each return to the app and discarded whatever was being
    // typed. The reminder flow made it reproducible — adding a reminder asks for
    // notification permission, the system dialog pauses the activity, and the
    // reminder just entered was gone by the time the user tapped Allow — but it
    // applied to every field, so switching apps mid-edit lost the lot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.id, isOpen]);

  // --- TRACK CHANGES ---
  //
  // Pin and completion are deliberately absent. They are written the instant they
  // are tapped, so counting them as unsaved changes would pop the discard dialog
  // on the way out of a sheet where nothing is actually unsaved.
  useEffect(() => {
    const oldDueDate = task.due_date
      ? formatDateForInput(task.due_date, Boolean(task.due_has_time))
      : "";
    const oldDueTime =
      task.due_has_time && task.due_date ? formatTimeForInput(task.due_date) : "";

    // Compared as JSON because both are plain data off a jsonb column; a deep
    // equality helper for two shapes this small would be ceremony.
    const changed =
      taskText !== task.text ||
      taskDescription !== (task.description || "") ||
      dueDate !== oldDueDate ||
      dueTime !== oldDueTime ||
      selectedCollection !== (task.collection_id || "") ||
      JSON.stringify(reminders) !==
        JSON.stringify(parseReminders(task.reminders));

    setIsTaskChanged(changed);
  }, [taskText, taskDescription, dueDate, dueTime, selectedCollection, reminders, task]);

  // --- CLEANUP TIMEOUTS ---
  useEffect(
    () => () => {
      if (errorTimer.current) clearTimeout(errorTimer.current);
      if (successTimer.current) clearTimeout(successTimer.current);
    },
    []
  );

  function formatDateForInput(
    date: Date | string | null | undefined,
    hasTime = false
  ): string {
    if (!date) return "";
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (Number.isNaN(dateObj.getTime())) return "";

      // A date-only due date is stored at UTC noon as a marker, so UTC is how to
      // read the day back. One with a time is a real local instant, and reading
      // that in UTC shows the wrong day for anything late in the evening west of
      // the meridian, or early morning east of it.
      if (!hasTime) return dateObj.toISOString().split("T")[0];
      return toDateKey(dateObj);
    } catch {
      return "";
    }
  }

  function formatTimeForInput(date: Date | string | null | undefined): string {
    if (!date) return "";
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (Number.isNaN(dateObj.getTime())) return "";
      const hours = `${dateObj.getHours()}`.padStart(2, "0");
      const minutes = `${dateObj.getMinutes()}`.padStart(2, "0");
      return `${hours}:${minutes}`;
    } catch {
      return "";
    }
  }

  // --- DISPLAY HELPERS ---
  const showError = useCallback((message: string) => {
    setError(message);
    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setError(null), 5000);
  }, []);

  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    if (successTimer.current) clearTimeout(successTimer.current);
    successTimer.current = setTimeout(() => setSuccessMessage(null), 2500);
  }, []);

  /**
   * Which discard the dialog is asking about, or null while it is shut.
   *
   * `window.confirm` answered inline, which is why the old code could branch on
   * it in a single expression. The app's own dialog resolves a turn later, so the
   * intent has to be held somewhere until it does.
   */
  const [pendingDiscard, setPendingDiscard] = useState<null | "close" | "edit">(
    null
  );

  const handleClose = useCallback(() => {
    if (isEditing && isTaskChanged) {
      setPendingDiscard("close");
      return;
    }
    onClose();
  }, [isEditing, isTaskChanged, onClose]);

  /** Put every field back as stored, and leave edit mode. */
  const revertForm = useCallback(() => {
    setTaskText(task.text || "");
    setTaskDescription(task.description || "");
    setDueDate(
      task.due_date ? formatDateForInput(task.due_date, Boolean(task.due_has_time)) : ""
    );
    setDueTime(
      task.due_has_time && task.due_date ? formatTimeForInput(task.due_date) : ""
    );
    setReminders(parseReminders(task.reminders));
    setSelectedCollection(task.collection_id || "");
    setIsTaskChanged(false);
    setError(null);
    setIsEditing(false);
    setDueEditorOpen(false);
  }, [task]);

  const handleCancelEdit = useCallback(() => {
    if (isTaskChanged) {
      setPendingDiscard("edit");
      return;
    }
    revertForm();
  }, [isTaskChanged, revertForm]);

  const confirmDiscard = useCallback(() => {
    const intent = pendingDiscard;
    setPendingDiscard(null);
    if (intent === "close") onClose();
    else if (intent === "edit") revertForm();
  }, [pendingDiscard, onClose, revertForm]);

  // --- KEYBOARD ESC ---
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !isOpen) return;
      if (showDeleteConfirmation) setShowDeleteConfirmation(false);
      else if (!isProcessing) handleClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, showDeleteConfirmation, isProcessing, handleClose]);

  // --- DERIVED ---
  const composed = composeDue(dueDate, dueTime);
  const dueAt = composed
    ? dueMoment({ due_date: composed.due, due_has_time: composed.hasTime })
    : null;

  /** Past its due day and still open. Drives the rose chip. */
  const isOverdue = Boolean(
    dueDate && !isCompleted && dueDate < toDateKey(new Date())
  );

  const dueLabel = dueDate ? formatDateKey(dueDate, dueTime || null) : null;

  const resolvedCollectionName =
    collectionName ??
    collections.find((c) => c.id === (task.collection_id || ""))
      ?.collection_name ??
    null;

  /** The collection's stored colour, for the sheet's restrained tint. */
  const collectionColor =
    collections.find((c) => c.id === (task.collection_id || ""))?.bg_color_hex ??
    null;

  const formattedCompletedDate = task.date_completed
    ? formatDetailDate(task.date_completed)
    : null;

  // --- IMMEDIATE TOGGLES ---
  //
  // Both go through the parent's handler, which is the same write the rest of the
  // app uses. Optimistic locally so the status line flips on the tap rather than
  // after a round trip, and rolled back if the write fails.
  const resultFailed = (result: unknown) =>
    Boolean(
      result &&
        typeof result === "object" &&
        "success" in result &&
        !(result as OperationResult).success
    );

  const toggleCompleted = async () => {
    const next = !isCompleted;
    setIsCompleted(next);
    setIsToggling(true);
    try {
      const result = await onComplete(task.id, next);
      if (resultFailed(result)) {
        setIsCompleted(!next);
        showError("Could not update this task.");
        return;
      }
      void appData?.refresh();
      showSuccess(next ? "Marked complete" : "Marked incomplete");

      // A completed task leaves the screen it was opened from — every list view
      // drops it, which is what `removeWhen` in useTaskActions is for. Leaving
      // the sheet open over a row that no longer exists is the confusing option,
      // so it closes once the message has been seen.
      if (next) setTimeout(onClose, 900);
    } catch {
      setIsCompleted(!next);
      showError("Could not update this task.");
    } finally {
      setIsToggling(false);
    }
  };

  const togglePinned = async () => {
    const next = !isPinned;
    setIsPinned(next);
    setIsToggling(true);
    try {
      const result = await onPriorityChange(task.id, next);
      if (resultFailed(result)) {
        setIsPinned(!next);
        showError("Could not update this task.");
        return;
      }
      void appData?.refresh();
    } catch {
      setIsPinned(!next);
      showError("Could not update this task.");
    } finally {
      setIsToggling(false);
    }
  };

  if (!isOpen) return null;

  // --- SAVE THE FORM FIELDS ---
  const updateTaskInDatabase = async (): Promise<OperationResult> => {
    if (!taskText.trim()) {
      showError("Task name is required");
      return { success: false, error: "Task name is required" };
    }
    if (!user?.id) {
      showError("You must be logged in to update a task");
      return { success: false, error: "Authentication required" };
    }

    try {
      setIsSaving(true);

      // Completion goes through the shared decision, same as useTaskActions and
      // ListDetailView. It is unchanged by this form — the toggle above already
      // wrote it — but the PATCH still has to send a consistent pair, because a
      // task whose `is_completed` and `date_completed` disagree reads as open on
      // one screen and done on another.
      const completion = applyCompletion(
        { due_date: task.due_date, repeat_rule: task.repeat_rule },
        isCompleted
      );

      const updateData = {
        text: taskText.trim(),
        description: taskDescription.trim() || null,
        due_date: composed?.due ?? null,
        due_has_time: composed?.hasTime ?? false,
        reminders: reminders.length > 0 ? reminders : null,
        is_pinned: isPinned,
        // Field by field rather than spread: applyCompletion returns dates as ISO
        // strings for the API, and this object is also handed to onTaskUpdate,
        // which types them as Date. A spread would quietly put a string where the
        // parent expects an object.
        is_completed: completion.is_completed,
        date_completed: completion.date_completed
          ? new Date(completion.date_completed)
          : null,
      };

      const patchRes = await apiFetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, ...updateData }),
      });
      if (!patchRes.ok) {
        const errBody = await patchRes.json();
        throw new Error(errBody.error || "Failed to update task");
      }
      const { data } = await patchRes.json();

      if (onTaskUpdate) {
        const result = await onTaskUpdate(task.id, updateData);
        if (resultFailed(result)) {
          throw new Error(
            String((result as OperationResult).error || "Failed to update task")
          );
        }
      }

      // Tell the shared cache, which is what schedules reminders.
      //
      // This sheet opens from all six task screens and from inside a list, and
      // each of those keeps its own copy of the rows. None of them is the list
      // useTaskReminders reads, so without this a reminder added or removed here
      // was written to the database and never reached the OS — it only took
      // effect after a relaunch or a resume happened to refetch.
      //
      // Null on the web, where no provider is mounted and nothing schedules.
      void appData?.refresh();

      return { success: true, data };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      showError(message || "Failed to update task");
      return { success: false, error: err };
    } finally {
      setIsSaving(false);
    }
  };

  const updateCollectionInDatabase = async (): Promise<OperationResult> => {
    if (!user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const currentCollectionId = task.collection_id ?? "";
    if (selectedCollection === currentCollectionId) return { success: true };

    try {
      if (onCollectionChange && selectedCollection) {
        const result = await onCollectionChange(task.id, selectedCollection);
        if (resultFailed(result)) {
          throw new Error(
            String(
              (result as OperationResult).error || "Failed to update collection"
            )
          );
        }
        return { success: true };
      }

      // No handler from the parent, so write it directly rather than silently
      // dropping the change.
      const patchRes = await apiFetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task.id,
          collection_id: selectedCollection === "" ? null : selectedCollection,
        }),
      });
      if (!patchRes.ok) {
        const errBody = await patchRes.json();
        throw new Error(errBody.error || "Failed to update task collection");
      }
      void appData?.refresh();
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      showError(message || "Failed to update collection");
      return { success: false, error: err };
    }
  };

  const handleSaveTask = async () => {
    const res = await updateTaskInDatabase();
    if (!res.success) return;

    if (selectedCollection !== (task.collection_id ?? "")) {
      const moved = await updateCollectionInDatabase();
      if (!moved.success) return;
    }

    showSuccess("Changes saved");
    // Back to the view, not out of the sheet. Saving an edit is a reason to see
    // the task as it now reads, not a reason to be returned to the list.
    setIsEditing(false);
    setDueEditorOpen(false);
    setIsTaskChanged(false);
  };

  // --- DELETE ---
  const handleConfirmDelete = async () => {
    if (!user?.id) {
      showError("You must be logged in to delete a task");
      return;
    }
    try {
      setIsDeleting(true);

      const deleteRes = await apiFetch("/api/tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id }),
      });
      if (!deleteRes.ok) {
        const errBody = await deleteRes.json();
        throw new Error(errBody.error || "Failed to delete task");
      }

      if (onTaskDelete) {
        const result = await onTaskDelete(task.id);
        if (resultFailed(result)) {
          throw new Error(
            String((result as OperationResult).error || "Failed to delete task")
          );
        }
      }

      void appData?.refresh();
      setShowDeleteConfirmation(false);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      showError(message || "Failed to delete task");
    } finally {
      setIsDeleting(false);
    }
  };

  // --- PIECES ---
  const primaryButton = (
    label: string,
    onClick: () => void,
    color: string,
    disabled?: boolean
  ) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="min-h-[48px] w-full rounded-2xl text-[15px] font-semibold text-white transition-opacity active:opacity-85 disabled:opacity-45"
      style={{ backgroundColor: color }}
    >
      {label}
    </button>
  );

  const ghostButton = (
    label: string,
    onClick: () => void,
    disabled?: boolean,
    tone?: string
  ) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`min-h-[48px] w-full rounded-2xl border text-[15px] font-medium transition-colors disabled:opacity-45 ${hairline} ${
        isDark ? "active:bg-white/10" : "active:bg-black/5"
      }`}
      style={tone ? { color: tone } : undefined}
    >
      {label}
    </button>
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      label={isEditing ? "Edit task" : "Task details"}
      isDark={isDark}
      canClose={!isProcessing}
      // The restrained tint the brief asks for: the collection's colour at 8%
      // over the sheet surface, so a task reads as belonging somewhere without
      // the panel becoming a coloured box.
      surfaceColor={collectionTint(collectionColor, isDark)}
      footer={
        <div className="mx-auto w-full max-w-md space-y-2">
          {!isEditing ? (
            <>
              {primaryButton(
                "Edit task",
                () => setIsEditing(true),
                PRIMARY,
                isProcessing
              )}
              {/* Delete sits here and nowhere near the completion control at the
                  top. They are one tap apart in intent and a world apart in
                  consequence. */}
              {ghostButton(
                "Delete",
                () => setShowDeleteConfirmation(true),
                isProcessing,
                DANGER
              )}
            </>
          ) : (
            <>
              {primaryButton(
                isSaving ? "Saving..." : "Save changes",
                handleSaveTask,
                PRIMARY,
                isProcessing || !isTaskChanged || !taskText.trim()
              )}
              {ghostButton("Cancel", handleCancelEdit, isProcessing)}
            </>
          )}
        </div>
      }
    >
      <div
        ref={sheetRef}
        className={`mx-auto w-full max-w-md px-5 ${
          isDark ? "text-gray-100" : "text-gray-900"
        }`}
      >
        {/* A labelled Back on the left is the control Android users look for; the
            X stays for anyone used to it. Neither saves — Save changes does, and
            Cancel says so outright. */}
        <div className="flex items-center justify-between py-1">
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className={`-ml-2 flex min-h-[44px] items-center gap-1 rounded-full px-2 pr-3 text-[14px] font-medium ${bodyText} ${
              isDark ? "active:bg-white/10" : "active:bg-black/5"
            }`}
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
            Back
          </button>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className={`-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              isDark ? "active:bg-white/10" : "active:bg-black/5"
            }`}
            aria-label="Close"
          >
            <X className={`h-5 w-5 ${mutedText}`} />
          </button>
        </div>

        {successMessage && (
          <div
            className="mb-3 flex items-center gap-2 rounded-xl px-3 py-2 text-[13px]"
            style={{
              backgroundColor: `color-mix(in srgb, ${SUCCESS} 14%, transparent)`,
              color: SUCCESS,
            }}
          >
            <Check className="h-4 w-4 shrink-0" />
            {successMessage}
          </div>
        )}
        {error && (
          <div
            className="mb-3 flex items-center gap-2 rounded-xl px-3 py-2 text-[13px]"
            style={{
              backgroundColor: `color-mix(in srgb, ${DANGER} 14%, transparent)`,
              color: DANGER,
            }}
            role="alert"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {!isEditing ? (
          /* ---------------- VIEW ---------------- */
          <div className="space-y-5 pb-2">
            <div className="space-y-1.5">
              <h2 className="break-words text-[21px] font-bold leading-tight">
                {taskText || "Untitled task"}
              </h2>
              <p className="flex items-center gap-1.5 text-[13px]">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: isCompleted ? SUCCESS : INFO }}
                  aria-hidden="true"
                />
                <span style={{ color: isCompleted ? SUCCESS : undefined }} className={isCompleted ? "" : mutedText}>
                  {isCompleted ? "Completed" : "Incomplete"}
                </span>
                {isCompleted && formattedCompletedDate && (
                  <span className={mutedText}>· {formattedCompletedDate}</span>
                )}
              </p>
            </div>

            {/* Completion lives here and only here. Ticking a task off a
                scrolling list is one mis-tap from marking the wrong thing done,
                and undoing it means finding it again in a view it has just left.
                Pin sits beside it because it is the other thing worth one tap. */}
            <div className="grid grid-cols-2 gap-2">
              <MetaToggle
                icon={<Check className="h-4 w-4" />}
                label="Mark complete"
                activeLabel="Completed"
                active={isCompleted}
                tone={SUCCESS}
                onClick={toggleCompleted}
                disabled={isProcessing}
                isDark={isDark}
              />
              <MetaToggle
                icon={<Pin className={`h-4 w-4 ${isPinned ? "fill-current" : ""}`} />}
                label="Pin"
                activeLabel="Pinned"
                active={isPinned}
                tone={WARNING}
                onClick={togglePinned}
                disabled={isProcessing}
                isDark={isDark}
              />
            </div>

            <div className="space-y-1.5">
              <SectionLabel isDark={isDark}>Due date</SectionLabel>
              {dueLabel ? (
                <DateChip label={dueLabel} overdue={isOverdue} isDark={isDark} />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(true);
                    setDueEditorOpen(true);
                  }}
                  className="flex min-h-[32px] items-center gap-1.5 text-[13px] font-medium"
                  style={{ color: INFO }}
                >
                  <CalendarPlus className="h-4 w-4" />
                  Add due date
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              <SectionLabel isDark={isDark}>Reminder</SectionLabel>
              <p className={`text-[14px] ${reminders.length ? "" : mutedText}`}>
                {describeReminders(reminders)}
              </p>
            </div>

            {taskDescription.trim() && (
              <div className="space-y-1.5">
                <SectionLabel isDark={isDark}>Description</SectionLabel>
                <p className="whitespace-pre-wrap break-words text-[14px] leading-relaxed">
                  {taskDescription}
                </p>
              </div>
            )}

            {/* Text-first relationship rows. Created is deliberately not here —
                it is metadata nobody opened this sheet to read. */}
            <div className={`space-y-0.5 border-t pt-3 ${hairline}`}>
              <InfoRow
                label="Collection"
                value={resolvedCollectionName}
                isDark={isDark}
              />
              <InfoRow label="List" value={listName} isDark={isDark} />
            </div>
          </div>
        ) : (
          /* ---------------- EDIT ---------------- */
          <div className="space-y-5 pb-2">
            <h2 className="text-[17px] font-semibold">Edit task</h2>

            <div className="space-y-1.5">
              <SectionLabel isDark={isDark}>Title</SectionLabel>
              <input
                id="task-name"
                type="text"
                value={taskText}
                onChange={(event) => {
                  setTaskText(event.target.value);
                  if (error === "Task name is required" && event.target.value.trim()) {
                    setError(null);
                  }
                }}
                maxLength={100}
                disabled={isProcessing}
                placeholder="Task name"
                className={`min-h-[48px] w-full rounded-xl border px-3.5 text-[15px] focus:outline-none focus:ring-1 ${fieldClass}`}
                style={{ ["--tw-ring-color" as string]: PRIMARY }}
              />
              <p className={`text-right text-[11px] ${mutedText}`}>
                {taskText.length}/100
              </p>
            </div>

            <div className="space-y-1.5">
              <SectionLabel isDark={isDark}>Description</SectionLabel>
              <textarea
                id="task-description"
                value={taskDescription}
                onChange={(event) => setTaskDescription(event.target.value)}
                maxLength={500}
                disabled={isProcessing}
                placeholder="Add a description (optional)"
                className={`min-h-[104px] w-full rounded-xl border px-3.5 py-3 text-[14px] leading-relaxed focus:outline-none focus:ring-1 ${fieldClass}`}
                style={{ ["--tw-ring-color" as string]: PRIMARY }}
              />
              <p className={`text-right text-[11px] ${mutedText}`}>
                {taskDescription.length}/500
              </p>
            </div>

            <div className="space-y-1.5">
              <SectionLabel isDark={isDark}>Collection</SectionLabel>
              <select
                id="collection-select"
                value={selectedCollection}
                onChange={(event) => setSelectedCollection(event.target.value)}
                disabled={isProcessing}
                className={`min-h-[48px] w-full rounded-xl border px-3 text-[14px] focus:outline-none focus:ring-1 ${fieldClass}`}
                style={{ ["--tw-ring-color" as string]: PRIMARY }}
              >
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.collection_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <SectionLabel isDark={isDark}>Due date</SectionLabel>
              {dueEditorOpen ? (
                <DueDateEditor
                  date={dueDate || null}
                  time={dueTime || null}
                  canClear={Boolean(dueDate)}
                  isDark={isDark}
                  onDone={(nextDate, nextTime) => {
                    setDueDate(nextDate ?? "");
                    setDueTime(nextTime ?? "");
                    setDueEditorOpen(false);
                    // An offset reminder with no due date can never fire, so
                    // clearing the date clears them rather than leaving a chip
                    // lit over nothing. Fixed-time reminders are unaffected.
                    if (!nextDate) {
                      setReminders((current) =>
                        current.filter((reminder) => reminder.kind === "absolute")
                      );
                    }
                  }}
                  onCancel={() => setDueEditorOpen(false)}
                />
              ) : (
                <div className="flex items-center gap-2">
                  {dueLabel ? (
                    <DateChip label={dueLabel} overdue={isOverdue} isDark={isDark} />
                  ) : (
                    <span className={`text-[14px] ${mutedText}`}>Not set</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setDueEditorOpen(true)}
                    className="flex min-h-[32px] items-center gap-1.5 text-[13px] font-medium"
                    style={{ color: INFO }}
                  >
                    {dueLabel ? (
                      <>
                        <Pencil className="h-3.5 w-3.5" />
                        Change
                      </>
                    ) : (
                      <>
                        <CalendarPlus className="h-4 w-4" />
                        Add due date
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <SectionLabel isDark={isDark}>Reminder</SectionLabel>
              <ReminderChips
                reminders={reminders}
                onChange={setReminders}
                dueDateKey={dueDate || null}
                dueAt={dueAt}
                isDark={isDark}
              />
            </div>

            {/* Still here in the form, still writing immediately. Listed in the
                edit fields by the brief, and someone who opened the form to
                change a date should not have to leave it to pin the thing. */}
            <div className="space-y-2">
              <SectionLabel isDark={isDark}>Status</SectionLabel>
              <div className="grid grid-cols-2 gap-2">
                <MetaToggle
                  icon={<Check className="h-4 w-4" />}
                  label="Mark complete"
                  activeLabel="Completed"
                  active={isCompleted}
                  tone={SUCCESS}
                  onClick={toggleCompleted}
                  disabled={isProcessing}
                  isDark={isDark}
                />
                <MetaToggle
                  icon={<Pin className={`h-4 w-4 ${isPinned ? "fill-current" : ""}`} />}
                  label="Pin"
                  activeLabel="Pinned"
                  active={isPinned}
                  tone={WARNING}
                  onClick={togglePinned}
                  disabled={isProcessing}
                  isDark={isDark}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDeleteConfirmation(true)}
              disabled={isProcessing}
              className={`flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border text-[14px] font-medium disabled:opacity-45 ${hairline}`}
              style={{ color: DANGER }}
            >
              <Trash2 className="h-4 w-4" />
              Delete task
            </button>
          </div>
        )}

        {/* Both prompts come through the one component: same shape, same z-index,
            and portalled to the body. The delete dialog used to be a
            `fixed inset-0` child of the sheet, which stopped meaning the viewport
            the moment the panel gained a drag transform. */}
        <ConfirmDialog
          isOpen={showDeleteConfirmation}
          isDark={isDark}
          destructive
          busy={isDeleting}
          title="Delete task"
          message="This cannot be undone and the task will be permanently removed."
          confirmLabel="Delete"
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteConfirmation(false)}
        />

        <ConfirmDialog
          isOpen={pendingDiscard !== null}
          isDark={isDark}
          title="Discard changes?"
          message={
            pendingDiscard === "close"
              ? "You have unsaved changes to this task. Leaving now loses them."
              : "You have unsaved changes to this task. Cancelling loses them."
          }
          confirmLabel="Discard"
          cancelLabel="Keep editing"
          onConfirm={confirmDiscard}
          onCancel={() => setPendingDiscard(null)}
        />
      </div>
    </BottomSheet>
  );
};

export default React.memo(TaskSidebar);
