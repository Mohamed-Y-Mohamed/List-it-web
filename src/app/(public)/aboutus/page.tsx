"use client";

import React from "react";
import { Briefcase, Code, ListTodo } from "lucide-react";
import Image from "next/image";
import { useTheme } from "@/context/ThemeContext";
import TeamMemberCard from "@/components/About/TeamMemberCard";

const AboutUs = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="min-h-screen w-full">
      {/* Hero Section with updated gradient background */}
      <section className="relative py-24 pt-28">
        {/* Background with radial gradient */}
        {isDark ? (
          <div className="absolute inset-0 -z-10 size-full items-center [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#7c2d12_100%)]" />
        ) : (
          <div className="absolute inset-0 -z-10 size-full bg-white [background:radial-gradient(125%_125%_at_60%_10%,#fff_20%,#bae6fd_100%)]" />
        )}

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <span
                className={`inline-flex items-center rounded-full ${
                  isDark
                    ? "bg-orange-900/50 text-orange-400"
                    : "bg-sky-100 text-sky-600"
                } px-4 py-1 text-sm font-medium`}
              >
                About Our Team
              </span>
            </div>
            <h1
              className={`mb-6 text-4xl font-bold leading-tight tracking-tight ${
                isDark ? "text-gray-100" : "text-gray-900"
              } md:text-5xl`}
            >
              About{" "}
              <span className={isDark ? "text-orange-400" : "text-sky-500"}>
                LIST IT
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
            <div
              className={`mx-auto h-1 w-24 rounded-full ${isDark ? "bg-orange-500" : "bg-sky-500"}`}
            ></div>
          </div>
        </div>
      </section>

      {/* Mission Section with glass effect */}
      <section className="py-20 relative">
        {/* Background with subtle gradient */}
        {isDark ? (
          <div className="absolute inset-0 -z-10 size-full items-center [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#000_100%)]" />
        ) : (
          <div className="absolute inset-0 -z-10 size-full bg-white [background:radial-gradient(125%_125%_at_50%_50%,#fff_20%,#f0f9ff_100%)]" />
        )}

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
            <div className="lg:w-2/3">
              <div
                className={`rounded-lg border-l-4 ${
                  isDark
                    ? "border-orange-500 bg-gray-800/70"
                    : "border-sky-500 bg-white/70"
                } p-8 shadow-lg backdrop-blur-sm`}
              >
                <div className="flex items-center mb-6">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 shadow-sm ${
                      isDark ? "bg-orange-600" : "bg-sky-500"
                    }`}
                  >
                    <ListTodo className="h-5 w-5 text-white" />
                  </div>
                  <h2
                    className={`text-3xl font-bold ${
                      isDark ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    Our{" "}
                    <span
                      className={isDark ? "text-orange-400" : "text-sky-500"}
                    >
                      Mission
                    </span>
                  </h2>
                </div>
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
              <div className="relative">
                <div
                  className={`absolute inset-0 rounded-full blur-xl opacity-30 ${
                    isDark ? "bg-orange-500" : "bg-sky-500"
                  }`}
                ></div>
                <div
                  className={`relative rounded-full bg-gradient-to-r ${
                    isDark
                      ? "from-orange-500 to-yellow-500"
                      : "from-sky-400 to-blue-500"
                  } p-2 shadow-xl w-64 h-64 flex items-center justify-center`}
                >
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
        </div>
      </section>

      {/* Team Section with glass effect cards */}
      <section className="py-20 relative">
        {/* Background with radial gradient */}
        {isDark ? (
          <div className="absolute inset-0 -z-10 size-full items-center [background:radial-gradient(125%_125%_at_50%_10%,#111827_40%,#1f2937_100%)]" />
        ) : (
          <div className="absolute inset-0 -z-10 size-full bg-white [background:radial-gradient(125%_125%_at_50%_50%,#f9fafb_20%,#f3f4f6_100%)]" />
        )}

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2
              className={`text-3xl font-bold ${
                isDark ? "text-gray-100" : "text-gray-900"
              }`}
            >
              Meet Our{" "}
              <span className={isDark ? "text-orange-400" : "text-sky-500"}>
                Team
              </span>
            </h2>
            <p
              className={`mx-auto mt-4 max-w-2xl text-lg ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              The talented developers behind LIST IT
            </p>
          </div>

          <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between md:gap-12">
            <TeamMemberCard
              name="Mohamed Yusuf Mohamed"
              role="Full Stack & Mobile Developer"
              description="Passionate about creating intuitive user experiences across all platforms. Contributed to both web and all mobile versions of LIST IT with a focus on responsive design and seamless functionality."
              icon={Code}
              gradientFrom={isDark ? "from-orange-600" : "from-sky-500"}
              gradientTo={isDark ? "to-yellow-600" : "to-blue-600"}
              isDark={isDark}
              badgeBg={
                isDark
                  ? "bg-orange-900/50 text-orange-400"
                  : "bg-sky-100 text-sky-700"
              }
              badgeText={isDark ? "text-orange-300" : "text-sky-700"}
              borderColor={isDark ? "border-orange-600" : "border-sky-500"}
            />
            <TeamMemberCard
              name="Abdul Moiz"
              role="Full Stack & Mobile Developer"
              description="Specializes in building scalable applications for both web and mobile platforms. Worked across all versions of LIST IT to create a consistent and powerful experience on every device."
              icon={Briefcase}
              gradientFrom={isDark ? "from-orange-600" : "from-sky-500"}
              gradientTo={isDark ? "to-yellow-600" : "to-blue-600"}
              isDark={isDark}
              badgeBg={
                isDark
                  ? "bg-orange-900/50 text-orange-400"
                  : "bg-sky-100 text-sky-700"
              }
              badgeText={isDark ? "text-orange-300" : "text-sky-700"}
              borderColor={isDark ? "border-orange-600" : "border-sky-500"}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className={`py-16 text-white relative ${isDark ? "bg-orange-800/90" : "bg-sky-500/90"} backdrop-blur-sm`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Ready to organize your life?
            </h2>
            <p className="mt-4 text-lg opacity-90">
              Join LIST IT today and start managing your tasks with ease.
            </p>
            <div className="mt-8">
              <a
                href="/register"
                className={`inline-flex items-center justify-center rounded-md ${
                  isDark
                    ? "bg-gray-800 text-orange-400 hover:bg-gray-700"
                    : "bg-white text-sky-500 hover:bg-gray-100"
                } px-6 py-3 text-base font-medium transition-colors`}
              >
                Get Started - It&apos;s Free!
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
