// The surfaces the public pages paint on.
//
// The marketing pages had drifted a long way from the app. Between the landing
// page and About Us there were nine separately hand-written gradients — browns
// and oranges like #2a1810, #1a0f12, #2d1b20 — none of which appear anywhere in
// the product, each with its own radial tint on top. Someone arriving from the
// App Store met one design and then signed in to a different one.
//
// These are the Stage 1 values the app itself ships (`ui/tokens`), expressed as
// CSS custom properties so a page sets them once on its root and every section
// below reads them. Same approach as the sidebar, and for the same reason:
// hard-coding a surface per section is how nine of them happened.
//
// Deliberately CSS variables rather than Tailwind classes. Half of these are
// used in `style` for gradient stops and colour-mix, where a class name cannot
// reach, and Tailwind 4 only generates classes it can see written out in full.
//
// Web-only in practice: the native app never loads these routes — `src/app/page.tsx`
// redirects to /landingpage only when `isPWAStandalone()` is false. Nothing here
// is imported by a shared layout, so none of it reaches the native bundle.

import { CARD, DEEP, FIELD, PRIMARY, RAISED, SELECTED } from "./tokens";

export interface PublicSurface {
  /** The page ground. */
  field: string;
  /** A band that steps away from the ground, for alternating sections. */
  band: string;
  /** A card sitting on either of the above. */
  card: string;
  /** A card raised a step further, for the one element meant to draw the eye. */
  raised: string;
  border: string;
  divider: string;
  text: string;
  /** Body copy. Dimmer than `text`, still comfortably readable on the field. */
  body: string;
  /** Labels and captions. */
  muted: string;
}

export const PUBLIC_DARK: PublicSurface = {
  field: FIELD,
  band: DEEP,
  card: CARD,
  raised: RAISED,
  border: "rgba(255,255,255,0.08)",
  divider: "rgba(255,255,255,0.06)",
  text: "#F1F5F9",
  body: "#A9B4CA",
  muted: "#7C89A4",
};

export const PUBLIC_LIGHT: PublicSurface = {
  field: "#FFFFFF",
  band: "#F6F8FC",
  card: "#FFFFFF",
  raised: "#F1F5F9",
  border: "rgba(15,23,42,0.09)",
  divider: "rgba(15,23,42,0.06)",
  text: "#0F172A",
  body: "#475569",
  muted: "#64748B",
};

export const publicSurface = (isDark: boolean): PublicSurface =>
  isDark ? PUBLIC_DARK : PUBLIC_LIGHT;

/**
 * The palette as custom properties, set once on a page root.
 *
 * `--ps-selected` and `--ps-primary` come straight from the app's tokens so a
 * primary button on the landing page is the same indigo as the one inside the
 * product.
 */
export function publicVars(s: PublicSurface): React.CSSProperties {
  return {
    "--ps-field": s.field,
    "--ps-band": s.band,
    "--ps-card": s.card,
    "--ps-raised": s.raised,
    "--ps-border": s.border,
    "--ps-divider": s.divider,
    "--ps-text": s.text,
    "--ps-body": s.body,
    "--ps-muted": s.muted,
    "--ps-primary": PRIMARY,
    "--ps-selected": SELECTED,
  } as React.CSSProperties;
}
