// lib/listLayout.ts
// How the Lists tab draws its lists: as a grid of cards, or as rows.
//
// Stored per install rather than per account, next to the theme. It describes how
// this phone shows the screen, not anything about the user's data, so it does not
// belong in the `users` row and should not cost a network round trip to read —
// the Lists tab is the first screen after launch and reads this before painting.
// Same reasoning, and the same localStorage home, as the theme in ThemeContext.
//
// Native only in practice: the setting that writes it is inside the native-only
// Appearance section, and the web dashboard has its own layout. Nothing here
// depends on that, so it stays a plain module rather than a gated one.

/**
 * `cards` is the three-column grid the screen has always had. `list` gives each of
 * the user's own lists a full-width row and drops the built-in views to two
 * columns above them.
 */
export type ListLayout = "cards" | "list";

export const DEFAULT_LIST_LAYOUT: ListLayout = "cards";

const STORAGE_KEY = "listit.listLayout";

/**
 * Narrows an unknown stored value to a layout, falling back to the default.
 *
 * Worth being strict about rather than casting: the value comes out of
 * localStorage, which is shared with every other key on the origin and survives
 * app updates. A stale or hand-edited value has to land on a layout the screen can
 * actually render, not be trusted into a `grid-cols-undefined`.
 */
export function parseListLayout(value: unknown): ListLayout {
  return value === "cards" || value === "list" ? value : DEFAULT_LIST_LAYOUT;
}

/**
 * The stored layout, or the default when nothing is stored or storage is barred.
 *
 * Reads are wrapped because localStorage throws rather than returning null when
 * the WebView has site data blocked, and a layout preference is not worth taking
 * the screen down over.
 */
export function readListLayout(): ListLayout {
  if (typeof window === "undefined") return DEFAULT_LIST_LAYOUT;

  try {
    return parseListLayout(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return DEFAULT_LIST_LAYOUT;
  }
}

/** Records the choice. Silent on failure, for the same reason reads are. */
export function writeListLayout(layout: ListLayout): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, layout);
  } catch {
    // The choice then lasts for this session only, which is a better outcome
    // than the setting refusing to move.
  }
}
