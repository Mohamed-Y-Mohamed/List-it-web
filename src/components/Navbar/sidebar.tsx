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

  const currentListId = pathname?.includes("/List/")
    ? pathname.split("/List/")[1]
    : null;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleListClick = (listId: string) => {
    router.push(`/List/${listId}`);
  };

  const handleCreateList = (listData: {
    name: string;
    background_color: string;
    is_default: boolean;
  }) => {
    const lastId = lists.reduce((max, list) => {
      const num = parseInt(list.id);
      return num > max ? num : max;
    }, 0);

    const newList: List = {
      ...listData,
      id: (lastId + 1).toString(),
      date_created: new Date(),
      tasks: [],
      notes: [],
      collections: [],
    };
    setLists((prev) => [...prev, newList]);
  };

  const sidebarWidth = isSidebarOpen ? "w-64" : "w-16";
  if (!isMounted) return null;

  return (
    <>
      <nav
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] ${sidebarWidth} ${
          isDark
            ? "bg-gray-900 text-gray-200 border-r border-gray-800"
            : "bg-white text-gray-800 border-r border-gray-100"
        } transition-all duration-300 z-40 ${
          isSidebarOpen ||
          (typeof window !== "undefined" && window.innerWidth >= 768)
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full py-4">
          <div className="flex-1 px-3 space-y-1 overflow-y-auto">
            <SidebarButton
              path="/dashboard"
              icon={<LayoutDashboard />}
              label="Dashboard"
              currentPath={pathname}
              isSidebarOpen={isSidebarOpen}
              isDark={isDark}
            />
            <SidebarButton
              path="/today"
              icon={<CalendarCheck />}
              label="Today"
              currentPath={pathname}
              isSidebarOpen={isSidebarOpen}
              isDark={isDark}
            />
            <SidebarButton
              path="/priority"
              icon={<Star />}
              label="Priority"
              currentPath={pathname}
              isSidebarOpen={isSidebarOpen}
              isDark={isDark}
            />
            <SidebarButton
              path="/completed"
              icon={<CheckCircle />}
              label="Completed"
              currentPath={pathname}
              isSidebarOpen={isSidebarOpen}
              isDark={isDark}
            />

            <div
              className={`my-3 border-t ${
                isDark ? "border-gray-800" : "border-gray-200"
              }`}
            />

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

      <CreateListModal
        isOpen={isCreateListModalOpen}
        onClose={() => setIsCreateListModalOpen(false)}
        onSubmit={handleCreateList}
      />
    </>
  );
};

const SidebarButton = ({
  path,
  icon,
  label,
  currentPath,
  isSidebarOpen,
  isDark,
}: any) => {
  const router = useRouter();
  const isActive = currentPath === path;

  return (
    <button
      onClick={() => router.push(path)}
      className={`flex w-full items-center px-3 py-2 rounded-md ${
        isActive ? (isDark ? "bg-gray-800" : "bg-gray-100") : ""
      } ${
        isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
      } transition-colors group`}
    >
      {React.cloneElement(icon, {
        className: `h-5 w-5 ${
          isDark
            ? "text-gray-400 group-hover:text-orange-400"
            : "text-gray-500 group-hover:text-orange-500"
        }`,
      })}
      {isSidebarOpen && (
        <span className="ml-3 text-sm font-medium text-left">{label}</span>
      )}
    </button>
  );
};

export default Sidebar;
