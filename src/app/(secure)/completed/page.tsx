"use client";

// Completed: what you finished, newest day first.
//
// A port of CompletedView from the published iOS app, which this screen had
// drifted a long way from. What was here: an "Overall Progress" panel with a
// motivational message, a sideways-scrolling strip of date cards on desktop, a
// second vertical layout on mobile, and a search that matched task titles. Four
// layouts and a progress bar to answer one question — what did I get done? —
// and none of them was the one the iOS app answers it with.
//
// What the Swift actually does, and what this now does:
//
//   * one layout, phone and desktop
//   * a list filter as a capsule menu: All Lists, then each list, ticked
//   * search matches the *collection* name, not the task title — the prompt
//     says "Search Collections" and that is what it searches
//   * tasks grouped by the day they were finished, newest day first
//   * each day headed Today / Yesterday / the weekday and date, and "N completed"
//   * a timeline down the left: a ring in the parent list's colour, joined by a
//     hairline, which is what makes a day read as a sequence rather than a pile
//   * "X% Done" in the corner — completed over everything not deleted
//   * undo, but only on something finished today
//
// Undo writes through `applyCompletion`, the same decision `useTaskActions`,
// `ListDetailView` and the task sheet write through, so the four cannot drift —
// `completionWiring.test.ts` asserts that by reading the source.

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, ChevronDown, RotateCcw, Search } from "lucide-react";
import { format, isToday } from "date-fns";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { apiFetch } from "@/lib/apiFetch";
import { applyCompletion } from "@/lib/completion";
import { isUsableHex } from "@/lib/colors";
import { useOptionalAppData } from "@/components/native/AppDataProvider";
import AppSurface from "@/components/AppSurface";
import { SkeletonTaskList } from "@/components/ui/Skeleton";
import { SUCCESS } from "@/components/ui/tokens";
import { dayTitle, startOfLocalDay } from "@/utils/dateUtils";
import type { Collection, List, Task } from "@/types/schema";

/** A day's worth of finished work. */
interface CompletedDay {
  date: Date;
  tasks: Task[];
}

/**
 * Midnight on the day a task was finished. iOS groups on exactly this.
 *
 * `startOfLocalDay` and `dayTitle` are shared with Overdue, which groups the
 * same way on the day a task was *due*. Two screens showing a column of dated
 * groups have to name a day identically, so neither owns the rule.
 */
function completionDay(task: Task): Date {
  return (
    startOfLocalDay(task.date_completed ?? task.created_at) ?? new Date(0)
  );
}

