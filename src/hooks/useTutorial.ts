"use client";

// Decides whether the in-app tutorial should be on screen, and closes it.
//
// Kept out of the overlay component so the layout can ask the question without
// mounting the tutorial's markup, and so the answer survives the overlay
// unmounting itself.

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { IS_NATIVE_BUILD } from "@/lib/platform";
import { fetchTutorialSeen, markTutorialSeen } from "@/lib/tutorial";

export function useTutorial(): {
  shouldShow: boolean;
  dismiss: () => void;
} {
  const { user, loading } = useAuth();
  const [shouldShow, setShouldShow] = useState(false);

  // The id, not the user object. The provider hands back a new object on every
  // token refresh, and re-running the effect on each one would put the tutorial
  // back up mid-session for anyone who had just skipped it.
  const userId = user?.id;

  useEffect(() => {
    // IS_NATIVE_BUILD folds to a literal false in the web build, so this returns
    // before anything else and the profile request is never made there.
    //
    // It is a gate, not an elimination: the tutorial's code still ships inside
    // the secure layout's chunk on web, because the import keeps it reachable to
    // the bundler even once the branch is statically dead. A few KB of unread
    // strings is not worth a dynamic import to chase, but do not read this line
    // as a promise that the web bundle is free of it.
    if (!IS_NATIVE_BUILD) return;
    if (loading || !userId) return;

    let cancelled = false;

    (async () => {
      const seen = await fetchTutorialSeen();
      // The user can sign out or navigate away while the profile is in flight.
      if (!cancelled && !seen) setShouldShow(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, loading]);

  const dismiss = useCallback(() => {
    // Close first, save second. The write is not worth a spinner over, and the
    // local half of markTutorialSeen is synchronous anyway.
    setShouldShow(false);
    void markTutorialSeen();
  }, []);

  return { shouldShow, dismiss };
}
