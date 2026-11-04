// components/AppDataProvider.tsx
// The signed-in user's data, fetched once and kept across navigation.
//
// Holds the profile, lists, open undeleted tasks and live notes, plus collections
// per list as screens load them. Screens read from here instead of each owning a
// fetch, so moving between pages does not refetch and re-spin. Mutations update
// the cache optimistically and call `refresh` when they need the server's truth.

"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/apiFetch";
import type { Collection, List, Note, Task, User } from "@/types/schema";

interface AppDataValue {
  /**
   * The signed-in user's row in the `users` table.
   *
   * The account's name lives here, not in `auth.user_metadata`. Both carry a
   * `full_name` and the two drift — Settings only ever wrote the table — so the
   * table is the source of truth and the one every screen reads. The iOS app
   * reads the same row. Null until the first fetch settles, or if it fails.
   */
  profile: User | null;

  lists: List[];
  /** The user's open, undeleted tasks. */
  tasks: Task[];
  /** The user's live notes. */
  notes: Note[];

  /**
   * True until the first fetch settles, and never true again.
   *
   * A later refresh sets `isRefreshing` instead. That distinction is load-bearing:
   * useDueTodayNotifications is handed this as its `loaded` flag, and an empty
   * `tasks` means "not fetched yet" before the first load and "nothing open"
   * after it. If a background refresh could flip this back to true, a reminder
   * for a task the user had just ticked off would survive the resync.
   */
  isLoading: boolean;
  /** True while a revalidation is in flight over data already on screen. */
  isRefreshing: boolean;

  /** Refetch everything. Call after a mutation. */
  refresh: () => Promise<void>;

  /**
   * Apply an optimistic change to the cached lists, for a mutation that should
   * show immediately — pinning, or removing a row the user just deleted.
   */
  setLists: React.Dispatch<React.SetStateAction<List[]>>;

  /** Cached collections for a list, or undefined if it has not been opened yet. */
  getCollections: (listId: string) => Collection[] | undefined;
  /**
   * Record the collections for a list, so returning to it is instant.
   *
   * There is deliberately no `invalidate` counterpart. Every mutation on the list
   * screen bumps its refresh trigger, which refetches the collections and calls
   * this — so the stale entry is always overwritten rather than removed and
   * refilled.
   */
  putCollections: (listId: string, collections: Collection[]) => void;
}

const AppDataContext = createContext<AppDataValue | null>(null);

export default function AppDataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  const [profile, setProfile] = useState<User | null>(null);
  const [lists, setLists] = useState<List[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [collectionsByList, setCollectionsByList] = useState<
    Record<string, Collection[]>
  >({});

  // Guards the in-flight fetch so a resume event landing mid-load, or two screens
  // asking at once, cannot start a second identical round of requests.
  const inFlight = useRef<Promise<void> | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    if (inFlight.current) return inFlight.current;

    const run = (async () => {
      try {
        // Parallel, as NativeHome already did. The three are independent and
        // serialising them was never necessary.
        const [profileRes, listsRes, tasksRes, notesRes] = await Promise.all([
          apiFetch("/api/user/profile"),
          apiFetch("/api/lists"),
          apiFetch("/api/tasks?is_deleted=false&is_completed=false"),
          apiFetch("/api/notes?is_deleted=false"),
        ]);

        // Each applied independently: one failing request should not discard the
        // two that succeeded, and whatever is already cached stays on screen.
        if (profileRes.ok) setProfile((await profileRes.json()).data ?? null);
        if (listsRes.ok) setLists((await listsRes.json()).data ?? []);
        if (tasksRes.ok) setTasks((await tasksRes.json()).data ?? []);
        if (notesRes.ok) setNotes((await notesRes.json()).data ?? []);
      } catch (error) {
        console.error("Error loading app data:", error);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        inFlight.current = null;
      }
    })();

    inFlight.current = run;
    return run;
  }, [user]);

  // The launch fetch. This is the whole point: by the time the user taps a list,
  // its tasks and notes are already here.
  useEffect(() => {
    void load();
  }, [load]);

  // Signing out and back in as someone else must not leave the previous account's
  // rows on screen.
  const userId = user?.id ?? null;
  const previousUserId = useRef(userId);
  useEffect(() => {
    if (previousUserId.current === userId) return;
    previousUserId.current = userId;

    setProfile(null);
    setLists([]);
    setTasks([]);
    setNotes([]);
    setCollectionsByList({});
    setIsLoading(true);
  }, [userId]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await load();
  }, [load]);

  // Coming back to the tab is when the data is most likely stale — edited
  // on another device, or the clock has rolled past midnight and the due-today
  // views mean something different now.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  const getCollections = useCallback(
    (listId: string) => collectionsByList[listId],
    [collectionsByList],
  );

  const putCollections = useCallback((listId: string, next: Collection[]) => {
    setCollectionsByList((previous) => ({ ...previous, [listId]: next }));
  }, []);

  const value = useMemo<AppDataValue>(
    () => ({
      profile,
      lists,
      tasks,
      notes,
      isLoading,
      isRefreshing,
      refresh,
      setLists,
      getCollections,
      putCollections,
    }),
    [
      profile,
      lists,
      tasks,
      notes,
      isLoading,
      isRefreshing,
      refresh,
      getCollections,
      putCollections,
    ],
  );

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

/**
 * The cached app data. Throws outside the provider, which is mounted by the
 * signed-in layout, so a misplaced call fails loudly instead of rendering empty.
 */
export function useAppData(): AppDataValue {
  const value = useContext(AppDataContext);
  if (!value) {
    throw new Error(
      "useAppData must be used inside AppDataProvider (mounted by the signed-in layout).",
    );
  }
  return value;
}

/**
 * The cached data if a provider is mounted, or null.
 *
 * For components that can render outside the signed-in layout and must keep
 * working without the cache.
 */
export function useOptionalAppData(): AppDataValue | null {
  return useContext(AppDataContext);
}
