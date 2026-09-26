"use client";

// The Android home screen, matching AllListsView from the published iOS app:
// a greeting, search, a horizontal row of pinned lists, then all lists in a
// three-column grid. Long-pressing a card opens its context menu; the toolbar menu
// holds settings, list creation and the six default list views.
//
// Rendered only in the native build — the web dashboard is untouched. See
// src/app/(secure)/dashboard/page.tsx.

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowUpDown,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Circle,
  LayoutDashboard,
  ListChecks,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
  Star,
  Trash2,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/apiFetch";
import { appPath, listHref } from "@/lib/routes";
import { useDueTodayNotifications } from "@/hooks/useDueTodayNotifications";
import type { List, Note, Task } from "@/types/schema";
import CreateListModal from "@/components/popupModels/ListPopup";
import EditListPopup from "@/components/popupModels/editListPopup";
import NativeContextMenu, {
  type ContextMenuItem,
} from "./NativeContextMenu";
import NativeListCard from "./NativeListCard";
import { CountBadge } from "./listVisuals";

// Mirrors SortOption in the iOS app.
type SortOption = "newest" | "oldest" | "az" | "za";

const SORT_LABELS: Record<SortOption, string> = {
  oldest: "Oldest",
  newest: "Newest",
  az: "A-Z",
  za: "Z-A",
};

// The six default views, in the order the iOS toolbar menu lists them.
const QUICK_ACTIONS = [
  { label: "Today's Tasks", href: "/today", icon: Calendar },
  { label: "Tomorrow's Tasks", href: "/tomorrow", icon: CalendarClock },
  { label: "Priority Tasks", href: "/priority", icon: Star },
  { label: "Completed Tasks", href: "/completed", icon: CheckCircle2 },
  { label: "Not Completed Tasks", href: "/notcomplete", icon: Circle },
  { label: "Overdue Tasks", href: "/overdue", icon: AlertCircle },
] as const;

