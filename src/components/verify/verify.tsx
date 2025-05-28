"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle,
  XCircle,
  Mail,
  ArrowRight,
  ListTodo,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";

const EmailVerification = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Get status and message from URL params
    const statusParam = searchParams.get("status");
    const messageParam = searchParams.get("message");

    if (statusParam === "success") {
      setStatus("success");
      setMessage(
        "Your email has been successfully verified! You can now log in to your account."
      );
    } else if (statusParam === "error") {
      setStatus("error");
      setMessage(
        messageParam ||
          "Email verification failed. Please try again or contact support."
      );
    } else {
    }
  }, [searchParams, router]);

  const handleLoginRedirect = () => {};

  if (status === "loading") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Animated background */}
      {isDark ? (
        <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(45deg,#000000_0%,#0b0a10_20%,#151419_40%,#0e0d12_70%,#000000_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_bottom_left,rgba(88,28,135,0.14)_0%,transparent_62%)] after:absolute after:inset-0 after:[background:radial-gradient(ellipse_at_top_right,rgba(124,58,237,0.08)_0%,transparent_52%)] before:content-[''] after:content-['']" />
      ) : (
        <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(45deg,#faf5ff_0%,#f3e8ff_25%,#e9d5ff_50%,#f3e8ff_75%,#fefbff_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.14)_0%,transparent_52%)] after:absolute after:inset-0 after:[background:radial-gradient(ellipse_at_top_right,rgba(196,181,253,0.09)_0%,transparent_42%)] before:content-[''] after:content-['']" />
      )}

      {/* Floating elements */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          y: [0, 20, 0],
          opacity: [0.1, 0.15, 0.1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className={`max-w-6xl w-full mx-auto rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row backdrop-blur-xl border ${
          isDark
            ? "bg-gray-800/40 border-gray-700/30 shadow-gray-900/20"
            : "bg-white/40 border-gray-300/30 shadow-gray-300/20"
        }`}
      >
        {/* Left Panel - Illustration */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="md:w-1/2 bg-gradient-to-br from-gray-800/90 to-gray-900/90 hidden md:flex md:flex-col justify-center items-center p-12 relative overflow-hidden backdrop-blur-sm"
        >
          {/* Animated background pattern */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          <div className="relative z-10 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex items-center justify-center mb-6"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className={`w-16 h-16 rounded-2xl flex items-center justify-center mr-3 shadow-2xl backdrop-blur-sm ${
                  isDark ? "bg-orange-600/80" : "bg-orange-500/80"
                }`}
              >
                <ListTodo className="h-8 w-8 text-white" />
              </motion.div>
              <span className="text-4xl font-bold text-white tracking-tight">
                LIST IT
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-3xl font-bold text-white mb-6"
            >
              {status === "success" ? "Welcome Aboard!" : "Verification Issue"}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="text-gray-300 mb-8 max-w-sm mx-auto leading-relaxed"
            >
              {status === "success"
                ? "Your email verification was successful. You're all set to start organizing your tasks and boosting your productivity!"
                : "Don't worry, these things happen sometimes. You can try verifying again or contact our support team for assistance."}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="relative mt-8"
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-r from-orange-500 to-purple-600 rounded-2xl blur-xl opacity-40"
              />
              <div className="relative backdrop-blur-sm">
                <Image
                  src="/app-icon.jpeg"
                  width={180}
                  height={180}
                  alt="LIST IT App"
                  className="mx-auto rounded-2xl shadow-2xl border-2 border-white/20"
                />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Panel - Verification Status */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="md:w-1/2 p-8 md:p-12 backdrop-blur-sm flex flex-col justify-center"
        >
          <div className="flex flex-col items-center text-center">
            {/* Mobile Logo */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="md:hidden mb-8 flex items-center justify-center"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className={`w-12 h-12 rounded-xl flex items-center justify-center mr-3 shadow-lg ${
                  isDark ? "bg-orange-600" : "bg-orange-500"
                }`}
              >
                <ListTodo className="h-6 w-6 text-white" />
              </motion.div>
              <span
                className={`text-2xl font-bold ${
                  isDark ? "text-orange-400" : "text-orange-500"
                }`}
              >
                LIST IT
              </span>
            </motion.div>

            {/* Status Icon */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 0.6,
                delay: 0.4,
                type: "spring",
                stiffness: 200,
              }}
              className="mb-8"
            >
              {status === "success" ? (
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center backdrop-blur-sm border border-green-500/30"
                >
                  <CheckCircle className="h-12 w-12 text-green-500" />
                </motion.div>
              ) : (
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center backdrop-blur-sm border border-red-500/30"
                >
                  <XCircle className="h-12 w-12 text-red-500" />
                </motion.div>
              )}
            </motion.div>

            {/* Status Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className={`text-3xl md:text-4xl font-bold mb-4 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              {status === "success" ? "Email Verified!" : "Verification Failed"}
            </motion.h1>

            {/* Status Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className={`mb-8 rounded-xl border-l-4 backdrop-blur-sm p-6 ${
                status === "success"
                  ? isDark
                    ? "border-green-300 bg-green-900/30 text-green-300"
                    : "border-green-200 bg-green-50/80 text-green-700"
                  : isDark
                    ? "border-red-300 bg-red-900/30 text-red-300"
                    : "border-red-200 bg-red-50/80 text-red-700"
              } shadow-lg`}
            >
              <div className="flex items-start">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1 }}
                  className="mr-3 mt-0.5"
                >
                  {status === "success" ? (
                    <Mail className="h-5 w-5" />
                  ) : (
                    <AlertCircle className="h-5 w-5" />
                  )}
                </motion.div>
                <div>
                  <p className="text-lg leading-relaxed">{message}</p>
                  {status === "error" && (
                    <p className="mt-3 text-sm opacity-80">
                      If you continue to have issues, please contact our support
                      team or try requesting a new verification email.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1 }}
              className="flex flex-col sm:flex-row gap-4 w-full"
            >
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLoginRedirect}
                className={`flex-1 font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center backdrop-blur-sm shadow-lg ${
                  isDark
                    ? "bg-orange-600/80 hover:bg-orange-700/80 text-white border border-orange-500/30 hover:shadow-xl"
                    : "bg-orange-500/80 hover:bg-orange-600/80 text-white border border-orange-400/30 hover:shadow-xl"
                }`}
              >
                <span className="mr-2">
                  {status === "success" ? "Continue to Login" : "Back to Login"}
                </span>
                <ArrowRight className="h-5 w-5" />
              </motion.button>

              {status === "error" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 1.2 }}
                >
                  <Link
                    href="/signup"
                    className={`flex-1 font-medium py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center backdrop-blur-sm border ${
                      isDark
                        ? "bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border-gray-600/50 hover:text-white"
                        : "bg-gray-100/50 hover:bg-gray-200/50 text-gray-700 border-gray-300/50 hover:text-gray-800"
                    }`}
                  >
                    Try Again
                  </Link>
                </motion.div>
              )}
            </motion.div>

            {/* Footer Links */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.4 }}
              className="mt-8 text-center"
            >
              <p
                className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                Need help?{" "}
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  href="mailto:support@listit.com"
                  className={`${
                    isDark
                      ? "text-orange-400 hover:text-orange-300"
                      : "text-orange-500 hover:text-orange-600"
                  } underline hover:no-underline transition-all duration-200`}
                >
                  Contact Support
                </motion.a>
              </p>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default EmailVerification;
