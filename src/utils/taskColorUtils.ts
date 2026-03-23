// utils/taskColorUtils.ts
// Deterministic Tailwind color helpers derived from a collection ID string.
// Both helpers hash the collection ID so the same collection always gets the
// same colour, and different collections get visually distinct colours.

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
