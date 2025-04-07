"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Circle,
  CalendarCheck,
  CheckCircle,
  Star,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useSidebar } from "@/context/sidebarContext";
import { LIST_COLORS, List, ListColor } from "@/types/schema";
import CreateListModal from "@/components/popupModels/ListPopup";

// Sample lists with the new List interface
const initialLists: List[] = [
  {
    id: "1",
    name: "Work",
    background_color: LIST_COLORS[1],
    date_created: new Date(),
    is_default: false,
    tasks: [],
    notes: [],
    collections: [],
  },
  {
    id: "2",
    name: "Personal",
    background_color: LIST_COLORS[2],
    date_created: new Date(),
    is_default: false,
    tasks: [],
    notes: [],
    collections: [],
  },
  {
    id: "3",
    name: "Shopping",
    background_color: LIST_COLORS[8],
    date_created: new Date(),
    is_default: false,
    tasks: [],
    notes: [],
    collections: [],
  },
];

const Sidebar = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();
  const pathname = usePathname();
  const { isSidebarOpen, toggleSidebar } = useSidebar();

  const [lists, setLists] = useState<List[]>(initialLists);
  const [isMounted, setIsMounted] = useState(false);
  const [isCreateListModalOpen, setIsCreateListModalOpen] = useState(false);

  // Extract the current list ID from the pathname if we're on a list page
  const currentListId = pathname?.includes("/List/")
    ? pathname.split("/List/")[1]
    : null;

  // Set mounted state when component mounts
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle list selection - use router.push for navigation
  const handleListClick = (listId: string) => {
    router.push(`/List/${listId}`);
  };

  // Handle creating a new list
  const handleCreateList = (listData: {
    name: string;
    background_color: string; // Change ListColor to string
    is_default: boolean;
  }) => {
    const newList: List = {
      ...listData,
      id: (lists.length + 1).toString(),
      date_created: new Date(),
      tasks: [],
      notes: [],
      collections: [],
    };
    setLists([...lists, newList]);
    // You might want to add additional logic here, like saving to a backend
  };

  // Hide sidebar if needed on small screens
  const sidebarWidth = isSidebarOpen ? "w-64" : "w-16";

  // Don't render during SSR
  if (!isMounted) {
    return null;
  }

  return (
    <>
      <nav
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] ${sidebarWidth}
        ${
          isDark
            ? "bg-gray-900 text-gray-200 border-r border-gray-800"
            : "bg-white text-gray-800 border-r border-gray-100"
        }
        transition-all duration-300 z-40
        ${
          isSidebarOpen ||
          (typeof window !== "undefined" && window.innerWidth >= 768)
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full py-4">
          {/* Main navigation items at top */}
          <div className="flex-1 px-3 space-y-1 overflow-y-auto">
            {/* Dashboard */}
            <button
              onClick={() => router.push("/dashboard")}
              className={`flex w-full items-center px-3 py-2 rounded-md ${
                pathname === "/dashboard"
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
              {isSidebarOpen && (
                <span className="ml-3 text-sm font-medium text-left">
                  Dashboard
                </span>
              )}
            </button>

            {/* Today's tasks */}
            <button
              onClick={() => router.push("/today")}
              className={`flex w-full items-center px-3 py-2 rounded-md ${
                pathname === "/today"
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
              {isSidebarOpen && (
                <span className="ml-3 text-sm font-medium text-left">
                  Today
                </span>
              )}
            </button>

            {/* Priority */}
            <button
              onClick={() => router.push("/priority")}
              className={`flex w-full items-center px-3 py-2 rounded-md ${
                pathname === "/priority"
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
              {isSidebarOpen && (
                <span className="ml-3 text-sm font-medium text-left">
                  Priority
                </span>
              )}
            </button>

            {/* Completed */}
            <button
              onClick={() => router.push("/completed")}
              className={`flex w-full items-center px-3 py-2 rounded-md ${
                pathname === "/completed"
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
              {isSidebarOpen && (
                <span className="ml-3 text-sm font-medium text-left">
                  Completed
                </span>
              )}
            </button>

            {/* Divider */}
            <div
              className={`my-3 border-t ${
                isDark ? "border-gray-800" : "border-gray-200"
              }`}
            ></div>

            {/* My Lists section with Add List button */}
            <div className="flex items-center justify-between px-3 py-2">
              {isSidebarOpen ? (
                <h3
                  className={`text-xs font-semibold uppercase ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  My Lists
                </h3>
              ) : (
                <div className="h-4"></div> // Spacer when collapsed
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

            {/* User Lists */}
            <div
              className={`space-y-1 ${
                !isSidebarOpen ? "flex flex-col items-center" : ""
              }`}
            >
              {lists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => handleListClick(list.id)}
                  className={`w-full ${
                    isSidebarOpen
                      ? "flex items-center px-3 py-2 text-left"
                      : "p-2 flex justify-center"
                  } rounded-md ${
                    currentListId === list.id
                      ? isDark
                        ? "bg-gray-800"
                        : "bg-gray-100"
                      : ""
                  } ${
                    isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
                  } transition-colors`}
                >
                  <Circle
                    className="h-5 w-5 flex-shrink-0"
                    style={{
                      color: list.background_color,
                      fill: list.background_color,
                      fillOpacity: 0.2,
                    }}
                  />
                  {isSidebarOpen && (
                    <span className="ml-3 text-sm font-medium truncate">
                      {list.name}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Toggle expand/collapse button */}
          <div
            className={`px-3 mt-2 ${
              isDark ? "border-t border-gray-800" : "border-t border-gray-100"
            }`}
          >
            <button
              onClick={toggleSidebar}
              className={`mt-2 p-2 w-full flex justify-center rounded-md ${
                isDark
                  ? "hover:bg-gray-800 text-gray-400 hover:text-orange-400"
                  : "hover:bg-gray-100 text-gray-500 hover:text-orange-500"
              } transition-colors`}
              aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {isSidebarOpen ? (
                <ChevronLeft className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Create List Modal */}
      <CreateListModal
        isOpen={isCreateListModalOpen}
        onClose={() => setIsCreateListModalOpen(false)}
        onSubmit={handleCreateList}
      />
    </>
  );
};

export default Sidebar;
