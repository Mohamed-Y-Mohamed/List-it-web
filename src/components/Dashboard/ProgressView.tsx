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
  /** Finished in this bucket, by `date_completed`. */
  completed: number;
  /** Started in this bucket by `created_at` and still open. */
  inProgress: number;
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
   * Two counts per bucket, not one.
   *
   * `completed` comes from `date_completed`, the only date that says a task was
   * finished. That was the whole series, which is why the chart was blank for
   * anyone who had not finished anything: with no completions in range `peak`
   * was 0, every bar collapsed to its 2px baseline sliver, and a screen full of
   * open work reported no activity at all. The data was never wrong — nothing
   * was asking about work in progress.
   *
   * `inProgress` is counted from `created_at` and only for tasks still open, so
   * the two series can never double-count the same task: a finished task is in
   * `completed` for the bucket it was finished in and nowhere else. Starting
   * something is activity, and it is the half the reader can still act on.
   *
   * The boundaries are built once and both counts read them, rather than each
   * range repeating its own filter. The day boundaries go through `startOfDay`
   * on both ends instead of adding 86400000 to the start, which was an hour out
   * on the two days a year the clocks change.
   */
  const activity = useMemo<Bucket[]>(() => {
    const now = new Date();

    const spans: { label: string; start: Date; end: Date }[] =
      range === "7d"
        ? Array.from({ length: 7 }, (_, index) => {
            const start = startOfDay(subDays(now, 6 - index));
            return {
              label: format(start, "EEEEE"),
              start,
              end: startOfDay(subDays(now, 5 - index)),
            };
          })
        : range === "1m"
          ? // Four weeks, because thirty bars on a 360px screen is a smear.
            Array.from({ length: 4 }, (_, index) => {
              const end = subDays(now, (3 - index) * 7);
              return { label: format(end, "d MMM"), start: subDays(end, 7), end };
            })
          : Array.from({ length: 12 }, (_, index) => {
              const end = subMonths(now, 11 - index);
              return { label: format(end, "LLLLL"), start: subMonths(end, 1), end };
            });

    const inSpan = (
      value: string | null | undefined,
      start: Date,
      end: Date,
    ): boolean => {
      if (!value) return false;
      const at = new Date(value);
      return at >= start && at < end;
    };

    return spans.map(({ label, start, end }) => ({
      label,
      completed: tasks.filter((task) =>
        inSpan(task.date_completed, start, end),
      ).length,
      inProgress: tasks.filter(
        (task) =>
          !task.is_completed && inSpan(task.created_at, start, end),
      ).length,
    }));
  }, [tasks, range]);

  /**
   * The tallest column, so the stack scales to the busiest bucket.
   *
   * The sum of both series rather than `completed` alone — scaling a stacked
   * column to one of its two parts lets the other overflow the chart.
   */
  const peak = Math.max(
    ...activity.map((bucket) => bucket.completed + bucket.inProgress),
    0,
  );
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

  const card = isDark ? "bg-[var(--surface-card)]" : "bg-white";
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
                          ? `${isDark ? "bg-[var(--surface-selected)]" : "bg-white"} ${strong}`
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
                {/* A stacked column per bucket: completed on the bottom in
                    solid indigo, still-open on top of it at a third of the
                    opacity. Stacked rather than side by side because the two
                    together are "what happened in this period" and the column's
                    full height says that at a glance; two thin bars per bucket
                    at twelve buckets on a phone is four pixels each.

                    Order matters — `justify-end` and completed last puts the
                    solid part at the base, so the columns share a floor and the
                    in-progress caps line up as the variable part. */}
                <div className="flex h-28 items-end gap-1.5">
                  {activity.map((bucket, index) => {
                    const total = bucket.completed + bucket.inProgress;
                    const share = (value: number) =>
                      peak === 0 || value === 0
                        ? 0
                        : Math.max((value / peak) * 100, 4);

                    return (
                      <div
                        key={index}
                        className="flex h-full min-w-0 flex-1 flex-col justify-end"
                      >
                        {/* Still open, on top. */}
                        <motion.div
                          className="w-full rounded-t-[3px] bg-[#6366F1]"
                          initial={{ height: 0 }}
                          animate={{ height: `${share(bucket.inProgress)}%` }}
                          transition={{ duration: 0.35, delay: index * 0.02 }}
                          style={{ opacity: 0.35 }}
                        />
                        {/* Completed, at the base. Carries the rounded top only
                            when nothing is stacked above it. */}
                        <motion.div
                          className={`w-full bg-[#6366F1] ${
                            bucket.inProgress === 0 ? "rounded-t-[3px]" : ""
                          }`}
                          initial={{ height: 0 }}
                          animate={{ height: `${share(bucket.completed)}%` }}
                          transition={{ duration: 0.35, delay: index * 0.02 }}
                        />
                        {/* An empty bucket keeps a baseline sliver so the axis
                            reads as a row of periods rather than a gap. */}
                        {total === 0 && (
                          <span className="h-[2px] w-full rounded-full bg-[#6366F1] opacity-25" />
                        )}
                      </div>
                    );
                  })}
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
                {/* Two colours need saying which is which. */}
                <div
                  className={`flex items-center justify-center gap-4 pt-3 text-[11px] ${muted}`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-sm bg-[#6366F1]" />
                    Completed
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-sm bg-[#6366F1] opacity-35" />
                    In progress
                  </span>
                </div>

                {/* The caveat only fires when the chart really has nothing in
                    it. It used to read "Nothing completed in this period yet"
                    whenever `peak` was 0, which was the message a reader got
                    while looking at a screen full of open tasks — the chart was
                    not counting them. `peak` is both series now, so 0 means the
                    period is genuinely empty. */}
                {(peak === 0 || thinHistory) && (
                  <p className={`pt-2 text-center text-[11px] ${muted}`}>
                    {peak === 0
                      ? "Nothing started or completed in this period yet."
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
