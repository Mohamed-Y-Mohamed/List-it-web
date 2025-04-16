"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { sampleData } from "@/data/data";
import { Task } from "@/types/schema";

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

  const getDateString = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
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

  return (
    <div className=" pl-16 pt-16 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Completed Tasks
            </h1>
          </div>
        </header>

        <main>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : sortedDates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <p className="text-xl text-gray-600 dark:text-gray-300">
                No completed tasks.
              </p>
            </div>
          ) : (
            <div className="space-y-10 pb-10 task-timeline">
              {sortedDates.map(({ date, tasks }) => (
                <div key={date.toString()} className="pt-2">
                  <div className="flex items-center mb-4 px-2 date-header">
                    <div className="h-3 w-3 rounded-full bg-blue-500 mr-3"></div>
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                      {getDateString(date)}
                    </h2>
                  </div>

                  <div className="space-y-4 pl-4">
                    {tasks.map((task) => (
                      <div key={task.id} className="flex">
                        <div className="flex flex-col items-center mr-4">
                          <div className="h-2 w-2 rounded-full bg-green-500"></div>
                          <div className="h-full w-0.5 bg-gray-300 dark:bg-gray-700"></div>
                        </div>

                        <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-2 task-card">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {task.title}
                          </h3>

                          {task.description && (
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                              {task.description}
                            </p>
                          )}

                          <div className="mt-2 flex items-center text-gray-500 dark:text-gray-400 text-xs">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3 w-3 mr-1"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
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
          )}
        </main>
      </div>
    </div>
  );
}