export default function CompletedPage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === "dark";

  // Null off-native, where no provider is mounted. Undo refreshes it so the rest
  // of the app sees a task that has come back.
  const appData = useOptionalAppData();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [lists, setLists] = useState<List[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [openCount, setOpenCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [searchText, setSearchText] = useState("");
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [listMenuOpen, setListMenuOpen] = useState(false);
  const [undoing, setUndoing] = useState<string | null>(null);

  // Three parallel calls through `apiFetch`, like AppDataProvider's launch
  // fetch. This screen used to query Supabase directly from the client, which
  // the route handlers' own header says not to do — and its "total tasks" count
  // was not scoped to the user at all, leaning entirely on RLS to be correct.
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    (async () => {
      try {
        const [doneRes, openRes, listsRes, collectionsRes] = await Promise.all([
          apiFetch("/api/tasks?is_deleted=false&is_completed=true"),
          apiFetch("/api/tasks?is_deleted=false&is_completed=false"),
          apiFetch("/api/lists"),
          apiFetch("/api/collections"),
        ]);

        if (cancelled) return;

        // Applied independently: one failing request should not discard the
        // others, same rule the shared cache follows.
        if (doneRes.ok) setTasks((await doneRes.json()).data ?? []);
        if (openRes.ok) setOpenCount(((await openRes.json()).data ?? []).length);
        if (listsRes.ok) setLists((await listsRes.json()).data ?? []);
        if (collectionsRes.ok)
          setCollections((await collectionsRes.json()).data ?? []);
      } catch (error) {
        console.error("Error loading completed tasks:", error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const listById = useMemo(
    () => new Map(lists.map((list) => [list.id, list])),
    [lists],
  );
  const collectionById = useMemo(
    () => new Map(collections.map((collection) => [collection.id, collection])),
    [collections],
  );

  /**
   * Completed over everything that is not deleted — iOS `completionPercentage`.
   *
   * The open count is fetched rather than derived, because this screen only
   * holds the completed half and a percentage of itself would always be 100.
   */
  const percentComplete = useMemo(() => {
    const total = tasks.length + openCount;
    return total === 0 ? 0 : Math.round((tasks.length / total) * 100);
  }, [tasks.length, openCount]);

  const selectedListTitle = selectedListId
    ? (listById.get(selectedListId)?.list_name ?? "All Lists")
    : "All Lists";

  const groupedDays = useMemo<CompletedDay[]>(() => {
    let filtered = tasks;

    if (selectedListId) {
      filtered = filtered.filter((task) => task.list_id === selectedListId);
    }

    // The collection name, not the task title. See the header note — the Swift's
    // prompt says "Search Collections" and the predicate matches it.
    const query = searchText.trim().toLowerCase();
    if (query) {
      filtered = filtered.filter((task) =>
        (collectionById.get(task.collection_id ?? "")?.collection_name ?? "")
          .toLowerCase()
          .includes(query),
      );
    }

    const byDay = new Map<number, Task[]>();
    for (const task of filtered) {
      const key = completionDay(task).getTime();
      const bucket = byDay.get(key);
      if (bucket) bucket.push(task);
      else byDay.set(key, [task]);
    }

    return [...byDay.entries()]
      // Newest day first. The old screen sorted ascending, so the first thing
      // on a long-running account was whatever it finished months ago.
      .sort((a, b) => b[0] - a[0])
      .map(([key, dayTasks]) => ({
        date: new Date(key),
        tasks: dayTasks.sort(
          (a, b) =>
            new Date(b.date_completed ?? b.created_at).getTime() -
            new Date(a.date_completed ?? a.created_at).getTime(),
        ),
      }));
  }, [tasks, selectedListId, searchText, collectionById]);

  /**
   * Put a task back where it came from.
   *
   * Only offered on something finished today — iOS `canUndo` — because this is
   * a correction for a mis-tap, not a way to reopen last month's work. Nothing
   * is moved: clearing `is_completed` is all it takes for the task to reappear
   * in its own collection, which is where it has been the whole time.
   */
  const undo = useCallback(
    async (task: Task) => {
      setUndoing(task.id);
      try {
        const patch = applyCompletion(task, false);

        const res = await apiFetch("/api/tasks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: task.id, ...patch }),
        });

        if (!res.ok) {
          console.error("Error undoing task completion");
          return;
        }

        setTasks((previous) => previous.filter((row) => row.id !== task.id));
        setOpenCount((previous) => previous + 1);
        void appData?.refresh();
      } catch (error) {
        console.error("Unexpected error undoing task completion:", error);
      } finally {
        setUndoing(null);
      }
    },
    [appData],
  );

  const muted = isDark ? "text-gray-400" : "text-gray-500";
  const faint = isDark ? "text-gray-500" : "text-gray-400";

  return (
    <main
      className={`relative min-h-screen w-full pb-20 pr-4 pt-6 md:pr-16 md:pt-10 ${
        isDark ? "text-white" : "text-black"
      }`}
    >
      <AppSurface />

      <div className="mx-auto w-full max-w-3xl pl-4 md:pl-20">
        {/* Title and the percentage, which is the only figure the iOS screen
            keeps. The progress panel that used to sit under it — a bar, a
            percentage, a motivational line and two counts — said the same thing
            four times over the top of the work itself. */}
        <header className="flex items-baseline justify-between gap-3 pb-4">
          <h1 className="truncate text-[22px] font-bold leading-tight md:text-[26px]">
            Completed Tasks
          </h1>
          <span
            className="shrink-0 text-[12px] font-bold"
            style={{ color: SUCCESS }}
          >
            {percentComplete}% Done
          </span>
        </header>

        {/* The list filter, as a capsule menu. iOS puts this above the list and
            titles it with whatever is selected. */}
        <div className="relative pb-3">
          <button
            type="button"
            onClick={() => setListMenuOpen((open) => !open)}
            aria-expanded={listMenuOpen}
            className={`flex min-h-[36px] items-center gap-1.5 rounded-full px-3.5 text-[14px] font-medium ${
              isDark ? "bg-white/[0.08]" : "bg-black/[0.05]"
            }`}
          >
            <span className="max-w-[12rem] truncate">{selectedListTitle}</span>
            <ChevronDown className={`h-3.5 w-3.5 ${muted}`} />
          </button>

          {listMenuOpen && (
            <>
              {/* A click-away layer rather than a document listener: the menu is
                  inside a scrolling page and a listener would also have to
                  handle the scroll. */}
              <button
                type="button"
                aria-label="Close list filter"
                className="fixed inset-0 z-20 cursor-default"
                onClick={() => setListMenuOpen(false)}
              />
              <div
                className={`absolute left-0 top-full z-30 mt-1 max-h-72 w-56 overflow-y-auto rounded-xl border bg-[var(--surface-card)] py-1 shadow-xl ${
                  isDark ? "border-white/[0.08]" : "border-black/[0.06]"
                }`}
              >
                {[{ id: null, name: "All Lists" }, ...lists.map((list) => ({
                  id: list.id,
                  name: list.list_name ?? "Untitled list",
                }))].map((option) => (
                  <button
                    key={option.id ?? "all"}
                    type="button"
                    onClick={() => {
                      setSelectedListId(option.id);
                      setListMenuOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[14px] ${
                      isDark ? "active:bg-white/10" : "active:bg-black/5"
                    }`}
                  >
                    <span className="truncate">{option.name}</span>
                    {selectedListId === option.id && (
                      <Check className="h-4 w-4 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Search. The placeholder names what it searches, because matching
            collection names rather than task titles is not what anyone would
            assume from a box on a screen full of task titles. */}
        <div
          className={`mb-5 flex items-center gap-2 rounded-[10px] px-3 py-2 ${
            isDark ? "bg-white/[0.08]" : "bg-black/[0.05]"
          }`}
        >
          <Search className={`h-4 w-4 shrink-0 ${muted}`} />
          <input
            type="search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search Collections"
            aria-label="Search collections"
            className="w-full bg-transparent text-[15px] outline-none placeholder:text-gray-500"
          />
        </div>

        {isLoading ? (
          <div aria-label="Loading completed tasks">
            <SkeletonTaskList isDark={isDark} />
          </div>
        ) : groupedDays.length === 0 ? (
          /* ContentUnavailableView's two cases, kept apart: nothing finished yet
             is a different message from nothing matching a query. */
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
            {searchText.trim() ? (
              <>
                <Search className={`h-10 w-10 ${faint}`} />
                <p className="text-[17px] font-semibold">
                  No Results for “{searchText.trim()}”
                </p>
                <p className={`max-w-[18rem] text-[14px] ${muted}`}>
                  Search matches the collection a task sits in.
                </p>
              </>
            ) : (
              <>
                <Check className={`h-10 w-10 ${faint}`} />
                <p className="text-[17px] font-semibold">No Completed Tasks</p>
                <p className={`max-w-[18rem] text-[14px] ${muted}`}>
                  Anything you tick off will be collected here, newest first.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-7">
            {groupedDays.map((group) => (
              <section key={group.date.getTime()}>
                <header className="flex items-baseline gap-2 pb-2.5">
                  <h2 className="text-[15px] font-semibold">
                    {dayTitle(group.date)}
                  </h2>
                  <span className={`text-[13px] ${faint}`}>
                    {group.tasks.length} completed
                  </span>
                </header>

                <div>
                  {group.tasks.map((task, index) => (
                    <TimelineRow
                      key={task.id}
                      task={task}
                      isLast={index === group.tasks.length - 1}
                      listName={
                        listById.get(task.list_id ?? "")?.list_name ?? "General"
                      }
                      listColor={listById.get(task.list_id ?? "")?.bg_color_hex}
                      collectionName={
                        collectionById.get(task.collection_id ?? "")
                          ?.collection_name ?? null
                      }
                      isDark={isDark}
                      busy={undoing === task.id}
                      onUndo={() => undo(task)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

/**
 * One finished task on the day's timeline — iOS `TimelineView`.
 *
 * The ring and the rule down the left are what make a day read as a sequence.
 * The ring takes the parent list's colour, so a day's work is also legible as
 * which lists it came from without a second label saying so.
 */
function TimelineRow({
  task,
  isLast,
  listName,
  listColor,
  collectionName,
  isDark,
  busy,
  onUndo,
}: {
  task: Task;
  isLast: boolean;
  listName: string;
  listColor: string | null | undefined;
  collectionName: string | null;
  isDark: boolean;
  busy: boolean;
  onUndo: () => void;
}) {
  const completedAt = task.date_completed
    ? new Date(task.date_completed as unknown as string)
    : null;

  // iOS `canUndo`: only what was finished today. A correction for a mis-tap,
  // not a way to reopen last month's work.
  const canUndo = Boolean(completedAt && isToday(completedAt));

  const ring = isUsableHex(listColor) ? (listColor as string) : SUCCESS;
  const muted = isDark ? "text-gray-400" : "text-gray-500";
  const faint = isDark ? "text-gray-500" : "text-gray-400";

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-stretch gap-4"
    >
      {/* The rail. Fixed width so every row's text starts on the same line
          however long the ring's colour name is. */}
      <div className="flex w-3 shrink-0 flex-col items-center">
        <span
          className="mt-1 h-3 w-3 shrink-0 rounded-full border-2 bg-[var(--surface-field)]"
          style={{ borderColor: ring }}
          aria-hidden="true"
        />
        {!isLast && (
          <span
            className={`w-px flex-1 ${isDark ? "bg-white/15" : "bg-black/15"}`}
            aria-hidden="true"
          />
        )}
      </div>

      <div className={`min-w-0 flex-1 ${isLast ? "pb-2" : "pb-4"}`}>
        <div className="flex items-start gap-3">
          <p className="line-clamp-2 min-w-0 flex-1 text-[15px] font-medium">
            {task.text}
          </p>

          {completedAt && (
            <span className={`shrink-0 text-[13px] ${faint}`}>
              {format(completedAt, "HH:mm")}
            </span>
          )}

          {canUndo && (
            <button
              type="button"
              onClick={onUndo}
              disabled={busy}
              aria-label={`Undo ${task.text ?? "task"}`}
              className={`-mt-0.5 shrink-0 rounded-md p-1.5 disabled:opacity-40 ${
                isDark
                  ? "bg-white/[0.08] active:bg-white/15"
                  : "bg-black/[0.05] active:bg-black/10"
              }`}
            >
              <RotateCcw className={`h-3.5 w-3.5 ${muted}`} />
            </button>
          )}
        </div>

        <p className={`pt-0.5 text-[13px] ${muted}`}>
          {listName}
          {collectionName && (
            <>
              <span className={faint}> / </span>
              <span className={faint}>{collectionName}</span>
            </>
          )}
        </p>
      </div>
    </motion.div>
  );
}
