"use client";

import React from "react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  isDark: boolean;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  isDark,
}) => {
  return (
    <div
      className={`rounded-lg ${isDark ? "bg-gray-800" : "bg-white"} p-6 shadow-sm transition-all hover:shadow-md`}
    >
      <div className="mb-4">{icon}</div>
      <h3
        className={`mb-3 text-xl font-semibold ${
          isDark ? "text-gray-100" : "text-gray-900"
        }`}
      >
        {title}
      </h3>
      <p className={isDark ? "text-gray-300" : "text-gray-600"}>
        {description}
      </p>
    </div>
  );
};

export default FeatureCard;
