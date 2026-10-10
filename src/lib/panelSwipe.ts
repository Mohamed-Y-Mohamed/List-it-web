// lib/panelSwipe.ts
// Which tab a sideways drag on a collection's panel is asking for.
//
// Pulled out of the component for one reason: the direction is a sign, and a sign
// is the easiest thing in a gesture to get backwards. Dragging left moves the
// content left, which brings in what sits to the *right* of it — so a negative
// offset means Notes, the tab on the right. Written inline in an `onDragEnd`
// nothing could check that, and getting it inverted would look like a working
// gesture that simply goes the wrong way.
//
// It also carries the thresholds, which are the ones the row swipe this replaces
// used, so every sideways gesture in the app asks for the same movement. See
// NativeOnboarding, which uses the same 56px to change step.

export type PanelTab = "tasks" | "notes";

/**
 * How far a slow drag has to travel to count.
 *
 * Below this a drag is a hesitation or a mis-aimed vertical scroll, and switching
 * tabs under someone who was trying to scroll is worse than ignoring them.
 */
export const SWIPE_DISTANCE_PX = 56;

/**
 * The flick that counts regardless of distance.
 *
 * Without it the gesture feels laborious: a fast swipe is over in a few frames and
 * may never cover 56px, but it is unambiguously a swipe.
 */
export const SWIPE_VELOCITY = 500;

/** The two tabs, left to right, which is what makes the direction meaningful. */
const ORDER: readonly PanelTab[] = ["tasks", "notes"] as const;

/**
 * The tab a drag wants, or null for "stay put".
 *
 * Null covers three different cases deliberately — the drag was too small, it was
 * fast enough but towards an edge with nothing beyond it, or it asked for the tab
 * already showing. All three mean the caller does nothing, so none of them needs
 * telling apart, and collapsing them is what keeps the caller a single `if`.
 */
export function tabForSwipe(
  offsetX: number,
  velocityX: number,
  current: PanelTab,
): PanelTab | null {
  const forward =
    offsetX < -SWIPE_DISTANCE_PX || velocityX < -SWIPE_VELOCITY ? 1 : 0;
  const back =
    offsetX > SWIPE_DISTANCE_PX || velocityX > SWIPE_VELOCITY ? -1 : 0;

  // Both can fire at once: drag well past the threshold one way, then flick back
  // the other before letting go. That is someone changing their mind mid-gesture,
  // and the two signals cancelling to "stay put" is the right answer to it —
  // picking a winner would commit to a tab the user just pulled away from.
  const direction = forward + back;
  if (direction === 0) return null;

  const next = ORDER[ORDER.indexOf(current) + direction];
  return next ?? null;
}
