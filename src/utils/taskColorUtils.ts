// utils/taskColorUtils.ts
// Deterministic Tailwind color helpers derived from a collection ID string.
// Both helpers hash the collection ID so the same collection always gets the
// same colour, and different collections get visually distinct colours.
//
// NOTE: All class names must appear as complete string literals here so that
// Tailwind's JIT compiler can detect and include them in the output bundle.
// Never build class names via string concatenation or `.replace()` elsewhere.

const BORDER_COLORS = [
  "border-blue-500",
  "border-emerald-500",
  "border-purple-500",
  "border-orange-500",
  "border-pink-500",
  "border-indigo-500",
  "border-teal-500",
  "border-cyan-500",
  "border-amber-500",
  "border-red-500",
] as const;

const ACCENT_COLORS = [
  "text-blue-500",
  "text-emerald-500",
  "text-purple-500",
  "text-orange-500",
  "text-pink-500",
  "text-indigo-500",
  "text-teal-500",
  "text-cyan-500",
  "text-amber-500",
  "text-red-500",
] as const;

/**
 * Background-color classes that correspond 1-to-1 with BORDER_COLORS.
 * Used for hover glow overlays on task cards.
 */
const BG_GLOW_COLORS = [
  "bg-blue-500/20",
  "bg-emerald-500/20",
  "bg-purple-500/20",
  "bg-orange-500/20",
  "bg-pink-500/20",
  "bg-indigo-500/20",
  "bg-teal-500/20",
  "bg-cyan-500/20",
  "bg-amber-500/20",
  "bg-red-500/20",
] as const;

/**
 * Solid background-color classes that correspond 1-to-1 with BORDER_COLORS.
 * Used for hover indicator dots on task cards.
 */
const BG_SOLID_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-amber-500",
  "bg-red-500",
] as const;

/** Hash a collection ID to a 0-based index within a palette array. */
const hashId = (id: string, length: number): number =>
  id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % length;

/**
 * Return the Tailwind border-color class for a task card based on its
 * collection ID.  Falls back to a neutral border when no collection is set.
 */
export const getTaskBorderColor = (
  collectionId: string | null | undefined,
  isDark: boolean
): string => {
  if (!collectionId)
    return isDark ? "border-gray-700/50" : "border-gray-300/50";
  return BORDER_COLORS[hashId(collectionId, BORDER_COLORS.length)];
};

/**
 * Return the Tailwind text-color class for accents (folder icon, etc.) based
 * on the collection ID.  Falls back to orange when no collection is set.
 */
export const getTaskAccentColor = (
  collectionId: string | null | undefined,
  isDark: boolean
): string => {
  if (!collectionId) return isDark ? "text-orange-400" : "text-orange-500";
  return ACCENT_COLORS[hashId(collectionId, ACCENT_COLORS.length)];
};

/**
 * Return the Tailwind bg-color/20 class used for the hover glow overlay on
 * task cards.  Falls back to a neutral value when no collection is set.
 * Use this instead of deriving the class from getTaskBorderColor via .replace().
 */
export const getTaskBgGlowColor = (
  collectionId: string | null | undefined,
  isDark: boolean
): string => {
  if (!collectionId)
    return isDark ? "bg-gray-700/20" : "bg-gray-300/20";
  return BG_GLOW_COLORS[hashId(collectionId, BG_GLOW_COLORS.length)];
};

/**
 * Return the solid Tailwind bg-color class used for the hover indicator dot
 * on task cards.  Falls back to a neutral value when no collection is set.
 * Use this instead of deriving the class from getTaskBorderColor via .replace().
 */
export const getTaskBgSolidColor = (
  collectionId: string | null | undefined,
  isDark: boolean
): string => {
  if (!collectionId)
    return isDark ? "bg-gray-700" : "bg-gray-300";
  return BG_SOLID_COLORS[hashId(collectionId, BG_SOLID_COLORS.length)];
};
