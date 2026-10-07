"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck,
  CheckCircle,
  Star,
  Plus,
  Menu,
  X,
  Trash2,
  AlertTriangle,
  CircleMinus,
  CalendarPlus2,
  ClockAlert,
  Pin,
  Home,
  Sun,
  Moon,
  LogOut,
  Settings,
  Edit3,
  type LucideIcon,
} from "lucide-react";
import { PRIMARY, SELECTED, DANGER } from "@/components/ui/tokens";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import CreateListModal from "@/components/popupModels/ListPopup";
import { List } from "@/types/schema";
import EditListPopup from "@/components/popupModels/editListPopup";
import { apiFetch } from "@/lib/apiFetch";
import { activeListId, listHref } from "@/lib/routes";
import { useIsNative } from "@/hooks/useIsNative";

/**
 * Surfaces for the sidebar, in both themes.
 *
 * The dark values are the Stage 1 palette the native app already ships
 * (`ui/tokens`); the light ones are its counterparts. Held as one object so a
 * row, a list entry and the footer cannot each invent their own grey.
 */
const SURFACE = {
  dark: {
    field: "#0B1222",
    // Opaque, not a translucent white. The row actions sit on top of the list
    // name and have to hide it, which a see-through surface cannot do.
    hover: "#141C2E",
    selected: SELECTED,
    border: "rgba(255,255,255,0.08)",
    divider: "rgba(255,255,255,0.06)",
    text: "#E2E8F0",
    muted: "#7C89A4",
  },
  light: {
    field: "#FFFFFF",
    hover: "#F1F5F9",
    selected: "#EEF2FF",
    border: "rgba(15,23,42,0.08)",
    divider: "rgba(15,23,42,0.06)",
    text: "#1E293B",
    muted: "#64748B",
  },
} as const;

type Surface = (typeof SURFACE)[keyof typeof SURFACE];

/**
 * The palette as CSS custom properties, set once on the wrapper.
 *
 * Hover used to be applied imperatively in onMouseEnter/onMouseLeave. An inline
 * style written straight onto the node is not something React owns, so it
 * survived a re-render: switching to light mode left whichever row the pointer
 * had last touched wearing its dark-theme hover colour. Hover belongs in CSS.
 */
function surfaceVars(s: Surface): React.CSSProperties {
  return {
    "--sb-field": s.field,
    "--sb-hover": s.hover,
    "--sb-selected": s.selected,
    "--sb-border": s.border,
    "--sb-divider": s.divider,
    "--sb-text": s.text,
    "--sb-muted": s.muted,
    "--sb-danger": DANGER,
    "--sb-primary": PRIMARY,
  } as React.CSSProperties;
}

/**
 * The built-in views.
 *
 * Seven buttons that differed only by icon, label and route were written out
 * in full, each carrying its own copy of the same six conditional class
 * strings. One list and one row component instead: changing how a nav row
 * looks is now one edit rather than seven.
 */
const VIEWS: {
  path: string;
  label: string;
  title: string;
  Icon: LucideIcon;
}[] = [
  {
    path: "/dashboard",
    label: "Dashboard",
    title: "Dashboard page",
    Icon: LayoutDashboard,
  },
  {
    path: "/today",
    label: "Today",
    title: "Tasks due today",
    Icon: CalendarCheck,
  },
  {
    path: "/tomorrow",
    label: "Tomorrow",
    title: "Tasks due tomorrow",
    Icon: CalendarPlus2,
  },
  { path: "/priority", label: "Priority", title: "Pinned tasks", Icon: Star },
  {
    path: "/notcomplete",
    label: "Not completed",
    title: "Tasks still open",
    Icon: CircleMinus,
  },
  {
    path: "/overdue",
    label: "Scheduled",
    title: "Tasks with a date",
    Icon: ClockAlert,
  },
  {
    path: "/completed",
    label: "Completed",
    title: "Completed tasks",
    Icon: CheckCircle,
  },
];

