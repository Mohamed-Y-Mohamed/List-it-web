"use client";

// Context menu shown after a long press, standing in for SwiftUI's `.contextMenu`.
//
// Appears anchored near the finger, scales up from that point the way iOS does,
// and dims the rest of the screen. Destructive items are tinted red to match the
// `role: .destructive` styling in the iOS app.

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";

export interface ContextMenuItem {
  label: string;
  icon: React.ReactNode;
  onSelect: () => void;
  destructive?: boolean;
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
            {items.map((item, index) => (
              <button
                key={item.label}
                role="menuitem"
                type="button"
                onClick={() => {
                  onClose();
                  item.onSelect();
                }}
                className={`flex w-full items-center justify-between px-4 py-3 text-left text-[15px] transition-colors ${
                  index > 0
                    ? isDark
                      ? "border-t border-white/10"
                      : "border-t border-black/5"
                    : ""
                } ${
                  item.destructive
                    ? "text-red-500 active:bg-red-500/10"
                    : isDark
                      ? "text-white active:bg-white/10"
                      : "text-gray-900 active:bg-black/5"
                }`}
              >
                <span>{item.label}</span>
                <span className="shrink-0 opacity-90">{item.icon}</span>
              </button>
            ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
