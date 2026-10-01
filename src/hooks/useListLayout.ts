"use client";

// Reads and writes the Lists tab layout preference.
//
// `layout` is null until the stored value has been read, and callers are expected
// to render their loading state while it is. That is deliberate rather than
// defensive: the alternative is seeding state with the default and correcting it in
// an effect, which paints one frame of the three-column grid before flipping to
// rows for anyone who chose rows. Seeding from localStorage inside the initialiser
// would avoid the flash but not the cause — this is a static export, so the
// prerendered HTML always says "cards" and a different first client render is a
// hydration mismatch.
//
// No context and no cross-tab syncing. NativeTransition keys the screen on the
// pathname, so Settings and the Lists tab are never mounted at the same time:
// changing the setting and walking back to the Lists tab remounts it, and the read
// below runs again. If the two ever do end up on screen together, this needs a
// provider.

import { useCallback, useEffect, useState } from "react";
import {
  readListLayout,
  writeListLayout,
  type ListLayout,
} from "@/lib/listLayout";

export function useListLayout(): {
  /** null while the stored value is still being read. */
  layout: ListLayout | null;
  setLayout: (next: ListLayout) => void;
} {
  const [layout, setLayoutState] = useState<ListLayout | null>(null);

  useEffect(() => {
    setLayoutState(readListLayout());
  }, []);

  const setLayout = useCallback((next: ListLayout) => {
    // Reflected immediately; the write is not something to wait on, and the
    // control that calls this is under the user's finger.
    setLayoutState(next);
    writeListLayout(next);
  }, []);

  return { layout, setLayout };
}
