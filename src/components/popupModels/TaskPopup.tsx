"use client";

// Create Task.
//
// Same fields as the edit form, in the same order, using the same calendar and
// the same reminder chips — a create form that looks nothing like the edit form
// makes people learn the app twice. There is no task colour here and never will
// be: a task takes its colour from its collection, which is the whole reason
// collections have one.
//
// Everything below the title is optional and says so by being empty rather than
// by carrying a disclaimer. The only validation is that a task needs a name.

import React, { useState, useRef, useEffect, useCallback } from "react";
import { AlertCircle, CalendarPlus, Check, Pencil, Pin } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Collection } from "@/types/schema";
import { composeDue, dueMoment, type Reminder } from "@/lib/reminders";
import ModalShell from "@/components/ui/ModalShell";
import SectionLabel from "@/components/ui/SectionLabel";
import MetaToggle from "@/components/ui/MetaToggle";
import DateChip from "@/components/ui/DateChip";
import DueDateEditor from "@/components/ui/DueDateEditor";
import ReminderChips from "@/components/ui/ReminderChips";
import { formatDateKey } from "@/components/ui/MiniCalendar";
import { DANGER, INFO, PRIMARY, WARNING } from "@/components/ui/tokens";

interface SubmissionResult {
  success: boolean;
  error?: unknown;
}

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: {
    text: string;
    description: string;
    is_pinned: boolean;
    due_date?: Date;
    due_has_time?: boolean;
    reminders?: Reminder[] | null;
    collection_id?: string;
  }) => Promise<SubmissionResult> | void;
  collections: Collection[];
  selectedCollectionId?: string;
}

