"use client";

// Progress: what the user has actually done, and nothing invented.
//
// Replaces the tabbed dashboard (Overview / Analytics / Tasks) with the single
// page the redesign calls for. Everything on it is counted from the signed-in
// user's own rows — there is no sample series, no placeholder percentage, and
// where there is not enough history to draw something honest it says so rather
// than filling the gap.
//
// Two things are deliberately absent. Priority tasks and Upcoming tasks had
// their own sections here; both are built-in views with their own screens, and
// an analytics page is not where you work through a list.
//
// One query pass, not one per card: a single fetch of the user's tasks, notes
// and lists, with everything on the page derived from it. The alternative —
// counting each tile separately — is nine round trips that can disagree with
// each other halfway through loading.

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { subDays, subMonths, subYears, startOfDay, format } from "date-fns";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/client";
import AppSurface from "@/components/AppSurface";

type Range = "7d" | "1m" | "1y";

const RANGES: { id: Range; label: string }[] = [
  { id: "7d", label: "7 days" },
  { id: "1m", label: "1 month" },
  { id: "1y", label: "1 year" },
];

interface TaskRow {
  id: string;
  list_id: string | null;
  is_completed: boolean | null;
  date_completed: string | null;
  created_at: string;
}

interface ListRow {
  id: string;
  list_name: string | null;
  bg_color_hex: string | null;
}

interface Bucket {
  label: string;
  completed: number;
}

