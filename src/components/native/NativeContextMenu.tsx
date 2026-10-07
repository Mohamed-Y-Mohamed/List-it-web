"use client";

// Context menu shown after a long press, standing in for SwiftUI's `.contextMenu`.
//
// Appears anchored near the finger, scales up from that point the way iOS does,
// and dims the rest of the screen. Destructive items are tinted red to match the
// `role: .destructive` styling in the iOS app.

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export interface ContextMenuItem {
  label: string;
  icon: React.ReactNode;
  /** Omitted on a row that only opens a submenu. */
  onSelect?: () => void;
  destructive?: boolean;
  /**
   * Turns the row into an expander: tapping it reveals these in place rather
   * than opening a second surface.
   *
   * Move-to-collection is the case this exists for. A nested sheet on top of a
   * menu on top of a list is two dismissals deep for picking one name, and the
   * list is short enough to sit inside the menu it was opened from.
   */
  submenu?: SubmenuEntry[];
  /**
   * Draws a heavier rule above this row.
   *
   * For a menu holding two different kinds of thing — how the lists are sorted,
   * and where else you can go — where the ordinary hairline between every row
   * is not enough to say they are separate groups.
   */
  startsGroup?: boolean;
}

export interface SubmenuEntry {
  label: string;
  /** A colour dot, so collections read the way they do everywhere else. */
  swatch?: string | null;
  onSelect: () => void;
}

interface NativeContextMenuProps {
  /** Press position in viewport coordinates, or null when closed. */
  origin: { x: number; y: number } | null;
  items: ContextMenuItem[];
  onClose: () => void;
}

const MENU_WIDTH = 230;
const VIEWPORT_MARGIN = 12;

export default function NativeContextMenu({
  origin,
  items,
  onClose,
}: NativeContextMenuProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  /** Which row is expanded, by label. One at a time. */
  const [expanded, setExpanded] = useState<string | null>(null);

  // A fresh press starts collapsed, otherwise the menu reopens mid-submenu.
  useEffect(() => {
    if (!origin) setExpanded(null);
  }, [origin]);

  // Keep the menu on screen: flip it above the finger when there is not enough
  // room below, and pull it inside the horizontal margins.
  useLayoutEffect(() => {
    if (!origin) return;

    const height = menuRef.current?.offsetHeight ?? items.length * 48 + 16;
    const { innerWidth, innerHeight } = window;

    const left = Math.min(
      Math.max(origin.x - MENU_WIDTH / 2, VIEWPORT_MARGIN),
      innerWidth - MENU_WIDTH - VIEWPORT_MARGIN
    );

    const fitsBelow = origin.y + 12 + height < innerHeight - VIEWPORT_MARGIN;
    const top = fitsBelow
      ? origin.y + 12
      : Math.max(origin.y - height - 12, VIEWPORT_MARGIN);

    setPosition({ top, left });
  }, [origin, items.length]);

  // Escape closes it, for keyboard and for debugging in a desktop browser.
  useEffect(() => {
    if (!origin) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [origin, onClose]);

  return (
    <AnimatePresence>
      {origin && (
        <>
          <motion.div
            className="fixed inset-0 z-[70] bg-black/25"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            ref={menuRef}
            role="menu"
            className={`fixed z-[71] overflow-hidden rounded-[14px] shadow-2xl backdrop-blur-xl ${
              isDark ? "bg-gray-800/95" : "bg-white/95"
            }`}
            style={{ top: position.top, left: position.left, width: MENU_WIDTH }}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 500, damping: 32 }}
          >
            {items.map((item, index) => {
              const isOpen = expanded === item.label;
              const divider = item.startsGroup
                ? isDark
                  ? "border-t-[6px] border-black/40"
                  : "border-t-[6px] border-black/10"
                : index > 0
                  ? isDark
                    ? "border-t border-white/10"
                    : "border-t border-black/5"
                  : "";

              return (
                <div key={item.label} className={divider}>
                  <button
                    role="menuitem"
                    type="button"
                    aria-expanded={item.submenu ? isOpen : undefined}
                    onClick={() => {
                      if (item.submenu) {
                        setExpanded(isOpen ? null : item.label);
                        return;
                      }
                      onClose();
                      item.onSelect?.();
                    }}
                    className={`flex w-full items-center justify-between px-4 py-3 text-left text-[15px] transition-colors ${
                      item.destructive
                        ? "text-red-500 active:bg-red-500/10"
                        : isDark
                          ? "text-white active:bg-white/10"
                          : "text-gray-900 active:bg-black/5"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      <span className="opacity-90">{item.icon}</span>
                      {/* A row that opens has to say so. The chevron is its own
                          mark rather than a rotation of the item's icon: turning
                          a sort glyph on its side reads as a different sort, not
                          as "there is more under here". Points right while shut,
                          down while open. */}
                      {item.submenu && (
                        <ChevronRight
                          size={16}
                          className={`opacity-60 transition-transform duration-200 ${
                            isOpen ? "rotate-90" : ""
                          }`}
                        />
                      )}
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {item.submenu && isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        // Capped and scrollable: someone with twenty collections
                        // would otherwise push the menu off the screen it was
                        // just carefully positioned inside.
                        className="overflow-hidden"
                      >
                        <div
                          className={`max-h-56 overflow-y-auto overscroll-contain ${
                            isDark ? "bg-black/20" : "bg-black/5"
                          }`}
                        >
                          {item.submenu.length === 0 ? (
                            <p
                              className={`px-4 py-3 text-[13px] ${
                                isDark ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              Nowhere else to move it.
                            </p>
                          ) : (
                            item.submenu.map((entry) => (
                              <button
                                key={entry.label}
                                role="menuitem"
                                type="button"
                                onClick={() => {
                                  onClose();
                                  entry.onSelect();
                                }}
                                // min-h-[44px]: these sit directly under a thumb.
                                className={`flex min-h-[44px] w-full items-center gap-3 py-2.5 pl-8 pr-4 text-left text-[14px] transition-colors ${
                                  isDark
                                    ? "text-white active:bg-white/10"
                                    : "text-gray-900 active:bg-black/5"
                                }`}
                              >
                                {/* The dot belongs to things that have a colour —
                                    collections do, a sort order does not. */}
                                {entry.swatch !== undefined && (
                                  <span
                                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                                    style={{ backgroundColor: entry.swatch || "#fb923c" }}
                                  />
                                )}
                                <span className="truncate">{entry.label}</span>
                              </button>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
