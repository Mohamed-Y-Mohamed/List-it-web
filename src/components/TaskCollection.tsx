"use client";

import React from "react";
import { Calendar, Folder } from "lucide-react";

interface TaskViewProps {
  className?: string;
}

const TaskCollection = ({ className = "" }: TaskViewProps) => {
  return (
    <div
      className={`overflow-hidden rounded-lg bg-white p-6 shadow-lg ${className}`}
    >
      {/* Collection Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Folder className="h-5 w-5 text-orange-500" />
          <h3 className="text-xl font-bold text-gray-800">Work Collection</h3>
        </div>
        <div className="flex items-center space-x-2">
          <div className="rounded-full bg-orange-100 px-4 py-1 text-sm font-medium text-orange-600">
            2 Tasks
          </div>
          <div className="h-4 w-4 rounded-full bg-orange-500"></div>
        </div>
      </div>

      {/* Tasks inside collection */}
      <div className="space-y-4">
        <div className="rounded-lg border border-gray-200 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="font-semibold text-gray-800">Website Redesign</h4>
            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-600">
              In Progress
            </span>
          </div>
          <p className="mb-2 text-sm text-gray-600">
            Update the company website with new branding and improve user
            experience.
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center">
              <Calendar className="mr-1 h-4 w-4" />
              <span>Apr 1 - Apr 15, 2025</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>Web Design</span>
              <div className="h-3 w-3 rounded-full bg-purple-500"></div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="font-semibold text-gray-800">Product Launch</h4>
            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-600">
              High Priority
            </span>
          </div>
          <p className="mb-2 text-sm text-gray-600">
            Coordinate marketing efforts for the new product launch.
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center">
              <Calendar className="mr-1 h-4 w-4" />
              <span>Apr 10 - Apr 25, 2025</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>Marketing</span>
              <div className="h-3 w-3 rounded-full bg-blue-500"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCollection;
