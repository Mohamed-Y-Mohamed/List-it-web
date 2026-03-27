"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  isDark: boolean;
  trend?: number;
  suffix?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  color,
  isDark,
  trend,
  suffix = "",
}) => {
  const Icon = icon;
  const hasTrend = trend !== undefined && trend !== 0;
  const isPositiveTrend = trend && trend > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`p-4 md:p-6 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} 
        shadow-sm hover:shadow-md transition-all duration-200`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 md:p-3 rounded-lg ${color}`}>
          <Icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
        </div>
        {hasTrend && (
          <div
            className={`flex items-center text-xs md:text-sm ${
              isPositiveTrend ? "text-green-500" : "text-red-500"
            }`}
          >
            {isPositiveTrend ? (
              <TrendingUp className="h-3 w-3 md:h-4 md:w-4 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 md:h-4 md:w-4 mr-1" />
            )}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <h3
        className={`text-xs md:text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-500"} mb-1`}
      >
        {title}
      </h3>
      <div className="text-2xl md:text-3xl font-bold">
        {value}
        {suffix}
      </div>
    </motion.div>
  );
};

export default StatsCard;
