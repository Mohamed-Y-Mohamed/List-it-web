"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "@/context/ThemeContext";

const Hero = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

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
            </div>
          </div>
          <div className="w-full lg:w-1/2">
            <div
              className={`relative overflow-hidden rounded-xl ${
                isDark ? "bg-gray-800" : "bg-white"
              } p-2 shadow-2xl`}
            >
              <Image
                src="/images/heroimage.png"
                alt="Task manager preview"
                width={600}
                height={500}
                className="rounded-lg w-full h-auto  object-cover"
                priority
              />
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
