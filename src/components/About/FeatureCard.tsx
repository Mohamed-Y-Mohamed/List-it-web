"use client";

import React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface FeatureCardProps {
  icon: LucideIcon;
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

export default FeatureCard;
