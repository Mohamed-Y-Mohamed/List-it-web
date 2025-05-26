"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { supabase } from "@/utils/client";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Search,
  Star,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";

interface DisplayTask {
  id: string;
  title: string;
  description?: string | null;
  createdDate: Date;
  completedDate: Date;
  isCompleted: boolean;
  priority?: string;
  category?: string;
}

interface GroupedDate {
  date: Date;
  tasks: DisplayTask[];
}

// Animated counter component
const AnimatedCounter: React.FC<{
  value: number;
  duration?: number;
  suffix?: string;
}> = ({ value, duration = 1000, suffix = "" }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    const startValue = 0;
    const endValue = value;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const current = startValue + (endValue - startValue) * progress;
      setCount(Math.floor(current));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return (
    <span>
      {count}
      {suffix}
    </span>
  );
};

// Progress color function based on completion percentage
const getProgressColor = (percentage: number) => {
  switch (true) {
    case percentage === 100:
      return { color: "#10b981", name: "green" }; // green
    case percentage >= 80:
      return { color: "#06d6a0", name: "mint" }; // mint
    case percentage >= 60:
      return { color: "#3b82f6", name: "blue" }; // blue
    case percentage >= 40:
      return { color: "#f59e0b", name: "orange" }; // orange
    case percentage >= 20:
      return { color: "#eab308", name: "yellow" }; // yellow
    default:
      return { color: "#ef4444", name: "red" }; // red
  }
};

