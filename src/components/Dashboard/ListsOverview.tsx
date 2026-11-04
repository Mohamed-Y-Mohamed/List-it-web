"use client";

// The lists on the dashboard, as on the Android Lists tab: a pinned rail sized
// so three cards are in view, then every list as a card grid.

import React, { useMemo } from "react";
import ListCard from "@/components/ui/ListCard";
import { useOptionalAppData } from "@/components/AppDataProvider";

export default function ListsOverview({ isDark }: { isDark: boolean }) {
  const appData = useOptionalAppData();
  const lists = appData?.lists;
  const tasks = appData?.tasks;
  const notes = appData?.notes;

  const counts = useMemo(() => {
    const byList = new Map<string, { tasks: number; notes: number }>();
    const bump = (id: string | null, key: "tasks" | "notes") => {
      if (!id) return;
      const entry = byList.get(id) ?? { tasks: 0, notes: 0 };
      entry[key] += 1;
      byList.set(id, entry);
    };
    tasks?.forEach((task) => {
      if (!task.is_completed && !task.is_deleted) bump(task.list_id, "tasks");
    });
    notes?.forEach((note) => {
      if (!note.is_deleted) bump(note.list_id, "notes");
    });
    return byList;
  }, [tasks, notes]);

  if (!appData) return null;

  const muted = isDark ? "text-gray-400" : "text-gray-500";
  const strong = isDark ? "text-white" : "text-gray-900";

  if (appData.isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 pt-6 md:grid-cols-3" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-[84px] animate-pulse rounded-[17px] bg-[var(--surface-card)]"
          />
        ))}
      </div>
    );
  }

  const all = lists ?? [];
  const pinned = all.filter((list) => list.is_pinned);
  const own = all.filter((list) => !list.is_default);
  const cardProps = (id: string) => ({
    taskCount: counts.get(id)?.tasks ?? 0,
    noteCount: counts.get(id)?.notes ?? 0,
  });

  return (
    <>
      {pinned.length > 0 && (
        <section className="pt-6" aria-labelledby="pinned-heading">
          <h2 id="pinned-heading" className={`text-[17px] font-semibold ${strong}`}>
            Pinned
          </h2>
          {/* Three cards in view; the rest scroll sideways. */}
          <div className="-mx-5 mt-3 flex snap-x gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none]">
            {pinned.map((list) => (
              <div
                key={list.id}
                className="w-[calc((100%-1.5rem)/3)] min-w-[104px] shrink-0 snap-start"
              >
                <ListCard list={list} isDark={isDark} variant="pinned" {...cardProps(list.id)} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="pt-6" aria-labelledby="lists-heading">
        <h2 id="lists-heading" className={`text-[17px] font-semibold ${strong}`}>
          Lists
        </h2>
        {own.length === 0 ? (
          <p className={`pt-2 text-[14px] ${muted}`}>
            No lists yet. Create one from the sidebar to group your tasks and notes.
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
            {own.map((list) => (
              <ListCard key={list.id} list={list} isDark={isDark} {...cardProps(list.id)} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
