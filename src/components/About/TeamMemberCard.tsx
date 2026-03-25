"use client";

import React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface TeamMemberCardProps {
  name: string;
  role: string;
  description: string;
  icon: LucideIcon;
  gradientFrom: string;
  gradientTo: string;
  isDark: boolean;
  delay?: number;
  portfolioUrl: string;
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
  portfolioUrl,
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
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-gradient-to-br from-orange-500/20 to-transparent" />

      {/* Icon */}
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
        >
          {name}
        </motion.h3>

        <div
          className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-4 ${
            isDark
              ? "bg-orange-900/30 text-orange-300 border border-orange-500/30"
              : "bg-orange-100 text-orange-600 border border-orange-200"
          }`}
        >
          {role}
        </div>

        <p
          className={`leading-relaxed mb-6 ${isDark ? "text-gray-400" : "text-gray-600"}`}
        >
          {description}
        </p>

        {/* Portfolio Button */}
        <motion.button
          onClick={(e) => {
            e.preventDefault();
            window.open(portfolioUrl, "_blank");
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all duration-300 border relative overflow-hidden group/btn ${
            isDark
              ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-400/30 hover:shadow-lg hover:shadow-orange-500/30"
              : "bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-400/50 hover:shadow-lg hover:shadow-orange-500/20"
          }`}
        >
          <span className="relative z-10">Go to Portfolio</span>
          <svg
            className="w-4 h-4 relative z-10 group-hover/btn:translate-x-1 transition-transform duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4m-4-6l6-6m0 0l-6 6"
            />
          </svg>
        </motion.button>
      </div>

      {/* Hover indicator */}
      <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
        <svg
          className={`w-5 h-5 ${isDark ? "text-orange-400" : "text-orange-500"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7l5 5m0 0l-5 5m5-5H6"
          />
        </svg>
      </div>
    </motion.div>
  );
};

export default TeamMemberCard;
