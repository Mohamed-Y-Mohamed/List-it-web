"use client";

import React from "react";
import { Calendar } from "lucide-react";

interface TaskCardProps {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  collection: string;
  collectionColor: string;
  className?: string;
}

const TaskCard = ({
  title,
  description,
  startDate,
  endDate,
  collection,
  collectionColor = "bg-blue-500",
  className = "",
}: TaskCardProps) => {
  return (
    <div
      className={`rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow ${className}`}
    >
      <div className="mb-2">
        <h4 className="font-semibold text-gray-800">{title}</h4>
      </div>
      <p className="mb-2 text-sm text-gray-600">{description}</p>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center">
          <Calendar className="mr-1 h-4 w-4" />
          <span>
            {startDate} - {endDate}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span>{collection}</span>
          <div className={`h-3 w-3 rounded-full ${collectionColor}`}></div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
