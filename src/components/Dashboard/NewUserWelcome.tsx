"use client";

import React from "react";
import { motion } from "framer-motion";
import { ListTodo } from "lucide-react";

interface NewUserWelcomeProps {
  isDark: boolean;
}

const NewUserWelcome: React.FC<NewUserWelcomeProps> = ({ isDark }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
      className={`rounded-xl shadow-sm p-8 md:p-12 text-center ${isDark ? "bg-gray-800/50" : "bg-white/50"}`}
    >
      <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-blue-100 mb-6">
        <ListTodo className="h-8 w-8 text-blue-600" />
      </div>
      <h3
        className={`text-xl md:text-2xl font-semibold ${isDark ? "text-white" : "text-gray-800"} mb-3`}
      >
        Welcome to Your Dashboard
      </h3>
      <p
        className={`text-sm md:text-base max-w-md mx-auto ${isDark ? "text-gray-400" : "text-gray-500"} mb-6`}
      >
        Start creating tasks to see your productivity insights and track your
        progress over time.
      </p>
    </motion.div>
  );
};

export default NewUserWelcome;
