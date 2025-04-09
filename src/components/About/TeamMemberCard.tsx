"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface TeamMemberCardProps {
  name: string;
  role: string;
  description: string;
  icon: LucideIcon;
  gradientFrom: string;
  gradientTo: string;
  isDark: boolean;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
}

const TeamMemberCard: React.FC<TeamMemberCardProps> = ({
  name,
  role,
  description,
  icon: Icon,
  gradientFrom,
  gradientTo,
  isDark,
  badgeBg,
  badgeText,
  borderColor,
}) => {
  return (
    <div
      className={`flex w-full flex-col items-center rounded-lg ${isDark ? "bg-gray-800" : "bg-white"} ${borderColor} p-8 shadow-md border-t-4 md:w-1/2`}
    >
      <div
        className={`mb-4 h-32 w-32 overflow-hidden rounded-full bg-gradient-to-br ${gradientFrom} ${gradientTo} p-1`}
      >
        <div
          className={`flex h-full w-full items-center justify-center rounded-full ${isDark ? "bg-gray-700 text-gray-400" : "bg-gray-200 text-gray-600"}`}
        >
          <svg className="h-20 w-20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
          </svg>
        </div>
      </div>
      <h3
        className={`mb-2 text-2xl font-bold ${isDark ? "text-gray-100" : "text-gray-900"}`}
      >
        {name}
      </h3>
      <div
        className={`mb-3 flex items-center ${badgeBg} px-4 py-1 rounded-full`}
      >
        <Icon
          className={`mr-2 h-5 w-5 ${isDark ? "text-orange-400" : "text-orange-500"}`}
        />
        <span className={badgeText}>{role}</span>
      </div>
      <p
        className={`mb-4 text-center ${isDark ? "text-gray-300" : "text-gray-600"}`}
      >
        {description}
      </p>
    </div>
  );
};

export default TeamMemberCard;
