"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck,
  CheckCircle,
  Star,
  Plus,
  Menu,
  X,
  ListTodo,
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
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import CreateListModal from "@/components/popupModels/ListPopup";
import { List, ListColor } from "@/types/schema";
import EditListPopup from "@/components/popupModels/EditListPopup";

interface SideNavProps {
  children?: React.ReactNode;
}

const SideNavigation: React.FC<SideNavProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_isTablet, setIsTablet] = useState<boolean>(false);
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

        const res = await fetch("/api/lists");
        if (!res.ok) throw new Error("Failed to fetch lists");
        const { data } = await res.json();

        // Sort: pinned first, then newest
        const sorted = (data || []).sort(
          (a: List, b: List) => {
            if (a.is_pinned && !b.is_pinned) return -1;
            if (!a.is_pinned && b.is_pinned) return 1;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          }
        );
        setLists(sorted);
      } catch (error) {
        console.error("Error fetching lists:", error);
      } finally {
        setIsLoadingLists(false);
      }
    },
    [isLoggedIn, user, lists.length]
  );
  const refreshCollectionsColor = useCallback(
    async (newColor: string, listId: string) => {
      try {
        if (!user?.id) return;
        // Find the "General" collection for this list, then update its color
        const res = await fetch(`/api/collections?list_id=${listId}`);
        if (!res.ok) return;
        const { data: cols } = await res.json();
        const general = (cols || []).find(
          (c: { id: string; collection_name: string | null }) =>
            c.collection_name?.toLowerCase().trim() === "general"
        );
        if (!general) return;
        await fetch("/api/collections", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: general.id, bg_color_hex: newColor }),
        });
      } catch (error) {
        console.error("Error in refreshCollectionsColor:", error);
      }
    },
    [user?.id]
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

  const currentListId = useMemo(() => {
    return pathname.includes("/List/") ? pathname.split("/List/")[1] : null;
  }, [pathname]);

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
    navigateTo(`/list/${listId}`);
  };

  const handleTogglePinList = async (listId: string): Promise<void> => {
    if (!user) return;

    const currentList = lists.find((list) => list.id === listId);
    if (!currentList) return;

    const res = await fetch("/api/lists", {
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
        list.id === listId ? { ...list, is_pinned: !list.is_pinned } : list
      )
    );
  };

  const handleEditList = (list: List): void => {
    setListToEdit(list);
    setIsEditListModalOpen(true);
  };

  const handleEditListSubmit = async (
    listId: string,
    listData: { list_name: string; bg_color_hex: ListColor }
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
            : list
        )
      );

      // If color changed, update General collections to match
      if (colorChanged) {
        console.log(
          "Color changed, updating General collections to:",
          listData.bg_color_hex
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
          })
        );
      }

      return { success: true };
    } catch (err) {
      console.error("Error handling list edit:", err);
      return { success: false, error: err };
    }
  };
  const handleCreateList = async (
    listData: Omit<List, "id" | "created_at">
  ): Promise<{ success: boolean; error?: unknown }> => {
    try {
      setIsLoadingLists(true);

      if (!user) {
        console.error("No user found when creating list");
        setIsLoadingLists(false);
        return { success: false, error: "No authenticated user" };
      }

      // Check for duplicate name via API
      const checkRes = await fetch("/api/lists");
      if (checkRes.ok) {
        const { data: existingLists } = await checkRes.json();
        const dup = (existingLists || []).find(
          (l: List) =>
            l.list_name?.trim().toLowerCase() ===
            listData.list_name?.trim().toLowerCase()
        );
        if (dup) {
          await fetchLists();
          navigateTo(`/list/${dup.id}`);
          setIsLoadingLists(false);
          return { success: true };
        }
      }

      // Create list
      const createRes = await fetch("/api/lists", {
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
      await fetch("/api/collections", {
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
      navigateTo(`/list/${createdList.id}`);
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

      const res = await fetch("/api/lists", {
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
            navigateTo(`/list/${nextList.id}`);
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

  // Check for tablet screen size
  const checkScreenSize = (): void => {
    setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
  };

  useEffect(() => {
    setIsMounted(true);
    checkScreenSize(); // Initial check

    window.addEventListener("resize", checkScreenSize);

    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, []);

  if (!isMounted) return null;

  // Toggle sidebar button outside sidebar for when it's closed
  const SidebarToggleButton = () => (
    <button
      onClick={toggleSidebar}
      className={`fixed top-4 left-4 z-50 ${
        sidebarOpen ? "hidden" : "flex"
      } h-10 w-10 items-center justify-center rounded-md ${
        isDark
          ? "bg-gray-800/50 text-orange-400 hover:bg-gray-700"
          : "bg-white text-sky-500 hover:bg-gray-100"
      } shadow-md transition-colors`}
      aria-label="Open menu"
    >
      <Menu size={24} />
    </button>
  );

  if (!isLoggedIn) {
    return <>{children}</>;
  }

  return (
    <div className="flex ">
      <SidebarToggleButton />

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <nav
        className={`fixed left-0 top-0 h-full ${sidebarOpen ? "w-64" : "w-0"} transition-all duration-300 z-40 overflow-hidden backdrop-blur-md border-r ${
          isDark
            ? "bg-gradient-to-b from-gray-900/90 via-gray-800/85 to-gray-900/90 text-gray-200 border-gray-600/30 shadow-xl shadow-gray-900/30"
            : "bg-gradient-to-b from-white/90 via-gray-50/85 to-white/90 text-gray-800 border-gray-300/30 shadow-xl shadow-gray-300/30"
        }`}
      >
        <div className={`flex flex-col h-full`}>
          {/* Sidebar Header with Logo */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-orange-500 rounded-md mr-2 flex items-center justify-center text-white font-bold">
                <Image
                  src="/app-icon.jpeg"
                  alt="App Icon"
                  width={32}
                  height={32}
                  className="rounded-md"
                  priority
                />
              </div>
              <div
                className={`text-2xl font-bold ${
                  isDark ? "text-orange-400" : "text-sky-500"
                }`}
              >
                LIST IT
              </div>
            </div>
            <button
              onClick={toggleSidebar}
              className={`rounded-md p-1 ${
                isDark
                  ? "text-gray-300 hover:text-orange-400"
                  : "text-gray-700 hover:text-orange-500"
              } transition-colors`}
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
          </div>

          {/* Main navigation links */}
          <div
            className={`flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-elegant ${isDark ? "scrollbar-dark" : "scrollbar-light"}`}
          >
            <style jsx>{`
              .scrollbar-elegant {
                scrollbar-width: thin;
              }

              .scrollbar-elegant::-webkit-scrollbar {
                width: 6px;
              }

              .scrollbar-light::-webkit-scrollbar-track {
                background: rgba(243, 244, 246, 0.5);
                border-radius: 3px;
              }

              .scrollbar-light::-webkit-scrollbar-thumb {
                background: linear-gradient(180deg, #0ea5e9, #06b6d4);
                border-radius: 3px;
                transition: all 0.3s ease;
              }

              .scrollbar-light::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(180deg, #0284c7, #0891b2);
                box-shadow: 0 0 10px rgba(14, 165, 233, 0.3);
              }

              .scrollbar-dark::-webkit-scrollbar-track {
                background: rgba(55, 65, 81, 0.5);
                border-radius: 3px;
              }

              .scrollbar-dark::-webkit-scrollbar-thumb {
                background: linear-gradient(180deg, #fb923c, #f97316);
                border-radius: 3px;
                transition: all 0.3s ease;
              }

              .scrollbar-dark::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(180deg, #ea580c, #dc2626);
                box-shadow: 0 0 10px rgba(251, 146, 60, 0.4);
              }

              /* For Firefox */
              .scrollbar-light {
                scrollbar-color: #0ea5e9 rgba(243, 244, 246, 0.5);
              }

              .scrollbar-dark {
                scrollbar-color: #fb923c rgba(55, 65, 81, 0.5);
              }
            `}</style>
            {/* Home & About links */}
            <div className="space-y-1 mb-3">
              <button
                title="go to home page"
                onClick={() => navigateTo("/landingpage")}
                className={`flex w-full items-center px-3 py-2 rounded-md ${
                  currentPath === "/landingpage"
                    ? isDark
                      ? "bg-gray-800"
                      : "bg-gray-100"
                    : ""
                } ${
                  isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
                } transition-colors group`}
              >
                <Home
                  className={`h-5 w-5 ${
                    isDark
                      ? "text-gray-400 group-hover:text-orange-400"
                      : "text-gray-500 group-hover:text-orange-500"
                  }`}
                />
                <span className="ml-3 text-sm font-medium">Home</span>
              </button>
            </div>

            {/* Divider */}
            <div
              className={`my-3 border-t ${
                isDark ? "border-gray-800" : "border-gray-200"
              }`}
            />

            {/* Dashboard & feature links */}
            <div className="space-y-1 mb-3">
              <button
                title="Dashboard page"
                onClick={() => navigateTo("/dashboard")}
                className={`flex w-full items-center px-3 py-2 rounded-md ${
                  currentPath === "/dashboard"
                    ? isDark
                      ? "bg-gray-800"
                      : "bg-gray-100"
                    : ""
                } ${
                  isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
                } transition-colors group`}
              >
                <LayoutDashboard
                  className={`h-5 w-5 ${
                    isDark
                      ? "text-gray-400 group-hover:text-orange-400"
                      : "text-gray-500 group-hover:text-orange-500"
                  }`}
                />
                <span className="ml-3 text-sm font-medium">Dashboard</span>
              </button>
              <button
                title="Task Due Today"
                onClick={() => navigateTo("/today")}
                className={`flex w-full items-center px-3 py-2 rounded-md ${
                  currentPath === "/today"
                    ? isDark
                      ? "bg-gray-800"
                      : "bg-gray-100"
                    : ""
                } ${
                  isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
                } transition-colors group`}
              >
                <CalendarCheck
                  className={`h-5 w-5 ${
                    isDark
                      ? "text-gray-400 group-hover:text-orange-400"
                      : "text-gray-500 group-hover:text-orange-500"
                  }`}
                />
                <span className="ml-3 text-sm font-medium">Today</span>
              </button>
              <button
                title="Task Due Tomorrow"
                onClick={() => navigateTo("/tomorrow")}
                className={`flex w-full items-center px-3 py-2 rounded-md ${
                  currentPath === "/tomorrow"
                    ? isDark
                      ? "bg-gray-800"
                      : "bg-gray-100"
                    : ""
                } ${
                  isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
                } transition-colors group`}
              >
                <CalendarPlus2
                  className={`h-5 w-5 ${
                    isDark
                      ? "text-gray-400 group-hover:text-orange-400"
                      : "text-gray-500 group-hover:text-orange-500"
                  }`}
                />
                <span className="ml-3 text-sm font-medium">Tomorrow</span>
              </button>
              <button
                title="Task with Priority"
                onClick={() => navigateTo("/priority")}
                className={`flex w-full items-center px-3 py-2 rounded-md ${
                  currentPath === "/priority"
                    ? isDark
                      ? "bg-gray-800"
                      : "bg-gray-100"
                    : ""
                } ${
                  isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
                } transition-colors group`}
              >
                <Star
                  className={`h-5 w-5 ${
                    isDark
                      ? "text-gray-400 group-hover:text-orange-400"
                      : "text-gray-500 group-hover:text-orange-500"
                  }`}
                />
                <span className="ml-3 text-sm font-medium">Priority</span>
              </button>
              <button
                title="thats not complete"
                onClick={() => navigateTo("/notcomplete")}
                className={`flex w-full items-center px-3 py-2 rounded-md ${
                  currentPath === "/notcomplete"
                    ? isDark
                      ? "bg-gray-800"
                      : "bg-gray-100"
                    : ""
                } ${
                  isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
                } transition-colors group`}
              >
                <CircleMinus
                  className={`h-5 w-5 ${
                    isDark
                      ? "text-gray-400 group-hover:text-orange-400"
                      : "text-gray-500 group-hover:text-orange-500"
                  }`}
                />
                <span className="ml-3 text-sm font-medium">
                  Not Completed Tasks
                </span>
              </button>
              <button
                title="Overdue Tasks"
                onClick={() => navigateTo("/overdue")}
                className={`flex w-full items-center px-3 py-2 rounded-md ${
                  currentPath === "/overdue"
                    ? isDark
                      ? "bg-gray-800"
                      : "bg-gray-100"
                    : ""
                } ${
                  isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
                } transition-colors group`}
              >
                <ClockAlert
                  className={`h-5 w-5 ${
                    isDark
                      ? "text-gray-400 group-hover:text-orange-400"
                      : "text-gray-500 group-hover:text-orange-500"
                  }`}
                />
                <span className="ml-3 text-sm font-medium">Overdue Tasks</span>
              </button>
              <button
                title="Completed Tasks"
                onClick={() => navigateTo("/completed")}
                className={`flex w-full items-center px-3 py-2 rounded-md ${
                  currentPath === "/completed"
                    ? isDark
                      ? "bg-gray-800"
                      : "bg-gray-100"
                    : ""
                } ${
                  isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
                } transition-colors group`}
              >
                <CheckCircle
                  className={`h-5 w-5 ${
                    isDark
                      ? "text-gray-400 group-hover:text-orange-400"
                      : "text-gray-500 group-hover:text-orange-500"
                  }`}
                />
                <span className="ml-3 text-sm font-medium">Completed</span>
              </button>
            </div>

            {/* My Lists section - Compressed Design */}
            <div
              className={`my-3 border-t ${
                isDark ? "border-gray-800" : "border-gray-200"
              }`}
            />

            {/* My Lists section - Clean Design with 3D Cards */}
            <div
              className={`my-3 border-t ${
                isDark ? "border-gray-800" : "border-gray-200"
              }`}
            />

            {/* Section Header */}
            <div className="px-3 py-2">
              <h3
                className={`text-xs font-semibold uppercase tracking-wide ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                My Lists ({isLoadingLists ? "..." : sortedLists.length})
              </h3>
            </div>

            {/* Create List Button */}
            <div className="px-3 mb-4">
              <button
                onClick={() => setIsCreateListModalOpen(true)}
                disabled={isLoadingLists}
                className={`flex w-full items-center px-4 py-3 rounded-lg border transition-all duration-200 ${
                  isDark
                    ? "bg-gray-800/50 border-gray-700 hover:bg-gray-800 hover:border-orange-400/50 text-gray-300 hover:text-orange-400"
                    : "bg-white border-gray-200 hover:bg-sky-50 hover:border-sky-300 text-gray-700 hover:text-sky-600"
                } ${
                  isLoadingLists
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer shadow-sm hover:shadow-md"
                }`}
                aria-label="Create new list"
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                    isDark ? "bg-gray-700" : "bg-gray-100"
                  }`}
                >
                  <Plus className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium">Create New List</div>
                  <div
                    className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}
                  >
                    Organize your tasks and notes
                  </div>
                </div>
              </button>
            </div>

            {/* Lists Container - Updated Layout */}
            <div className="px-3 space-y-3">
              {isLoadingLists ? (
                <div className="flex justify-center py-4">
                  <div
                    className={`animate-spin rounded-full h-5 w-5 border-b-2 ${isDark ? "border-orange-400" : "border-sky-500"}`}
                  ></div>
                </div>
              ) : sortedLists.length === 0 ? (
                <div
                  className={`text-center py-6 px-4 rounded-lg ${
                    isDark
                      ? "bg-gray-800/30 text-gray-400"
                      : "bg-gray-50 text-gray-500"
                  }`}
                >
                  <ListTodo className={`w-6 h-6 mx-auto mb-2 opacity-50`} />
                  <p className="text-sm">No lists yet</p>
                  <p className="text-xs mt-1 opacity-75">
                    Create your first list above
                  </p>
                </div>
              ) : (
                sortedLists.map((list) => (
                  <div
                    key={list.id}
                    className={`group relative transition-all duration-200 ${
                      currentListId === list.id.toString()
                        ? isDark
                          ? "transform translate-x-1"
                          : "transform translate-x-1"
                        : ""
                    }`}
                  >
                    {/* 3D Card */}
                    <div
                      className={`relative rounded-lg border transition-all duration-200 ${
                        currentListId === list.id.toString()
                          ? isDark
                            ? "bg-gray-800 border-orange-400/60 shadow-lg shadow-orange-400/20"
                            : "bg-sky-50 border-sky-400/60 shadow-lg shadow-sky-500/20"
                          : isDark
                            ? "bg-gray-800/60 border-gray-700 hover:bg-gray-800 hover:border-gray-600 shadow-md hover:shadow-lg"
                            : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow-md"
                      }`}
                      style={{
                        transform:
                          currentListId === list.id.toString()
                            ? "translateY(-2px)"
                            : "translateY(0px)",
                      }}
                    >
                      {/* Pinned Indicator */}
                      {list.is_pinned && (
                        <div
                          className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                            isDark ? "bg-orange-400" : "bg-sky-500"
                          } shadow-lg`}
                        />
                      )}

                      {/* Card Content - Updated Layout */}
                      <div className="p-4">
                        {/* First Row - List Name and Icon */}
                        <div
                          onClick={() => handleListClick(list.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleListClick(list.id);
                            }
                          }}
                          className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-1 rounded-lg mb-3"
                        >
                          <div className="flex items-center">
                            {/* List Icon */}
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 shadow-sm"
                              style={{
                                backgroundColor: list.bg_color_hex
                                  ? `${list.bg_color_hex}25`
                                  : isDark
                                    ? "#374151"
                                    : "#F3F4F6",
                                border: `1px solid ${list.bg_color_hex || (isDark ? "#4B5563" : "#E5E7EB")}40`,
                              }}
                            >
                              <ListTodo
                                className="w-4 h-4"
                                style={{
                                  color:
                                    list.bg_color_hex ||
                                    (isDark ? "#9CA3AF" : "#6B7280"),
                                }}
                              />
                            </div>

                            {/* List Name */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center">
                                <span
                                  className={`font-medium text-sm truncate ${
                                    isDark ? "text-gray-200" : "text-gray-800"
                                  }`}
                                >
                                  {list.list_name}
                                </span>
                                {list.is_pinned && (
                                  <Pin
                                    className={`w-3 h-3 ml-2 flex-shrink-0 ${
                                      isDark
                                        ? "text-orange-400"
                                        : "text-sky-500"
                                    }`}
                                    fill="currentColor"
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Second Row - Action Icons */}
                        <div className="flex justify-end space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePinList(list.id);
                            }}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                              list.is_pinned
                                ? isDark
                                  ? "bg-orange-400/20 text-orange-400 hover:bg-orange-400/30 shadow-sm"
                                  : "bg-sky-100 text-sky-600 hover:bg-sky-200 shadow-sm"
                                : isDark
                                  ? "bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-orange-400 shadow-sm"
                                  : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-sky-600 shadow-sm"
                            }`}
                            title={list.is_pinned ? "Unpin" : "Pin"}
                            disabled={isDeletingList}
                          >
                            <Pin className="w-4 h-4" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditList(list);
                            }}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                              isDark
                                ? "bg-gray-700 text-gray-400 hover:bg-blue-500/20 hover:text-blue-400 shadow-sm"
                                : "bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600 shadow-sm"
                            }`}
                            title="Edit"
                            disabled={isDeletingList}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setListToDelete(list.id);
                              setIsDeleteListModalOpen(true);
                            }}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                              isDark
                                ? "bg-gray-700 text-gray-400 hover:bg-red-500/20 hover:text-red-400 shadow-sm"
                                : "bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 shadow-sm"
                            }`}
                            title="Delete"
                            disabled={isDeletingList}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer with settings, theme toggle and sign out */}
          <div
            className={`p-4 border-t ${isDark ? "border-gray-800" : "border-gray-200"}`}
          >
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => navigateTo("/setting")}
                className={`flex items-center px-3 py-2 rounded-md ${
                  currentPath === "/setting"
                    ? isDark
                      ? "bg-gray-800"
                      : "bg-gray-100"
                    : ""
                } ${
                  isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
                } transition-colors group`}
              >
                <Settings
                  className={`h-5 w-5 ${
                    currentPath === "/setting"
                      ? isDark
                        ? "text-orange-400"
                        : "text-sky-500"
                      : isDark
                        ? "text-gray-400 group-hover:text-orange-400"
                        : "text-gray-500 group-hover:text-sky-500"
                  }`}
                />
                <span className="ml-3 text-sm font-medium">Settings</span>
              </button>

              <div
                className={`my-2 border-t ${
                  isDark ? "border-gray-700" : "border-gray-300"
                }`}
              />

              <button
                onClick={toggleTheme}
                className={`flex items-center px-3 py-2 rounded-md ${
                  isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
                } transition-colors group`}
              >
                {isDark ? (
                  <Sun className="h-5 w-5 text-orange-400" />
                ) : (
                  <Moon className="h-5 w-5 text-sky-500" />
                )}
                <span className="ml-3 text-sm font-medium">
                  {isDark ? "Light Mode" : "Dark Mode"}
                </span>
              </button>
              <button
                onClick={handleLogout}
                className={`flex items-center px-3 py-2 rounded-md ${
                  isDark
                    ? "hover:bg-gray-800 text-red-400"
                    : "hover:bg-gray-100 text-red-500"
                } transition-colors group`}
              >
                <LogOut className="h-5 w-5" />
                <span className="ml-3 text-sm font-medium">Sign out</span>
              </button>
            </div>
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
