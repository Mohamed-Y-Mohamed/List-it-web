"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  animate,
  AnimatePresence,
  motion,
  useDragControls,
  useMotionValue,
  type PanInfo,
} from "framer-motion";
import { pushOverlay } from "@/lib/overlayStack";

/**
 * MOBILE
 * -------
 * The existing draggable bottom-sheet behaviour is preserved.
 *
 * DESKTOP / WEB
 * -------------
 * At Tailwind's md breakpoint (768px+) the content becomes a
 * full-height inspector attached to the right side of the viewport.
 *
 * The desktop panel is deliberately a separate element from the
 * mobile sheet. This prevents the mobile y/drag state from affecting
 * desktop positioning.
 *
 * ONLY ONE OF THE TWO IS EVER MOUNTED
 * -----------------------------------
 * Both shells used to render, with CSS hiding the inactive one. That
 * mounts `children` twice: two copies of the task or note form, so
 * duplicate element ids (every `<label htmlFor>` resolved to the
 * hidden copy), refs where the last writer won, and every effect and
 * fetch inside the form running twice per open. The breakpoint is
 * therefore resolved in JS and only the matching shell is rendered.
 * The md: classes are kept as a second line of defence.
 */

/**
 * There is one stop, and the sheet opens at it.
 *
 * There used to be two — a half-height rest and a full one, the web equivalent
 * of SwiftUI's `.presentationDetents([.medium, .large])`. The medium detent is
 * gone from the iOS app and gone from here: the task and note sheets are long
 * enough that half a viewport showed the title and little else, so every visit
 * began with a drag before anything could be read. The list behind it was never
 * worth the half screen it cost.
 *
 * So the panel is `h-[90dvh]` and rests at y=0. Dragging down still dismisses —
 * that is the gesture people reach for and the only one left — but it no longer
 * has a second stop to catch on, which is also why `atFullStop` and the padding
 * that compensated for it have gone with it.
 */
const DESKTOP_QUERY = "(min-width: 768px)";

const DISMISS_SLOP = 90;
const DISMISS_VELOCITY = 900;

const SPRING = {
  type: "spring" as const,
  stiffness: 420,
  damping: 40,
};

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;

  /** Accessible name for the dialog. */
  label: string;

  isDark: boolean;

  /** Prevent closing while a save/update is running. */
  canClose?: boolean;

  /**
   * Pinned action area.
   *
   * TaskSidebar and NoteSidebar can continue passing their existing
   * footer without knowing whether this is mobile or desktop.
   */
  footer?: React.ReactNode;

  /**
   * Optional collection-colour surface.
   *
   * TaskSidebar already passes its collection tint through this prop.
   * It is used by both the mobile sheet and desktop inspector.
   */
  surfaceColor?: string;

  children: React.ReactNode;
}

