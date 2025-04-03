import React from "react";
import TaskCard from "./Tasks/tasksCard";
import { ArrowRight, Clock, Folder, StickyNote } from "lucide-react";
import Link from "next/link";
import NoteCard from "./Notes/noteCard";

const Hero = () => {
  return (
    <section className="bg-gradient-to-r from-sky-100 via-orange-50 to-sky-200 pt-28">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between lg:flex-row">
          <div className="mb-12 max-w-xl lg:mb-0 lg:w-1/2">
            <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-gray-900 md:text-5xl">
              Organize Your Work with{" "}
              <span className="text-sky-500">LIST IT</span>
            </h1>
            <p className="mb-8 text-lg text-gray-600">
              A simple yet powerful task management tool to help you organize
              collections, track tasks, and keep important notes all in one
              place.
            </p>
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-md bg-sky-500 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-sky-600"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center rounded-md border-2 border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 transition-colors hover:border-sky-500 hover:text-sky-500"
              >
                See How It Works
              </Link>
            </div>
          </div>
          <div className="w-full lg:w-1/2">
            <div className="relative overflow-hidden rounded-xl bg-white p-2 shadow-2xl">
              {/* Mockup of the app interface */}
              <div className="flex flex-col rounded-lg">
                <div className="flex items-center justify-between rounded-t-lg bg-orange-500 p-4 text-white">
                  <div className="flex items-center space-x-2">
                    <Folder className="h-5 w-5" />
                    <span className="font-semibold">My Collections</span>
                  </div>
                  <div className="flex space-x-2">
                    <Clock className="h-5 w-5" />
                  </div>
                </div>
                <div className="space-y-4 bg-gray-50 p-6">
                  {/* Task Cards inside Collection */}
                  <TaskCard
                    title="Website Redesign"
                    description="Update the company website with new branding and improve user experience."
                    startDate="Apr 1"
                    endDate="Apr 15, 2025"
                    collection="Work Projects"
                    collectionColor="bg-purple-500"
                  />

                  <TaskCard
                    title="Product Launch"
                    description="Coordinate marketing efforts for the new product launch."
                    startDate="Apr 10"
                    endDate="Apr 25, 2025"
                    collection="Work Projects"
                    collectionColor="bg-orange-500"
                  />

                  {/* Notes Section - Separated from Tasks */}
                  <div className="mt-6 border-t border-gray-200 pt-4">
                    <h4 className="mb-3 font-semibold text-gray-800">Notes</h4>
                    <NoteCard
                      title="Website Redesign Notes"
                      content="Remember to update the color scheme and typography based on the new brand guidelines. Schedule meeting with marketing team for feedback."
                      lastUpdated="2 hours ago"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-16 w-full bg-sky-500 py-10 text-center text-white">
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
