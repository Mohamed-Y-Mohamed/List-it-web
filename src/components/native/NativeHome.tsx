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

import React, { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import {
  ArrowUpDown,
  ListChecks,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/apiFetch";
import { appPath, listHref } from "@/lib/routes";
import { useDueTodayNotifications } from "@/hooks/useDueTodayNotifications";
import type { List } from "@/types/schema";
import CreateListModal from "@/components/popupModels/ListPopup";
import EditListPopup from "@/components/popupModels/editListPopup";
import NativeContextMenu, {
  type ContextMenuItem,
} from "./NativeContextMenu";
import NativeListCard from "./NativeListCard";
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
  ["Today", "calendar", "#007AFF", "/today"],
  ["Tomorrow", "calendar.badge.clock", "#5856D6", "/tomorrow"],
  ["Priority", "star.fill", "#FF9500", "/priority"],
  ["Completed", "checkmark.circle", "#34C759", "/completed"],
  ["Not Completed", "circle", "#8E8E93", "/notcomplete"],
  ["Overdue", "exclamationmark.circle", "#FF3B30", "/overdue"],
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

export default function NativeHome() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === "dark";

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

  const [menuOrigin, setMenuOrigin] = useState<{ x: number; y: number } | null>(
    null
  );
  const [menuItems, setMenuItems] = useState<ContextMenuItem[]>([]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [listToEdit, setListToEdit] = useState<List | null>(null);
  const [listToDelete, setListToDelete] = useState<List | null>(null);

  // These are the user's open, undeleted tasks — exactly the set a due-today
  // reminder should consider. Scheduling from here means it refreshes whenever
  // the screen does, without a second fetch.
  //
  // The loaded flag matters: an empty `tasks` means "not fetched yet" before the
  // first load resolves and "nothing open" after it, and only the second of those
  // should reach the scheduler. It is what ticking off the last task looks like.
  useDueTodayNotifications(tasks, !isLoading);

  const matchesSearch = useCallback(
    (list: List) =>
      !search.trim() ||
      (list.list_name ?? "").toLowerCase().includes(search.trim().toLowerCase()),
    [search]
  );

  const visibleDefaultLists = useMemo(
    () => DEFAULT_LISTS.filter(matchesSearch),
    [matchesSearch]
  );

  // Any `is_default` rows the API returns describe the same built-in views that
  // DEFAULT_LISTS already covers, so they are dropped here rather than shown twice.
  const userLists = useMemo(
    () => lists.filter((list) => !list.is_default),
    [lists]
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
    [userLists, matchesSearch]
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
    [router]
  );

  const togglePin = useCallback(
    async (list: List) => {
      // Reflect it straight away; the card is under the user's finger.
      setLists((previous) =>
        previous.map((item) =>
          item.id === list.id ? { ...item, is_pinned: !item.is_pinned } : item
        )
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
    [refreshData, setLists]
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
          }
        );
      }

      setMenuItems(items);
      setMenuOrigin(position);
    },
    [togglePin]
  );

  // Sorting is instant and reversible, so the chip commits on tap with no confirm
  // step. The haptic is the receipt — on a grid of small cards the reorder is not
  // always visible from the top of the screen.
  const selectSort = useCallback((option: SortOption) => {
    setSort(option);
    void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
  }, []);

  const handleCreateSubmit = useCallback(
    async (
      listData: Omit<List, "id" | "created_at" | "tasks" | "notes" | "collections">
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
            listData.list_name?.trim().toLowerCase()
        );

        if (created) {
          setIsCreateOpen(false);
          setLists(data ?? []);
          router.push(listHref(created.id, true));
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

      setIsCreateOpen(false);
      await refreshData();
      router.push(listHref(created.id, true));
      return { success: true };
    },
    [refreshData, setLists, router]
  );

  const handleEditSubmit = useCallback(
    async (
      listId: string,
      listData: { list_name: string; bg_color_hex: string }
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
    [refreshData]
  );

  const headingClass = "text-[24px] font-bold";
  // Text colour only. The background used to be part of this — a flat bg-gray-950
  // or bg-white — but it now comes from the gradient layer below, and a colour on
  // the root would paint straight over that `-z-10` child and hide it.
  const surface = isDark ? "text-white" : "text-gray-900";

  return (
    // No background and no min-height of its own. Both come from the secure
    // layout's wrapper now: it draws NativeSurface behind every screen, and it is
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
            <p
              className={`text-[13px] font-medium ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Welcome back 👋
            </p>
            <h1 className="truncate text-[24px] font-bold leading-tight tracking-[-0.02em]">
              {user?.user_metadata?.full_name || user?.email || "…"}
            </h1>
          </div>
          {/* Creating a list was the one thing in the old toolbar menu that had
              nowhere else to go, so it gets the slot the menu used to occupy —
              named for what it does rather than hidden behind "More options". */}
          {/* Creating a list was the one thing in the old toolbar menu that had
              nowhere else to go, so it gets the slot the menu used to occupy —
              named for what it does rather than hidden behind "More options". */}
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            aria-label="Create list"
            className="touch-target -mr-2 flex shrink-0 items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/10"
          >
            <Plus size={24} strokeWidth={2.2} />
          </button>
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
          <div className="flex items-center gap-2 pb-4">
            <h2 className={headingClass}>Pinned Lists</h2>
            <CountBadge count={pinnedLists.length} />
          </div>
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

      {/* The heading, its sort control and the long-press hint only earn their
          space once there is something to sort and something to hold. On a first
          run the create prompt below stands on its own. */}
      {!isFirstRun && (
        <>
          <section className="px-4">
            <div className="flex items-center gap-2">
              <h2 className={headingClass}>Your Lists</h2>
              <CountBadge count={userLists.length} />
              <span className="flex-1" />
              {/* Sort lives up here in the heading rather than as a row of chips
                  above the grid. Four options are not worth the vertical space a
                  permanent control costs on a screen whose job is showing lists,
                  and the sort is set once and rarely changed. */}
              <button
                type="button"
                onClick={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect();
                  setMenuItems(
                    SORT_ORDER.map((option) => ({
                      label:
                        SORT_LABELS[option] + (sort === option ? "  ✓" : ""),
                      icon: <ArrowUpDown size={18} />,
                      onSelect: () => selectSort(option),
                    }))
                  );
                  setMenuOrigin({ x: rect.right - 40, y: rect.bottom });
                }}
                className="touch-target flex items-center gap-1.5 text-[15px] text-blue-500 active:opacity-60"
              >
                <ArrowUpDown size={18} />
                Sort
              </button>
            </div>
            <p className="pt-1 text-[12px] text-gray-500">
              💡 Hold a list for more options
            </p>
          </section>

          {/* The 1px rule iOS draws under the section heading. At 50% opacity
              this was a hard black line cutting the screen in half; a hairline
              separates without competing with the cards under it. */}
          <div
            className={`mx-4 mt-3 h-px ${
              isDark ? "bg-white/10" : "bg-black/10"
            }`}
          />
        </>
      )}

      <section
        className="px-4 pt-3"
        style={{ paddingBottom: "2rem" }}
      >
        {state === "loading" ? (
          <div className="grid grid-cols-3 gap-2.5">
            {Array.from({ length: 6 }).map((_, index) => (
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
              Everything in List It lives inside a list. Create your first one to
              start adding tasks and notes.
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
            {/* Two groups, not one flowing grid. The built-in views are fixed
                and always sit on top; the user's own lists are what the sort
                control reorders. A rule between them makes that split visible
                instead of leaving the user to infer it from the icons. */}
            {visibleDefaultLists.length > 0 && (
              <div className="grid grid-cols-3 gap-2.5">
                {visibleDefaultLists.map((list) => (
                  <NativeListCard
                    key={list.id}
                    list={list}
                    tasks={tasks}
                    notes={notes}
                    variant="grid"
                    onOpen={() => router.push(appPath(list.href))}
                  />
                ))}
              </div>
            )}

            {visibleDefaultLists.length > 0 && sortedLists.length > 0 && (
              <div
                className={`my-5 h-px ${
                  isDark ? "bg-white/10" : "bg-black/10"
                }`}
              />
            )}

            {sortedLists.length > 0 && (
              <div className="grid grid-cols-3 gap-2.5">
                {sortedLists.map((list) => (
                  <NativeListCard
                    key={`${list.id}-${list.list_name}-${list.bg_color_hex}`}
                    list={list}
                    tasks={tasks}
                    notes={notes}
                    variant="grid"
                    onOpen={() => openList(list)}
                    onLongPress={(position) => showContextMenu(list, position)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <NativeContextMenu
        origin={menuOrigin}
        items={menuItems}
        onClose={() => setMenuOrigin(null)}
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
