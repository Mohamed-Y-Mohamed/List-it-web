"use client";

import React from "react";
import { ArrowRight, Clock, ClipboardList } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import TaskCard from "@/components/Tasks/index";

const Hero = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Sample task data for the hero display
  const sampleTasks = [
    {
      id: "sample1",
      text: "Website Redesign",
      description:
        "Update the company website with new branding and improve user experience.",
      date_created: new Date("2025-04-01"),
      due_date: new Date("2025-04-15"),
      is_completed: false,
      is_priority: true,
    },
    {
      id: "sample2",
      text: "Product Launch",
      description: "Coordinate marketing efforts for the new product launch.",
      date_created: new Date("2025-04-10"),
      due_date: new Date("2025-04-25"),
      is_completed: false,
      is_priority: false,
    },
  ];

  return (
    <section
      className={`${
        isDark
          ? "bg-gradient-to-r from-gray-900 via-orange-950 to-gray-900"
          : "bg-gradient-to-r from-sky-100 via-orange-50 to-sky-200"
      } pt-28 transition-colors duration-300`}
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between lg:flex-row">
          <div className="mb-12 max-w-xl lg:mb-0 lg:w-1/2">
            <h1
              className={`mb-6 text-4xl font-bold leading-tight tracking-tight ${
                isDark ? "text-gray-100" : "text-gray-900"
              } md:text-5xl`}
            >
              Organize Your Work with{" "}
              <span className={isDark ? "text-orange-400" : "text-sky-500"}>
                LIST IT
              </span>
            </h1>
            <p
              className={`mb-8 text-lg ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              A simple yet powerful task management tool to help you organize
              collections, track tasks, and keep important notes all in one
              place.
            </p>
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
              <Link
                href="/signup"
                className={`inline-flex items-center justify-center rounded-md ${
                  isDark
                    ? "bg-orange-600 hover:bg-orange-700 text-white"
                    : "bg-sky-500 hover:bg-sky-600 text-white"
                } px-6 py-3 text-base font-medium transition-colors`}
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/demo"
                className={`inline-flex items-center justify-center rounded-md border-2 ${
                  isDark
                    ? "border-gray-600 bg-gray-800 text-gray-200 hover:border-orange-500 hover:text-orange-400"
                    : "border-gray-300 bg-white text-gray-700 hover:border-sky-500 hover:text-sky-500"
                } px-6 py-3 text-base font-medium transition-colors`}
              >
                See How It Works
              </Link>
            </div>
          </div>
          <div className="w-full lg:w-1/2">
            <div
              className={`relative overflow-hidden rounded-xl ${
                isDark ? "bg-gray-800" : "bg-white"
              } p-2 shadow-2xl`}
            >
              {/* Mockup of the app interface */}
              <div className="flex flex-col rounded-lg">
                <div
                  className={`flex items-center justify-between rounded-t-lg ${
                    isDark ? "bg-orange-700" : "bg-orange-500"
                  } p-4 text-white`}
                >
                  <div className="flex items-center space-x-2">
                    <ClipboardList className="h-5 w-5" />
                    <span className="font-semibold">My Tasks</span>
                  </div>
                  <div className="flex space-x-2">
                    <Clock className="h-5 w-5" />
                  </div>
                </div>
                <div
                  className={`space-y-4 ${
                    isDark ? "bg-gray-800" : "bg-gray-50"
                  } p-6`}
                >
                  {/* Sample Tasks Inside */}
                  {sampleTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      id={task.id}
                      text={task.text}
                      description={task.description}
                      date_created={task.date_created}
                      due_date={task.due_date}
                      is_completed={task.is_completed}
                      is_priority={task.is_priority}
                      onComplete={() => {}}
                      onPriorityChange={() => {}}
                    />
                  ))}

                  {/* Notes Section - Simplified for Hero */}
                  <div
                    className={`mt-6 border-t ${
                      isDark ? "border-gray-700" : "border-gray-200"
                    } pt-4`}
                  >
                    <h4
                      className={`mb-3 font-semibold ${
                        isDark ? "text-gray-200" : "text-gray-800"
                      }`}
                    >
                      Notes
                    </h4>
                    <div
                      className={`rounded-lg p-4 ${
                        isDark ? "bg-gray-750" : "bg-yellow-50"
                      }`}
                    >
                      <h5
                        className={`font-medium ${
                          isDark ? "text-gray-200" : "text-gray-800"
                        } mb-2`}
                      >
                        Website Redesign Notes
                      </h5>
                      <p
                        className={`text-sm ${
                          isDark ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Remember to update the color scheme and typography based
                        on the new brand guidelines. Schedule meeting with
                        marketing team for feedback.
                      </p>
                      <div className="mt-2 text-xs text-gray-500">
                        2 hours ago
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className={`mt-16 w-full ${
          isDark ? "bg-orange-800" : "bg-sky-500"
        } py-10 text-center text-white`}
      >
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="mb-4 text-2xl font-bold md:text-3xl">
            The simplest way to manage your tasks
          </h2>
          <p className="text-lg opacity-90">
            Get organized and boost your productivity with LIST IT
          </p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
