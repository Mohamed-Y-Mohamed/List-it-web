"use client";

// The app's background, in one place.
//
// Every native screen paints this same field: the Lists tab, a list's detail, the
// six built-in views, Progress and Settings. It used to be copy-pasted per screen
// — and had already drifted, with the Lists tab on a flat colour and DashboardView
// carrying a second, purple variant on its loading and error paths.
//
// Rendered once behind the whole secure shell rather than per page, which also
// fixes a subtler problem. (secure)/layout wraps each screen in a div carrying
// `pt-safe-top` and `pb-tab-bar`. That padding sits *outside* any background the
// page itself draws, so the top and bottom strips showed the bare `html` colour
// (#111827 in dark mode) against a gradient that ends in #000000 — the "different
// colour at the end" when a screen was scrolled to the bottom. A backdrop on the
// wrapper covers its own padding, so no strip can be left bare no matter what a
// page does.
//
// Positioned absolutely at -z-10, so it needs a `relative` parent.
//
// Native only.

import React from "react";
import { useTheme } from "@/context/ThemeContext";

export default function NativeSurface() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return isDark ? (
    <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(45deg,#000000_0%,#0a0c0f_20%,#141619_40%,#0f1114_70%,#000000_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.15)_0%,transparent_60%)] after:absolute after:inset-0 after:[background:radial-gradient(ellipse_at_top_right,rgba(147,197,253,0.08)_0%,transparent_50%)] before:content-[''] after:content-['']" />
  ) : (
    <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(45deg,#f8fafc_0%,#f1f5f9_25%,#e2e8f0_50%,#f3f4f6_75%,#ffffff_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.08)_0%,transparent_60%)] after:absolute after:inset-0 after:[background:radial-gradient(ellipse_at_top_right,rgba(147,197,253,0.06)_0%,transparent_50%)] before:content-[''] after:content-['']" />
  );
}
