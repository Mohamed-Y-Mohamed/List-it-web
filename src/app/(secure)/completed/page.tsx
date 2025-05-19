"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { supabase } from "@/utils/client";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
} from "lucide-react";

interface DisplayTask {
  id: string;
  title: string;
  description?: string | null;
  createdDate: Date;
  completedDate: Date;
  isCompleted: boolean;
}

interface GroupedDate {
  date: Date;
  tasks: DisplayTask[];
}

export default function CompletedPage() {
  const [tasks, setTasks] = useState<DisplayTask[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === "dark";
  const scrollAmount = 240; // Amount to scroll by (2 cards)

  const getDateString = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getShortDateString = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Fetch completed tasks from the database
  useEffect(() => {
    const fetchCompletedTasks = async () => {
      if (!user) return;

      setIsLoading(true);

      try {
        // Fetch all completed tasks for the current user
        const { data: completedTasksData, error } = await supabase
          .from("task")
          .select("*")
          .eq("is_completed", true)
          .eq("is_deleted", false)
          .not("date_completed", "is", null)
          .order("date_completed", { ascending: false });

        if (error) {
          console.error("Error fetching completed tasks:", error);
          setIsLoading(false);
          return;
        }

        if (!completedTasksData || completedTasksData.length === 0) {
          setTasks([]);
          setIsLoading(false);
          return;
        }

        // Transform the data to match the DisplayTask interface
        const formattedTasks: DisplayTask[] = completedTasksData.map(
          (task) => ({
            id: task.id,
            title: task.text || "Untitled Task",
            description: task.description,
            createdDate: new Date(task.created_at),
            completedDate: new Date(task.date_completed),
            isCompleted: true,
          })
        );

        setTasks(formattedTasks);
      } catch (error) {
        console.error("Unexpected error fetching completed tasks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompletedTasks();
  }, [user]);

  const groupedTasksByDay = useMemo(() => {
    const grouped: Record<string, DisplayTask[]> = {};

    tasks.forEach((task) => {
      const date = new Date(task.completedDate);
      const startOfDay = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      ).toISOString();

      if (!grouped[startOfDay]) {
        grouped[startOfDay] = [];
      }

      grouped[startOfDay].push(task);
    });

    return grouped;
  }, [tasks]);

  const sortedDates = useMemo((): GroupedDate[] => {
    return Object.keys(groupedTasksByDay)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map((dateKey) => ({
        date: new Date(dateKey),
        tasks: groupedTasksByDay[dateKey],
      }));
  }, [groupedTasksByDay]);

  // Set the first date as selected when data loads initially
  useEffect(() => {
    if (sortedDates.length > 0 && !selectedDate) {
      setSelectedDate(sortedDates[0].date.toISOString());
    }
  }, [sortedDates, selectedDate]);

  // Get tasks for the selected date
  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return [];
    return (
      sortedDates.find((group) => group.date.toISOString() === selectedDate)
        ?.tasks || []
    );
  }, [selectedDate, sortedDates]);

  // Function to scroll timeline left or right
  const scrollTimeline = (direction: "left" | "right") => {
    if (timelineRef.current) {
      const currentScroll = timelineRef.current.scrollLeft;
      const newScroll =
        direction === "left"
          ? Math.max(0, currentScroll - scrollAmount)
          : currentScroll + scrollAmount;

      timelineRef.current.scrollTo({
        left: newScroll,
        behavior: "smooth",
      });
    }
  };

  return (
    <div
      className={`transition-all pt-16 pr-16 min-h-screen duration-300 
     pb-20 w-full relative
    ${isDark ? "text-gray-200" : "text-gray-800"}
    `}
    >
      {isDark ? (
        <div className="absolute inset-0 -z-10 size-full items-center [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#7c2d12_100%)]" />
      ) : (
        <div className="absolute inset-0 -z-10 size-full bg-white [background:radial-gradient(125%_125%_at_60%_10%,#fff_20%,#bae6fd_100%)]" />
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <h1
              className={`text-3xl font-bold tracking-tight ${
                isDark ? "text-white" : "text-gray-900/50"
              }`}
            >
              Completed Tasks
            </h1>
            <div className="flex space-x-2">
              <button
                className={`p-2 rounded-full ${
                  isDark
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                } transition-colors shadow-sm`}
                onClick={() => scrollTimeline("left")}
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                className={`p-2 rounded-full ${
                  isDark
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                } transition-colors shadow-sm`}
                onClick={() => scrollTimeline("right")}
                aria-label="Scroll right"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        <main>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div
                className={`animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${
                  isDark ? "border-orange-400" : "border-blue-500"
                }`}
              ></div>
            </div>
          ) : sortedDates.length === 0 ? (
            <div
              className={`flex flex-col items-center justify-center py-16 rounded-xl shadow-sm ${
                isDark ? "bg-gray-800/70" : "bg-white"
              }`}
            >
              <p
                className={`text-xl ${isDark ? "text-gray-300" : "text-gray-600/70"}`}
              >
                No completed tasks.
              </p>
            </div>
          ) : (
            <>
              {/* Timeline - Hidden on mobile */}
              <div className="hidden md:block mb-8">
                <div
                  className={`w-full rounded-lg shadow-md overflow-hidden ${
                    isDark
                      ? "bg-gray-800/50 text-gray-100"
                      : "bg-gray-50 text-gray-900"
                  } py-3`}
                >
                  <div
                    ref={timelineRef}
                    className="flex flex-nowrap overflow-x-hidden px-3 pt-1 pb-3"
                  >
                    {sortedDates.map(({ date, tasks }, index) => {
                      const isActive = date.toISOString() === selectedDate;
                      const dateKey = date.toISOString();
                      const isLast = index === sortedDates.length - 1;

                      return (
                        <div
                          key={dateKey}
                          onClick={() => setSelectedDate(dateKey)}
                          className={`relative flex-none min-w-[120px] rounded-lg px-3 py-3 mr-3 cursor-pointer transition-all duration-300 ${
                            isActive
                              ? isDark
                                ? "bg-orange-500 text-white"
                                : "bg-blue-500 text-white"
                              : isDark
                                ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                                : "bg-white hover:bg-gray-100 text-gray-800"
                          } ${isActive ? "ring-4 ring-opacity-20 " + (isDark ? "ring-orange-300" : "ring-blue-200") : ""}`}
                        >
                          <span className="block text-xs font-semibold mb-1">
                            {getShortDateString(date)}
                          </span>
                          <p className="text-xs font-medium">
                            {date.getFullYear()}
                          </p>
                          <div className="flex items-center text-xs mt-1">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            <span>{tasks.length}</span>
                          </div>

                          {/* Connecting line and dot */}
                          {!isLast && (
                            <div
                              className={`absolute top-1/2 -right-3 w-3 h-0.5 transform -translate-y-1/2 ${
                                isDark ? "bg-gray-600" : "bg-gray-300"
                              }`}
                            ></div>
                          )}
                          <div
                            className={`absolute top-1/2 -right-[4px] w-2 h-2 rounded-full transform -translate-y-1/2 z-10 border-2 ${
                              isActive
                                ? isDark
                                  ? "border-orange-500 bg-orange-500"
                                  : "border-blue-500 bg-blue-500"
                                : isDark
                                  ? "border-gray-600 bg-gray-800"
                                  : "border-gray-300 bg-gray-50"
                            }`}
                          ></div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Selected date tasks display */}
                <div
                  className={`mt-8 rounded-xl shadow-md overflow-hidden ${
                    isDark ? "bg-gray-800/50" : "bg-white"
                  }`}
                >
                  <div
                    className={`px-6 py-4 border-b ${
                      isDark ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <h2
                        className={`text-xl font-semibold flex items-center ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        <Calendar className="w-5 h-5 mr-2" />
                        {selectedDate && getDateString(new Date(selectedDate))}
                      </h2>
                      <div
                        className={`text-sm flex items-center ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        {selectedDateTasks.length} task
                        {selectedDateTasks.length !== 1 ? "s" : ""} completed
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="space-y-4">
                      {selectedDateTasks.map((task) => (
                        <div
                          key={task.id}
                          className={`p-4 rounded-xl hover:shadow-md transition-all duration-300 ${
                            isDark
                              ? "bg-gray-750 border border-gray-700"
                              : "bg-gray-50 border border-gray-100"
                          }`}
                        >
                          <div className="flex items-start">
                            <div className="flex-shrink-0 mt-1">
                              <div
                                className={`h-6 w-6 rounded-full flex items-center justify-center shadow-sm ${
                                  isDark
                                    ? "bg-gradient-to-br from-green-500 to-green-600"
                                    : "bg-gradient-to-br from-green-400 to-green-500"
                                }`}
                              >
                                <CheckCircle2 className="w-3 h-3 text-white" />
                              </div>
                            </div>
                            <div className="ml-4 flex-1">
                              <h3
                                className={`font-medium ${
                                  isDark ? "text-white" : "text-gray-900"
                                }`}
                              >
                                {task.title}
                              </h3>
                              {task.description && (
                                <p
                                  className={`mt-1 text-sm ${
                                    isDark ? "text-gray-400" : "text-gray-500"
                                  }`}
                                >
                                  {task.description}
                                </p>
                              )}
                              <div
                                className={`mt-2 flex items-center text-xs ${
                                  isDark ? "text-gray-500" : "text-gray-500"
                                }`}
                              >
                                <Clock className="h-3 w-3 mr-1" />
                                <span>
                                  Created: {getDateString(task.createdDate)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Original Vertical Timeline (mobile) - Hidden on desktop */}
              <div className="md:hidden space-y-10 pb-10 task-timeline">
                {sortedDates.map(({ date, tasks }) => (
                  <div key={date.toString()} className="pt-2">
                    <div className="flex items-center mb-4 px-2 date-header">
                      <div
                        className={`h-3 w-3 rounded-full mr-3 ${
                          isDark ? "bg-orange-500" : "bg-blue-500"
                        }`}
                      ></div>
                      <h2
                        className={`text-lg font-medium ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {getDateString(date)}
                      </h2>
                    </div>

                    <div className="space-y-4 pl-4">
                      {tasks.map((task) => (
                        <div key={task.id} className="flex">
                          <div className="flex flex-col items-center mr-4">
                            <div
                              className={`h-2 w-2 rounded-full ${
                                isDark ? "bg-green-500" : "bg-green-500"
                              }`}
                            ></div>
                            <div
                              className={`h-full w-0.5 ${
                                isDark ? "bg-gray-700" : "bg-gray-300"
                              }`}
                            ></div>
                          </div>

                          <div
                            className={`flex-1 rounded-lg shadow-sm p-4 mb-2 task-card ${
                              isDark ? "bg-gray-800" : "bg-white"
                            }`}
                          >
                            <h3
                              className={`font-medium ${
                                isDark ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {task.title}
                            </h3>

                            {task.description && (
                              <p
                                className={`mt-1 text-sm ${
                                  isDark ? "text-gray-400" : "text-gray-500"
                                }`}
                              >
                                {task.description}
                              </p>
                            )}

                            <div
                              className={`mt-2 flex items-center text-xs ${
                                isDark ? "text-gray-500" : "text-gray-400"
                              }`}
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              <span>
                                Created: {getDateString(task.createdDate)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
