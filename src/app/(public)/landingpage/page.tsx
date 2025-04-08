"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Folder,
  ListTodo,
  StickyNote,
  CheckCircle,
  Lightbulb,
  Zap,
} from "lucide-react";
import Hero from "@components/hero";
import { useTheme } from "@/context/ThemeContext";

const LandingPage = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const features = [
    {
      icon: (
        <Folder
          className={`h-12 w-12 ${
            isDark ? "text-orange-400" : "text-orange-500"
          }`}
        />
      ),
      title: "Collections",
      description:
        "Group related tasks with customizable color-coding for efficient organization.",
    },
    {
      icon: (
        <ListTodo
          className={`h-12 w-12 ${isDark ? "text-sky-400" : "text-sky-500"}`}
        />
      ),
      title: "Task Management",
      description:
        "Create, prioritize, and track tasks with descriptions and deadlines.",
    },
    {
      icon: (
        <Clock
          className={`h-12 w-12 ${
            isDark ? "text-orange-400" : "text-orange-500"
          }`}
        />
      ),
      title: "Due Date Tracking",
      description:
        "Assign due dates to tasks and easily identify priority items.",
    },
    {
      icon: (
        <StickyNote
          className={`h-12 w-12 ${isDark ? "text-sky-400" : "text-sky-500"}`}
        />
      ),
      title: "Notes",
      description:
        "Add color-coded, pinnable notes to collections for important information.",
    },
  ];

  return (
    <div
      className={`min-h-screen w-full ${
        isDark ? "bg-gray-900" : "bg-white"
      } transition-colors duration-300`}
    >
      {/* Navigation */}

      <Hero />

      {/* How It Works Section */}
      <section className={`py-20 ${isDark ? "bg-gray-900" : ""}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2
              className={`text-3xl font-bold tracking-tight ${
                isDark ? "text-gray-100" : "text-gray-900"
              } md:text-4xl`}
            >
              How{" "}
              <span className={isDark ? "text-orange-400" : "text-sky-500"}>
                LIST IT
              </span>{" "}
              Works
            </h2>
            <p
              className={`mx-auto mt-4 max-w-2xl text-lg ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              A structured approach to task management with hierarchical
              organization
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <div
              className={`rounded-lg ${
                isDark
                  ? "bg-gray-800 hover:border-orange-700"
                  : "bg-white hover:border-orange-200"
              } p-8 text-center shadow-sm transition-all hover:shadow-md border border-transparent`}
            >
              <div
                className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
                  isDark ? "bg-orange-900" : "bg-orange-100"
                } text-orange-500`}
              >
                <Folder className="h-8 w-8" />
              </div>
              <h3
                className={`mb-3 text-xl font-semibold ${
                  isDark ? "text-gray-100" : "text-gray-900"
                }`}
              >
                Create Lists
              </h3>
              <p className={isDark ? "text-gray-300" : "text-gray-600"}>
                Start with color-coded lists as your top-level organization
                system for related collections.
              </p>
            </div>

            <div
              className={`rounded-lg ${
                isDark
                  ? "bg-gray-800 hover:border-sky-700"
                  : "bg-white hover:border-sky-200"
              } p-8 text-center shadow-sm transition-all hover:shadow-md border border-transparent`}
            >
              <div
                className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
                  isDark ? "bg-sky-900" : "bg-sky-100"
                } ${isDark ? "text-sky-400" : "text-sky-500"}`}
              >
                <ListTodo className="h-8 w-8" />
              </div>
              <h3
                className={`mb-3 text-xl font-semibold ${
                  isDark ? "text-gray-100" : "text-gray-900"
                }`}
              >
                Add Collections
              </h3>
              <p className={isDark ? "text-gray-300" : "text-gray-600"}>
                Group related tasks into themed collections with custom colors
                for visual organization.
              </p>
            </div>

            <div
              className={`rounded-lg ${
                isDark
                  ? "bg-gray-800 hover:border-orange-700"
                  : "bg-white hover:border-orange-200"
              } p-8 text-center shadow-sm transition-all hover:shadow-md border border-transparent`}
            >
              <div
                className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
                  isDark ? "bg-orange-900" : "bg-orange-100"
                } text-orange-500`}
              >
                <StickyNote className="h-8 w-8" />
              </div>
              <h3
                className={`mb-3 text-xl font-semibold ${
                  isDark ? "text-gray-100" : "text-gray-900"
                }`}
              >
                Manage Tasks & Notes
              </h3>
              <p className={isDark ? "text-gray-300" : "text-gray-600"}>
                Create priority tasks with due dates and add colorful, pinnable
                notes for important details.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        className={`py-20 ${
          isDark
            ? "bg-gradient-to-r from-gray-900 via-orange-950 to-gray-900"
            : "bg-gradient-to-r from-sky-100 via-orange-50 to-sky-100"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2
              className={`text-3xl font-bold tracking-tight ${
                isDark ? "text-gray-100" : "text-gray-900"
              } md:text-4xl`}
            >
              Everything You Need to Stay Organized
            </h2>
            <p
              className={`mx-auto mt-4 max-w-2xl text-lg ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Powerful features designed to boost your productivity
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <div
                key={`feature-${index}`}
                className={`rounded-lg ${
                  isDark ? "bg-gray-800" : "bg-white"
                } p-6 shadow-sm transition-all hover:shadow-md`}
              >
                <div className="mb-4">{feature.icon}</div>
                <h3
                  className={`mb-3 text-xl font-semibold ${
                    isDark ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  {feature.title}
                </h3>
                <p className={isDark ? "text-gray-300" : "text-gray-600"}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Introduction Section (replacing the App Preview) */}
      <section className={`py-20 ${isDark ? "bg-gray-900" : "bg-white"}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2
              className={`text-3xl font-bold tracking-tight ${
                isDark ? "text-gray-100" : "text-gray-900"
              } md:text-4xl`}
            >
              Introducing{" "}
              <span className={isDark ? "text-orange-400" : "text-sky-500"}>
                LIST IT
              </span>
            </h2>
            <p
              className={`mt-4 text-lg ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              A hierarchical task management system for organized productivity
            </p>
          </div>

          <div className="grid gap-12 md:grid-cols-2 items-center">
            <div
              className={`rounded-xl ${
                isDark
                  ? "bg-gradient-to-br from-orange-600 to-sky-700"
                  : "bg-gradient-to-br from-sky-500 to-orange-400"
              } p-1`}
            >
              <div
                className={`${
                  isDark ? "bg-gray-800" : "bg-white"
                } rounded-lg p-8 h-full`}
              >
                <h3
                  className={`text-2xl font-bold ${
                    isDark ? "text-gray-100" : "text-gray-900"
                  } mb-6`}
                >
                  How LIST IT Works
                </h3>
                <ul className="space-y-6">
                  <li className="flex items-start">
                    <CheckCircle
                      className={`h-6 w-6 ${
                        isDark ? "text-orange-400" : "text-sky-500"
                      } mt-1 mr-3 flex-shrink-0`}
                    />
                    <div>
                      <h4
                        className={`font-semibold text-lg ${
                          isDark ? "text-gray-100" : "text-gray-900"
                        }`}
                      >
                        Lists at the Top
                      </h4>
                      <p className={isDark ? "text-gray-300" : "text-gray-600"}>
                        Create color-coded lists as your main organization
                        categories. Each list can contain multiple collections,
                        tasks, and notes.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle
                      className={`h-6 w-6 ${
                        isDark ? "text-orange-400" : "text-sky-500"
                      } mt-1 mr-3 flex-shrink-0`}
                    />
                    <div>
                      <h4
                        className={`font-semibold text-lg ${
                          isDark ? "text-gray-100" : "text-gray-900"
                        }`}
                      >
                        Collections for Organization
                      </h4>
                      <p className={isDark ? "text-gray-300" : "text-gray-600"}>
                        Group related tasks into collections with custom colors
                        for visual organization and quick identification.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle
                      className={`h-6 w-6 ${
                        isDark ? "text-orange-400" : "text-sky-500"
                      } mt-1 mr-3 flex-shrink-0`}
                    />
                    <div>
                      <h4
                        className={`font-semibold text-lg ${
                          isDark ? "text-gray-100" : "text-gray-900"
                        }`}
                      >
                        Tasks with Priorities
                      </h4>
                      <p className={isDark ? "text-gray-300" : "text-gray-600"}>
                        Create detailed tasks with descriptions, due dates, and
                        priority flags so you never miss important deadlines.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <div
              className={`rounded-xl ${
                isDark
                  ? "bg-gradient-to-br from-sky-700 to-orange-600"
                  : "bg-gradient-to-br from-orange-400 to-sky-500"
              } p-1`}
            >
              <div
                className={`${
                  isDark ? "bg-gray-800" : "bg-white"
                } rounded-lg p-8 h-full`}
              >
                <h3
                  className={`text-2xl font-bold ${
                    isDark ? "text-gray-100" : "text-gray-900"
                  } mb-6`}
                >
                  Visual Organization
                </h3>
                <div className="grid grid-cols-1 gap-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-4">
                      <div
                        className={`h-12 w-12 rounded-full ${
                          isDark ? "bg-orange-900" : "bg-orange-100"
                        } flex items-center justify-center`}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-6 w-6 text-orange-500"
                          fill="none"
                          stroke="currentColor"
                        >
                          <rect
                            x="4"
                            y="4"
                            width="16"
                            height="16"
                            rx="2"
                            strokeWidth="2"
                          />
                          <rect
                            x="9"
                            y="9"
                            width="6"
                            height="6"
                            fill="currentColor"
                          />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h4
                        className={`font-semibold text-lg ${
                          isDark ? "text-gray-100" : "text-gray-900"
                        }`}
                      >
                        Color Coding
                      </h4>
                      <p className={isDark ? "text-gray-300" : "text-gray-600"}>
                        Choose from 9 distinct colors to visually organize your
                        lists and collections for instant recognition.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-4">
                      <div
                        className={`h-12 w-12 rounded-full ${
                          isDark ? "bg-sky-900" : "bg-sky-100"
                        } flex items-center justify-center`}
                      >
                        <Zap
                          className={`h-6 w-6 ${
                            isDark ? "text-sky-400" : "text-sky-500"
                          }`}
                        />
                      </div>
                    </div>
                    <div>
                      <h4
                        className={`font-semibold text-lg ${
                          isDark ? "text-gray-100" : "text-gray-900"
                        }`}
                      >
                        Priority Flags
                      </h4>
                      <p className={isDark ? "text-gray-300" : "text-gray-600"}>
                        Mark important tasks with priority flags to keep them at
                        the top of your focus.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-4">
                      <div
                        className={`h-12 w-12 rounded-full ${
                          isDark ? "bg-orange-900" : "bg-orange-100"
                        } flex items-center justify-center`}
                      >
                        <StickyNote className="h-6 w-6 text-orange-500" />
                      </div>
                    </div>
                    <div>
                      <h4
                        className={`font-semibold text-lg ${
                          isDark ? "text-gray-100" : "text-gray-900"
                        }`}
                      >
                        Pinnable Notes
                      </h4>
                      <p className={isDark ? "text-gray-300" : "text-gray-600"}>
                        Create colorful notes that can be pinned for quick
                        access to important information.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className={`py-16 text-white ${
          isDark ? "bg-orange-800" : "bg-sky-500"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Ready to boost your productivity?
            </h2>
            <p className="mt-4 text-lg opacity-90">
              Join LIST IT today and start organizing your work life.
            </p>
            <div className="mt-8 flex flex-col justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
              <Link
                href="/signup"
                className={`inline-flex items-center justify-center rounded-md ${
                  isDark
                    ? "bg-gray-800 text-orange-400 hover:bg-gray-700"
                    : "bg-white text-orange-500 hover:bg-gray-100"
                } px-6 py-3 text-base font-medium transition-colors`}
              >
                Get Started - It&apos;s Free!
              </Link>
              <Link
                href="/demo"
                className={`inline-flex items-center justify-center rounded-md border-2 border-white px-6 py-3 text-base font-medium text-white transition-colors ${
                  isDark ? "hover:bg-orange-700" : "hover:bg-orange-600"
                }`}
              >
                See How It Works
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