// Overall Progress Component
const OverallProgress: React.FC<{
  completedCount: number;
  totalCount: number;
  isDark: boolean;
  isLoading: boolean;
}> = ({ completedCount, totalCount, isDark, isLoading }) => {
  const percentage =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const progressColor = getProgressColor(percentage);

  const getMotivationalMessage = (percentage: number) => {
    switch (true) {
      case percentage === 100:
        return "Perfect! All tasks completed! 🎉";
      case percentage >= 80:
        return "Keep up the momentum!";
      case percentage >= 60:
        return "Great progress so far!";
      case percentage >= 40:
        return "You're getting there!";
      case percentage >= 20:
        return "Good start, keep going!";
      default:
        return "Time to get started!";
    }
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={`rounded-xl p-6 mb-8 ${
          isDark ? "bg-gray-800/50" : "bg-white/50"
        } backdrop-blur-sm border ${isDark ? "border-gray-700/50" : "border-gray-300/50"}`}
      >
        <div className="animate-pulse">
          <div
            className={`h-8 w-32 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"} mb-2`}
          ></div>
          <div
            className={`h-4 w-48 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"} mb-4`}
          ></div>
          <div
            className={`h-3 w-full rounded-full ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
          ></div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`rounded-xl p-6 mb-8 ${
        isDark ? "bg-transparent" : "bg-white"
      } backdrop-blur-sm border ${isDark ? "border-gray-700/59" : "border-gray-300/50"} relative overflow-hidden`}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2
              className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
            >
              Overall Progress
            </h2>
            <p
              className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              {getMotivationalMessage(percentage)}
            </p>
          </div>

          <div className="text-right">
            <div
              className="text-4xl font-bold mb-1"
              style={{ color: progressColor.color }}
            >
              <AnimatedCounter value={percentage} suffix="%" />
            </div>
            <p
              className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              Complete
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div
          className={`w-full h-3 rounded-full ${isDark ? "bg-gray-700" : "bg-gray-200"} overflow-hidden`}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: progressColor.color }}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </div>

        <div className="flex justify-between mt-2 text-sm">
          <span className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
            {completedCount} completed
          </span>
          <span className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
            {totalCount} total tasks
          </span>
        </div>
      </div>
    </motion.div>
  );
};

//  task card
const TaskCard: React.FC<{
  task: DisplayTask;
  isDark: boolean;
  index: number;
}> = ({ task, isDark, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`p-4 rounded-xl transition-all duration-300 cursor-pointer border-l-4 border-green-500
        ${
          isDark
            ? "bg-gray-800/50 border-r border-t border-b border-gray-700/50 hover:bg-gray-800/80"
            : "bg-white/50 border-r border-t border-b border-gray-200/50 hover:bg-white/80"
        }
        hover:shadow-lg hover:scale-[1.02]`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-start">
        <motion.div
          className="flex-shrink-0 mt-1"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="h-8 w-8 rounded-full flex items-center justify-center shadow-sm bg-gradient-to-br from-green-500 to-emerald-600">
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
        </motion.div>

        <div className="ml-4 flex-1">
          <div className="flex items-center justify-between">
            <h3
              className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
            >
              {task.title}
            </h3>
            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              Completed
            </span>
          </div>

          <AnimatePresence>
            {(task.description || isExpanded) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {task.description && (
                  <p
                    className={`mt-2 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
                    {task.description}
                  </p>
                )}

                <div className="flex items-center justify-between mt-3">
                  <div
                    className={`flex items-center text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    <span>
                      Created: {format(task.createdDate, "MMM dd, yyyy")}
                    </span>
                  </div>
                  <div
                    className={`flex items-center text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    <span>
                      Completed: {format(task.completedDate, "MMM dd, yyyy")}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

// Date timeline component (Desktop only)
const DateTimeline: React.FC<{
  dates: GroupedDate[];
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
  isDark: boolean;
  timelineRef: React.RefObject<HTMLDivElement | null>;
  onScrollLeft: () => void;
  onScrollRight: () => void;
}> = ({
  dates,
  selectedDate,
  onDateSelect,
  isDark,
  timelineRef,
  onScrollLeft,
  onScrollRight,
}) => {
  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMM dd");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`rounded-xl shadow-sm overflow-hidden mb-8 ${
        isDark ? "bg-gray-800/50" : "bg-white/50"
      } p-4 relative hidden md:block`}
    >
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onScrollLeft}
        className={`absolute left-2 top-1/2 transform -translate-y-1/2 z-10 p-2 rounded-full shadow-lg ${
          isDark
            ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
            : "bg-white text-gray-600 hover:bg-gray-100"
        } transition-colors`}
        aria-label="Scroll left"
      >
        <ChevronLeft className="h-4 w-4" />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onScrollRight}
        className={`absolute right-2 top-1/2 transform -translate-y-1/2 z-10 p-2 rounded-full shadow-lg ${
          isDark
            ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
            : "bg-white text-gray-600 hover:bg-gray-100"
        } transition-colors`}
        aria-label="Scroll right"
      >
        <ChevronRight className="h-4 w-4" />
      </motion.button>

      <div
        ref={timelineRef}
        className="flex overflow-x-auto scrollbar-hide space-x-3 pb-2 px-8"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {dates.map(({ date, tasks }, index) => {
          const isActive = date.toISOString() === selectedDate;
          const dateKey = date.toISOString();

          return (
            <motion.div
              key={dateKey}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onClick={() => onDateSelect(dateKey)}
              className={`flex-none min-w-[140px] p-4 rounded-lg cursor-pointer transition-all duration-300 ${
                isActive
                  ? isDark
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg scale-105"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105"
                  : isDark
                    ? "bg-gray-700/50 hover:bg-gray-700 text-gray-300"
                    : "bg-gray-100/50 hover:bg-gray-200 text-gray-800"
              }`}
            >
              <div className="text-center">
                <div className="text-sm font-semibold mb-1">
                  {getDateLabel(date)}
                </div>
                <div className="text-xs opacity-80 mb-2">
                  {format(date, "yyyy")}
                </div>
                <div className="flex items-center justify-center text-xs">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  <span className="font-medium">{tasks.length}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

// Mobile Date Header Component
const MobileDateHeader: React.FC<{
  date: Date;
  taskCount: number;
  isDark: boolean;
}> = ({ date, taskCount, isDark }) => {
  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM dd, yyyy");
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-between py-4"
    >
      <div className="flex items-center">
        <div className="w-4 h-4 rounded-full bg-blue-500 mr-3"></div>
        <div>
          <h2
            className={`text-lg font-medium ${isDark ? "text-white" : "text-gray-900"}`}
          >
            {getDateLabel(date)}
          </h2>
          <p
            className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            {isToday(date) ? "Today" : format(date, "EEEE")}
          </p>
        </div>
      </div>
      <div className="flex items-center bg-yellow-500 text-yellow-900 px-2 py-1 rounded-full">
        <Star className="h-3 w-3 mr-1 fill-current" />
        <span className="text-sm font-medium">{taskCount}</span>
      </div>
    </motion.div>
  );
};

export default function CompletedPage() {
  const [tasks, setTasks] = useState<DisplayTask[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const timelineRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === "dark";
  const scrollAmount = 240;

  // Fetch completed tasks and total tasks from the database
  useEffect(() => {
    const fetchTasksData = async () => {
      if (!user) return;

      setIsLoading(true);

      try {
        // Fetch total tasks count (all tasks ever created)
        const { count: totalCount } = await supabase
          .from("task")
          .select("*", { count: "exact", head: true })
          .eq("is_deleted", false);

        setTotalTasks(totalCount || 0);

        // Fetch all completed tasks for the current user
        const { data: completedTasksData, error } = await supabase
          .from("task")
          .select("*")
          .eq("is_completed", true)
          .eq("is_deleted", false)
          .not("date_completed", "is", null)
          .order("date_completed", { ascending: false });

        if (error) {
          console.error("Error fetching completed tasks:", error);
          setIsLoading(false);
          return;
        }

        if (!completedTasksData || completedTasksData.length === 0) {
          setTasks([]);
          setIsLoading(false);
          return;
        }

        // Transform the data to match the DisplayTask interface
        const formattedTasks: DisplayTask[] = completedTasksData.map(
          (task) => ({
            id: task.id,
            title: task.text || "Untitled Task",
            description: task.description,
            createdDate: new Date(task.created_at),
            completedDate: new Date(task.date_completed),
            isCompleted: true,
            priority: task.priority || "medium",
            category: task.category || "general",
          })
        );

        setTasks(formattedTasks);
      } catch (error) {
        console.error("Unexpected error fetching tasks data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasksData();
  }, [user]);

  // Group tasks by completion date
  const groupedTasksByDay = useMemo(() => {
    const filtered = tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.description &&
          task.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const grouped: Record<string, DisplayTask[]> = {};

    filtered.forEach((task) => {
      const date = new Date(task.completedDate);
      const startOfDay = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      ).toISOString();

      if (!grouped[startOfDay]) {
        grouped[startOfDay] = [];
      }

      grouped[startOfDay].push(task);
    });

    return grouped;
  }, [tasks, searchTerm]);

  const sortedDates = useMemo((): GroupedDate[] => {
    return Object.keys(groupedTasksByDay)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map((dateKey) => ({
        date: new Date(dateKey),
        tasks: groupedTasksByDay[dateKey],
      }));
  }, [groupedTasksByDay]);

  // Set the first date as selected when data loads initially
  useEffect(() => {
    if (sortedDates.length > 0 && !selectedDate) {
      setSelectedDate(sortedDates[0].date.toISOString());
    }
  }, [sortedDates, selectedDate]);

  // Get tasks for the selected date
  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return [];
    return (
      sortedDates.find((group) => group.date.toISOString() === selectedDate)
        ?.tasks || []
    );
  }, [selectedDate, sortedDates]);

  // Function to scroll timeline left or right
  const scrollTimeline = (direction: "left" | "right") => {
    if (timelineRef.current) {
      const currentScroll = timelineRef.current.scrollLeft;
      const newScroll =
        direction === "left"
          ? Math.max(0, currentScroll - scrollAmount)
          : currentScroll + scrollAmount;

      timelineRef.current.scrollTo({
        left: newScroll,
        behavior: "smooth",
      });
    }
  };

  if (isLoading) {
    return (
      <div
        className={`transition-all pt-16 pr-4 md:pr-16 min-h-screen duration-300 pb-20 w-full relative
        ${isDark ? "text-gray-200" : "text-gray-800"}`}
      >
        {isDark ? (
          <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(135deg,#121212_0%,#1a1a1a_30%,#232323_70%,#2a1810_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_top_right,rgba(251,146,60,0.1)_0%,transparent_50%)] before:content-['']" />
        ) : (
          <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(135deg,#ffffff_0%,#fefefe_50%,#f9fafb_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_top_right,rgba(251,146,60,0.05)_0%,transparent_70%)] before:content-['']" />
        )}

        <div className="max-w-7xl px-4 md:pl-20 w-full mx-auto">
          <div className="animate-pulse space-y-6 mt-8">
            <div className="h-8 bg-gray-300 rounded w-1/3"></div>
            <div className="h-32 bg-gray-300 rounded-xl"></div>
            <div className="h-64 bg-gray-300 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`transition-all pt-16 pr-4 md:pr-16 min-h-screen duration-300 pb-20 w-full relative
      ${isDark ? "text-gray-200" : "text-gray-800"}`}
    >
      {/* Animated background */}
      {isDark ? (
        <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(45deg,#000000_0%,#080a0d_20%,#121518_40%,#0d0f12_70%,#000000_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_bottom_left,rgba(37,99,235,0.18)_0%,transparent_58%)] after:absolute after:inset-0 after:[background:radial-gradient(ellipse_at_top_right,rgba(129,140,248,0.1)_0%,transparent_48%)] before:content-[''] after:content-['']" />
      ) : (
        <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(45deg,#f7f9fc_0%,#f0f4f8_25%,#e1e7ee_50%,#f2f3f5_75%,#fefefe_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_bottom_left,rgba(37,99,235,0.09)_0%,transparent_58%)] after:absolute after:inset-0 after:[background:radial-gradient(ellipse_at_top_right,rgba(129,140,248,0.07)_0%,transparent_48%)] before:content-[''] after:content-['']" />
      )}

      <div className="max-w-7xl px-4 md:pl-20 w-full mx-auto">
        {/* Header - Desktop only */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 hidden md:block"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1
                className={`text-3xl md:text-4xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
              >
                Completed Tasks
              </h1>
              <p
                className={`text-base mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                Review and track your completed work
              </p>
            </div>

            <div className="flex items-center space-x-3">
              {/* Search - Desktop */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <Search
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-10 pr-4 py-2 rounded-lg border transition-all duration-200 ${
                    isDark
                      ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
                      : "bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                />
              </motion.div>
            </div>
          </div>
        </motion.header>

        {/* Mobile Search - Outside header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 md:hidden"
        >
          <div className="relative">
            <Search
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDark ? "text-gray-400" : "text-gray-500"}`}
            />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-all duration-200 ${
                isDark
                  ? "bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400 focus:border-blue-500"
                  : "bg-white/50 border-gray-200/50 text-gray-900 placeholder-gray-500 focus:border-blue-500"
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm`}
            />
          </div>
        </motion.div>

        {/* Overall Progress Bar */}
        <OverallProgress
          completedCount={tasks.length}
          totalCount={totalTasks}
          isDark={isDark}
          isLoading={isLoading}
        />

        {sortedDates.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className={`flex flex-col items-center justify-center py-20 rounded-xl shadow-sm ${
              isDark ? "bg-gray-800/50" : "bg-white/50"
            }`}
          >
            <div className="mb-6">
              <CheckCircle2
                className={`h-16 w-16 ${isDark ? "text-gray-600" : "text-gray-300"}`}
              />
            </div>
            <h3
              className={`text-xl font-semibold mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}
            >
              No Completed Tasks
            </h3>
            <p
              className={`text-center max-w-md ${isDark ? "text-gray-500" : "text-gray-400"}`}
            >
              Your completed tasks will appear here once you finish some work.
            </p>
          </motion.div>
        ) : (
          <>
            {/* Desktop: Date Timeline */}
            <DateTimeline
              dates={sortedDates}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              isDark={isDark}
              timelineRef={timelineRef}
              onScrollLeft={() => scrollTimeline("left")}
              onScrollRight={() => scrollTimeline("right")}
            />

            {/* Desktop: Selected Date Tasks */}
            <div className="hidden md:block">
              <AnimatePresence mode="wait">
                {selectedDate && (
                  <motion.div
                    key={selectedDate}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className={`rounded-xl shadow-sm overflow-hidden ${isDark ? "bg-gray-800/50" : "bg-white/50"}`}
                  >
                    <div
                      className={`px-6 py-4 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}
                    >
                      <div className="flex justify-between items-center">
                        <h2
                          className={`text-xl font-semibold flex items-center ${isDark ? "text-white" : "text-gray-900"}`}
                        >
                          <Calendar className="w-5 h-5 mr-2" />
                          {selectedDate &&
                            format(
                              new Date(selectedDate),
                              "EEEE, MMMM dd, yyyy"
                            )}
                        </h2>
                        <div
                          className={`flex items-center space-x-4 text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
                        >
                          <div className="flex items-center">
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            {selectedDateTasks.length} completed
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      {selectedDateTasks.length === 0 ? (
                        <div className="text-center py-8">
                          <p
                            className={`${isDark ? "text-gray-400" : "text-gray-500"}`}
                          >
                            No completed tasks found for this date.
                          </p>
                        </div>
                      ) : (
                        <motion.div
                          className="space-y-4"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.6, delay: 0.2 }}
                        >
                          {selectedDateTasks.map((task, index) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              isDark={isDark}
                              index={index}
                            />
                          ))}
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile: Vertical Timeline */}
            <div className="md:hidden space-y-6">
              {sortedDates.map(({ date, tasks: dateTasks }) => (
                <div key={date.toString()}>
                  <MobileDateHeader
                    date={date}
                    taskCount={dateTasks.length}
                    isDark={isDark}
                  />
                  <div className="space-y-3 pl-6">
                    {dateTasks.map((task, index) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        isDark={isDark}
                        index={index}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
