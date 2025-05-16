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
  Info,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import CreateListModal from "@/components/popupModels/ListPopup";
import { supabase } from "@/utils/client";
import { List } from "@/types/schema";

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
  const [isDeleteListModalOpen, setIsDeleteListModalOpen] =
    useState<boolean>(false);
  const [listToDelete, setListToDelete] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_isTablet, setIsTablet] = useState<boolean>(false);
  const [lists, setLists] = useState<List[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState<boolean>(true);
  const [isDeletingList, setIsDeletingList] = useState<boolean>(false);

  // Helper function to format date for Postgres
  const formatDateForPostgres = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  // Helper function to fetch lists
  const fetchLists = useCallback(
    async (forceFetch = false) => {
      if (!isLoggedIn || !user) {
        setLists([]);
        setIsLoadingLists(false);
        return;
      }

      try {
        // Only set loading if this isn't a background refresh
        if (forceFetch || lists.length === 0) {
          setIsLoadingLists(true);
        }

        // Request lists with proper ordering for consistent display
        const { data, error } = await supabase
          .from("list")
          .select("*")
          .eq("user_id", user.id)
          .order("is_pinned", { ascending: false }) // Pinned first
          .order("created_at", { ascending: false }); // Then newest first

        if (error) {
          throw error;
        }

        // Update the lists state with the fresh data
        setLists(data || []);
      } catch (error) {
        console.error("Error fetching lists:", error);
        // Don't clear lists on error to preserve user experience
      } finally {
        setIsLoadingLists(false);
      }
    },
    [isLoggedIn, user, lists.length]
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
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handleListClick = (listId: string): void => {
    navigateTo(`/List/${listId}`);
  };

  const handleTogglePinList = async (listId: string): Promise<void> => {
    if (!user) return;

    const currentList = lists.find((list) => list.id === listId);
    if (!currentList) return;

    const { error } = await supabase
      .from("list")
      .update({ is_pinned: !currentList.is_pinned })
      .eq("id", listId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error updating list pin status:", error);
      return;
    }

    setLists((prevLists) =>
      prevLists.map((list) =>
        list.id === listId ? { ...list, is_pinned: !list.is_pinned } : list
      )
    );
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

      // First, check if a list with the same name already exists
      const { data: existingLists, error: checkError } = await supabase
        .from("list")
        .select("id")
        .eq("user_id", user.id)
        .eq("list_name", listData.list_name?.trim())
        .limit(1);

      if (checkError) {
        console.error("Error checking existing lists:", checkError);
      } else if (existingLists && existingLists.length > 0) {
        // If a list with this name already exists, navigate to it instead of creating a duplicate
        await fetchLists();
        navigateTo(`/List/${existingLists[0].id}`);
        setIsLoadingLists(false);
        return { success: true };
      }

      // If no existing list was found, create a new one with created_at
      const { data: newList, error: createListError } = await supabase
        .from("list")
        .insert([
          {
            ...listData,
            user_id: user.id,
            created_at: formatDateForPostgres(new Date()),
          },
        ])
        .select();

      if (createListError) {
        console.error("Error creating list:", createListError);
        setIsLoadingLists(false);
        return { success: false, error: createListError };
      }

      if (!newList || newList.length === 0) {
        console.error("No list created");
        setIsLoadingLists(false);
        return { success: false, error: "No list created" };
      }

      const createdList = newList[0];

      // Create a default collection for the new list with created_at
      const { error: createCollectionError } = await supabase
        .from("collection")
        .insert([
          {
            list_id: createdList.id,
            collection_name: "General",
            bg_color_hex: createdList.bg_color_hex,
            user_id: user.id,
            created_at: formatDateForPostgres(new Date()),
          },
        ]);

      if (createCollectionError) {
        console.error(
          "Error creating General collection:",
          createCollectionError
        );
      }

      // Update the local lists state immediately to show the new list
      setLists((prevLists) => [createdList, ...prevLists]);

      // Also refresh lists from the server to ensure complete data
      await fetchLists();

      // Close the create list modal
      setIsCreateListModalOpen(false);

      // Navigate to the new list
      navigateTo(`/List/${createdList.id}`);
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

      // Get all collections for this list
      const { data: collections, error: collectionsQueryError } = await supabase
        .from("collection")
        .select("id")
        .eq("list_id", listId);

      if (collectionsQueryError) {
        throw collectionsQueryError;
      }

      const collectionIds = collections?.map((c) => c.id) || [];

      // Delete tasks related to collections in this list
      if (collectionIds.length > 0) {
        // Use 'in' filter for multiple collection IDs
        const { error: tasksError } = await supabase
          .from("task")
          .delete()
          .in("collection_id", collectionIds);

        if (tasksError) {
          console.error("Error deleting tasks from collections:", tasksError);
        }

        // Delete notes related to collections in this list
        const { error: notesError } = await supabase
          .from("note")
          .delete()
          .in("collection_id", collectionIds);

        if (notesError) {
          console.error("Error deleting notes from collections:", notesError);
        }
      }

      // Also delete any tasks directly associated with the list (not via collection)
      const { error: listTasksError } = await supabase
        .from("task")
        .delete()
        .eq("list_id", listId);

      if (listTasksError) {
        console.error("Error deleting list tasks:", listTasksError);
      }

      // Also delete any notes directly associated with the list (not via collection)
      const { error: listNotesError } = await supabase
        .from("note")
        .delete()
        .eq("list_id", listId);

      if (listNotesError) {
        console.error("Error deleting list notes:", listNotesError);
      }

      // Delete all collections for this list
      const { error: collectionsError } = await supabase
        .from("collection")
        .delete()
        .eq("list_id", listId);

      if (collectionsError) {
        console.error("Error deleting collections:", collectionsError);
      }

      // Finally delete the list itself
      const { error: listError } = await supabase
        .from("list")
        .delete()
        .eq("id", listId)
        .eq("user_id", user.id);

      if (listError) {
        throw listError;
      }

      navigateTo("/dashboard"); // Update local state
      setLists((prevLists) => prevLists.filter((list) => list.id !== listId));

      // If we deleted the current list, navigate to another list or dashboard
      if (currentListId === listId) {
        // If there are other lists, navigate to the first one
        if (lists.length > 1) {
          const nextList = lists.find((list) => list.id !== listId);
          if (nextList) {
            navigateTo(`/List/${nextList.id}`);
          } else {
            navigateTo("/dashboard");
          }
        } else {
          // If this was the last list, navigate to dashboard
          navigateTo("/dashboard");
        }
      }
    } catch (error) {
      console.error("Error deleting list:", error);
    } finally {
      // Close the modal and reset state
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
          ? "bg-gray-800 text-orange-400 hover:bg-gray-700"
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
      {/* Toggle button visible when sidebar is closed */}
      <SidebarToggleButton />

      {/* Sidebar overlay when open on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <nav
        className={`fixed left-0 top-0 h-full ${sidebarOpen ? "w-64" : "w-0"} ${
          isDark
            ? "bg-gray-900 text-gray-200 border-r border-gray-800"
            : "bg-white text-gray-800 border-r border-gray-100"
        } shadow-lg transition-all duration-300 z-40 overflow-hidden`}
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
          <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {/* Home & About links */}
            <div className="space-y-1 mb-3">
              <button
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
              <button
                onClick={() => navigateTo("/aboutus")}
                className={`flex w-full items-center px-3 py-2 rounded-md ${
                  currentPath === "/aboutus"
                    ? isDark
                      ? "bg-gray-800"
                      : "bg-gray-100"
                    : ""
                } ${
                  isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
                } transition-colors group`}
              >
                <Info
                  className={`h-5 w-5 ${
                    isDark
                      ? "text-gray-400 group-hover:text-orange-400"
                      : "text-gray-500 group-hover:text-orange-500"
                  }`}
                />
                <span className="ml-3 text-sm font-medium">About</span>
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
                  Incomplete Tasks
                </span>
              </button>
              <button
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

            {/* My Lists section */}
            <div
              className={`my-3 border-t ${
                isDark ? "border-gray-800" : "border-gray-200"
              }`}
            />

            {/* Lists header with add button */}
            <div className="flex items-center justify-between px-3 py-2">
              <h3
                className={`text-xs font-semibold uppercase ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                My Lists
              </h3>
              <button
                onClick={() => setIsCreateListModalOpen(true)}
                className={`rounded-md p-1 transition-colors ${
                  isDark
                    ? "hover:bg-gray-800 text-gray-400 hover:text-orange-400"
                    : "hover:bg-gray-100 text-gray-500 hover:text-orange-500"
                }`}
                aria-label="Add new list"
                title="Add new list"
                disabled={isLoadingLists}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Lists */}
            <div className="space-y-1">
              {isLoadingLists ? (
                <div className="flex justify-center py-4">
                  <div
                    className={`animate-spin rounded-full h-5 w-5 border-b-2 ${isDark ? "border-orange-400" : "border-sky-500"}`}
                  ></div>
                </div>
              ) : sortedLists.length === 0 ? (
                <div
                  className={`text-center py-4 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                >
                  <p className="text-sm">No lists yet</p>
                  <p className="text-xs mt-1">Create your first list</p>
                </div>
              ) : (
                sortedLists.map((list) => (
                  <div
                    key={list.id}
                    className={`flex items-center w-full rounded-md ${
                      currentListId === list.id.toString()
                        ? isDark
                          ? "bg-gray-800"
                          : "bg-gray-100"
                        : ""
                    } ${
                      isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
                    } transition-colors`}
                  >
                    <button
                      onClick={() => handleListClick(list.id)}
                      className="flex-grow flex items-center px-3 py-2 text-left"
                    >
                      <ListTodo
                        className="h-5 w-5 flex-shrink-0"
                        style={{
                          color:
                            list.bg_color_hex !== null ? list.bg_color_hex : "",
                          fill:
                            list.bg_color_hex !== null ? list.bg_color_hex : "",
                          fillOpacity: 0.2,
                        }}
                      />
                      <span className="ml-3 text-sm font-medium truncate">
                        {list.list_name}
                      </span>
                    </button>
                    <div className="flex mr-1">
                      {/* Pin Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePinList(list.id);
                        }}
                        className={`p-1.5 ${
                          list.is_pinned
                            ? isDark
                              ? "text-orange-400"
                              : "text-orange-500"
                            : isDark
                              ? "text-gray-500 hover:text-gray-400"
                              : "text-gray-400 hover:text-gray-500"
                        } transition-colors`}
                        aria-label={list.is_pinned ? "Unpin list" : "Pin list"}
                        title={list.is_pinned ? "Unpin list" : "Pin list"}
                        disabled={isDeletingList}
                      >
                        <Pin
                          size={18}
                          fill={
                            list.is_pinned
                              ? (list.bg_color_hex ?? "currentColor")
                              : "none"
                          }
                          stroke={list.is_pinned ? "none" : "currentColor"}
                          style={{
                            color: list.is_pinned
                              ? (list.bg_color_hex ?? "currentColor")
                              : "currentColor",
                          }}
                        />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setListToDelete(list.id);
                          setIsDeleteListModalOpen(true);
                        }}
                        className={`p-1.5 ${
                          isDark
                            ? "text-gray-500 hover:text-red-500"
                            : "text-gray-400 hover:text-red-500"
                        } transition-colors`}
                        aria-label={`Delete ${list.list_name} list`}
                        title={`Delete ${list.list_name}`}
                        disabled={isDeletingList}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer with theme toggle and sign out */}
          <div
            className={`p-4 border-t ${isDark ? "border-gray-800" : "border-gray-200"}`}
          >
            <div className="flex flex-col space-y-2">
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
      />

      {/* Delete List Confirmation Modal */}
      {isDeleteListModalOpen && listToDelete && (
        <>
          <div
            className="fixed inset-0 z-40 backdrop-blur-md bg-black bg-opacity-50"
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
