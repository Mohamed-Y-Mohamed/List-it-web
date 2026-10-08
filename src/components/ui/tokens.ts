// The redesign's palette, in one place.
//
// These are the exact values from the design brief. They were being retyped as
// literals in every file that needed them — `#131A2B` appears in the list cards,
// the collection header, both task cards and the note card — and a hex typed
// eight times is a hex that will eventually disagree with itself.
//
// Hex rather than Tailwind classes on purpose. Half of these are used in `style`
// (a left stripe whose colour is computed, a tint built with a colour-mix) where
// a class name cannot reach, and Tailwind 4's scanner only generates classes it
// can see written out in full.

/** Deep page field. */
export const FIELD = "#0B1222";
/** The darkest ground, behind the field. */
export const DEEP = "#05080F";
/** A raised surface sitting on the field. */
export const RAISED = "#121829";
/** A card. */
export const CARD = "#131A2B";
/** A selected or active surface. */
export const SELECTED = "#1B2440";

export const PRIMARY = "#6366F1";
export const SUCCESS = "#10B981";
export const WARNING = "#F59E0B";
export const INFO = "#38BDF8";
export const DANGER = "#F43F5E";

/** Pinned, and flagged. Distinct on purpose: a yellow and an orange that read
 *  as two different things at a glance rather than two shades of the same. */
export const PINNED = "#FACC15";
export const FLAGGED = "#F97316";

export type TaskStatus = "normal" | "pinned" | "overdue" | "flagged";

/**
 * The label and the colour for each status, in one map.
 *
 * `normal` carries a real colour rather than `transparent`: the legend draws a
 * dot for all four, and a card that does not want a stripe for an ordinary task
 * decides that by checking the status, not by painting nothing.
 */
export const STATUS_META = {
  normal: { label: "", colour: INFO },
  pinned: { label: "Pinned", colour: PINNED },
  flagged: { label: "Flagged", colour: FLAGGED },
  overdue: { label: "Overdue", colour: DANGER },
} satisfies Record<TaskStatus, { label: string; colour: string }>;

/**
 * Which status a task is in.
 *
 * Overdue outranks everything deliberately: a pinned task you have missed is
 * still missed, and that is the thing worth seeing first. Flagged is the rung
 * below — pinned *and* carrying a date, so it is going to come due — and plain
 * pinned below that.
 *
 * Shared by the card in a collection, the card in a default view and the legend
 * that names them, so the three cannot drift. They did: both cards grew their
 * own copy of this map and had already stopped agreeing on `normal`.
 */
export function taskStatus(
  isOverdue: boolean,
  isPinned: boolean,
  isScheduled: boolean,
): TaskStatus {
  if (isOverdue) return "overdue";
  if (isPinned && isScheduled) return "flagged";
  if (isPinned) return "pinned";
  return "normal";
}

/** The stripe down the left of a task card, and the dot beside a status label. */
export function statusColor(
  isOverdue: boolean,
  isPinned: boolean,
  isScheduled = false,
): string {
  return STATUS_META[taskStatus(isOverdue, isPinned, isScheduled)].colour;
}

/**
 * A collection's colour at low strength, for the tint on a detail sheet.
 *
 * The brief asks for a restrained tint rather than a coloured panel, and
 * `color-mix` is how to get one from a stored hex without knowing it in advance:
 * 8% of the collection's colour over the card surface. Supported in the Android
 * WebView from Chrome 111 and in every browser this app targets on the web; the
 * second argument is the plain surface, so a browser that drops the declaration
 * still gets a readable card rather than a transparent one.
 */
export function collectionTint(
  hex: string | null | undefined,
  isDark: boolean,
  strength = 8,
): string {
  const base = isDark ? CARD : "#FFFFFF";
  if (!hex) return base;
  return `color-mix(in srgb, ${hex} ${strength}%, ${base})`;
}
