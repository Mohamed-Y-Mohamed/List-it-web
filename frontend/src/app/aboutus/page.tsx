"use client";

import React from "react";
import {
  Code,
  BookOpen,
  Monitor,
  Smartphone,
  Tablet,
  Zap,
  Briefcase,
  GraduationCap,
  Home,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@components/top-Navbar";
import Footer from "@components/Footer";

const AboutUs = () => {
  return (
    <div className="min-h-screen w-full bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-white pt-28">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-gray-900 md:text-5xl">
              About <span className="text-sky-500">LISTED</span>
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600">
              Helping everyone manage their day with ease — from students to
              carers and everyone in between.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center lg:flex-row lg:items-start lg:gap-12">
            <div className="lg:w-1/2">
              <h2 className="mb-6 text-3xl font-bold text-gray-900">
                Our Mission
              </h2>
              <p className="mb-4 text-lg text-gray-600">
                At LISTED, we believe that effective task management shouldn't
                be complicated. Our mission is to help people organize their
                lives with a simple, intuitive tool that works across all their
                devices.
              </p>
              <p className="mb-4 text-lg text-gray-600">
                We understand the unique challenges faced by individuals
                managing work, studies, caregiving, and personal
                responsibilities. That's why we've created a platform that makes
                it easy to track and prioritize tasks in every area of life.
              </p>
              <p className="text-lg text-gray-600">
                Whether you're juggling assignments, part-time jobs, daily
                errands, or caregiving duties, LISTED helps you stay on top of
                everything in one centralized place.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
            Meet Our Team
          </h2>
          <div className="flex flex-col items-center space-y-12 md:flex-row md:space-x-8 md:space-y-0">
            <div className="flex w-full flex-col items-center rounded-lg bg-gray-50 p-8 shadow-md md:w-1/2">
              <div className="mb-4 h-32 w-32 overflow-hidden rounded-full">
                <img
                  src="/api/placeholder/250/250"
                  alt="Mohamed Yusuf Mohamed"
                  className="h-full w-full object-cover"
                />
              </div>
              <h3 className="mb-2 text-2xl font-bold text-gray-900">
                Mohamed Yusuf Mohamed
              </h3>
              <p className="mb-4 text-center text-gray-600">
                Full Stack Developer with a passion for creating intuitive user
                experiences. Specializes in frontend development and user
                interface design.
              </p>
            </div>

            <div className="flex w-full flex-col items-center rounded-lg bg-gray-50 p-8 shadow-md md:w-1/2">
              <div className="mb-4 h-32 w-32 overflow-hidden rounded-full">
                <img
                  src="/api/placeholder/250/250"
                  alt="Abdul Moiz"
                  className="h-full w-full object-cover"
                />
              </div>
              <h3 className="mb-2 text-2xl font-bold text-gray-900">
                Abdul Moiz
              </h3>
              <p className="mb-4 text-center text-gray-600">
                Backend Developer with expertise in building scalable
                applications. Focused on performance optimization and creating
                robust architectures.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutUs;
