"use client";

// The background behind every full page of the app, web and native, in one place.
//
// It is a flat field, and it is the same field the sign-in screen paints — the
// values are `--splash-bg`'s, #ffffff and #111827 — so the launcher icon, the
// splash, the first-run intro, the door into the app and every room beyond it are
// one continuous surface rather than a sequence of different coloured screens.
//
// ---------------------------------------------------------------------------
// What this replaces
//
// Eleven hand-written five-stop diagonal gradients, each with two radial overlays
// on pseudo-elements, one per screen and no two alike: the Lists tab was slate,
// Today was green, Completed was blue, Settings was a third blue, the list detail a
// fourth, Dashboard a fifth, and Completed carried a *sixth* on its loading path. A
// tint per screen reads as a different app per screen, and nothing about which
// green belonged to Today was ever written down.
//
// ---------------------------------------------------------------------------
// Why not var(--splash-bg) directly
//
// That token is defined against `prefers-color-scheme`, deliberately: it has to
// resolve on the first paint with no JavaScript, before ThemeProvider has read
// localStorage, or a dark launch flashes white. The app's own theme is a `.dark`
// class that the toggle controls, and the two disagree for anyone who sets the app
// against their system setting. Binding the app's surface to the system would paint
// a white field under white-on-dark text for exactly those people.
//
// So this reads the theme the rest of the app reads, and carries the same two
// values. In the ordinary case, where the theme follows the system, it resolves to
// the identical colour.
//
// Positioned absolutely at -z-10, so it needs a `relative` parent.

import React from "react";

export default function AppSurface() {
  // No longer branches on the theme. `--surface-field` already carries the field
  // for the current theme *and* the background chosen in Settings, and the inline
  // script in layout.tsx sets it before the first paint — so reading the variable
  // is both simpler and earlier than reading the context was.
  return (
    <div className="absolute inset-0 -z-10 size-full bg-[var(--surface-field)]" />
  );
}
