"use client";

// The privacy policy as a sheet, for the two places you meet it inside the
// product: the consent checkbox on sign-up, and the row in Settings.
//
// ModalShell rather than a dialog of its own. It already solves the four things
// this needs and none of them are obvious:
//
//   * portals to the body, so opening from inside a transformed ancestor does
//     not clip the overlay to the card that opened it;
//   * registers with pushOverlay, so Android's back button closes the sheet
//     instead of popping the screen underneath it;
//   * bottom-sheet on native, centred modal on web, from the same markup;
//   * a safe-area floor on the scrolling body, so the last paragraph clears the
//     navigation bar on a device that reports no bottom inset.
//
// A long document rather than a form, so no footer is passed — ModalShell's
// footerless branch puts the safe-area floor on the body itself, which is what
// a scrolling document wants.

import React from "react";
import ModalShell from "@/components/ui/ModalShell";
import PolicyDocument from "./PolicyDocument";

export default function PolicyModal({
  isOpen,
  onClose,
  isDark,
}: {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}) {
  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Privacy Policy"
      isDark={isDark}
    >
      <PolicyDocument isDark={isDark} />
    </ModalShell>
  );
}
