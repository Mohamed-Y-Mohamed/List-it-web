"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, Plus, Activity } from "lucide-react";
import { DashboardActivityItem } from "@/types/schema";
import { formatTimeAgo } from "@/utils/dateUtils";

interface RecentActivityProps {
  activities: DashboardActivityItem[];
  isLoading: boolean;
  isDark: boolean;
}

const RecentActivity: React.FC<RecentActivityProps> = ({
  activities,
  isLoading,
  isDark,
}) => {
  if (isLoading) {
    return (
      <div
        className={`p-4 md:p-6 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} shadow-sm`}
      >
        <div
          className={`h-6 w-32 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"} animate-pulse mb-4`}
        ></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start animate-pulse">
              <div
                className={`h-8 w-8 rounded-full ${isDark ? "bg-gray-700/50" : "bg-gray-200/50"} mr-3`}
              ></div>
              <div className="flex-1">
                <div
                  className={`h-4 w-3/4 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"} mb-2`}
                ></div>
                <div
                  className={`h-3 w-1/3 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div
        className={`p-4 md:p-6 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} shadow-sm`}
      >
        <h2
          className={`text-lg md:text-xl font-semibold ${isDark ? "text-white" : "text-gray-800"} mb-4`}
        >
          Recent Activity
        </h2>
        <div className="text-center py-8">
          <Activity
            className={`h-12 w-12 mx-auto mb-4 ${isDark ? "text-gray-600" : "text-gray-300"}`}
          />
          <p
            className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"} mb-2`}
          >
            No recent activity
          </p>
          <p
            className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}
          >
            Your task activity will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className={`p-4 md:p-6 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} shadow-sm`}
    >
      <h2
        className={`text-lg md:text-xl font-semibold ${isDark ? "text-white" : "text-gray-800"} mb-4`}
      >
        Recent Activity
      </h2>
      <div className="space-y-4">
        {activities.slice(0, 5).map((activity) => (
          <div key={activity.id} className="flex items-start">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-white mr-3 ${
                activity.type === "completed"
                  ? isDark
                    ? "bg-green-600"
                    : "bg-green-500"
                  : isDark
                    ? "bg-blue-600"
                    : "bg-blue-500"
              }`}
            >
              {activity.type === "completed" ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium ${isDark ? "text-gray-200" : "text-gray-700"} line-clamp-2`}
              >
                {activity.description}
              </p>
              <p
                className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"} mt-1`}
              >
                {formatTimeAgo(activity.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default RecentActivity;
