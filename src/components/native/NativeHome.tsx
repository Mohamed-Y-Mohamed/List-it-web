"use client";

// The Android home screen — the Lists tab — matching AllListsView from the
// published iOS app: a greeting, search, a horizontal row of pinned lists, then
// the built-in views and the user's own lists as two three-column grids with a
// rule between them. Long-pressing a card opens its context menu.
//
// Settings and Progress used to live in a toolbar menu here; they are tab bar
// destinations now, so the menu is gone. The six default views it also held were
// always duplicated by the grid cards, so nothing was lost with it.
//
// Rendered only in the native build — the web dashboard is untouched. See
// src/app/(secure)/dashboard/page.tsx.

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import {
  ArrowUpDown,
  ListChecks,
  Pencil,
  Pin,
  PinOff,
  MoreVertical,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { apiFetch } from "@/lib/apiFetch";
import { appPath, listHref } from "@/lib/routes";
import { useListLayout } from "@/hooks/useListLayout";
import type { List } from "@/types/schema";
import CreateListModal from "@/components/popupModels/ListPopup";
import EditListPopup from "@/components/popupModels/editListPopup";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import NativeContextMenu, { type ContextMenuItem } from "./NativeContextMenu";
import NativeHelpSheet from "./NativeHelpSheet";
import NativeListCard from "./NativeListCard";
import { ListIcon } from "./listVisuals";
import SwipeableRow, { type SwipeAction } from "./SwipeableRow";
import { useAppData } from "./AppDataProvider";
import { CountBadge } from "./listVisuals";
import { homeState } from "./homeState";

// Mirrors SortOption in the iOS app.
type SortOption = "newest" | "oldest" | "az" | "za";

// Ordered as they appear in the chip row. Oldest is first because it is the
// default, and a selected chip at the left edge needs no scrolling to see.
const SORT_ORDER: readonly SortOption[] = ["oldest", "newest", "az", "za"];

const SORT_LABELS: Record<SortOption, string> = {
  oldest: "Oldest",
  newest: "Newest",
  az: "A-Z",
  za: "Z-A",
};

/**
 * The built-in lists, always shown above the user's own and never reordered by
 * the sort control — they are fixed views, so sorting them by creation date or
 * name would be meaningless. They are views over the user's tasks rather than
 * rows in the `list` table, so they are described here rather than fetched: there
 * is nothing to create, rename, pin or delete. `list_icon` carries the same SF
 * Symbol names the iOS app stores, so listVisuals maps them to the matching icon.
 */
const DEFAULT_LISTS: (List & { href: string })[] = [
  // First, because it is the one of these you open every morning.
  ["Today", "calendar", "#007AFF", "/today"],
  ["Tomorrow", "calendar.badge.clock", "#5856D6", "/tomorrow"],
  ["Priority", "star.fill", "#FF9500", "/priority"],
  ["Completed", "checkmark.circle", "#34C759", "/completed"],
  ["Not Completed", "circle", "#8E8E93", "/notcomplete"],
  ["Scheduled", "calendar.badge.exclamationmark", "#5AC8FA", "/overdue"],
].map(([name, icon, color, href]) => ({
  id: `default:${href}`,
  created_at: new Date(0),
  list_icon: icon,
  list_name: name,
  is_default: true,
  bg_color_hex: color,
  is_pinned: false,
  user_id: null,
  href,
}));

/**
 * A section name sharing a line with the rule under it.
 *
 * The screen used to carry one 24px "Your Lists" heading above *both* grids and a
 * bare hairline between them, so the heading named the built-in views and nothing
 * named the user's own lists. Two identical grids split by an unlabelled line left
 * the reader to work out which was which. Putting the name on the rule labels both
 * groups for the height of one row, which is less than the old arrangement spent
 * getting it wrong.
 */
function SectionDivider({
  label,
  count,
  isDark,
  className = "",
}: {
  label: string;
  /** Omitted where a count would be noise, as on a fixed set of built-in views. */
  count?: number;
  isDark: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2.5 pb-3 ${className}`}>
      <h2 className="shrink-0 text-[13px] font-semibold uppercase tracking-[0.06em] text-gray-500 dark:text-gray-400">
        {label}
      </h2>
      {count !== undefined && <CountBadge count={count} />}
      {/* Takes the rest of the row, so the rule starts where the label ends
          however long the label is. */}
      <span
        className={`h-px flex-1 ${isDark ? "bg-white/10" : "bg-black/10"}`}
      />
    </div>
  );
}

export default function NativeHome() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // There is no document to portal into during the server render, and the first
  // client render has to match it.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Read from the shared cache rather than fetching here.
  //
  // This screen used to own the three requests and the loading flag, which meant
  // they ran again on every return to the Lists tab — NativeTransition re-keys on
  // the pathname, so the whole screen is remounted each time and its state went
  // with it. AppDataProvider lives above that boundary, so the data is fetched once
  // at launch and this is now instant on every subsequent visit.
  //
  // `refresh` replaces the old local `loadData` at each mutation site, and
  // `setLists` still applies optimistic updates — just against the cache, so the
  // change persists past a navigation instead of being thrown away.
  const {
    lists,
    tasks,
    notes,
    isLoading,
    refresh: refreshData,
    setLists,
  } = useAppData();

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("oldest");

  // Cards or rows, from Settings → Appearance → List layout. null while the stored
  // choice is still being read; the screen holds its skeleton until it arrives
  // rather than painting the three-column grid and flipping to rows a frame later.
  const { layout } = useListLayout();
  const isListLayout = layout === "list";

  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const [menuOrigin, setMenuOrigin] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [menuItems, setMenuItems] = useState<ContextMenuItem[]>([]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [listToEdit, setListToEdit] = useState<List | null>(null);
  const [listToDelete, setListToDelete] = useState<List | null>(null);

  const matchesSearch = useCallback(
    (list: List) =>
      !search.trim() ||
      (list.list_name ?? "")
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
    [search],
  );

  const visibleDefaultLists = useMemo(
    () => DEFAULT_LISTS.filter(matchesSearch),
    [matchesSearch],
  );

  // Any `is_default` rows the API returns describe the same built-in views that
  // DEFAULT_LISTS already covers, so they are dropped here rather than shown twice.
  const userLists = useMemo(
    () => lists.filter((list) => !list.is_default),
    [lists],
  );

  const sortedLists = useMemo(() => {
    const filtered = userLists.filter(matchesSearch);
    const byName = (list: List) => (list.list_name ?? "").toLowerCase();
    const byDate = (list: List) => new Date(list.created_at).getTime();

    return [...filtered].sort((a, b) => {
      switch (sort) {
        case "newest":
          return byDate(b) - byDate(a);
        case "oldest":
          return byDate(a) - byDate(b);
        case "az":
          return byName(a).localeCompare(byName(b));
        case "za":
          return byName(b).localeCompare(byName(a));
      }
    });
  }, [userLists, matchesSearch, sort]);

  const pinnedLists = useMemo(
    () => userLists.filter((list) => list.is_pinned && matchesSearch(list)),
    [userLists, matchesSearch],
  );

  const state = homeState({
    isLoading,
    search,
    userListCount: userLists.length,
    matchingListCount: sortedLists.length,
    matchingDefaultCount: visibleDefaultLists.length,
  });

  // Someone who has not made a list yet gets the built-in views hidden and the
  // screen reduced to a single invitation to create one.
  //
  // Hidden rather than shown empty because every one of them is a view over
  // tasks, and tasks live in collections, which live in lists — so with no lists
  // there is nothing any of them could ever hold. Six cards all reading zero is
  // a worse first screen than one button that does something.
  const isFirstRun = state === "first-run";

  const openList = useCallback(
    (list: List) => router.push(listHref(list.id, true)),
    [router],
  );

  const togglePin = useCallback(
    async (list: List) => {
      // Reflect it straight away; the card is under the user's finger.
      setLists((previous) =>
        previous.map((item) =>
          item.id === list.id ? { ...item, is_pinned: !item.is_pinned } : item,
        ),
      );

      const res = await apiFetch("/api/lists", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: list.id, is_pinned: !list.is_pinned }),
      });

      if (!res.ok) {
        console.error("Error updating list pin status");
        await refreshData();
      }
    },
    [refreshData, setLists],
  );

  const deleteList = useCallback(async () => {
    const target = listToDelete;
    if (!target) return;
    setListToDelete(null);

    const res = await apiFetch("/api/lists", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: target.id }),
    });

    if (!res.ok) {
      console.error("Error deleting list");
      return;
    }
    setLists((previous) => previous.filter((list) => list.id !== target.id));
  }, [listToDelete, setLists]);

  // Default lists can only be pinned; user lists can also be renamed or deleted.
  // Same split as the iOS context menus.
  const showContextMenu = useCallback(
    (list: List, position: { x: number; y: number }) => {
      const items: ContextMenuItem[] = [
        {
          label: list.is_pinned ? "Unpin List" : "Pin List",
          icon: list.is_pinned ? <PinOff size={18} /> : <Pin size={18} />,
          onSelect: () => togglePin(list),
        },
      ];

      if (!list.is_default) {
        items.push(
          {
            label: "Update List",
            icon: <Pencil size={18} />,
            onSelect: () => setListToEdit(list),
          },
          {
            label: "Delete List",
            icon: <Trash2 size={18} />,
            destructive: true,
            onSelect: () => setListToDelete(list),
          },
        );
      }

      setMenuItems(items);
      setMenuOrigin(position);
    },
    [togglePin],
  );

  // The same three actions the context menu offers a user list, as swipe panels.
  //
  // Only in the List layout, and only on the user's own lists: the built-in views
  // have nothing to rename or delete, and a card one third of the screen wide has
  // nowhere for a panel to come from. Long press still opens the menu either way,
  // so this adds a faster route and no new capability.
  //
  // Ordered pin, rename, delete so the destructive one ends up against the outer
  // edge, furthest from where a leftward thumb first lands. Nothing fires on
  // reveal — a panel still has to be tapped — which is what lets delete sit here
  // without a confirmation of its own beyond the dialog it already opens.
  const rowActions = useCallback(
    (list: List): SwipeAction[] => [
      // Held a little off full strength so three saturated tiles do not shout
      // louder than the lists they belong to. 80% is as far as it goes: the icons
      // on them are white, and thinning the fill any further over the dark field
      // starts eating the contrast that keeps them legible.
      {
        label: list.is_pinned ? "Unpin List" : "Pin List",
        icon: list.is_pinned ? PinOff : Pin,
        background: "bg-amber-500/80",
        onAction: () => togglePin(list),
      },
      {
        label: "Update List",
        icon: Pencil,
        background: "bg-blue-500/80",
        onAction: () => setListToEdit(list),
      },
      {
        label: "Delete List",
        icon: Trash2,
        background: "bg-red-500/80",
        onAction: () => setListToDelete(list),
      },
    ],
    [togglePin],
  );

  // Sorting is instant and reversible, so the chip commits on tap with no confirm
  // step. The haptic is the receipt — on a grid of small cards the reorder is not
  // always visible from the top of the screen.
  /**
   * What the ⋯ opens: how the lists are ordered, then where else you can go.
   *
   * Two groups in one menu rather than two controls on the page. Sort is set
   * once and rarely changed, and the built-in views are six fixed destinations —
   * neither earns permanent space on a screen that exists to show the user's
   * own lists.
   *
   * The views keep their icons, and they are the only things in the app that do.
   * That is the point of them here: in a list of plain text rows, an icon is
   * what says these six are a different kind of thing from everything else.
   */
  const overflowMenuItems = (): ContextMenuItem[] => [
    {
      label: "Sort",
      icon: <ArrowUpDown size={16} />,
      // One row that opens into the four orders, rather than four rows of its
      // own. The menu's job is to offer two things — how the lists are ordered
      // and where else you can go — and spelling the orders out flat made the
      // sorting look like most of what the menu was for.
      submenu: SORT_ORDER.map((option) => ({
        label: SORT_LABELS[option] + (sort === option ? "  ✓" : ""),
        onSelect: () => selectSort(option),
      })),
    },
    ...visibleDefaultLists.map((list) => ({
      label: list.list_name || "",
      startsGroup: list.id === visibleDefaultLists[0]?.id,
      icon: <ListIcon list={list} size={22} />,
      onSelect: () => router.push(appPath(list.href)),
    })),
  ];

  const selectSort = useCallback((option: SortOption) => {
    setSort(option);
    void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
  }, []);

  const handleCreateSubmit = useCallback(
    async (
      listData: Omit<
        List,
        "id" | "created_at" | "tasks" | "notes" | "collections"
      >,
    ) => {
      // CreateListModal has already inserted the list and its General collection
      // directly through Supabase by the time this runs — it calls onSubmit to
      // announce what it made, not to ask for it. So this looks the new list up
      // and opens it, exactly as SideNav does on the web. Creating it again here
      // would produce a duplicate.
      const listsRes = await apiFetch("/api/lists");
      if (listsRes.ok) {
        const { data } = await listsRes.json();
        const created = (data ?? []).find(
          (list: List) =>
            list.list_name?.trim().toLowerCase() ===
            listData.list_name?.trim().toLowerCase(),
        );

        if (created) {
          // Stays on the Lists tab rather than opening the new list.
          //
          // It used to push straight into it, which is the wrong guess twice over:
          // a list is empty at the moment it is made, so there is nothing to see,
          // and anyone setting up more than one had to come back out between each.
          // `setLists` with the fetched rows updates the grid in place, so the new
          // list is simply there, with no reload and no navigation.
          setIsCreateOpen(false);
          setLists(data ?? []);
          return { success: true };
        }
      }

      // The modal reported success but the list is not there — fall back to
      // creating it over the API so the user's action is not silently lost.
      const createRes = await apiFetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(listData),
      });

      if (!createRes.ok) {
        const body = await createRes.json();
        return { success: false, error: body.error };
      }

      const { data: created } = await createRes.json();

      // Every list needs its default collection, or the detail screen has nowhere
      // to put tasks.
      await apiFetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          list_id: created.id,
          collection_name: "General",
          bg_color_hex: created.bg_color_hex,
        }),
      });

      // Same again on the fallback path: refresh the grid, stay put.
      setIsCreateOpen(false);
      await refreshData();
      return { success: true };
    },
    [refreshData, setLists, router],
  );

  const handleEditSubmit = useCallback(
    async (
      listId: string,
      listData: { list_name: string; bg_color_hex: string },
    ) => {
      const res = await apiFetch("/api/lists", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: listId, ...listData }),
      });

      if (!res.ok) {
        const body = await res.json();
        return { success: false, error: body.error };
      }

      setListToEdit(null);
      await refreshData();
      return { success: true };
    },
    [refreshData],
  );

  // Text colour only. The background used to be part of this — a flat bg-gray-950
  // or bg-white — but it now comes from the gradient layer below, and a colour on
  // the root would paint straight over that `-z-10` child and hide it.
  const surface = isDark ? "text-white" : "text-gray-900";

  return (
    // No background and no min-height of its own. Both come from the secure
    // layout's wrapper now: it draws AppSurface behind every screen, and it is
    // the element that is one viewport tall, so this page adding its own
    // `min-h-screen` on top would make the document taller than the screen.
    <div className={surface}>
      {/* Navigation bar and search, pinned together. `pt-safe-top` clears the
          status bar and content scrolling past goes behind this rather than into
          the system UI.

          No background colour of its own, deliberately. It was a flat fill, which
          was invisible while the page behind it was the same flat colour — but
          against the gradient it became a band of a different shade across the top
          of the screen. Any tint does that, including a translucent one. With none,
          what shows through the header *is* the page gradient, so it matches by
          construction rather than by a value someone has to keep in step.
          `backdrop-blur-xl` is what keeps the greeting legible over cards scrolling
          underneath. */}
      <div className="sticky top-0 z-30 pt-safe-top backdrop-blur-xl">
        {/* The greeting and the name are one block, not two rows. They were
            stacked as a 17px "Welcome Back" in the toolbar and a separate 20px
            name underneath, which spent two full rows saying one thing and left
            neither looking like the screen's title. The name leads now; the
            greeting is the small line above it. */}
        {/* pt-3 on top of pt-safe-top: the inset only clears the status bar, it
            does not leave any air under it, and the greeting sat directly
            beneath the clock. */}
        <div className="flex items-start justify-between gap-3 px-4 pt-3">
          <div className="min-w-0">
            {/* The date, then the page. The greeting and the user's own name
                were the two largest things on a screen whose job is showing
                lists — and the name is already on the Settings tab. */}
            <p
              className={`text-[12px] font-medium uppercase tracking-wide ${
                isDark ? "text-gray-500" : "text-gray-400"
              }`}
            >
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
            <h1 className="truncate text-[26px] font-bold leading-tight tracking-[-0.02em]">
              My Lists
            </h1>
          </div>
        </div>

        {/* Search, which iOS places in the toolbar via .searchable */}
        <div className="px-4 pb-3 pt-3">
          {/* A translucent fill rather than the solid bg-gray-800 / bg-gray-100 it
              had. Those were picked to sit on a flat surface of the same family; on
              the gradient they read as a grey slab with its own colour. Tinting the
              surface underneath instead keeps the field legible as an input while
              letting the page show through it, which is what makes it look part of
              the same screen. */}
          <div
            className={`flex items-center gap-2 rounded-[10px] px-3 py-2 ${
              isDark ? "bg-white/10" : "bg-black/[0.06]"
            }`}
          >
            <Search size={17} className="shrink-0 text-gray-500" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search lists"
              aria-label="Search lists"
              className="w-full bg-transparent outline-none placeholder:text-gray-500"
            />
          </div>
        </div>
      </div>

      {pinnedLists.length > 0 && (
        <section className="px-4 pb-4">
          {/* Same divider as the two groups below it. Left as a 24px bold heading
              it would have been the one section on the screen shouting. */}
          <SectionDivider
            label="Pinned"
            count={pinnedLists.length}
            isDark={isDark}
          />
          {/* Horizontal rail, as in the iOS PinnedListView */}
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {pinnedLists.map((list) => (
              <NativeListCard
                key={`${list.id}-${list.list_name}-${list.bg_color_hex}`}
                list={list}
                tasks={tasks}
                notes={notes}
                variant="pinned"
                onOpen={() => openList(list)}
                onLongPress={(position) => showContextMenu(list, position)}
              />
            ))}
          </div>
        </section>
      )}

      {/* The screen's own controls, and nothing that names a group of lists — the
          section rules below do that now. Only earns its space once there is
          something to sort; on a first run the create prompt stands alone. */}
      {!isFirstRun && (
        <section className="flex items-center gap-2 px-4">
          {/* Keeps the lightbulb and the small grey type it has always had — it
              reads as a tip rather than as a control, which is what it is. What
              changed is that it is now a button, and says there is something new
              behind it rather than naming one gesture. */}
          <button
            type="button"
            onClick={() => setIsHelpOpen(true)}
            className="touch-target -ml-1 flex items-center px-1 text-[12px] text-gray-500 active:opacity-60"
          >
            💡 New features and tips
          </button>
          <span className="flex-1" />
          {/* Sort is an icon menu rather than a row of chips. Four options are not
              worth the vertical space a permanent control costs on a screen whose
              job is showing lists, and the sort is set once and rarely changed. */}
          <button
            type="button"
            onClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              setMenuItems(overflowMenuItems());
              setMenuOrigin({ x: rect.right - 40, y: rect.bottom });
            }}
            aria-label="Sort and views"
            className="touch-target flex items-center justify-center text-gray-400 active:opacity-60 dark:text-gray-500"
          >
            <MoreVertical size={20} />
          </button>
        </section>
      )}

      <section
        className="px-4 pt-1"
        // Clears the floating Add button, which is fixed and therefore takes no
        // space in the document. Without this the last row scrolls to rest
        // underneath it. 3.5rem button + the gap below it + breathing room.
        style={{ paddingBottom: "calc(5.5rem + var(--safe-bottom))" }}
      >
        {/* `layout === null` means the stored card-or-rows choice has not been read
            yet. Holding the skeleton for that frame is the alternative to painting
            the grid and flipping it to rows, which is what someone who chose rows
            would see on every visit to this tab. */}
        {state === "loading" || layout === null ? (
          <div className="grid grid-cols-3 gap-2.5">
            {Array.from({ length: 7 }).map((_, index) => (
              <div
                key={index}
                className={`h-[100px] animate-pulse rounded-[10px] ${
                  isDark ? "bg-gray-800" : "bg-gray-100"
                }`}
              />
            ))}
          </div>
        ) : state === "first-run" ? (
          // The whole screen for someone with nothing yet. Equivalent of
          // ContentUnavailableView on iOS, and the only thing to do here — the
          // built-in view cards are hidden for this case, because with no lists
          // there are no collections and so nothing any of them could hold.
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <ListChecks size={48} className="text-gray-400" />
            <p className="text-[17px] font-semibold">No Lists Yet</p>
            <p className="max-w-[17rem] text-[14px] text-gray-500">
              Everything in List It lives inside a list. Create your first one
              to start adding tasks and notes.
            </p>
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="mt-1 flex items-center gap-1.5 rounded-[10px] bg-blue-500 px-4 py-2.5 text-[15px] font-semibold text-white active:bg-blue-600"
            >
              <Plus size={18} />
              Create List
            </button>
          </div>
        ) : state === "search-miss" ? (
          // No create button here on purpose. Someone who has typed a query is
          // looking for something that exists, not asking to make a new one.
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Search size={48} className="text-gray-400" />
            <p className="text-[17px] font-semibold">No Results</p>
            <p className="max-w-[17rem] text-[14px] text-gray-500">
              Nothing matches “{search.trim()}”.
            </p>
          </div>
        ) : (
          <>
            {/* Two named groups, not one flowing grid. The built-in views are
                fixed and always sit on top; the user's own lists are what the
                sort control reorders. Each group's name sits on the rule above
                it, so which is which is stated rather than inferred. */}
            {/* The built-in views are not on the page any more. They are fixed
                destinations rather than lists, and six tiles of them sat above
                the user's own lists on the screen whose job is showing those.
                They live in the menu behind the ⋯ now, under the sort options.
                See `overflowMenuItems`. */}
            {sortedLists.length > 0 && (
              <>
                <SectionDivider
                  label="My Lists"
                  count={userLists.length}
                  isDark={isDark}
                  className={visibleDefaultLists.length > 0 ? "pt-6" : ""}
                />
                {isListLayout ? (
                  <div className="flex flex-col gap-2">
                    {sortedLists.map((list) => (
                      <SwipeableRow
                        key={`${list.id}-${list.list_name}-${list.bg_color_hex}`}
                        trailing={rowActions(list)}
                        showLabels={false}
                        // Matches the row's own corners, so they do not square
                        // off the moment a swipe starts.
                        radiusClass="rounded-2xl"
                      >
                        <NativeListCard
                          list={list}
                          tasks={tasks}
                          notes={notes}
                          variant="row"
                          onOpen={() => openList(list)}
                          onLongPress={(position) =>
                            showContextMenu(list, position)
                          }
                        />
                      </SwipeableRow>
                    ))}
                  </div>
                ) : (
                  // Two across on a narrow phone, three once there is room. The
                  // user's own cards carry a name and a counts line where a
                  // built-in view carries neither, so squeezing them to a third of
                  // a 360px screen leaves a name that is all scroll and no read.
                  <div className="grid grid-cols-2 gap-2.5">
                    {sortedLists.map((list) => (
                      <NativeListCard
                        key={`${list.id}-${list.list_name}-${list.bg_color_hex}`}
                        list={list}
                        tasks={tasks}
                        notes={notes}
                        variant="grid"
                        onOpen={() => openList(list)}
                        onLongPress={(position) =>
                          showContextMenu(list, position)
                        }
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </section>

      {/* The one Add button.

          It was in the header, which put it at the far top corner of a
          one-handed reach on the tab you use most. Floating bottom-right is
          where a phone expects it, and there is deliberately no second one up
          top — two Add buttons on one screen is a question, not an affordance.

          Portalled to the body, and that is not optional: NativeTransition wraps
          this screen in a `transform`, which makes it the containing block for
          any `position: fixed` child. Rendered in place the button measured
          itself against the transition wrapper instead of the viewport and never
          appeared. Same trap the detail sheets hit.

          It clears the tab bar and the device inset itself, since being fixed it
          takes no space in the document — the grid above reserves the matching
          room so the last row never rests underneath it. */}
      {mounted &&
        createPortal(
          <motion.button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            aria-label="Create list"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
              delay: 0.15,
            }}
            whileTap={{ scale: 0.92 }}
            className="fixed right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#6366F1] text-white shadow-lg shadow-[#6366F1]/30 active:bg-[#4f52d6]"
            // Sits just clear of the tab bar, on the Settings side, so it is in
            // the same place at every scroll position and under the thumb that
            // is already down there.
            style={{ bottom: "calc(56px + var(--safe-bottom) + 4px)" }}
          >
            <Plus size={26} strokeWidth={2.4} />
          </motion.button>,
          document.body,
        )}

      <NativeContextMenu
        origin={menuOrigin}
        items={menuItems}
        onClose={() => setMenuOrigin(null)}
      />

      {/* The walkthrough's material, on demand. Mounted here because the control
          that opens it is here, and because this is the screen most of it is
          about. */}
      <NativeHelpSheet
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      <CreateListModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
        existingLists={userLists}
      />

      <EditListPopup
        isOpen={listToEdit !== null}
        onClose={() => setListToEdit(null)}
        onSubmit={handleEditSubmit}
        existingLists={userLists}
        currentList={listToEdit}
      />

      {/* Delete confirmation, matching the iOS .alert with a destructive action */}
      {listToDelete && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-8">
          <div
            className={`w-full max-w-[270px] overflow-hidden rounded-[14px] text-center ${
              isDark ? "bg-gray-800 text-white" : "bg-white text-gray-900"
            }`}
          >
            <div className="px-4 py-4">
              <p className="text-[17px] font-semibold">Delete List?</p>
              <p className="pt-1 text-[13px] text-gray-500">
                This action cannot be undone.
              </p>
            </div>
            <div
              className={`flex border-t ${
                isDark ? "border-white/10" : "border-black/10"
              }`}
            >
              <button
                type="button"
                onClick={() => setListToDelete(null)}
                className={`flex-1 py-3 text-[17px] ${
                  isDark ? "border-white/10" : "border-black/10"
                } border-r`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={deleteList}
                className="flex-1 py-3 text-[17px] font-semibold text-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
