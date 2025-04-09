"use client";

import React from "react";

interface SectionTitleProps {
  title: string;
  highlight: string;
  description: string;
  isDark: boolean;
  highlightColor: string;
}

const SectionTitle: React.FC<SectionTitleProps> = ({
  title,
  highlight,
  description,
  isDark,
  highlightColor,
}) => {
  return (
    <div className="text-center">
      <h2
        className={`text-3xl font-bold tracking-tight ${isDark ? "text-gray-100" : "text-gray-900"} md:text-4xl`}
      >
        {title} <span className={highlightColor}>{highlight}</span>
      </h2>
      <p
        className={`mx-auto mt-4 max-w-2xl text-lg ${isDark ? "text-gray-300" : "text-gray-600"}`}
      >
        {description}
      </p>
    </div>
  );
};

export default SectionTitle;
