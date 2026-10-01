// utils/taskColorUtils.ts
// Deterministic Tailwind colour classes derived from a collection ID string.
// Every helper hashes the collection ID so the same collection always gets the
// same colour, and different collections get visually distinct colours.
//
// Tasks are the one entity with no colour column of their own, which is why this
// exists at all.
//
// ---------------------------------------------------------------------------
// Why this file lists every variant out longhand
//
// The palettes used to hold only the `border-*` and `text-*` forms, and call
// sites derived the rest at runtime:
//
//     getBorderColor().replace("border-", "bg-").replace("-500", "-500/20")
//
// Tailwind v4 generates utilities by **scanning source text**. It cannot see a
// class name assembled from fragments at runtime, so those derived names were
// never emitted into the stylesheet. Checked against the shipped bundle:
// `bg-pink-500`, `bg-cyan-500`, `bg-amber-500` and all eight `bg-*-500/20`
// variants were absent, along with `bg-gray-300/50`. The few that did work only
// did so because something unrelated elsewhere in the app happened to use the
// same literal.
//
// The visible effect was that a task card's hover glow rendered for 2 of the 10
// palette slots and its hover dot for 7 of 10 — and which slot a collection lands
// in depends on the character sum of its UUID, so it looked random and differed
// from user to user. That is the "some of the colours are not working" report.
//
// So each entry now spells out every form it needs. Verbose on purpose: a
// safelist would also fix it, but it would hide the coupling and let the next
// `.replace()` slip through unnoticed.
// ---------------------------------------------------------------------------

/** Every class form a task card needs for one hue. All literal, all scannable. */
export interface TaskPalette {
  /** Card border. */
  border: string;
  /** Icon and tag text. */
  text: string;
  /** Solid fill, for the small hover dot. */
  bg: string;
  /** Translucent fill, for the card's hover glow. */
  bgSoft: string;
}

const PALETTES: readonly TaskPalette[] = [
  {
    border: "border-blue-500",
    text: "text-blue-500",
    bg: "bg-blue-500",
    bgSoft: "bg-blue-500/20",
  },
  {
    border: "border-emerald-500",
    text: "text-emerald-500",
    bg: "bg-emerald-500",
    bgSoft: "bg-emerald-500/20",
  },
  {
    border: "border-purple-500",
    text: "text-purple-500",
    bg: "bg-purple-500",
    bgSoft: "bg-purple-500/20",
  },
  {
    border: "border-orange-500",
    text: "text-orange-500",
    bg: "bg-orange-500",
    bgSoft: "bg-orange-500/20",
  },
  {
    border: "border-pink-500",
    text: "text-pink-500",
    bg: "bg-pink-500",
    bgSoft: "bg-pink-500/20",
  },
  {
    border: "border-indigo-500",
    text: "text-indigo-500",
    bg: "bg-indigo-500",
    bgSoft: "bg-indigo-500/20",
  },
  {
    border: "border-teal-500",
    text: "text-teal-500",
    bg: "bg-teal-500",
    bgSoft: "bg-teal-500/20",
  },
  {
    border: "border-cyan-500",
    text: "text-cyan-500",
    bg: "bg-cyan-500",
    bgSoft: "bg-cyan-500/20",
  },
  {
    border: "border-amber-500",
    text: "text-amber-500",
    bg: "bg-amber-500",
    bgSoft: "bg-amber-500/20",
  },
  {
    border: "border-red-500",
    text: "text-red-500",
    bg: "bg-red-500",
    bgSoft: "bg-red-500/20",
  },
] as const;

/** Used when a task has no collection, so there is nothing to hash. */
const NEUTRAL_DARK: TaskPalette = {
  border: "border-gray-700/50",
  text: "text-orange-400",
  bg: "bg-gray-700/50",
  bgSoft: "bg-gray-700/20",
};

const NEUTRAL_LIGHT: TaskPalette = {
  border: "border-gray-300/50",
  text: "text-orange-500",
  bg: "bg-gray-300/50",
  bgSoft: "bg-gray-300/20",
};

/** Hash a collection ID to a 0-based index within a palette array. */
const hashId = (id: string, length: number): number =>
  id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % length;

/**
 * The full set of classes for a task card, from its collection ID.
 *
 * Prefer this over the two single-value helpers below: reading `.bg` and
 * `.bgSoft` from here is what stops call sites reaching for `.replace()`.
 */
export const getTaskPalette = (
  collectionId: string | null | undefined,
  isDark: boolean
): TaskPalette => {
  if (!collectionId) return isDark ? NEUTRAL_DARK : NEUTRAL_LIGHT;
  return PALETTES[hashId(collectionId, PALETTES.length)];
};

/**
 * Return the Tailwind border-color class for a task card based on its
 * collection ID.  Falls back to a neutral border when no collection is set.
 */
export const getTaskBorderColor = (
  collectionId: string | null | undefined,
  isDark: boolean
): string => getTaskPalette(collectionId, isDark).border;

/**
 * Return the Tailwind text-color class for accents (folder icon, etc.) based
 * on the collection ID.  Falls back to orange when no collection is set.
 */
export const getTaskAccentColor = (
  collectionId: string | null | undefined,
  isDark: boolean
): string => getTaskPalette(collectionId, isDark).text;
