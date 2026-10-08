// lib/overlayStack.ts
// Which overlays are open, so the Android back button dismisses one instead of
// leaving the screen underneath it.
//
// NativeShell's `backButton` handler only ever knew about routes: it checked
// whether the path was a tab root and otherwise called `router.back()`. With a
// dialog open that popped the whole screen — pressing back on a task's detail
// sheet closed the sheet *and* the list behind it, which is not what back means
// anywhere on Android. Every ModalShell dialog and every BottomSheet had it.
//
// A module-level stack rather than context: the back handler is registered once
// in an effect that deliberately does not re-run on navigation (re-registering
// leaves a window with no handler, during which back closes the app), so it
// cannot read React state. A plain array it can consult at call time can.
//
// Last in, first out, because that is the order they are stacked on screen — a
// confirm raised over a form has to be the one that closes.

type Dismiss = () => void;

const stack: Dismiss[] = [];

/**
 * Registers an open overlay. Returns the matching unregister, so the caller can
 * hand it straight back from a `useEffect`.
 *
 * Unregistering removes this exact entry rather than popping the end: overlays do
 * not always close in the order they opened, and splicing by identity keeps the
 * stack honest when they do not.
 */
export function pushOverlay(dismiss: Dismiss): () => void {
  stack.push(dismiss);

  return () => {
    const index = stack.lastIndexOf(dismiss);
    if (index !== -1) stack.splice(index, 1);
  };
}

/**
 * Dismisses the topmost overlay. Returns true when one was open, which is the
 * caller's signal to stop — back has been spent.
 *
 * True is returned even when the overlay refuses to close. An overlay says no
 * while a write is in flight, and the right answer to back during a save is to do
 * nothing at all, certainly not to navigate away from it.
 */
export function dismissTopOverlay(): boolean {
  const dismiss = stack[stack.length - 1];
  if (!dismiss) return false;

  dismiss();
  return true;
}
