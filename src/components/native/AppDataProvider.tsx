"use client";

// The app's data, fetched once at launch and kept across navigation.
//
// ---------------------------------------------------------------------------
// The problem this solves
//
// There was no client-side cache of any kind: no SWR, no react-query, no store.
// Every screen owned a `useState` and a `useEffect` that fetched from scratch.
// That would be survivable on its own, but NativeTransition re-keys its subtree on
// the pathname, so React unmounts the entire previous screen on every tab switch
// and every back press. All fetched state went with it, and the destination screen
// started from an empty array and a spinner — every single time.
//
// So opening a list, going back, and opening it again refetched everything twice,
// and each of those fetches costs two upstream round trips before any data is read
// (requireAuth verifies the JWT with Supabase Auth per request). The visible
// result was the reported "clicking a List takes some time to load" and "there's a
// small loading between switching pages".
//
// This provider sits *above* NativeTransition in (secure)/layout.tsx, so it is not
// re-keyed and its state survives navigation. Screens read from it instead of
// fetching, and the launch pays for the data once.
//
// ---------------------------------------------------------------------------
// Scope, deliberately
//
// It holds exactly what NativeHome was already fetching: the user's lists, their
// open undeleted tasks, and their live notes. That is not an arbitrary choice —
// those three queries also cover the list detail screen, because tasks and notes
// both carry `list_id` and the filters match (`is_deleted=false`,
// `is_completed=false`) exactly. So a list can be rendered from cache with no
// request at all, and only its collections need fetching.
//
// Collections are cached per list as they are visited, since there is no one query
// that returns them all with the same shape the screen wants.
//
// Native only. The web app keeps its per-screen fetching untouched — this
// component is rendered solely inside the `isNative` arm of (secure)/layout.tsx.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/apiFetch";
import { isNativeApp } from "@/lib/platform";
import type { Collection, List, Note, Task } from "@/types/schema";
import { useTaskReminders } from "@/hooks/useTaskReminders";

interface AppDataValue {
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
        const [listsRes, tasksRes, notesRes] = await Promise.all([
          apiFetch("/api/lists"),
          apiFetch("/api/tasks?is_deleted=false&is_completed=false"),
          apiFetch("/api/notes?is_deleted=false"),
        ]);

        // Each applied independently: one failing request should not discard the
        // two that succeeded, and whatever is already cached stays on screen.
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

  // Coming back to the foreground is when the data is most likely stale — edited
  // on another device, or the clock has rolled past midnight and the due-today
  // views mean something different now.
  useEffect(() => {
    if (!isNativeApp()) return;

    const listener = CapacitorApp.addListener("resume", () => {
      void refresh();
    });

    return () => {
      listener.then((handle) => handle.remove()).catch(() => {});
    };
  }, [refresh]);

  const getCollections = useCallback(
    (listId: string) => collectionsByList[listId],
    [collectionsByList],
  );

  const putCollections = useCallback((listId: string, next: Collection[]) => {
    setCollectionsByList((previous) => ({ ...previous, [listId]: next }));
  }, []);

  // Reminder scheduling lives here rather than on a screen.
  //
  // It used to run from NativeHome, which meant nothing was rescheduled unless
  // the Lists tab happened to be mounted: edit a reminder from inside a list and
  // walk away, and the stale one was still the one queued. This provider holds
  // every task and sits above NativeTransition, so it runs wherever the user is.
  //
  // `!isLoading` is the loaded flag. An empty `tasks` means "not fetched yet"
  // before the first load and "nothing to remind about" after it, and only the
  // second of those should cancel anything.
  useTaskReminders(tasks, !isLoading);

  // No reminder-tap listener here. NativeShell already registers one, and it
  // is the better of the two: it falls back to /today when the payload has no
  // list. A second listener meant one tap ran both a push and a replace on the
  // same router, which left a junk history entry and raced over the result.

  const value = useMemo<AppDataValue>(
    () => ({
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
 * The cached app data. Throws off-native, where no provider is mounted — which is
 * intentional: it turns "this component was rendered on the web by mistake" into
 * an immediate, obvious failure rather than a silent empty screen.
 */
export function useAppData(): AppDataValue {
  const value = useContext(AppDataContext);
  if (!value) {
    throw new Error(
      "useAppData must be used inside AppDataProvider, which is mounted only in " +
        "the native shell. Guard the call site with IS_NATIVE_BUILD.",
    );
  }
  return value;
}

/**
 * The cached data if a provider is mounted, or null.
 *
 * For components shared with the web — ListDetailView — which want to read the
 * cache on native but must keep working without it. Calling a hook conditionally
 * is not allowed, so those files call this unconditionally and branch on the
 * result.
 */
export function useOptionalAppData(): AppDataValue | null {
  return useContext(AppDataContext);
}