/**
 * One row in the sidebar.
 *
 * The active state is a 2px rail flush to the sidebar's left edge plus a tinted
 * surface. It replaces the lift-and-glow the cards used to carry: position in a
 * vertical list is the thing being communicated, so a vertical mark says it
 * without adding height or shadow.
 */
function NavRow({
  Icon,
  label,
  active,
  onClick,
  title,
  danger,
}: {
  Icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick: () => void;
  title?: string;
  danger?: boolean;
}) {
  const tone = danger
    ? "text-[var(--sb-danger)]"
    : active
      ? "text-[var(--sb-text)]"
      : "text-[var(--sb-muted)] hover:text-[var(--sb-text)]";

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`relative flex h-9 w-full items-center gap-3 rounded-lg px-3 text-left text-[13px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sb-primary)] ${tone} ${
        active ? "bg-[var(--sb-selected)]" : "hover:bg-[var(--sb-hover)]"
      }`}
    >
      {active && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-[var(--sb-primary)]"
        />
      )}
      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
      <span className="truncate">{label}</span>
    </button>
  );
}

interface SideNavProps {
  children?: React.ReactNode;
}

const SideNavigation: React.FC<SideNavProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isNative = useIsNative();
  const { theme, toggleTheme } = useTheme();
  const { isLoggedIn, user, logout } = useAuth();
  const isDark = theme === "dark";
  const currentPath = pathname;

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [isCreateListModalOpen, setIsCreateListModalOpen] =
    useState<boolean>(false);
  const [isEditListModalOpen, setIsEditListModalOpen] =
    useState<boolean>(false);
  const [isDeleteListModalOpen, setIsDeleteListModalOpen] =
    useState<boolean>(false);
  const [listToDelete, setListToDelete] = useState<string | null>(null);
  const [listToEdit, setListToEdit] = useState<List | null>(null);
  const [lists, setLists] = useState<List[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState<boolean>(true);
  const [isDeletingList, setIsDeletingList] = useState<boolean>(false);

  // Helper function to refresh collections when list color changes

  const fetchLists = useCallback(
    async (forceFetch = false) => {
      if (!isLoggedIn || !user) {
        setLists([]);
        setIsLoadingLists(false);
        return;
      }

      try {
        if (forceFetch || lists.length === 0) {
          setIsLoadingLists(true);
        }

        const res = await apiFetch("/api/lists");
        if (!res.ok) throw new Error("Failed to fetch lists");
        const { data } = await res.json();

        // Sort: pinned first, then newest
        const sorted = (data || []).sort((a: List, b: List) => {
          if (a.is_pinned && !b.is_pinned) return -1;
          if (!a.is_pinned && b.is_pinned) return 1;
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        });
        setLists(sorted);
      } catch (error) {
        console.error("Error fetching lists:", error);
      } finally {
        setIsLoadingLists(false);
      }
    },
    [isLoggedIn, user, lists.length],
  );
  const refreshCollectionsColor = useCallback(
    async (newColor: string, listId: string) => {
      try {
        if (!user?.id) return;
        // Find the "General" collection for this list, then update its color
        const res = await apiFetch(`/api/collections?list_id=${listId}`);
        if (!res.ok) return;
        const { data: cols } = await res.json();
        const general = (cols || []).find(
          (c: { id: string; collection_name: string | null }) =>
            c.collection_name?.toLowerCase().trim() === "general",
        );
        if (!general) return;
        await apiFetch("/api/collections", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: general.id, bg_color_hex: newColor }),
        });
      } catch (error) {
        console.error("Error in refreshCollectionsColor:", error);
      }
    },
    [user?.id],
  );
  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const sortedLists = useMemo(() => {
    return [...lists].sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return 0;
    });
  }, [lists]);

  // Reads either URL shape, since native navigates to /List?id=… — see listHref.
  const currentListId = useMemo(() => {
    return activeListId(pathname, searchParams);
  }, [pathname, searchParams]);

  const toggleSidebar = (): void => {
    setSidebarOpen((prev) => !prev);
  };

  const navigateTo = (path: string): void => {
    router.push(path);
    setSidebarOpen(false); // Always close the sidebar on navigation

    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handleListClick = (listId: string): void => {
    navigateTo(listHref(listId, isNative));
  };

  const handleTogglePinList = async (listId: string): Promise<void> => {
    if (!user) return;

    const currentList = lists.find((list) => list.id === listId);
    if (!currentList) return;

    const res = await apiFetch("/api/lists", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: listId, is_pinned: !currentList.is_pinned }),
    });

    if (!res.ok) {
      console.error("Error updating list pin status");
      return;
    }

    setLists((prevLists) =>
      prevLists.map((list) =>
        list.id === listId ? { ...list, is_pinned: !list.is_pinned } : list,
      ),
    );
  };

  const handleEditList = (list: List): void => {
    setListToEdit(list);
    setIsEditListModalOpen(true);
  };

  const handleEditListSubmit = async (
    listId: string,
    listData: { list_name: string; bg_color_hex: string },
  ): Promise<{ success: boolean; error?: unknown }> => {
    try {
      // Check if the color changed
      const currentList = lists.find((list) => list.id === listId);
      const colorChanged =
        currentList && currentList.bg_color_hex !== listData.bg_color_hex;

      // Update the local state immediately for better UX
      setLists((prevLists) =>
        prevLists.map((list) =>
          list.id === listId
            ? {
                ...list,
                list_name: listData.list_name,
                bg_color_hex: listData.bg_color_hex,
              }
            : list,
        ),
      );

      // If color changed, update General collections to match
      if (colorChanged) {
        console.log(
          "Color changed, updating General collections to:",
          listData.bg_color_hex,
        );
        await refreshCollectionsColor(listData.bg_color_hex, listId);
      }

      // Close the edit modal
      setIsEditListModalOpen(false);
      setListToEdit(null);

      // Refresh the lists from the server to ensure consistency
      await fetchLists(true); // Force refresh

      // Dispatch custom event to notify ListPage component about the update
      if (colorChanged) {
        window.dispatchEvent(
          new CustomEvent("listUpdated", {
            detail: {
              listId: listId,
              newColor: listData.bg_color_hex,
              listName: listData.list_name,
            },
          }),
        );
      }

      return { success: true };
    } catch (err) {
      console.error("Error handling list edit:", err);
      return { success: false, error: err };
    }
  };
  const handleCreateList = async (
    listData: Omit<List, "id" | "created_at">,
  ): Promise<{ success: boolean; error?: unknown }> => {
    try {
      setIsLoadingLists(true);

      if (!user) {
        console.error("No user found when creating list");
        setIsLoadingLists(false);
        return { success: false, error: "No authenticated user" };
      }

      // Check for duplicate name via API
      const checkRes = await apiFetch("/api/lists");
      if (checkRes.ok) {
        const { data: existingLists } = await checkRes.json();
        const dup = (existingLists || []).find(
          (l: List) =>
            l.list_name?.trim().toLowerCase() ===
            listData.list_name?.trim().toLowerCase(),
        );
        if (dup) {
          await fetchLists();
          navigateTo(listHref(dup.id, isNative));
          setIsLoadingLists(false);
          return { success: true };
        }
      }

      // Create list
      const createRes = await apiFetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(listData),
      });

      if (!createRes.ok) {
        const body = await createRes.json();
        console.error("Error creating list:", body.error);
        setIsLoadingLists(false);
        return { success: false, error: body.error };
      }

      const { data: createdList } = await createRes.json();

      // Create a default "General" collection for the new list
      await apiFetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          list_id: createdList.id,
          collection_name: "General",
          bg_color_hex: createdList.bg_color_hex,
        }),
      });

      setLists((prevLists) => [createdList, ...prevLists]);
      await fetchLists();
      setIsCreateListModalOpen(false);
      navigateTo(listHref(createdList.id, isNative));
      return { success: true };
    } catch (err) {
      console.error("Error handling list creation:", err);
      return { success: false, error: err };
    } finally {
      setIsLoadingLists(false);
    }
  };

  const handleDeleteList = async (listId: string): Promise<void> => {
    if (!user || isDeletingList) return;

    try {
      setIsDeletingList(true);

      const res = await apiFetch("/api/lists", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: listId }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to delete list");
      }

      navigateTo("/dashboard");
      setLists((prevLists) => prevLists.filter((list) => list.id !== listId));

      if (currentListId === listId) {
        if (lists.length > 1) {
          const nextList = lists.find((list) => list.id !== listId);
          if (nextList) {
            navigateTo(listHref(nextList.id, isNative));
          } else {
            navigateTo("/dashboard");
          }
        } else {
          navigateTo("/dashboard");
        }
      }
    } catch (error) {
      console.error("Error deleting list:", error);
    } finally {
      setListToDelete(null);
      setIsDeleteListModalOpen(false);
      setIsDeletingList(false);
    }
  };

  // Handle logout using auth context
  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
      router.push("/"); // Navigate to home after logout
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  if (!isLoggedIn) {
    return <>{children}</>;
  }

  const surface = isDark ? SURFACE.dark : SURFACE.light;

  return (
    <div className="flex" style={surfaceVars(surface)}>
      {/* Opens the sidebar when it is closed. Inline rather than a component
          declared in the render body, which React treated as a new type every
          pass and remounted. */}
      <button
        type="button"
        onClick={toggleSidebar}
        className={`fixed left-4 top-4 z-50 ${
          sidebarOpen ? "hidden" : "flex"
        } h-9 w-9 items-center justify-center rounded-lg border border-[var(--sb-border)] bg-[var(--sb-field)] text-[var(--sb-text)] transition-colors hover:bg-[var(--sb-hover)]`}
        aria-label="Open menu"
      >
        <Menu size={18} strokeWidth={1.75} />
      </button>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <nav
        className={`fixed left-0 top-0 z-40 h-full ${
          sidebarOpen ? "w-[260px]" : "w-0"
        } overflow-hidden border-r border-[var(--sb-border)] bg-[var(--sb-field)] text-[var(--sb-text)] transition-[width] duration-300`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--sb-divider)] px-4">
            <div className="flex items-center gap-2.5">
              <Image
                src="/app-icon.jpeg"
                alt=""
                width={24}
                height={24}
                className="rounded-md"
                priority
              />
              <span className="text-[13px] font-semibold tracking-[0.14em]">
                LIST IT
              </span>
            </div>
            <button
              type="button"
              onClick={toggleSidebar}
              className="rounded-md p-1 text-[var(--sb-muted)] transition-colors hover:text-[var(--sb-text)]"
              aria-label="Close menu"
            >
              <X size={18} strokeWidth={1.75} />
            </button>
          </div>

          {/* Scrollable body: built-in views, then the user's lists */}
          <div className="sidebar-scroll flex-1 overflow-y-auto px-3 py-3">
            <style jsx>{`
              .sidebar-scroll {
                scrollbar-width: thin;
                scrollbar-color: var(--sb-border) transparent;
              }
              .sidebar-scroll::-webkit-scrollbar {
                width: 6px;
              }
              .sidebar-scroll::-webkit-scrollbar-track {
                background: transparent;
              }
              .sidebar-scroll::-webkit-scrollbar-thumb {
                background: var(--sb-border);
                border-radius: 3px;
              }
            `}</style>

            <div className="space-y-0.5">
              <NavRow
                Icon={Home}
                label="Home"
                title="Go to the home page"
                active={currentPath === "/landingpage"}
                onClick={() => navigateTo("/landingpage")}
              />
            </div>

            <div className="my-3 border-t border-[var(--sb-divider)]" />

            {/* The built-in views. These keep their icons: being recognisable
                at a glance is the whole point of them, and it is what sets
                them apart from the lists below. */}
            <div className="space-y-0.5">
              {VIEWS.map(({ path, label, title, Icon }) => (
                <NavRow
                  key={path}
                  Icon={Icon}
                  label={label}
                  title={title}
                  active={currentPath === path}
                  onClick={() => navigateTo(path)}
                />
              ))}
            </div>

            <div className="my-3 border-t border-[var(--sb-divider)]" />

            {/* Lists */}
            <div className="mb-1 flex h-7 items-center justify-between px-3">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--sb-muted)]">
                My lists
                {!isLoadingLists && sortedLists.length > 0 && (
                  <span className="ml-1.5 font-normal tabular-nums opacity-70">
                    {sortedLists.length}
                  </span>
                )}
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateListModalOpen(true)}
                disabled={isLoadingLists}
                className="-mr-1 flex h-6 w-6 items-center justify-center rounded-md text-[var(--sb-muted)] transition-colors hover:bg-[var(--sb-hover)] hover:text-[var(--sb-text)] disabled:opacity-40"
                title="Create a list"
                aria-label="Create a list"
              >
                <Plus className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            <div className="space-y-0.5">
              {isLoadingLists ? (
                // Bars at the height of a real row, so the panel does not
                // resize when the lists arrive.
                <div className="space-y-0.5" aria-hidden="true">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex h-9 items-center px-3">
                      <div
                        className="h-2 animate-pulse rounded-full bg-[var(--sb-hover)]"
                        style={{ width: `${68 - i * 14}%` }}
                      />
                    </div>
                  ))}
                </div>
              ) : sortedLists.length === 0 ? (
                <p className="px-3 py-2 text-[12px] leading-relaxed text-[var(--sb-muted)]">
                  No lists yet. Create one to group your tasks and notes.
                </p>
              ) : (
                sortedLists.map((list) => {
                  const active = currentListId === list.id.toString();

                  return (
                    <div
                      key={list.id}
                      className={`group relative flex h-9 items-center rounded-lg transition-colors ${
                        active
                          ? "bg-[var(--sb-selected)]"
                          : "hover:bg-[var(--sb-hover)]"
                      }`}
                    >
                      {active && (
                        <span
                          aria-hidden="true"
                          className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-[var(--sb-primary)]"
                        />
                      )}

                      {/* The list itself. A list is its name and its colour:
                          the icon tile every row used to carry said nothing
                          the name did not already say. */}
                      <button
                        type="button"
                        onClick={() => handleListClick(list.id)}
                        className="flex h-full min-w-0 flex-1 items-center gap-2.5 rounded-lg px-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sb-primary)]"
                        title={list.list_name ?? undefined}
                      >
                        <span
                          aria-hidden="true"
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{
                            backgroundColor:
                              list.bg_color_hex || "var(--sb-muted)",
                          }}
                        />
                        <span className="truncate text-[13px] font-medium text-[var(--sb-text)]">
                          {list.list_name}
                        </span>
                        {list.is_pinned && (
                          <Pin
                            className="h-3 w-3 shrink-0 text-[var(--sb-muted)]"
                            strokeWidth={2}
                            fill="currentColor"
                            aria-label="Pinned"
                          />
                        )}
                      </button>

                      {/* Actions. Absolutely positioned so revealing them adds
                          no height, and siblings of the row button rather than
                          children of it: a button cannot nest inside a button,
                          which is what the old markup needed stopPropagation
                          to paper over. The gradient fades the name out under
                          them instead of cutting it off square. */}
                      <div
                        className={`absolute right-1.5 flex items-center gap-0.5 pl-5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 ${
                          active
                            ? "bg-gradient-to-r from-transparent to-[var(--sb-selected)] to-20%"
                            : "bg-gradient-to-r from-transparent to-[var(--sb-hover)] to-20%"
                        }`}
                      >
                        {(
                          [
                            {
                              key: "pin",
                              Icon: Pin,
                              label: list.is_pinned ? "Unpin" : "Pin",
                              onClick: () => handleTogglePinList(list.id),
                              tone: list.is_pinned
                                ? "text-[var(--sb-primary)]"
                                : "text-[var(--sb-muted)] hover:text-[var(--sb-text)]",
                            },
                            {
                              key: "edit",
                              Icon: Edit3,
                              label: "Edit",
                              onClick: () => handleEditList(list),
                              tone: "text-[var(--sb-muted)] hover:text-[var(--sb-text)]",
                            },
                            {
                              key: "delete",
                              Icon: Trash2,
                              label: "Delete",
                              onClick: () => {
                                setListToDelete(list.id);
                                setIsDeleteListModalOpen(true);
                              },
                              tone: "text-[var(--sb-muted)] hover:text-[var(--sb-danger)]",
                            },
                          ] as const
                        ).map(({ key, Icon, label, onClick, tone }) => (
                          <button
                            key={key}
                            type="button"
                            onClick={onClick}
                            disabled={isDeletingList}
                            title={label}
                            aria-label={`${label} ${list.list_name ?? "list"}`}
                            className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-[var(--sb-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sb-primary)] disabled:opacity-40 ${tone}`}
                          >
                            <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 space-y-0.5 border-t border-[var(--sb-divider)] p-2">
            <NavRow
              Icon={Settings}
              label="Settings"
              active={currentPath === "/setting"}
              onClick={() => navigateTo("/setting")}
            />
            <NavRow
              Icon={isDark ? Sun : Moon}
              label={isDark ? "Light mode" : "Dark mode"}
              onClick={toggleTheme}
            />
            <NavRow
              Icon={LogOut}
              label="Sign out"
              onClick={handleLogout}
              danger
            />
          </div>
        </div>
      </nav>

      {/* Render children */}
      <div className="w-full  pl-0 transition-all duration-300">{children}</div>

      {/* Render the CreateListModal component */}
      <CreateListModal
        isOpen={isCreateListModalOpen}
        onClose={() => setIsCreateListModalOpen(false)}
        onSubmit={handleCreateList}
        existingLists={lists}
      />

      {/* Render the EditListPopup component */}
      <EditListPopup
        isOpen={isEditListModalOpen}
        onClose={() => {
          setIsEditListModalOpen(false);
          setListToEdit(null);
        }}
        onSubmit={handleEditListSubmit}
        existingLists={lists}
        currentList={listToEdit}
      />

      {/* Delete List Confirmation Modal */}
      {isDeleteListModalOpen && listToDelete && (
        <>
          <div
            className="fixed inset-0 z-40 backdrop-blur-md bg-black/50 bg-opacity-50"
            onClick={() => !isDeletingList && setIsDeleteListModalOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div
              className={`w-full max-w-md pointer-events-auto p-6 rounded-lg shadow-xl mx-4 ${
                isDark ? "bg-gray-800" : "bg-white"
              }`}
            >
              <div className="mb-4 flex items-start">
                <div className="mr-3 flex-shrink-0">
                  <AlertTriangle
                    className={`h-6 w-6 ${isDark ? "text-red-400" : "text-red-500"}`}
                  />
                </div>
                <div>
                  <h2
                    className={`text-xl font-semibold ${isDark ? "text-gray-100" : "text-gray-800"}`}
                  >
                    Delete List
                  </h2>
                  <p
                    className={`mt-2 ${isDark ? "text-gray-300" : "text-gray-600"}`}
                  >
                    Are you sure you want to delete this list? This will remove
                    all collections, tasks, and notes associated with it. This
                    action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setIsDeleteListModalOpen(false)}
                  className={`px-4 py-2 rounded-md ${
                    isDark
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  } ${isDeletingList ? "opacity-50 cursor-not-allowed" : ""}`}
                  disabled={isDeletingList}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteList(listToDelete)}
                  className={`px-4 py-2 rounded-md ${
                    isDark ? "bg-red-600" : "bg-red-500"
                  } hover:bg-red-600 text-white ${
                    isDeletingList ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={isDeletingList}
                >
                  {isDeletingList ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Deleting...
                    </span>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SideNavigation;
