"use client";

import React from "react";
import { useTheme } from "@/context/ThemeContext";
import { CheckCircle2, CalendarClock, Plus } from "lucide-react";

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: "check" | "calendar" | "plus";
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  icon = "check",
  actionLabel,
  onAction,
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  let IconComponent;
  let iconBgColor;
  let iconFgColor;

  switch (icon) {
    case "calendar":
      IconComponent = CalendarClock;
      iconBgColor = isDark ? "bg-blue-900/30" : "bg-blue-100";
      iconFgColor = isDark ? "text-blue-300" : "text-blue-600";
      break;
    case "plus":
      IconComponent = Plus;
      iconBgColor = isDark ? "bg-purple-900/30" : "bg-purple-100";
      iconFgColor = isDark ? "text-purple-300" : "text-purple-600";
      break;
    case "check":
    default:
      IconComponent = CheckCircle2;
      iconBgColor = isDark ? "bg-green-900/30" : "bg-green-100";
      iconFgColor = isDark ? "text-green-300" : "text-green-600";
  }

  return (
    <div
      className={`text-center py-16 rounded-xl ${
        isDark ? "bg-gray-800/20 text-gray-300" : "bg-white text-gray-500"
      } shadow-lg transition-all duration-300`}
    >
      <div className="flex flex-col items-center justify-center space-y-5">
        <div className={`p-4 rounded-full ${iconBgColor}`}>
          <IconComponent className={`h-10 w-10 ${iconFgColor}`} />
        </div>
        <div className="space-y-2">
          <p className="text-xl font-medium">{title}</p>
          <p className="text-sm max-w-sm mx-auto">{message}</p>
        </div>

        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className={`mt-4 px-4 py-2 rounded-lg font-medium transition-colors ${
              isDark
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
