"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { DashboardPriorityTask } from "@/types/schema";
import { formatDisplayDate } from "@/utils/dateUtils";

interface PriorityTasksProps {
  tasks: DashboardPriorityTask[];
  isLoading: boolean;
  isDark: boolean;
}

const PriorityTasks: React.FC<PriorityTasksProps> = ({
  tasks,
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
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`p-3 rounded-lg ${isDark ? "bg-gray-700/50" : "bg-gray-100"} animate-pulse`}
            >
              <div
                className={`h-4 w-3/4 rounded ${isDark ? "bg-gray-600" : "bg-gray-200"} mb-2`}
              ></div>
              <div
                className={`h-3 w-1/4 rounded ${isDark ? "bg-gray-600" : "bg-gray-200"}`}
              ></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div
        className={`p-4 md:p-6 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} shadow-sm`}
      >
        <h2
          className={`text-lg md:text-xl font-semibold ${isDark ? "text-white" : "text-gray-800"} mb-4`}
        >
          Priority Tasks
        </h2>
        <div className="text-center py-8">
          <Star
            className={`h-12 w-12 mx-auto mb-4 ${isDark ? "text-gray-600" : "text-gray-300"}`}
          />
          <p
            className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"} mb-2`}
          >
            No priority tasks
          </p>
          <p
            className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}
          >
            Pin important tasks to see them here
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className={`p-4 md:p-6 rounded-xl ${isDark ? "bg-gray-800/50" : "bg-white/50"} shadow-sm`}
    >
      <h2
        className={`text-lg md:text-xl font-semibold ${isDark ? "text-white" : "text-gray-800"} mb-4`}
      >
        Priority Tasks
      </h2>
      <div className="space-y-3">
        {tasks.slice(0, 5).map((task) => (
          <Link
            href={`/task/${task.id}`}
            key={task.id}
            className={`block p-3 rounded-lg ${
              isDark
                ? "bg-gray-700/50 hover:bg-gray-700 border border-gray-700"
                : "bg-gray-50/50 hover:bg-gray-100 border border-gray-100"
            } transition-colors duration-200`}
          >
            <div className="flex items-start">
              <Star
                className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isDark ? "text-orange-400" : "text-orange-500"} mr-2`}
              />
              <div className="flex-1 min-w-0">
                <h4
                  className={`text-sm font-medium ${isDark ? "text-gray-200" : "text-gray-700"} line-clamp-1`}
                >
                  {task.text || "Untitled Task"}
                </h4>
                {task.due_date && (
                  <p
                    className={`text-xs flex items-center mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDisplayDate(task.due_date)}
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
      {tasks.length > 5 && (
        <Link
          href="/tasks"
          className={`flex items-center justify-center text-sm font-medium mt-4 py-2 rounded-lg
            ${
              isDark
                ? "text-gray-300 hover:text-white bg-gray-700/50 hover:bg-gray-700"
                : "text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200"
            } transition-colors duration-200`}
        >
          View all tasks
          <ArrowRight className="h-3 w-3 ml-1" />
        </Link>
      )}
    </motion.div>
  );
};

export default PriorityTasks;
