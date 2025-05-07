"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Circle,
  CalendarCheck,
  CheckCircle,
  Star,
  ChevronDown,
  Plus,
  Menu,
  X,
  Sun,
  Moon,
  User,
  LogOut,
  Settings,
  ChevronRight,
  ListTodo,
  Trash2,
  AlertTriangle,
  CircleMinus,
  CalendarPlus2,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import CreateListModal from "@/components/popupModels/ListPopup";
import { supabase } from "@/utils/client";
import { List, Collection, Task, Note } from "@/types/schema";

// Main navigation component that should wrap the page content
const MergedNavigation = ({ children }: { children?: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { isLoggedIn, user, logout } = useAuth();
  const isDark = theme === "dark";
  const currentPath = pathname;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isCreateListModalOpen, setIsCreateListModalOpen] = useState(false);
  const [isDeleteListModalOpen, setIsDeleteListModalOpen] = useState(false);
  const [listToDelete, setListToDelete] = useState<number | null>(null);
  const [isTablet, setIsTablet] = useState(false);
  const [lists, setLists] = useState<List[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(true);

  useEffect(() => {
    const fetchLists = async () => {
      if (!isLoggedIn || !user) {
        setLists([]);
        setIsLoadingLists(false);
        return;
      }

      try {
        setIsLoadingLists(true);
        const { data, error } = await supabase
          .from("list")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setLists(data || []);
      } catch (error) {
        console.error("Error fetching lists:", error);
      } finally {
        setIsLoadingLists(false);
      }
    };

    fetchLists();
  }, [isLoggedIn, user]);

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

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const navigateTo = (path: string) => {
    router.push(path);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
      setIsMobileMenuOpen(false);
    }
  };

  const handleListClick = (listId: number) => {
    navigateTo(`/List/${listId}`);
  };

  const handleTogglePinList = async (listId: number) => {
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
    listData: Omit<
      List,
      "id" | "created_at" | "tasks" | "notes" | "collections"
    >
  ) => {
    try {
      setIsLoadingLists(true);

      if (!user) {
        console.error("No user found when creating list");
        setIsLoadingLists(false);
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      const { data: listByName, error: nameError } = await supabase
        .from("list")
        .select("*")
        .eq("user_id", user.id)
        .eq("list_name", listData.list_name)
        .order("created_at", { ascending: false });

      if (!nameError && listByName && listByName.length > 0) {
        const createdList = listByName[0];

        const { data: collections, error: collectionsError } = await supabase
          .from("collection")
          .select("*")
          .eq("list_id", createdList.id);

        if (!collectionsError && (!collections || collections.length === 0)) {
          const { error: createCollectionError } = await supabase
            .from("collection")
            .insert([
              {
                list_id: createdList.id,
                collection_name: "General",
                bg_color_hex: createdList.bg_color_hex,
                is_default: true,
              },
            ]);

          if (createCollectionError) {
            console.error(
              "Error creating General collection:",
              createCollectionError
            );
          }
        }

        const { data: allLists } = await supabase
          .from("list")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (allLists) {
          setLists(allLists);
        }

        navigateTo(`/List/${createdList.id}`);
        setIsLoadingLists(false);
        return;
      }

      const { data: recentLists, error: recentError } = await supabase
        .from("list")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!recentError && recentLists && recentLists.length > 0) {
        const recentList = recentLists[0];

        const { data: collections, error: collectionsError } = await supabase
          .from("collection")
          .select("*")
          .eq("list_id", recentList.id);

        if (!collectionsError && (!collections || collections.length === 0)) {
          const { error: createCollectionError } = await supabase
            .from("collection")
            .insert([
              {
                list_id: recentList.id,
                collection_name: "General",
                bg_color_hex: recentList.bg_color_hex,
                is_default: true,
              },
            ]);

          if (createCollectionError) {
            console.error(
              "Error creating General collection:",
              createCollectionError
            );
          }
        }

        const { data: allLists } = await supabase
          .from("list")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (allLists) {
          setLists(allLists);
        }

        // Navigate to the most recent list
        navigateTo(`/List/${recentList.id}`);
        setIsLoadingLists(false);
        return;
      }

      // If both approaches failed, just get all lists and refresh the state
      const { data: allLists } = await supabase
        .from("list")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (allLists && allLists.length > 0) {
        setLists(allLists);

        // Check the first list for collections
        const firstList = allLists[0];

        // Check if this list has any collections
        const { data: collections, error: collectionsError } = await supabase
          .from("collection")
          .select("*")
          .eq("list_id", firstList.id);

        if (!collectionsError && (!collections || collections.length === 0)) {
          // No collections found, create a General collection
          const { error: createCollectionError } = await supabase
            .from("collection")
            .insert([
              {
                list_id: firstList.id,
                collection_name: "General",
                bg_color_hex: firstList.bg_color_hex,
                is_default: true,
              },
            ]);

          if (createCollectionError) {
            console.error(
              "Error creating General collection:",
              createCollectionError
            );
          }
        }

        // Navigate to the first list
        navigateTo(`/List/${firstList.id}`);
      }
    } catch (err) {
      console.error("Error handling list creation:", err);
    } finally {
      setIsLoadingLists(false);
    }
  };

  const handleDeleteList = async (listId: number) => {
    if (!user) return;

    try {
      // First, get all collections for this list
      const { data: collections, error: collectionsQueryError } = await supabase
        .from("collection")
        .select("id")
        .eq("list_id", listId);

      if (collectionsQueryError) throw collectionsQueryError;

      // If there are collections, delete their associated tasks and notes
      if (collections && collections.length > 0) {
        const collectionIds = collections.map((c) => c.id);

        // Delete tasks associated with these collections
        const { error: tasksError } = await supabase
          .from("task")
          .delete()
          .in("collection_id", collectionIds);

        if (tasksError) throw tasksError;

        // Delete notes associated with these collections
        const { error: notesError } = await supabase
          .from("note")
          .delete()
          .in("collection_id", collectionIds);

        if (notesError) throw notesError;
      }

      // Delete tasks associated directly with the list (not through a collection)
      const { error: listTasksError } = await supabase
        .from("task")
        .delete()
        .eq("list_id", listId);

      if (listTasksError) throw listTasksError;

      // Then delete all collections for this list
      const { error: collectionsError } = await supabase
        .from("collection")
        .delete()
        .eq("list_id", listId);

      if (collectionsError) throw collectionsError;

      // Finally delete the list itself
      const { error: listError } = await supabase
        .from("list")
        .delete()
        .eq("id", listId)
        .eq("user_id", user.id);

      if (listError) throw listError;

      // Update local state
      setLists((prevLists) => prevLists.filter((list) => list.id !== listId));

      // If we deleted the current list, navigate to another list or dashboard
      if (currentListId === listId.toString()) {
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
      // Close the modal
      setListToDelete(null);
      setIsDeleteListModalOpen(false);
    }
  };

  // Handle logout using auth context
  const handleLogout = async () => {
    try {
      await logout();
      // Navigation to home is already handled in your auth context
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Check for tablet screen size
  const checkScreenSize = () => {
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

  return (
    <div
      className={`${isDark ? "bg-gray-100 text-gray-200" : "bg-white text-gray-800"}`}
    >
      {/* Top Navigation Bar */}
      <header
        className={`fixed top-0 z-50 w-full ${
          isDark ? "bg-gray-900 shadow-gray-800" : "bg-white shadow-sm"
        } transition-colors duration-300`}
      >
        <div className="mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              {isLoggedIn && (
                <button
                  onClick={toggleSidebar}
                  className={`inline-flex p-2 rounded-md ${
                    isDark
                      ? "text-gray-300 hover:text-orange-400"
                      : "text-gray-700 hover:text-orange-500"
                  } transition-colors mr-2`}
                  aria-label="Toggle menu"
                >
                  {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              )}
              <div className="flex items-center">
                <div className="h-8 w-8 bg-orange-500 rounded-md mr-2 flex items-center justify-center text-white font-bold">
                  <Image
                    src={"/app-icon.jpeg"}
                    alt="App Icon"
                    width={32}
                    height={32}
                    className="rounded-md"
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
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center space-x-4">
              <button
                onClick={() => navigateTo("/landingpage")}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                  isDark
                    ? "text-gray-300 hover:text-orange-400"
                    : "text-gray-700 hover:text-orange-500"
                }`}
              >
                Home
              </button>
              <button
                onClick={() => navigateTo("/aboutus")}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                  isDark
                    ? "text-gray-300 hover:text-orange-400"
                    : "text-gray-700 hover:text-orange-500"
                }`}
              >
                About
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-full ${
                  isDark
                    ? "bg-gray-800 text-orange-400 hover:bg-gray-700"
                    : "bg-gray-100 text-sky-500 hover:bg-gray-200"
                }`}
                aria-label={
                  isDark ? "Switch to light mode" : "Switch to dark mode"
                }
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {isLoggedIn ? (
                // User menu for logged in users
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className={`flex items-center justify-center rounded-full p-1 h-10 w-10 border ${
                      isDark
                        ? "bg-gray-800 text-orange-400 hover:bg-gray-700 border-gray-700"
                        : "bg-gray-100 text-sky-500 hover:bg-gray-200 border-gray-200"
                    }`}
                    aria-label="User menu"
                  >
                    <User size={20} />
                  </button>

                  {isUserMenuOpen && (
                    <div
                      className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${
                        isDark ? "bg-gray-800" : "bg-white"
                      }`}
                      role="menu"
                    >
                      {user && (
                        <div
                          className={`px-4 py-2 border-b ${isDark ? "border-gray-700 text-gray-300" : "border-gray-200 text-gray-700"}`}
                        >
                          <p className="text-sm font-semibold">
                            {user.user_metadata?.full_name || "User"}
                          </p>
                          <p className="text-xs truncate">{user.email}</p>
                        </div>
                      )}
                      <div className="py-1">
                        <button
                          onClick={() => navigateTo("/profile")}
                          className={`flex w-full items-center px-4 py-2 text-sm text-left ${
                            isDark
                              ? "text-gray-300 hover:bg-gray-700"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <User size={16} className="mr-2" /> Your Profile
                        </button>
                        <button
                          onClick={() => navigateTo("/settings")}
                          className={`flex w-full items-center px-4 py-2 text-sm text-left ${
                            isDark
                              ? "text-gray-300 hover:bg-gray-700"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <Settings size={16} className="mr-2" /> Settings
                        </button>
                        <button
                          onClick={handleLogout}
                          className={`flex w-full items-center px-4 py-2 text-sm text-left ${
                            isDark
                              ? "text-gray-300 hover:bg-gray-700"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                          role="menuitem"
                        >
                          <LogOut size={16} className="mr-2" /> Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Login/Register buttons for non-logged in users
                <div className="hidden lg:flex items-center space-x-2">
                  <button
                    onClick={() => navigateTo("/login")}
                    className={`rounded-md px-4 py-2 text-sm font-medium ${
                      isDark
                        ? "text-gray-300 hover:text-orange-400"
                        : "text-gray-700 hover:text-orange-500"
                    }`}
                  >
                    Log in
                  </button>
                  <button
                    onClick={() => navigateTo("/register")}
                    className={`rounded-md px-4 py-2 text-sm font-medium text-white ${
                      isDark
                        ? "bg-orange-600 hover:bg-orange-700"
                        : "bg-orange-500 hover:bg-orange-600"
                    }`}
                  >
                    Sign up
                  </button>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`lg:hidden inline-flex items-center justify-center p-2 rounded-md ${
                  isDark
                    ? "text-gray-300 hover:text-orange-400"
                    : "text-gray-700 hover:text-orange-500"
                }`}
              >
                {isMobileMenuOpen ? (
                  <ChevronDown className="h-6 w-6" />
                ) : (
                  <ChevronRight className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="lg:hidden">
            <div
              className={`space-y-1 px-2 pb-3 pt-2 ${
                isDark ? "bg-gray-900" : "bg-white"
              }`}
            >
              <button
                onClick={() => navigateTo("/landingpage")}
                className={`block w-full text-left rounded-md px-3 py-2 text-base font-medium ${
                  isDark
                    ? "text-gray-300 hover:text-orange-400"
                    : "text-gray-700 hover:text-orange-500"
                }`}
              >
                Home
              </button>
              <button
                onClick={() => navigateTo("/aboutus")}
                className={`block w-full text-left rounded-md px-3 py-2 text-base font-medium ${
                  isDark
                    ? "text-gray-300 hover:text-orange-400"
                    : "text-gray-700 hover:text-orange-500"
                }`}
              >
                About
              </button>

              {!isLoggedIn && (
                <>
                  <button
                    onClick={() => navigateTo("/login")}
                    className={`block w-full text-left rounded-md px-3 py-2 text-base font-medium ${
                      isDark
                        ? "text-gray-300 hover:text-orange-400"
                        : "text-gray-700 hover:text-orange-500"
                    }`}
                  >
                    Log in
                  </button>
                  <button
                    onClick={() => navigateTo("/signup")}
                    className={`block w-full text-left rounded-md px-3 py-2 text-base font-medium text-white ${
                      isDark
                        ? "bg-orange-600 hover:bg-orange-700"
                        : "bg-orange-500 hover:bg-orange-600"
                    }`}
                  >
                    Sign up
                  </button>
                </>
              )}

              {isLoggedIn && (
                <>
                  <button
                    onClick={() => navigateTo("/profile")}
                    className={`block w-full text-left rounded-md px-3 py-2 text-base font-medium ${
                      isDark
                        ? "text-gray-300 hover:text-orange-400"
                        : "text-gray-700 hover:text-orange-500"
                    }`}
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => navigateTo("/settings")}
                    className={`block w-full text-left rounded-md px-3 py-2 text-base font-medium ${
                      isDark
                        ? "text-gray-300 hover:text-orange-400"
                        : "text-gray-700 hover:text-orange-500"
                    }`}
                  >
                    Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className={`block w-full text-left rounded-md px-3 py-2 text-base font-medium ${
                      isDark
                        ? "text-red-300 hover:text-red-400"
                        : "text-red-600 hover:text-red-700"
                    }`}
                  >
                    Sign out
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {isLoggedIn && sidebarOpen && (
        <div
          className="fixed inset-0 bg-transparent bg-opacity-50 z-10 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {isLoggedIn && (
        <nav
          className={`fixed left-0 top-0 h-full ${
            sidebarOpen ? "w-64" : "w-16"
          } ${
            isDark
              ? "bg-gray-900 text-gray-200 border-r border-gray-800"
              : "bg-white text-gray-800 border-r border-gray-100"
          } transition-all duration-300 z-20 ${
            sidebarOpen
              ? "translate-x-0"
              : isTablet
                ? "-translate-x-full"
                : "lg:translate-x-0 -translate-x-full"
          } pt-16`}
        >
          <div className="flex flex-col h-full py-4">
            <div className="flex-1 px-3 space-y-1 overflow-y-auto">
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
                {sidebarOpen && (
                  <span className="ml-3 text-sm font-medium text-left">
                    Dashboard
                  </span>
                )}
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
                {sidebarOpen && (
                  <span className="ml-3 text-sm font-medium text-left">
                    Today
                  </span>
                )}
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
                {sidebarOpen && (
                  <span className="ml-3 text-sm font-medium text-left">
                    Tomorrow
                  </span>
                )}
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
                {sidebarOpen && (
                  <span className="ml-3 text-sm font-medium text-left">
                    Priority
                  </span>
                )}
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
                {sidebarOpen && (
                  <span className="ml-3 text-sm font-medium text-left">
                    incomplete Tasks
                  </span>
                )}
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
                {sidebarOpen && (
                  <span className="ml-3 text-sm font-medium text-left">
                    Completed
                  </span>
                )}
              </button>
              <div
                className={`my-3 border-t ${
                  isDark ? "border-gray-800" : "border-gray-200"
                }`}
              />
              <div className="flex items-center justify-between px-3 py-2">
                {sidebarOpen ? (
                  <h3
                    className={`text-xs font-semibold uppercase ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    My Lists
                  </h3>
                ) : (
                  <div className="h-4"></div>
                )}
                <button
                  onClick={() => setIsCreateListModalOpen(true)}
                  className={`rounded-md p-1 transition-colors ${
                    isDark
                      ? "hover:bg-gray-800 text-gray-400 hover:text-orange-400"
                      : "hover:bg-gray-100 text-gray-500 hover:text-orange-500"
                  }`}
                  aria-label="Add new list"
                  title="Add new list"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div
                className={`space-y-1 ${
                  !sidebarOpen ? "flex flex-col items-center" : ""
                }`}
              >
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
                    {sidebarOpen && (
                      <p className="text-xs mt-1">Create your first list</p>
                    )}
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
                        className={`flex-grow ${
                          sidebarOpen
                            ? "flex items-center px-3 py-2 text-left"
                            : "p-2 flex justify-center"
                        }`}
                      >
                        <ListTodo
                          className="h-5 w-5 flex-shrink-0"
                          style={{
                            color: list.bg_color_hex,
                            fill: list.bg_color_hex,
                            fillOpacity: 0.2,
                          }}
                        />
                        {sidebarOpen && (
                          <span className="ml-3 text-sm font-medium truncate">
                            {list.list_name}
                          </span>
                        )}
                      </button>
                      {sidebarOpen && (
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
                            aria-label={
                              list.is_pinned ? "Unpin list" : "Pin list"
                            }
                            title={list.is_pinned ? "Unpin list" : "Pin list"}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              style={{
                                color: list.is_pinned
                                  ? list.bg_color_hex
                                  : "currentColor",
                              }}
                            >
                              <path
                                d={
                                  list.is_pinned
                                    ? "M16 2H8C7.448 2 7 2.448 7 3V7.5C7 8.328 7.672 9 8.5 9H9l1 5H6v2h12v-2h-4l1-5h0.5c0.828 0 1.5-0.672 1.5-1.5V3C17 2.448 16.552 2 16 2Z"
                                    : "M16 2H8C7.448 2 7 2.448 7 3V7.5C7 8.328 7.672 9 8.5 9H9l1 5H6v2h12v-2h-4l1-5h0.5c0.828 0 1.5-0.672 1.5-1.5V3C17 2.448 16.552 2 16 2ZM15 7.5c0 0.276-0.224 0.5-0.5 0.5h-5C9.224 8 9 7.776 9 7.5V4h6v3.5Z"
                                }
                                fill="currentColor"
                              />
                              <path
                                d="M12 22L9 16H15L12 22Z"
                                fill={list.is_pinned ? "currentColor" : "none"}
                                stroke={
                                  list.is_pinned ? "none" : "currentColor"
                                }
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
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
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </nav>
      )}

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
            className="fixed inset-0 z-40 backdrop-blur-md bg-blur-50"
            onClick={() => setIsDeleteListModalOpen(false)}
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
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteList(listToDelete)}
                  className="px-4 py-2 rounded-md bg-red-500 hover:bg-red-600 text-white"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main content */}
      <div className={`${isLoggedIn ? "lg:pl-16" : ""} pt-16`}>{children}</div>
    </div>
  );
};

export default MergedNavigation;
