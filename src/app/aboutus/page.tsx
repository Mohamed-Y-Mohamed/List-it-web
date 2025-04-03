"use client";

import React from "react";
import { Briefcase, Code } from "lucide-react";
import Image from "next/image";
import Navbar from "@components/top-Navbar";
import Footer from "@components/Footer";

const AboutUs = () => {
  return (
    <div className="min-h-screen w-full bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-orange-100 via-orange-50 to-sky-100 pt-28">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="mb-4 inline-block rounded-full bg-orange-100 px-4 py-1 text-sm font-medium text-orange-600">
              About Our Team
            </span>
            <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-gray-900 md:text-5xl">
              About <span className="text-orange-500">LIST</span>{" "}
              <span className="text-sky-500">IT</span>
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600">
              Helping everyone manage their day with ease — from students to
              carers and everyone in between.
            </p>
            <div className="mx-auto h-1 w-24 rounded-full bg-orange-500"></div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
            <div className="lg:w-2/3">
              <div className="rounded-lg border-l-4 border-orange-500 bg-white p-8 shadow-lg">
                <h2 className="mb-6 text-3xl font-bold text-gray-900">
                  Our <span className="text-orange-500">Mission</span>
                </h2>
                <p className="mb-4 text-lg text-gray-600">
                  At LIST IT, we believe that effective task management
                  shouldn't be complicated. Our mission is to help people
                  organize their lives with a simple, intuitive tool that works
                  across all their devices.
                </p>
                <p className="mb-4 text-lg text-gray-600">
                  We understand the unique challenges faced by individuals
                  managing work, studies, caregiving, and personal
                  responsibilities. That's why we've created a platform that
                  makes it easy to track and prioritize tasks in every area of
                  life.
                </p>
                <p className="text-lg text-gray-600">
                  Whether you're juggling assignments, part-time jobs, daily
                  errands, or caregiving duties, LIST IT helps you stay on top
                  of everything in one centralized place.
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

      {/* Team Section */}
      <section className="bg-gradient-to-r from-orange-100 via-sky-50 to-orange-100 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Meet Our <span className="text-orange-500">Team</span>
            </h2>
            <div className="mx-auto mt-4 h-1 w-24 rounded-full bg-orange-500"></div>
          </div>
          <div className="flex flex-col items-center space-y-12 md:flex-row md:space-x-8 md:space-y-0">
            <div className="flex w-full flex-col items-center rounded-lg bg-white p-8 shadow-md border-t-4 border-orange-500 md:w-1/2">
              <div className="mb-4 h-32 w-32 overflow-hidden rounded-full bg-gradient-to-br from-orange-400 to-orange-600 p-1">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-gray-200 text-gray-600">
                  <svg
                    className="h-20 w-20"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                  </svg>
                </div>
              </div>
              <h3 className="mb-2 text-2xl font-bold text-gray-900">
                Mohamed Yusuf Mohamed
              </h3>
              <div className="mb-3 flex items-center bg-orange-100 px-4 py-1 rounded-full">
                <Code className="mr-2 h-5 w-5 text-orange-500" />
                <span className="text-orange-700">
                  Full Stack & Mobile Developer
                </span>
              </div>
              <p className="mb-4 text-center text-gray-600">
                Passionate about creating intuitive user experiences across all
                platforms. Contributed to both web and all mobile versions of
                LIST IT with a focus on responsive design and seamless
                functionality.
              </p>
            </div>

            <div className="flex w-full flex-col items-center rounded-lg bg-white p-8 shadow-md border-t-4 border-sky-500 md:w-1/2">
              <div className="mb-4 h-32 w-32 overflow-hidden rounded-full bg-gradient-to-br from-sky-400 to-sky-600 p-1">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-gray-200 text-gray-600">
                  <svg
                    className="h-20 w-20"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                  </svg>
                </div>
              </div>
              <h3 className="mb-2 text-2xl font-bold text-gray-900">
                Abdul Moiz
              </h3>
              <div className="mb-3 flex items-center bg-sky-100 px-4 py-1 rounded-full">
                <Briefcase className="mr-2 h-5 w-5 text-sky-500" />
                <span className="text-sky-700">
                  Full Stack & Mobile Developer
                </span>
              </div>
              <p className="mb-4 text-center text-gray-600">
                Specializes in building scalable applications for both web and
                mobile platforms. Worked across all versions of LIST IT to
                create a consistent and powerful experience on every device.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
