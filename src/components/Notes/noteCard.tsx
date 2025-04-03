"use client";

import React from "react";

interface NoteCardProps {
  title: string;
  content: string;
  lastUpdated?: string;
  className?: string;
}

const NoteCard = ({
  title,
  content,
  lastUpdated,
  className = "",
}: NoteCardProps) => {
  return (
    <div className={`rounded-lg bg-yellow-50 p-4 ${className}`}>
      <h4 className="mb-2 font-semibold text-gray-800">{title}</h4>
      <p className="text-sm text-gray-600">{content}</p>
      {lastUpdated && (
        <div className="mt-3 text-right">
          <span className="text-xs text-gray-500">
            Last updated: {lastUpdated}
          </span>
        </div>
      )}
    </div>
  );
};

export default NoteCard;
