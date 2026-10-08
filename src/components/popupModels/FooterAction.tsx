"use client";

// One of the compact actions pinned to the foot of a detail sheet.
//
// Icon above label, not beside it. Three of these sit in a row on a phone, and
// side-by-side icon and text put "Mark as Completed" over two lines at that
// width — which is what the Pin/Complete pair was doing before, and why the row
// read as ragged. Stacking gives every column the same height whatever the
// label, so the row lines up without any of them being truncated.
//
// `active` is the on-state — ticked, pinned — not a hover or a press. Delete
// never has one.

import React from "react";

export default function FooterAction({
  icon,
  label,
  active,
  activeClass,
  idleClass,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  /** Applied when the action is on. */
  activeClass: string;
  /** Applied the rest of the time. */
  idleClass: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      // min-h-[56px] rather than padding alone: the labels differ in length and
      // a one-word column would otherwise come out shorter than its neighbours.
      className={`flex min-h-[56px] w-full flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-center transition-colors disabled:opacity-50 ${
        active ? activeClass : idleClass
      }`}
    >
      {icon}
      <span className="text-[11px] font-medium leading-tight">{label}</span>
    </button>
  );
}
