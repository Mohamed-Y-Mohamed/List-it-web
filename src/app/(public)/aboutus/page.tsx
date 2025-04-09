"use client";

import React from "react";
import { Briefcase, Code } from "lucide-react";
import Image from "next/image";
import { useTheme } from "@/context/ThemeContext";
import TeamMemberCard from "@/components/About/TeamMemberCard";

const AboutUs = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      className={`min-h-screen w-full ${
        isDark ? "bg-gray-900" : "bg-white"
      } transition-colors duration-300`}
    >
      {/* Hero Section */}
      <section
        className={`${
          isDark
            ? "bg-gradient-to-r from-gray-900 via-orange-950 to-gray-900"
            : "bg-gradient-to-r from-orange-100 via-orange-50 to-sky-100"
        } pt-28 transition-colors duration-300`}
      >
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <span
              className={`mb-4 inline-block rounded-full ${
                isDark
                  ? "bg-orange-900 text-orange-400"
                  : "bg-orange-100 text-orange-600"
              } px-4 py-1 text-sm font-medium`}
            >
              About Our Team
            </span>
            <h1
              className={`mb-6 text-4xl font-bold leading-tight tracking-tight ${
                isDark ? "text-gray-100" : "text-gray-900"
              } md:text-5xl`}
            >
              About{" "}
              <span className={isDark ? "text-orange-400" : "text-orange-500"}>
                LIST
              </span>{" "}
              <span className={isDark ? "text-sky-400" : "text-sky-500"}>
                IT
              </span>
            </h1>
            <p
              className={`mx-auto mb-8 max-w-2xl text-lg ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Helping everyone manage their day with ease — from students to
              carers and everyone in between.
            </p>
            <div className="mx-auto h-1 w-24 rounded-full bg-orange-500"></div>
          </div>
        </div>
      </section>

      <section className={`py-20 ${isDark ? "bg-gray-900" : ""}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
            <div className="lg:w-2/3">
              <div
                className={`rounded-lg border-l-4 border-orange-500 ${
                  isDark ? "bg-gray-800" : "bg-white"
                } p-8 shadow-lg`}
              >
                <h2
                  className={`mb-6 text-3xl font-bold ${
                    isDark ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  Our{" "}
                  <span
                    className={isDark ? "text-orange-400" : "text-orange-500"}
                  >
                    Mission
                  </span>
                </h2>
                <p
                  className={`mb-4 text-lg ${
                    isDark ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  At LIST IT, we believe that effective task management
                  shouldn&apos;t be complicated. Our mission is to help people
                  organize their lives with a simple, intuitive tool that works
                  across all their devices.
                </p>
                <p
                  className={`mb-4 text-lg ${
                    isDark ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  We understand the unique challenges faced by individuals
                  managing work, studies, caregiving, and personal
                  responsibilities. That&apos;s why we&apos;ve created a
                  platform that makes it easy to track and prioritize tasks in
                  every area of life.
                </p>
                <p
                  className={`text-lg ${
                    isDark ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Whether you&apos;re juggling assignments, part-time jobs,
                  daily errands, or caregiving duties, LIST IT helps you stay on
                  top of everything in one centralized place.
                </p>
              </div>
            </div>
            <div className="lg:w-1/3 flex justify-center items-center">
              <div className="rounded-full bg-gradient-to-r from-orange-500 to-sky-500 p-2 shadow-xl w-64 h-64 flex items-center justify-center">
                <Image
                  src="/apple-touch-icon.png"
                  alt="LIST IT Logo"
                  width={224}
                  height={224}
                  className="rounded-full object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col items-center space-y-12 md:flex-row md:space-x-8 md:space-y-0">
        <TeamMemberCard
          name="Mohamed Yusuf Mohamed"
          role="Full Stack & Mobile Developer"
          description="Passionate about creating intuitive user experiences across all platforms. Contributed to both web and all mobile versions of LIST IT with a focus on responsive design and seamless functionality."
          icon={Code}
          gradientFrom="from-orange-400"
          gradientTo="to-orange-600"
          isDark={isDark}
          badgeBg={
            isDark
              ? "bg-orange-900 text-orange-400"
              : "bg-orange-100 text-orange-700"
          }
          badgeText={isDark ? "text-orange-300" : "text-orange-700"}
          borderColor={isDark ? "border-orange-600" : "border-orange-500"}
        />
        <TeamMemberCard
          name="Abdul Moiz"
          role="Full Stack & Mobile Developer"
          description="Specializes in building scalable applications for both web and mobile platforms. Worked across all versions of LIST IT to create a consistent and powerful experience on every device."
          icon={Briefcase}
          gradientFrom="from-sky-400"
          gradientTo="to-sky-600"
          isDark={isDark}
          badgeBg={
            isDark ? "bg-sky-900 text-sky-400" : "bg-sky-100 text-sky-700"
          }
          badgeText={isDark ? "text-sky-300" : "text-sky-700"}
          borderColor={isDark ? "border-sky-600" : "border-sky-500"}
        />
      </div>
    </div>
  );
};

export default AboutUs;