export default function ProgressView({
  heading = "Progress",
}: {
  heading?: string;
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { user } = useAuth();

  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [lists, setLists] = useState<ListRow[]>([]);
  const [noteCount, setNoteCount] = useState(0);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [range, setRange] = useState<Range>("7d");

  const load = useCallback(async () => {
    if (!user) return;
    setState("loading");

    try {
      const [taskResult, listResult, noteResult] = await Promise.all([
        supabase
          .from("task")
          .select("id,list_id,is_completed,date_completed,created_at")
          .eq("user_id", user.id)
          .eq("is_deleted", false),
        // No `is_deleted` filter here: `list` has no such column — deleting a
        // list removes the row, where tasks and notes are soft-deleted. Asking
        // for it failed the whole query and the page showed its error state.
        supabase
          .from("list")
          .select("id,list_name,bg_color_hex")
          .eq("user_id", user.id),
        supabase
          .from("note")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_deleted", false),
      ]);

      if (taskResult.error || listResult.error)
        throw taskResult.error || listResult.error;

      setTasks((taskResult.data as TaskRow[]) || []);
      setLists((listResult.data as ListRow[]) || []);
      setNoteCount(noteResult.count || 0);
      setState("ready");
    } catch (error) {
      console.error("Could not load progress:", error);
      // Logged with the Supabase error attached, so a column or policy problem
      // names itself instead of arriving as "could not load".
      setState("error");
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const completed = useMemo(
    () => tasks.filter((task) => task.is_completed).length,
    [tasks],
  );
  const open = tasks.length - completed;
  const percent =
    tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100);

  /**
   * The activity series for the chosen range, bucketed so a year does not try to
   * draw 365 columns on a phone.
   *
   * Counted from `date_completed`, which is the only date that says a task was
   * finished. A task with no completion date contributes nothing — it has not
   * happened yet, and guessing from `created_at` would draw work that was never
   * done.
   */
  const activity = useMemo<Bucket[]>(() => {
    const now = new Date();

    if (range === "7d") {
      return Array.from({ length: 7 }, (_, index) => {
        const day = startOfDay(subDays(now, 6 - index));
        const next = new Date(day.getTime() + 86400000);
        return {
          label: format(day, "EEEEE"),
          completed: tasks.filter((task) => {
            if (!task.date_completed) return false;
            const at = new Date(task.date_completed);
            return at >= day && at < next;
          }).length,
        };
      });
    }

    if (range === "1m") {
      // Four weeks, because thirty bars on a 360px screen is a smear.
      return Array.from({ length: 4 }, (_, index) => {
        const end = subDays(now, (3 - index) * 7);
        const start = subDays(end, 7);
        return {
          label: format(end, "d MMM"),
          completed: tasks.filter((task) => {
            if (!task.date_completed) return false;
            const at = new Date(task.date_completed);
            return at >= start && at < end;
          }).length,
        };
      });
    }

    return Array.from({ length: 12 }, (_, index) => {
      const end = subMonths(now, 11 - index);
      const start = subMonths(end, 1);
      return {
        label: format(end, "LLLLL"),
        completed: tasks.filter((task) => {
          if (!task.date_completed) return false;
          const at = new Date(task.date_completed);
          return at >= start && at < end;
        }).length,
      };
    });
  }, [tasks, range]);

  const peak = Math.max(...activity.map((bucket) => bucket.completed), 0);
  const oldest = useMemo(() => {
    const dates = tasks.map((task) => new Date(task.created_at).getTime());
    return dates.length ? new Date(Math.min(...dates)) : null;
  }, [tasks]);

  /**
   * Whether the chosen range reaches further back than the account does.
   *
   * Drawing twelve empty months for someone who signed up last week is not a
   * chart, it is a lie with axes on it.
   */
  const rangeStart =
    range === "7d"
      ? subDays(new Date(), 7)
      : range === "1m"
        ? subMonths(new Date(), 1)
        : subYears(new Date(), 1);
  const thinHistory = Boolean(oldest && oldest > rangeStart);

  const perList = useMemo(
    () =>
      lists
        .map((list) => {
          const own = tasks.filter((task) => task.list_id === list.id);
          return {
            ...list,
            total: own.length,
            done: own.filter((task) => task.is_completed).length,
          };
        })
        .filter((entry) => entry.total > 0)
        .sort((a, b) => b.total - a.total),
    [lists, tasks],
  );

  const card = isDark ? "bg-[#131A2B]" : "bg-white";
  const edge = isDark ? "border-white/[0.08]" : "border-black/[0.06]";
  const muted = isDark ? "text-gray-400" : "text-gray-500";
  const strong = isDark ? "text-white" : "text-gray-900";
  const track = isDark ? "bg-white/10" : "bg-black/10";

  return (
    // AppSurface paints the field behind the page; it is a sibling layer, not a
    // wrapper. 20px of horizontal padding on mobile, widening to a readable
    // column on desktop rather than stretching across a monitor.
    <div className="relative min-h-screen">
      <AppSurface />
      <div className="mx-auto w-full max-w-3xl px-5 pb-28 pt-safe-top">
        <header className="pt-3">
          <h1
            className={`text-[26px] font-bold leading-tight tracking-[-0.02em] ${strong}`}
          >
            {heading}
          </h1>

          {state === "ready" && (
            <>
              <p className={`pt-1 text-[14px] ${muted}`}>
                {tasks.length === 0
                  ? "No tasks yet"
                  : `${percent}% of tasks completed`}
              </p>
              {/* Thin, because it is a summary and not a control. */}
              <div
                className={`mt-3 h-1.5 w-full overflow-hidden rounded-full ${track}`}
              >
                <motion.div
                  className="h-full rounded-full bg-[#6366F1]"
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                />
              </div>
            </>
          )}
        </header>

        {state === "loading" && (
          <div className="grid grid-cols-2 gap-3 pt-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className={`h-[88px] animate-pulse rounded-2xl border ${card} ${edge}`}
              />
            ))}
          </div>
        )}

        {state === "error" && (
          <p className={`pt-8 text-[14px] ${muted}`}>
            Could not load your progress. Pull down or reopen the tab to try
            again.
          </p>
        )}

        {state === "ready" && (
          <>
            {/* Numbers dominant, no decorative icons. */}
            <section className="grid grid-cols-2 gap-3 pt-6">
              {[
                { label: "Completed", value: completed },
                { label: "Open", value: open },
                { label: "Notes", value: noteCount },
                { label: "Lists", value: lists.length },
              ].map((tile) => (
                <div
                  key={tile.label}
                  className={`rounded-2xl border p-4 ${card} ${edge}`}
                >
                  <p className={`text-[28px] font-bold leading-none ${strong}`}>
                    {tile.value}
                  </p>
                  <p className={`pt-1.5 text-[12px] ${muted}`}>{tile.label}</p>
                </div>
              ))}
            </section>

            <section className="pt-8">
              <div className="flex items-center justify-between gap-3">
                <h2 className={`text-[17px] font-semibold ${strong}`}>
                  Activity
                </h2>
                <div
                  className={`flex rounded-xl p-0.5 ${isDark ? "bg-white/[0.06]" : "bg-black/[0.05]"}`}
                >
                  {RANGES.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setRange(option.id)}
                      className={`rounded-[10px] px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                        range === option.id
                          ? `${isDark ? "bg-[#1B2440]" : "bg-white"} ${strong}`
                          : muted
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`mt-3 rounded-2xl border p-4 ${card} ${edge}`}>
                {/* The chart always draws, even when the range reaches back
                    further than the account does or nothing landed in it.
                    Picking "1 year" is a request to see the year; answering with
                    a sentence where the chart should be is a refusal. The
                    caveats go underneath as a caption instead, so the shape is
                    there and the reader is still told what they are looking at. */}
                <div className="flex h-28 items-end gap-1.5">
                  {activity.map((bucket, index) => (
                    <div
                      key={index}
                      className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
                    >
                      <motion.div
                        className="w-full rounded-t-[3px] bg-[#6366F1]"
                        initial={{ height: 0 }}
                        animate={{
                          // An empty bucket keeps a baseline sliver so the axis
                          // reads as a row of periods rather than a gap, and a
                          // completed-but-tiny bar stays visible against a busy
                          // one next to it.
                          height:
                            peak === 0 || bucket.completed === 0
                              ? 2
                              : `${Math.max((bucket.completed / peak) * 100, 6)}%`,
                        }}
                        transition={{ duration: 0.35, delay: index * 0.02 }}
                        style={{ opacity: bucket.completed === 0 ? 0.25 : 1 }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-1.5 pt-2">
                  {activity.map((bucket, index) => (
                    <span
                      key={index}
                      className={`min-w-0 flex-1 truncate text-center text-[10px] ${muted}`}
                    >
                      {bucket.label}
                    </span>
                  ))}
                </div>
                {(peak === 0 || thinHistory) && (
                  <p className={`pt-3 text-center text-[11px] ${muted}`}>
                    {peak === 0
                      ? "Nothing completed in this period yet."
                      : "Your account does not cover this whole range yet."}
                  </p>
                )}
              </div>
            </section>

            {perList.length > 0 && (
              <section className="pt-8">
                <h2 className={`text-[17px] font-semibold ${strong}`}>
                  Progress by list
                </h2>
                <div className="mt-3 space-y-3">
                  {perList.map((entry) => {
                    const pct = Math.round((entry.done / entry.total) * 100);
                    const colour = entry.bg_color_hex || "#6366F1";
                    return (
                      <div
                        key={entry.id}
                        className={`rounded-2xl border p-4 ${card} ${edge}`}
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <span
                            className={`min-w-0 truncate text-[14px] font-medium ${strong}`}
                          >
                            {entry.list_name || "Untitled"}
                          </span>
                          <span className={`shrink-0 text-[12px] ${muted}`}>
                            {entry.done} / {entry.total}
                          </span>
                        </div>
                        <div
                          className={`mt-2.5 h-1.5 w-full overflow-hidden rounded-full ${track}`}
                        >
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: colour }}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{
                              duration: 0.5,
                              ease: [0.4, 0, 0.2, 1],
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
