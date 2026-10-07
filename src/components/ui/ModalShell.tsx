"use client";

// The container every create and edit dialog sits in.
//
// On the phone it is anchored to the bottom with rounded top corners, which is
// the shape the brief asks for and the shape Android users expect from a form
// raised over a screen. On the web it is a centred modal. Same markup, different
// alignment — not two components.
//
// Two things in here were bought the hard way:
//
//   * The bottom padding is a `max()` floor, not the raw inset. Android reports
//     `--safe-bottom` as 0 on a device with no bottom cutout even when the
//     three-button navigation bar is drawn over the page, so trusting the inset
//     alone put Create and Cancel underneath it.
//   * The overlay must not use the `p-4` shorthand on native. It sets
//     padding-bottom as well, and whether it or the longhand in
//     `native-dialog-scroll` wins comes down to which Tailwind emits last — so
//     the floor that clears the navigation bar was being silently replaced by
//     1rem. The card's own side margin supplies the gutter instead.
//
// Portalled to the body: these open from inside list and collection views that
// carry drag and scale transforms, and a transformed ancestor becomes the
// containing block for `position: fixed`, which clips the overlay to the card
// that opened it.

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { IS_NATIVE_BUILD } from "@/lib/platform";
import { CARD } from "./tokens";

export default function ModalShell({
  isOpen,
  onClose,
  title,
  isDark,
  /** False while a write is in flight, so a stray backdrop tap cannot abandon it. */
  canClose = true,
  footer,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  isDark: boolean;
  canClose?: boolean;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = React.useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && canClose) onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, canClose, onClose]);

  if (!mounted || !isOpen) return null;

  const surface = isDark ? CARD : "#FFFFFF";
  const hairline = isDark ? "border-white/[0.08]" : "border-black/[0.06]";

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[70] bg-black/60"
        onClick={canClose ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        className={`fixed inset-0 z-[71] flex justify-center ${
          IS_NATIVE_BUILD ? "items-end" : "items-center p-4"
        }`}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className={`pointer-events-auto flex max-h-[92dvh] w-full flex-col border shadow-2xl ${hairline} ${
            IS_NATIVE_BUILD
              ? "rounded-t-[22px]"
              : "mx-4 max-w-md rounded-2xl"
          }`}
          style={{ backgroundColor: surface }}
        >
          <div
            className={`flex shrink-0 items-center justify-between border-b px-5 py-3.5 ${hairline}`}
          >
            <h2
              className={`text-[16px] font-semibold ${
                isDark ? "text-gray-100" : "text-gray-900"
              }`}
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={canClose ? onClose : undefined}
              disabled={!canClose}
              aria-label="Close"
              className={`-mr-1 flex h-9 w-9 items-center justify-center rounded-full disabled:opacity-40 ${
                isDark
                  ? "text-gray-400 active:bg-white/10"
                  : "text-gray-500 active:bg-black/5"
              }`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4"
            style={{ paddingBottom: "calc(var(--keyboard-offset, 0px) + 0.5rem)" }}
          >
            {children}
          </div>

          {footer && (
            <div
              className={`shrink-0 border-t px-5 pt-3 ${hairline}`}
              style={{
                paddingBottom:
                  "max(1rem, calc(var(--safe-bottom) + 0.75rem + var(--keyboard-offset, 0px)))",
              }}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}
