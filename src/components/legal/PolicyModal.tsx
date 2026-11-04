"use client";

// The privacy policy as a sheet, for the two places you meet it inside the
// product: the consent checkbox on sign-up, and the row in Settings.
//
// ModalShell rather than a dialog of its own: it portals to the body, is a bottom
// sheet on a phone and a centred modal on wider screens, and keeps the last
// paragraph clear of the home indicator.

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
