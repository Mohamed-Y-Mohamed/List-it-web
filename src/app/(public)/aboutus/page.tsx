"use client";

import React from "react";
import { motion } from "framer-motion";
import { Briefcase, Code, Heart, Target, Users, Lightbulb } from "lucide-react";
import Image from "next/image";
import { useTheme } from "@/context/ThemeContext";

interface TeamMemberCardProps {
  name: string;
  role: string;
  description: string;
  icon: React.ElementType;
  gradientFrom: string;
  gradientTo: string;
  isDark: boolean;
  delay?: number;
}

const TeamMemberCard: React.FC<TeamMemberCardProps> = ({
  name,
  role,
  description,
  icon: Icon,
  gradientFrom,
  gradientTo,
  isDark,
  delay = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -8, scale: 1.02 }}
      className={`rounded-xl p-6 sm:p-8 transition-all duration-300 backdrop-blur-sm border group relative overflow-hidden ${
        isDark
          ? "bg-gray-800/50 border-gray-700/50 hover:bg-gray-800/70 hover:shadow-xl hover:shadow-gray-900/20"
          : "bg-white/50 border-gray-300/50 hover:bg-white/70 hover:shadow-xl hover:shadow-gray-300/20"
      }`}
    >
      {/* Subtle glow effect */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-gradient-to-br from-orange-500/20 to-transparent" />

      {/* Icon with gradient background */}
      <motion.div
        className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center mb-4 sm:mb-6 shadow-lg relative z-10`}
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ duration: 0.2 }}
      >
        <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
      </motion.div>

      {/* Content */}
      <div className="relative z-10">
        <motion.h3
          className={`text-xl sm:text-2xl font-bold mb-2 ${
            isDark ? "text-gray-100" : "text-gray-900"
          }`}
          whileHover={{ x: 5 }}
          transition={{ duration: 0.2 }}
        >
          {name}
        </motion.h3>

        <motion.div
          className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-4 ${
            isDark
              ? "bg-orange-900/30 text-orange-300 border border-orange-500/30"
              : "bg-orange-100 text-orange-600 border border-orange-200"
          }`}
          whileHover={{ scale: 1.05 }}
        >
          {role}
        </motion.div>

        <p
          className={`leading-relaxed ${isDark ? "text-gray-400" : "text-gray-600"}`}
        >
          {description}
        </p>
      </div>

      {/* Hover indicator */}
      <motion.div
        className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        initial={{ scale: 0 }}
        whileHover={{ scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div
          className={`w-3 h-3 rounded-full ${
            isDark ? "bg-orange-400" : "bg-orange-500"
          }`}
        />
      </motion.div>
    </motion.div>
  );
};

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  delay?: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  title,
  description,
  delay = 0,
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -5, scale: 1.02 }}
      className={`text-center p-6 rounded-xl backdrop-blur-sm border transition-all duration-300 group ${
        isDark
          ? "bg-gray-800/50 border-gray-700/50 hover:bg-gray-800/70"
          : "bg-white/50 border-gray-300/50 hover:bg-white/70"
      }`}
    >
      <motion.div
        className={`w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center ${
          isDark
            ? "bg-orange-900/30 text-orange-400"
            : "bg-orange-100 text-orange-600"
        }`}
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ duration: 0.2 }}
      >
        <Icon className="w-8 h-8" />
      </motion.div>

      <h3
        className={`text-lg font-semibold mb-2 ${
          isDark ? "text-gray-100" : "text-gray-900"
        }`}
      >
        {title}
      </h3>

      <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
        {description}
      </p>
    </motion.div>
  );
};