const CreateTaskModal = ({
  isOpen,
  onClose,
  onSubmit,
  collections,
  selectedCollectionId: initialCollectionId,
}: CreateTaskModalProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [taskName, setTaskName] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [dueDate, setDueDate] = useState<string>("");
  // Blank means due that day without a particular moment, which is the behaviour
  // every task created before times existed already has.
  const [dueTime, setDueTime] = useState<string>("");
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");
  const [dueEditorOpen, setDueEditorOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const composed = composeDue(dueDate, dueTime);
  const dueAt = composed
    ? dueMoment({ due_date: composed.due, due_has_time: composed.hasTime })
    : null;

  const defaultCollection = collections.find((c) => c.is_default);

  useEffect(() => {
    if (!isOpen) return;

    if (initialCollectionId) setSelectedCollectionId(initialCollectionId);
    else if (defaultCollection?.id)
      setSelectedCollectionId(defaultCollection.id);
    else if (collections.length > 0) setSelectedCollectionId(collections[0].id);
    else setSelectedCollectionId("");

    const focus = setTimeout(() => inputRef.current?.focus(), 120);
    return () => clearTimeout(focus);
  }, [isOpen, initialCollectionId, defaultCollection, collections]);

  // Reset on close. Without this the next task created in the same session
  // inherits the last one's reminders without the form ever showing them.
  useEffect(() => {
    if (isOpen) return;
    setTaskName("");
    setTaskDescription("");
    setIsPinned(false);
    setDueDate("");
    setDueTime("");
    setReminders([]);
    setSelectedCollectionId("");
    setDueEditorOpen(false);
    setError(null);
    setIsSubmitting(false);
  }, [isOpen]);

  useEffect(
    () => () => {
      if (errorTimer.current) clearTimeout(errorTimer.current);
    },
    [],
  );

  const showError = useCallback((message: string) => {
    setError(message);
    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setError(null), 5000);
  }, []);

  const getCollectionId = useCallback((): string | undefined => {
    if (selectedCollectionId) return selectedCollectionId;
    if (defaultCollection?.id) return defaultCollection.id;
    if (collections.length > 0) return collections[0].id;
    return undefined;
  }, [selectedCollectionId, defaultCollection, collections]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!taskName.trim()) {
      showError("Task name is required");
      return;
    }
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await onSubmit({
        text: taskName.trim(),
        description: taskDescription.trim(),
        is_pinned: isPinned,
        due_date: composed?.due,
        due_has_time: composed?.hasTime ?? false,
        reminders: reminders.length > 0 ? reminders : null,
        collection_id: getCollectionId(),
      });

      if (result && !result.success) {
        throw new Error(
          result.error ? String(result.error) : "Failed to create task",
        );
      }
      onClose();
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Failed to create task");
      setIsSubmitting(false);
    }
  };

  const dueLabel = dueDate ? formatDateKey(dueDate, dueTime || null) : null;

  const mutedText = isDark ? "text-gray-400" : "text-gray-500";
  const fieldClass = isDark
    ? "border-white/[0.08] bg-white/[0.04] text-gray-100 placeholder:text-gray-600"
    : "border-black/[0.08] bg-white text-gray-900 placeholder:text-gray-400";

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="New task"
      isDark={isDark}
      canClose={!isSubmitting}
      footer={
        <div className="space-y-2">
          <button
            type="submit"
            form="create-task-form"
            disabled={isSubmitting || !taskName.trim()}
            className="min-h-[48px] w-full rounded-2xl text-[15px] font-semibold text-white transition-opacity active:opacity-85 disabled:opacity-45"
            style={{ backgroundColor: PRIMARY }}
          >
            {isSubmitting ? "Creating..." : "Create task"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
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

      <form id="create-task-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <SectionLabel isDark={isDark}>
            Title <span style={{ color: DANGER }}>*</span>
          </SectionLabel>
          <input
            ref={inputRef}
            id="task-name"
            type="text"
            value={taskName}
            onChange={(event) => setTaskName(event.target.value)}
            maxLength={100}
            disabled={isSubmitting}
            placeholder="What needs doing?"
            className={`min-h-[48px] w-full rounded-xl border px-3.5 text-[15px] focus:outline-none focus:ring-1 ${fieldClass}`}
            style={{ ["--tw-ring-color" as string]: PRIMARY }}
          />
          <p className={`text-right text-[11px] ${mutedText}`}>
            {taskName.length}/100
          </p>
        </div>

        <div className="space-y-1.5">
          <SectionLabel isDark={isDark}>Description</SectionLabel>
          <textarea
            id="task-description"
            value={taskDescription}
            onChange={(event) => setTaskDescription(event.target.value)}
            maxLength={500}
            disabled={isSubmitting}
            placeholder="Add a description (optional)"
            className={`min-h-[88px] w-full rounded-xl border px-3.5 py-3 text-[14px] leading-relaxed focus:outline-none focus:ring-1 ${fieldClass}`}
            style={{ ["--tw-ring-color" as string]: PRIMARY }}
          />
          <p className={`text-right text-[11px] ${mutedText}`}>
            {taskDescription.length}/500
          </p>
        </div>

        {collections.length > 0 && (
          <div className="space-y-1.5">
            <SectionLabel isDark={isDark}>Collection</SectionLabel>
            <select
              value={selectedCollectionId}
              onChange={(event) => setSelectedCollectionId(event.target.value)}
              disabled={isSubmitting}
              className={`min-h-[48px] w-full rounded-xl border px-3 text-[14px] focus:outline-none focus:ring-1 ${fieldClass}`}
              style={{ ["--tw-ring-color" as string]: PRIMARY }}
            >
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.collection_name || "Unnamed collection"}
                </option>
              ))}
            </select>
          </div>
        )}

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
                // An offset reminder with no due date can never fire.
                if (!nextDate) {
                  setReminders((current) =>
                    current.filter((reminder) => reminder.kind === "absolute"),
                  );
                }
              }}
              onCancel={() => setDueEditorOpen(false)}
            />
          ) : (
            <div className="flex items-center gap-2">
              {dueLabel ? (
                <DateChip label={dueLabel} isDark={isDark} />
              ) : (
                <span className={`text-[14px] ${mutedText}`}>No date</span>
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

        <div className="space-y-2">
          <SectionLabel isDark={isDark}>Pin</SectionLabel>
          <MetaToggle
            icon={
              <Pin className={`h-4 w-4 ${isPinned ? "fill-current" : ""}`} />
            }
            label="Pin this task"
            activeLabel="Pinned"
            active={isPinned}
            tone={WARNING}
            onClick={() => setIsPinned((pinned) => !pinned)}
            disabled={isSubmitting}
            isDark={isDark}
            className="w-full"
          />
          {isPinned && (
            <p
              className="flex items-center gap-1.5 text-[11px]"
              style={{ color: WARNING }}
            >
              <Check className="h-3 w-3" />
              Pinned tasks sort to the top of their collection.
            </p>
          )}
        </div>
      </form>
    </ModalShell>
  );
};

export default React.memo(CreateTaskModal);
