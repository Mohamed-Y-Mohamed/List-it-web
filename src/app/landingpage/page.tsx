"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Clock, Folder, ListTodo, StickyNote } from "lucide-react";
import NoteCard from "@components/Notes/noteCard";
import TaskManagementView from "@components/TaskCollection";
import Hero from "@components/hero";

const LandingPage = () => {
  // Features section data
  const features = [
    {
      icon: <Folder className="h-12 w-12 text-orange-500" />,
      title: "Collections",
      description:
        "Organize your tasks into collections for better management and focused workflow.",
    },
    {
      icon: <ListTodo className="h-12 w-12 text-sky-500" />,
      title: "Task Management",
      description:
        "Create, track, and complete tasks with descriptions, priorities, and deadlines.",
    },
    {
      icon: <Clock className="h-12 w-12 text-orange-500" />,
      title: "Timeline View",
      description:
        "Visualize your tasks with start and end dates to manage your schedule effectively.",
    },
    {
      icon: <StickyNote className="h-12 w-12 text-sky-500" />,
      title: "Notes",
      description:
        "Add detailed notes to your tasks and collections for better context and references.",
    },
  ];

  return (
    <div className="min-h-screenw-full bg-white">
      {/* Navigation */}

      <Hero />

      {/* How It Works Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
              How <span className="text-sky-500">LIST IT</span> Works
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              A simple, intuitive approach to organizing your work and life
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <div className="rounded-lg bg-white p-8 text-center shadow-sm transition-all hover:shadow-md hover:border-orange-200 border border-transparent">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-500">
                <Folder className="h-8 w-8" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-gray-900">
                Create Collections
              </h3>
              <p className="text-gray-600">
                Organize your tasks into collections based on projects, areas of
                focus, or any category you prefer.
              </p>
            </div>

            <div className="rounded-lg bg-white p-8 text-center shadow-sm transition-all hover:shadow-md hover:border-sky-200 border border-transparent">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 text-sky-500">
                <ListTodo className="h-8 w-8" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-gray-900">
                Add Tasks & Deadlines
              </h3>
              <p className="text-gray-600">
                Create tasks with descriptions, set start and end dates, and
                track your progress effortlessly.
              </p>
            </div>

            <div className="rounded-lg bg-white p-8 text-center shadow-sm transition-all hover:shadow-md hover:border-orange-200 border border-transparent">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-500">
                <StickyNote className="h-8 w-8" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-gray-900">
                Capture Notes
              </h3>
              <p className="text-gray-600">
                Add detailed notes to your tasks and collections to keep
                important information at your fingertips.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gradient-to-r from-sky-100 via-orange-50 to-sky-100 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
              Everything You Need to Stay Organized
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              Powerful features designed to boost your productivity
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <div
                key={`feature-${index}`}
                className="rounded-lg bg-white p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="mb-3 text-xl font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Preview Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
              See <span className="text-sky-500">LIST IT</span> in Action
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              A simple, intuitive interface for managing your tasks
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2">
            {/* Task View */}
            <TaskManagementView />
            <div className="overflow-hidden rounded-lg bg-white p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Folder className="h-5 w-5 text-orange-500" />
                  <h3 className="text-xl font-bold text-gray-800">
                    Project Notes
                  </h3>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="rounded-full bg-orange-100 px-4 py-1 text-sm font-medium text-orange-600">
                    2 Notes
                  </div>
                  <div className="h-4 w-4 rounded-full bg-orange-500"></div>
                </div>
              </div>
              <div className="space-y-4">
                <NoteCard
                  title="Website Redesign Notes"
                  content="Meeting with design team - agreed on new color scheme and typography. Wireframes completed for homepage and about page. Need feedback from marketing."
                  lastUpdated="2 hours ago"
                />

                <NoteCard
                  title="Project Timeline"
                  content="Need to adjust the project timeline to accommodate the new feature requests. Schedule a meeting with the team to discuss priorities."
                  lastUpdated="Yesterday"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-orange-500 py-16 text-white">
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
                className="inline-flex items-center justify-center rounded-md bg-white px-6 py-3 text-base font-medium text-orange-500 transition-colors hover:bg-gray-100"
              >
                Get Started - It&apos;s Free!
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center rounded-md border-2 border-white px-6 py-3 text-base font-medium text-white transition-colors hover:bg-orange-600"
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
