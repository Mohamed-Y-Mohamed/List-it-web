// app/(public)/page.tsx or wherever LandingPage is
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
  Zap,
} from "lucide-react";
import Hero from "@components/hero";
import FeatureCard from "@components/Landing/FeatureCard";
import HowItWorksCard from "@components/Landing/HowItWorksCard";
import SectionTitle from "@components/Landing/SectionTitle";
import { useTheme } from "@/context/ThemeContext";

const LandingPage = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const features = [
    {
      icon: (
        <Folder
          className={`h-12 w-12 ${isDark ? "text-orange-400" : "text-orange-500"}`}
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
          className={`h-12 w-12 ${isDark ? "text-orange-400" : "text-orange-500"}`}
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
      className={`min-h-screen w-full ${isDark ? "bg-gray-900" : "bg-white"} transition-colors duration-300`}
    >
      <Hero />

      {/* How It Works Section */}
      <section className={`py-20 ${isDark ? "bg-gray-900" : ""}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title="How"
            highlight="LIST IT"
            description="A structured approach to task management with hierarchical organization"
            isDark={isDark}
            highlightColor={isDark ? "text-orange-400" : "text-sky-500"}
          />

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <HowItWorksCard
              icon={Folder}
              title="Create Lists"
              description="Start with color-coded lists as your top-level organization system for related collections."
              isDark={isDark}
              bgColor={isDark ? "bg-gray-800" : "bg-white"}
              hoverBorder={isDark ? "border-orange-700" : "border-orange-200"}
              textColor={
                isDark
                  ? "bg-orange-900 text-orange-500"
                  : "bg-orange-100 text-orange-500"
              }
            />
            <HowItWorksCard
              icon={ListTodo}
              title="Add Collections"
              description="Group related tasks into themed collections with custom colors for visual organization."
              isDark={isDark}
              bgColor={isDark ? "bg-gray-800" : "bg-white"}
              hoverBorder={isDark ? "border-sky-700" : "border-sky-200"}
              textColor={
                isDark ? "bg-sky-900 text-sky-400" : "bg-sky-100 text-sky-500"
              }
            />
            <HowItWorksCard
              icon={StickyNote}
              title="Manage Tasks & Notes"
              description="Create priority tasks with due dates and add colorful, pinnable notes for important details."
              isDark={isDark}
              bgColor={isDark ? "bg-gray-800" : "bg-white"}
              hoverBorder={isDark ? "border-orange-700" : "border-orange-200"}
              textColor={
                isDark
                  ? "bg-orange-900 text-orange-500"
                  : "bg-orange-100 text-orange-500"
              }
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        className={`py-20 ${isDark ? "bg-gradient-to-r from-gray-900 via-orange-950 to-gray-900" : "bg-gradient-to-r from-sky-100 via-orange-50 to-sky-100"}`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title="Everything You Need to"
            highlight="Stay Organized"
            description="Powerful features designed to boost your productivity"
            isDark={isDark}
            highlightColor=""
          />

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} isDark={isDark} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className={`py-16 text-white ${isDark ? "bg-orange-800" : "bg-sky-500"}`}
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
