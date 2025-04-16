// "use client";

// import React, { useMemo, useState, useEffect } from "react";
// import Link from "next/link";
// import { sampleData } from "@/data/data";
// import { Task } from "@/types/schema";

// interface DisplayTask {
//   id: string;
//   title: string;
//   description: string | undefined;
//   createdDate: Date;
//   completedDate: Date;
//   isCompleted: boolean;
// }

// interface GroupedDate {
//   date: Date;
//   tasks: DisplayTask[];
// }

// export default function CompletedPage() {
//   const [tasks, setTasks] = useState<DisplayTask[]>([]);
//   const [isLoading, setIsLoading] = useState<boolean>(true);

//   const getDateString = (date: Date): string => {
//     return date.toLocaleDateString("en-US", {
//       month: "long",
//       day: "numeric",
//       year: "numeric",
//     });
//   };

//   useEffect(() => {
//     const loadTasks = () => {
//       const completed: DisplayTask[] = [];

//       Object.values(sampleData.lists).forEach((list) => {
//         list.collections.forEach((collection) => {
//           collection.tasks.forEach((task: Task) => {
//             if (task.is_completed && task.date_completed) {
//               completed.push({
//                 id: task.id,
//                 title: task.text,
//                 description: task.description,
//                 createdDate: task.date_created,
//                 completedDate: task.date_completed,
//                 isCompleted: true,
//               });
//             }
//           });
//         });
//       });

//       setTasks(completed);
//       setIsLoading(false);
//     };

//     loadTasks();
//   }, []);

//   const groupedTasksByDay = useMemo(() => {
//     const grouped: Record<string, DisplayTask[]> = {};

//     tasks.forEach((task) => {
//       const date = new Date(task.completedDate);
//       const startOfDay = new Date(
//         date.getFullYear(),
//         date.getMonth(),
//         date.getDate()
//       ).toISOString();

//       if (!grouped[startOfDay]) {
//         grouped[startOfDay] = [];
//       }

//       grouped[startOfDay].push(task);
//     });

//     return grouped;
//   }, [tasks]);

//   const sortedDates = useMemo((): GroupedDate[] => {
//     return Object.keys(groupedTasksByDay)
//       .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
//       .map((dateKey) => ({
//         date: new Date(dateKey),
//         tasks: groupedTasksByDay[dateKey],
//       }));
//   }, [groupedTasksByDay]);

//   return (
//     <div className=" pl-16 pt-16 min-h-screen bg-gray-50 dark:bg-gray-900">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         <header className="mb-8">
//           <div className="flex justify-between items-center">
//             <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
//               Completed Tasks
//             </h1>
//           </div>
//         </header>

//         <main>
//           {isLoading ? (
//             <div className="flex justify-center py-12">
//               <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
//             </div>
//           ) : sortedDates.length === 0 ? (
//             <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
//               <p className="text-xl text-gray-600 dark:text-gray-300">
//                 No completed tasks.
//               </p>
//             </div>
//           ) : (
//             <div className="space-y-10 pb-10 task-timeline">
//               {sortedDates.map(({ date, tasks }) => (
//                 <div key={date.toString()} className="pt-2">
//                   <div className="flex items-center mb-4 px-2 date-header">
//                     <div className="h-3 w-3 rounded-full bg-blue-500 mr-3"></div>
//                     <h2 className="text-lg font-medium text-gray-900 dark:text-white">
//                       {getDateString(date)}
//                     </h2>
//                   </div>

//                   <div className="space-y-4 pl-4">
//                     {tasks.map((task) => (
//                       <div key={task.id} className="flex">
//                         <div className="flex flex-col items-center mr-4">
//                           <div className="h-2 w-2 rounded-full bg-green-500"></div>
//                           <div className="h-full w-0.5 bg-gray-300 dark:bg-gray-700"></div>
//                         </div>

//                         <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-2 task-card">
//                           <h3 className="font-medium text-gray-900 dark:text-white">
//                             {task.title}
//                           </h3>

//                           {task.description && (
//                             <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
//                               {task.description}
//                             </p>
//                           )}

//                           <div className="mt-2 flex items-center text-gray-500 dark:text-gray-400 text-xs">
//                             <svg
//                               xmlns="http://www.w3.org/2000/svg"
//                               className="h-3 w-3 mr-1"
//                               fill="none"
//                               viewBox="0 0 24 24"
//                               stroke="currentColor"
//                             >
//                               <path
//                                 strokeLinecap="round"
//                                 strokeLinejoin="round"
//                                 strokeWidth={2}
//                                 d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
//                               />
//                             </svg>
//                             <span>
//                               Created: {getDateString(task.createdDate)}
//                             </span>
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </main>
//       </div>
//     </div>
//   );
// }

"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { sampleData } from "@/data/data";
import { Task } from "@/types/schema";
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
  description: string | undefined;
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
  const isDark = theme === "dark";

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

  useEffect(() => {
    const loadTasks = () => {
      const completed: DisplayTask[] = [];

      Object.values(sampleData.lists).forEach((list) => {
        list.collections.forEach((collection) => {
          collection.tasks.forEach((task: Task) => {
            if (task.is_completed && task.date_completed) {
              completed.push({
                id: task.id,
                title: task.text,
                description: task.description,
                createdDate: task.date_created,
                completedDate: task.date_completed,
                isCompleted: true,
              });
            }
          });
        });
      });

      setTasks(completed);
      setIsLoading(false);
    };

    loadTasks();
  }, []);

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
      const scrollAmount = direction === "left" ? -300 : 300;
      timelineRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div
      className={`pl-16 pt-16 min-h-screen ${
        isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <h1
              className={`text-3xl font-bold tracking-tight ${
                isDark ? "text-white" : "text-gray-900"
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
                isDark ? "bg-gray-800" : "bg-white"
              }`}
            >
              <p
                className={`text-xl ${isDark ? "text-gray-300" : "text-gray-600"}`}
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
                      ? "bg-gray-800 text-gray-100"
                      : "bg-gray-50 text-gray-900"
                  } py-3`}
                >
                  <div
                    ref={timelineRef}
                    className={`flex flex-nowrap overflow-x-auto pb-3 pt-1 px-3 scrollbar-thin ${
                      isDark
                        ? "scrollbar-track-gray-700 scrollbar-thumb-orange-500"
                        : "scrollbar-track-gray-200 scrollbar-thumb-blue-500"
                    } snap-x snap-mandatory`}
                    style={{ scrollbarWidth: "thin" }}
                  >
                    {sortedDates.map(({ date, tasks }, index) => {
                      const isActive = date.toISOString() === selectedDate;
                      const dateKey = date.toISOString();
                      const isLast = index === sortedDates.length - 1;

                      return (
                        <div
                          key={dateKey}
                          onClick={() => setSelectedDate(dateKey)}
                          className={`relative flex-none min-w-[120px] rounded-lg px-3 py-3 mr-3 cursor-pointer transition-all duration-300 snap-start ${
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
                    isDark ? "bg-gray-800" : "bg-white"
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