/**
 * The built-in lists, always present at the top of the grid exactly as they are
 * on iOS. They are views over the user's tasks rather than rows in the `list`
 * table, so they are described here rather than fetched: there is nothing to
 * create, rename, pin or delete. `list_icon` carries the same SF Symbol names the
 * iOS app stores, so listVisuals maps them to the matching icon.
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

  const [lists, setLists] = useState<List[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("oldest");

  const [menuOrigin, setMenuOrigin] = useState<{ x: number; y: number } | null>(
    null
  );
  const [menuItems, setMenuItems] = useState<ContextMenuItem[]>([]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [listToEdit, setListToEdit] = useState<List | null>(null);
  const [listToDelete, setListToDelete] = useState<List | null>(null);

  // One pass for everything the screen shows. The counts under each card need all
  // of the user's open tasks and live notes, so they are fetched once here rather
  // than per card.
  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [listsRes, tasksRes, notesRes] = await Promise.all([
        apiFetch("/api/lists"),
        apiFetch("/api/tasks?is_deleted=false&is_completed=false"),
        apiFetch("/api/notes?is_deleted=false"),
      ]);

      if (listsRes.ok) setLists((await listsRes.json()).data ?? []);
      if (tasksRes.ok) setTasks((await tasksRes.json()).data ?? []);
      if (notesRes.ok) setNotes((await notesRes.json()).data ?? []);
    } catch (error) {
      console.error("Error loading lists screen:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // These are the user's open, undeleted tasks — exactly the set a due-today
  // reminder should consider. Scheduling from here means it refreshes whenever
  // the screen does, without a second fetch.
  useDueTodayNotifications(tasks);

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
        await loadData();
      }
    },
    [loadData]
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
  }, [listToDelete]);

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

  const showToolbarMenu = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      setMenuItems([
        {
          label: "Dashboard",
          icon: <LayoutDashboard size={18} />,
          onSelect: () => router.push(appPath("/stats")),
        },
        {
          label: "Settings",
          icon: <Settings size={18} />,
          onSelect: () => router.push(appPath("/setting")),
        },
        {
          label: "Create List",
          icon: <Plus size={18} />,
          onSelect: () => setIsCreateOpen(true),
        },
        ...QUICK_ACTIONS.map(({ label, href, icon: Icon }) => ({
          label,
          icon: <Icon size={18} />,
          onSelect: () => router.push(appPath(href)),
        })),
      ]);
      setMenuOrigin({ x: rect.right - 40, y: rect.bottom });
    },
    [router]
  );

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
      await loadData();
      router.push(listHref(created.id, true));
      return { success: true };
    },
    [loadData, router]
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
      await loadData();
      return { success: true };
    },
    [loadData]
  );

  const headingClass = "text-[24px] font-bold";
  const surface = isDark ? "bg-gray-950 text-white" : "bg-white text-gray-900";

  return (
    <div className={`min-h-screen ${surface}`}>
      {/* Navigation bar and search, pinned together. `pt-safe-top` clears the
          status bar and the opaque background means the grid scrolls underneath
          rather than colliding with it. */}
      <div
        className={`sticky top-0 z-30 pt-safe-top ${
          isDark ? "bg-gray-950" : "bg-white"
        }`}
      >
        <div className="flex items-center justify-between px-4">
        <h1 className="py-3 text-[17px] font-semibold">Welcome Back 👋</h1>
        <button
          type="button"
          onClick={showToolbarMenu}
          aria-label="More options"
          className="touch-target -mr-2 flex items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/10"
        >
          <SlidersHorizontal size={22} />
        </button>
      </div>

      {/* Search, which iOS places in the toolbar via .searchable */}
      <div className="px-4 pb-3">
        <div
          className={`flex items-center gap-2 rounded-[10px] px-3 py-2 ${
            isDark ? "bg-gray-800" : "bg-gray-100"
          }`}
        >
          <Search size={17} className="shrink-0 text-gray-500" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search List"
            aria-label="Search List"
            className="w-full bg-transparent outline-none placeholder:text-gray-500"
          />
        </div>
        </div>
      </div>

      <div className="px-4">
        <p className="pb-4 text-[20px] font-bold">
          {user?.user_metadata?.full_name || user?.email || "Loading..."}
        </p>
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

      <section className="px-4">
        <div className="flex items-center gap-2">
          <h2 className={headingClass}>Your Lists</h2>
          <CountBadge count={userLists.length} />
          <span className="flex-1" />
          <button
            type="button"
            onClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              setMenuItems(
                (Object.keys(SORT_LABELS) as SortOption[]).map((option) => ({
                  label:
                    SORT_LABELS[option] + (sort === option ? "  ✓" : ""),
                  icon: <ArrowUpDown size={18} />,
                  onSelect: () => setSort(option),
                }))
              );
              setMenuOrigin({ x: rect.right - 40, y: rect.bottom });
            }}
            className="flex items-center gap-1.5 text-[15px] text-blue-500 active:opacity-60"
          >
            <ArrowUpDown size={18} />
            Sort
          </button>
        </div>
        <p className="pt-1 text-[12px] text-gray-500">
          💡 Hold a list for more options
        </p>
      </section>

      {/* The 1px rule iOS draws under the section heading */}
      <div
        className={`mx-4 mt-3 h-px ${isDark ? "bg-white/50" : "bg-black/50"}`}
      />

      <section
        className="px-4 pt-3"
        style={{ paddingBottom: "2rem" }}
      >
        {isLoading ? (
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
        ) : sortedLists.length === 0 && visibleDefaultLists.length === 0 ? (
          // Equivalent of ContentUnavailableView on iOS
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <ListChecks size={48} className="text-gray-400" />
            <p className="text-[17px] font-semibold">No Lists</p>
            <p className="max-w-[16rem] text-[14px] text-gray-500">
              Create a List to start organising your tasks and notes.
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
        ) : (
          <div className="grid grid-cols-3 gap-2.5">
            {/* Built-in lists first and always, as on iOS. */}
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
