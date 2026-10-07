"use client";

// The app's own "are you sure?".
//
// Two things brought this into existence.
//
// The discard prompts were `window.confirm`. That draws Android's system dialog
// — different type, different buttons, the package name in the corner — in the
// middle of a sheet that is otherwise entirely the app's own. It also blocks the
// WebView's main thread while it is up.
//
// The delete prompts were already custom, but they were `position: fixed` inside
// the detail sheet, and the sheet's panel now carries a framer `transform` to
// drag it. A transformed ancestor becomes the containing block for a fixed
// child, so `inset-0` stopped meaning the viewport and started meaning the
// panel — and the panel's `overflow-hidden` clipped whatever hung outside it.
// Portalling to the body is what makes a dialog mean the screen again.
//
// So both now come through here: one shape, one z-index, one place to change.

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive = false,
  busy = false,
  isDark,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Red confirm button and a warning mark, for anything that cannot be undone. */
  destructive?: boolean;
  /** Keeps the dialog up and the buttons inert while the action runs. */
  busy?: boolean;
  isDark: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Escape cancels, matching every other dismissible surface in the app. Bound
  // only while open so this is not sitting on the window for each closed sheet.
  useEffect(() => {
    if (!isOpen || busy) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, busy, onCancel]);

  if (!mounted || !isOpen) return null;

  const surface = isDark ? "bg-gray-800" : "bg-white";
  const bodyText = isDark ? "text-gray-300" : "text-gray-600";
  const headingText = isDark ? "text-gray-100" : "text-gray-900";
  const neutralButton = isDark
    ? "bg-gray-700 text-gray-200 active:bg-gray-600"
    : "bg-gray-200 text-gray-700 active:bg-gray-300";

  return createPortal(
    // Above the sheet (z-50) and anything it contains.
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-black/70"
        onClick={busy ? undefined : onCancel}
        aria-hidden="true"
      />

      <div
        className={`relative w-full max-w-sm rounded-2xl p-6 shadow-2xl ${surface} animate-scaleIn`}
      >
        <div className="mb-4 flex items-center gap-3">
          {destructive && (
            <div className="rounded-full bg-red-500/15 p-2">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
          )}
          <h3 className={`text-lg font-semibold ${headingText}`}>{title}</h3>
        </div>

        <p className={`mb-6 text-sm leading-relaxed ${bodyText}`}>{message}</p>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className={`min-h-[44px] rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${neutralButton}`}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`flex min-h-[44px] min-w-[96px] items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-60 ${
              destructive
                ? "bg-red-600 active:bg-red-700"
                : "bg-orange-600 active:bg-orange-700"
            }`}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