export default function BottomSheet({
  isOpen,
  onClose,
  label,
  isDark,
  canClose = true,
  footer,
  surfaceColor,
  children,
}: BottomSheetProps) {
  const mobilePanelRef = useRef<HTMLDivElement>(null);

  const dragControls = useDragControls();

  /**
   * MOBILE ONLY.
   *
   * y=0 is the fully expanded mobile position.
   * Positive y values move the sheet down the screen.
   */
  const y = useMotionValue(0);

  const [panelHeight, setPanelHeight] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  const hasEntered = useRef(false);

  // ------------------------------------------------------------
  // Mount / portal safety, and which shell to render
  // ------------------------------------------------------------

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_QUERY);

    const sync = () => setIsDesktop(media.matches);

    // Both pieces of state are set in the one effect so they land in the same
    // render. Resolving the breakpoint separately would show the mobile sheet
    // for a frame on desktop and remount the form underneath it.
    sync();
    setMounted(true);

    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  // ------------------------------------------------------------
  // Modal behaviour shared by both shells
  // ------------------------------------------------------------

  useEffect(() => {
    if (!isOpen) return;

    // The panel is `aria-modal`, so Escape has to dismiss it. The backdrop was
    // the only way out, which leaves keyboard users stuck in the dialog.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && canClose) {
        onClose();
      }
    };

    // Without this the list behind keeps scrolling once the sheet's own content
    // reaches its end, so the page quietly moves under an open form.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, canClose, onClose]);

  // Android back is Escape's counterpart here too. Without it, back on an open
  // task sheet closed the sheet and popped the list out from behind it.
  useEffect(() => {
    if (!isOpen) return;
    return pushOverlay(() => {
      if (canClose) onClose();
    });
  }, [isOpen, canClose, onClose]);

  // ------------------------------------------------------------
  // Mobile sheet measurement
  // ------------------------------------------------------------

  useEffect(() => {
    if (!isOpen) return;

    const measure = () => {
      const height = mobilePanelRef.current?.offsetHeight ?? 0;

      /**
       * On desktop the mobile element is display:none, so its height
       * will be zero. That is expected and can simply be ignored.
       */
      if (!height) return;

      setPanelHeight(height);
    };

    /**
     * Wait one frame so the portal/mobile element has had a chance
     * to enter the DOM before measuring it.
     */
    const frame = window.requestAnimationFrame(measure);

    window.addEventListener("resize", measure);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
    };
  }, [isOpen, mounted]);

  // ------------------------------------------------------------
  // Mobile entrance
  // ------------------------------------------------------------

  useEffect(() => {
    if (!isOpen) {
      hasEntered.current = false;
      return;
    }

    if (!panelHeight || hasEntered.current) {
      return;
    }

    hasEntered.current = true;

    /**
     * Begin below the visible viewport.
     */
    y.set(panelHeight);

    /**
     * Settle at the one stop there is.
     */
    animate(y, 0, SPRING);
  }, [isOpen, panelHeight, y]);

  // ------------------------------------------------------------
  // Mobile dragging
  // ------------------------------------------------------------

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const current = y.get();
    const velocity = info.velocity.y;

    /**
     * Pull far enough down, or flick down quickly enough, and dismiss.
     *
     * Measured from y=0 rather than from a half stop, since there is no longer
     * one to pass through on the way out.
     */
    if (canClose && (current > DISMISS_SLOP || velocity > DISMISS_VELOCITY)) {
      onClose();
      return;
    }

    /** Anything short of that springs back to the top. */
    animate(y, 0, SPRING);
  };

  if (!mounted) {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label={label}
        >
          {/* ==================================================
              SHARED BACKDROP
             ================================================== */}

          <motion.button
            type="button"
            tabIndex={-1}
            aria-label={`Close ${label}`}
            className="
              absolute
              inset-0
              h-full
              w-full
              cursor-default
              border-0
              bg-black/60
              p-0
            "
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              if (canClose) {
                onClose();
              }
            }}
          />

          {/* ==================================================
              DESKTOP WEB

              Hidden by default.
              md:flex makes it exist visually only from 768px up.

              This is NOT draggable and does not use the mobile
              y motion value.

              Rendered only on desktop: see the note at the top of
              the file about mounting `children` twice.
             ================================================== */}

          {isDesktop && (
            <motion.div
              className={`
              absolute
              right-0
              top-0
              z-10

              hidden
              h-dvh
              w-[440px]
              max-w-[45vw]

              overflow-hidden
              border-l
              shadow-2xl

              md:flex
              md:flex-col

              ${isDark ? "border-white/10" : "border-black/10"}
            `}
              initial={{
                x: "100%",
              }}
              animate={{
                x: 0,
              }}
              exit={{
                x: "100%",
              }}
              transition={SPRING}
            >
              {/* Desktop surface / collection colour */}

              <div
                className={`
                absolute
                inset-0

                ${!surfaceColor ? "bg-[var(--surface-field)]" : ""}
              `}
                style={
                  surfaceColor
                    ? {
                        backgroundColor: surfaceColor,
                      }
                    : undefined
                }
                aria-hidden="true"
              />

              {/* Desktop layout */}

              <div
                className="
                relative
                z-10
                flex
                min-h-0
                w-full
                flex-1
                flex-col
              "
              >
                {/* Scrollable details/edit form */}

                <div
                  className="
                  min-h-0
                  flex-1
                  overflow-y-auto
                  overscroll-contain
                "
                >
                  {children}
                </div>

                {/* Fixed desktop actions */}

                {footer && (
                  <div
                    className={`
                    shrink-0
                    border-t
                    px-6
                    pb-4
                    pt-3

                    ${isDark ? "border-white/10" : "border-black/10"}
                  `}
                  >
                    {footer}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ==================================================
              MOBILE

              md:hidden guarantees this element disappears once
              the viewport reaches the desktop breakpoint.

              This keeps your existing draggable bottom sheet.
             ================================================== */}

          {!isDesktop && (
            <motion.div
              ref={mobilePanelRef}
              className="
              absolute
              inset-x-0
              bottom-0
              z-10

              h-[90dvh]

              overflow-hidden
              rounded-t-[22px]
              shadow-2xl

              md:hidden
            "
              style={{
                y,
              }}
              exit={{
                y: panelHeight || 1000,
              }}
              transition={SPRING}
              drag="y"
              dragListener={false}
              dragControls={dragControls}
              // Down is 1:1 and runs the height of the panel, so a dismissing
              // drag carries the sheet out under the finger rather than
              // rubber-banding against a stop that no longer exists. Up is
              // pinned at the single resting position.
              dragConstraints={{
                top: 0,
                bottom: panelHeight || 1000,
              }}
              dragElastic={{
                top: 0,
                bottom: 0,
              }}
              dragMomentum={false}
              onDragEnd={handleDragEnd}
            >
              {/* Mobile surface / collection colour. Solid at every stop — it
                  used to ramp its opacity with the drag, which meant the screen
                  behind read through the sheet at the resting height. */}

              <div
                className={`
                absolute
                inset-0

                ${!surfaceColor ? "bg-[var(--surface-field)]" : ""}
              `}
                style={surfaceColor ? { backgroundColor: surfaceColor } : undefined}
                aria-hidden="true"
              />

              {/* Mobile layout */}

              <div
                className="
                relative
                z-10
                flex
                h-full
                flex-col
              "
                // Just the device inset now. The second term was the half stop's
                // compensation — the panel is taller than its resting height, so
                // the slack below had to be padded out or the footer sat off
                // screen. With one stop there is no slack.
                style={{ paddingBottom: "var(--safe-bottom, 0px)" }}
              >
                {/* Mobile drag handle */}

                <div
                  onPointerDown={(event) => {
                    dragControls.start(event);
                  }}
                  className="
                  flex
                  shrink-0
                  cursor-grab
                  touch-none
                  justify-center
                  py-3

                  active:cursor-grabbing
                "
                  aria-hidden="true"
                >
                  <div
                    className={`
                    h-1.5
                    w-11
                    rounded-full

                    ${isDark ? "bg-white/25" : "bg-black/20"}
                  `}
                  />
                </div>

                {/* Mobile scrolling content */}

                <div
                  className="
                  min-h-0
                  flex-1
                  overflow-y-auto
                  overscroll-contain
                "
                  style={{
                    paddingBottom:
                      "calc(var(--keyboard-offset, 0px) + 1.25rem)",
                  }}
                >
                  {children}
                </div>

                {/* Mobile fixed footer */}

                {footer && (
                  <div
                    className={`
                    shrink-0
                    border-t
                    px-6
                    pt-3

                    ${isDark ? "border-white/10" : "border-black/10"}
                  `}
                    style={{
                      paddingBottom:
                        "calc(var(--keyboard-offset, 0px) + 0.75rem)",
                    }}
                  >
                    {footer}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