const AboutUs = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const features = [
    {
      icon: Target,
      title: "Simple & Intuitive",
      description: "Clean, user-friendly interface that anyone can master",
    },
    {
      icon: Users,
      title: "For Everyone",
      description: "Perfect for students, professionals, and caregivers",
    },
    {
      icon: Heart,
      title: "Always Free",
      description: "Core features available at no cost, forever",
    },
  ];

  return (
    <div className="min-h-screen w-full transition-colors duration-300">
      {/* Hero Section */}
      <section className="relative pt-20 sm:pt-28 pb-16 sm:pb-20">
        {/*  background */}
        {isDark ? (
          <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(135deg,#1a0f12_0%,#2d1b20_50%,#1a0f12_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_center,rgba(59,130,246,0.05)_0%,transparent_70%)] before:content-['']" />
        ) : (
          <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(135deg,#f8f6f7_0%,#ffffff_50%,#f8f6f7_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_center,rgba(59,130,246,0.03)_0%,transparent_70%)] before:content-['']" />
        )}

        <div className="mx-auto max-w-7xl px-4 py-8 sm:py-16 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className={`mb-4 sm:mb-6 inline-block rounded-full backdrop-blur-sm ${
                isDark
                  ? "bg-orange-900/30 text-orange-400 border border-orange-500/30"
                  : "bg-orange-100 text-orange-600 border border-orange-200"
              } px-4 sm:px-6 py-2 text-sm sm:text-base font-medium`}
            >
              About Our Team
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className={`mb-4 sm:mb-6 text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tight ${
                isDark ? "text-gray-100" : "text-gray-900"
              }`}
            >
              About{" "}
              <span
                className={`${isDark ? "text-orange-400" : "text-orange-500"} relative`}
              >
                LIST
                <motion.div
                  className="absolute -bottom-1 sm:-bottom-2 left-0 h-0.5 sm:h-1 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1, delay: 1.2 }}
                />
              </span>{" "}
              <span className={isDark ? "text-blue-400" : "text-blue-500"}>
                IT
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className={`mx-auto mb-6 sm:mb-8 max-w-2xl text-base sm:text-lg px-4 ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Helping everyone manage their day with ease — from students to
              carers and everyone in between.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="mx-auto h-1 w-16 sm:w-24 rounded-full bg-gradient-to-r from-orange-500 to-orange-600"
            />
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-12 sm:py-16 lg:py-20 relative">
        {/*  background */}
        {isDark ? (
          <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(135deg,#1a1a1a_0%,#232323_50%,#2a1810_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_center,rgba(59,130,246,0.05)_0%,transparent_70%)] before:content-['']" />
        ) : (
          <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(135deg,#f0f9ff_0%,#ffffff_50%,#f8fafc_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_center,rgba(59,130,246,0.03)_0%,transparent_70%)] before:content-['']" />
        )}

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="lg:w-2/3"
            >
              <div
                className={`rounded-xl border-l-4 border-orange-500 backdrop-blur-sm ${
                  isDark ? "bg-gray-800/50" : "bg-white/50"
                } p-6 sm:p-8 shadow-xl border ${isDark ? "border-gray-700/50" : "border-gray-300/50"}`}
              >
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className={`mb-4 sm:mb-6 text-2xl sm:text-3xl font-bold ${
                    isDark ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  Our{" "}
                  <span
                    className={`${isDark ? "text-orange-400" : "text-orange-500"} relative`}
                  >
                    Mission
                    <motion.div
                      className="absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
                      initial={{ width: 0 }}
                      whileInView={{ width: "100%" }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                    />
                  </span>
                </motion.h2>

                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="space-y-4"
                >
                  <p
                    className={`text-base sm:text-lg ${
                      isDark ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    At LIST IT, we believe that effective task management
                    shouldn&apos;t be complicated. Our mission is to help people
                    organize their lives with a simple, intuitive tool that
                    works across all their devices.
                  </p>

                  <p
                    className={`text-base sm:text-lg ${
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
                    className={`text-base sm:text-lg ${
                      isDark ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    Whether you&apos;re juggling assignments, part-time jobs,
                    daily errands, or caregiving duties, LIST IT helps you stay
                    on top of everything in one centralized place.
                  </p>
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:w-1/3 flex justify-center items-center"
            >
              <motion.div
                whileHover={{ scale: 1.05, rotate: 2 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                <div className="rounded-full bg-gradient-to-br from-orange-500 to-blue-500 p-3 shadow-2xl w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center backdrop-blur-sm">
                  <Image
                    src="/apple-touch-icon.png"
                    alt="LIST IT Logo"
                    width={192}
                    height={192}
                    className="rounded-full object-cover shadow-lg"
                    priority
                  />
                </div>

                {/* Animated rings */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-orange-500/30"
                  animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.1, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full border border-blue-500/20"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.05, 0.2] }}
                  transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-20 relative">
        {/*  background */}
        {isDark ? (
          <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(45deg,#000000_0%,#0f0a0c_20%,#1a1416_40%,#140f11_70%,#000000_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_bottom_left,rgba(236,72,153,0.1)_0%,transparent_63%)] after:absolute after:inset-0 after:[background:radial-gradient(ellipse_at_top_right,rgba(251,113,133,0.06)_0%,transparent_53%)] before:content-[''] after:content-['']" />
        ) : (
          <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(45deg,#fcfafc_0%,#f6f3f6_25%,#ece5ec_50%,#f5f2f5_75%,#ffffff_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_bottom_left,rgba(236,72,153,0.07)_0%,transparent_63%)] after:absolute after:inset-0 after:[background:radial-gradient(ellipse_at_top_right,rgba(251,113,133,0.05)_0%,transparent_53%)] before:content-[''] after:content-['']" />
        )}

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2
              className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-4 ${
                isDark ? "text-gray-100" : "text-gray-900"
              }`}
            >
              Why Choose{" "}
              <span
                className={`${isDark ? "text-orange-400" : "text-orange-500"} relative`}
              >
                LIST IT
                <motion.div
                  className="absolute -bottom-1 sm:-bottom-2 left-0 h-0.5 sm:h-1 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
                  initial={{ width: 0 }}
                  whileInView={{ width: "100%" }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                />
              </span>
            </h2>
            <p
              className={`max-w-2xl mx-auto text-base sm:text-lg ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Built with care for everyone who needs to stay organized
            </p>
          </motion.div>

          <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} delay={index * 0.2} />
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-12 sm:py-16 lg:py-20 relative">
        {/*  background */}
        {isDark ? (
          <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(135deg,#1a1a1a_0%,#232323_50%,#2a1810_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_bottom_center,rgba(251,146,60,0.1)_0%,transparent_50%)] before:content-['']" />
        ) : (
          <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(135deg,#fff7ed_0%,#ffffff_50%,#f9fafb_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_bottom_center,rgba(251,146,60,0.05)_0%,transparent_70%)] before:content-['']" />
        )}

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2
              className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-4 ${
                isDark ? "text-gray-100" : "text-gray-900"
              }`}
            >
              Meet Our{" "}
              <span
                className={`${isDark ? "text-orange-400" : "text-orange-500"} relative`}
              >
                Team
                <motion.div
                  className="absolute -bottom-1 sm:-bottom-2 left-0 h-0.5 sm:h-1 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
                  initial={{ width: 0 }}
                  whileInView={{ width: "100%" }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                />
              </span>
            </h2>
            <p
              className={`max-w-2xl mx-auto text-base sm:text-lg ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              The passionate developers behind LIST IT
            </p>
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-2 max-w-5xl mx-auto">
            <TeamMemberCard
              name="Mohamed Yusuf Mohamed"
              role="Full Stack & Mobile Developer"
              description="Passionate about creating intuitive user experiences across all platforms. Contributed to both web and all mobile versions of LIST IT with a focus on responsive design and seamless functionality."
              icon={Code}
              gradientFrom="from-orange-400"
              gradientTo="to-orange-600"
              isDark={isDark}
              delay={0}
            />
            <TeamMemberCard
              name="Abdul Moiz"
              role="Full Stack & Mobile Developer"
              description="Specializes in building scalable applications for both web and mobile platforms. Worked across all versions of LIST IT to create a consistent and powerful experience on every device."
              icon={Briefcase}
              gradientFrom="from-blue-400"
              gradientTo="to-blue-600"
              isDark={isDark}
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-12 sm:py-16 lg:py-20 relative">
        {/*  background */}
        {isDark ? (
          <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(135deg,#1a0f12_0%,#2d1b20_50%,#1a0f12_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_center,rgba(59,130,246,0.05)_0%,transparent_70%)] before:content-['']" />
        ) : (
          <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(135deg,#f8f6f7_0%,#ffffff_50%,#f8f6f7_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_center,rgba(59,130,246,0.03)_0%,transparent_70%)] before:content-['']" />
        )}

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className={`text-center p-8 sm:p-12 rounded-xl backdrop-blur-sm border ${
              isDark
                ? "bg-gray-800/50 border-gray-700/50"
                : "bg-white/50 border-gray-300/50"
            }`}
          >
            <motion.div
              className={`w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 rounded-xl flex items-center justify-center ${
                isDark
                  ? "bg-orange-900/30 text-orange-400"
                  : "bg-orange-100 text-orange-600"
              }`}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ duration: 0.2 }}
            >
              <Lightbulb className="w-8 h-8 sm:w-10 sm:h-10" />
            </motion.div>

            <h2
              className={`text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 ${
                isDark ? "text-gray-100" : "text-gray-900"
              }`}
            >
              Our Vision
            </h2>

            <p
              className={`text-base sm:text-lg leading-relaxed ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              We envision a world where task management is effortless and
              accessible to everyone. LIST IT represents our commitment to
              creating tools that adapt to your life, not the other way around.
              Our goal is to continue evolving and improving to meet the diverse
              needs of our growing community.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
