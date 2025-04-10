"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface HowItWorksCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  isDark: boolean;
  bgColor: string;
  hoverBorder: string;
  textColor: string;
}

const HowItWorksCard: React.FC<HowItWorksCardProps> = ({
  icon: Icon,
  title,
  description,
  isDark,
  bgColor,
  hoverBorder,
  textColor,
}) => {
  return (
    <div
      className={`rounded-lg ${bgColor} hover:${hoverBorder} p-8 text-center shadow-sm transition-all hover:shadow-md border border-transparent`}
    >
      <div
        className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${textColor}`}
      >
        <Icon className="h-8 w-8" />
      </div>
      <h3
        className={`mb-3 text-xl font-semibold ${isDark ? "text-gray-100" : "text-gray-900"}`}
      >
        {title}
      </h3>
      <p className={isDark ? "text-gray-300" : "text-gray-600"}>
        {description}
      </p>
    </div>
  );
};

export default HowItWorksCard;
