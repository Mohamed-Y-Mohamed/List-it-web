"use client";

import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Lock,
  ListTodo,
  ArrowLeft,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";

const ResetPasswordPage = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();
  const { updatePassword, logout } = useAuth();

  // Form states
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [countdownInterval, setCountdownInterval] =
    useState<NodeJS.Timeout | null>(null);

  // Handle redirect when countdown reaches 0
  useEffect(() => {
    if (countdown === 0) {
      // Clear the interval
      if (countdownInterval) {
        clearInterval(countdownInterval);
        setCountdownInterval(null);
      }

      const performLogoutAndRedirect = async () => {
        try {
          await logout();
        } catch (logoutError) {
          console.error(
            "Error during logout after password reset:",
            logoutError
          );
        }
        router.push("/login?password_reset=success");
      };

      performLogoutAndRedirect();
    }
  }, [countdown, countdownInterval, logout, router]);

  // Cleanup interval on component unmount
  useEffect(() => {
    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [countdownInterval]);

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Toggle confirm password visibility
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Validate password strength
  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    return null;
  };

  // Handle setting new password
  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    // 1) Validate password strength
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    // 2) Validate confirmation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      // 3) Attempt to update the password
      const { success, error } = await updatePassword(password);
      if (!success) {
        throw error ?? new Error("Failed to update password");
      }

      // 4) On success, show message and start countdown
      setSuccess(true);
      setMessage("Your password has been successfully updated!");

      let secondsLeft = 5;
      setCountdown(secondsLeft);

      const intervalId = setInterval(() => {
        secondsLeft -= 1;
        setCountdown(secondsLeft);

        // 5) When countdown hits zero, clear interval, logout & redirect
        if (secondsLeft <= 0) {
          clearInterval(intervalId);

          logout().catch((logoutErr) => {
            console.error("Error during logout after reset:", logoutErr);
          });

          router.push("/login?password_reset=success");
        }
      }, 1000);
    } catch (err: unknown) {
      console.error("Password update error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Animated background */}
      {isDark ? (
        <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(135deg,#121212_0%,#1a1a1a_30%,#232323_70%,#2a1810_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_center,rgba(16,185,129,0.15)_0%,transparent_50%)] before:content-['']" />
      ) : (
        <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(135deg,#ffffff_0%,#fefefe_50%,#f9fafb_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_center,rgba(16,185,129,0.08)_0%,transparent_70%)] before:content-['']" />
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
        className="absolute top-1/4 right-1/4 w-64 h-64 bg-green-500/10 rounded-full blur-3xl"
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
        className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className={`max-w-md w-full mx-auto rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl border ${
          isDark
            ? "bg-gray-800/40 border-gray-700/30 shadow-gray-900/20"
            : "bg-white/40 border-gray-300/30 shadow-gray-300/20"
        }`}
      >
        <div className="p-8 md:p-12">
          {/* Logo and branding */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center mb-8"
          >
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="relative mb-4"
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl blur-xl opacity-40"
              />
              <div className="relative">
                <Image
                  src="/app-icon.jpeg"
                  width={96}
                  height={96}
                  alt="LIST IT Logo"
                  className="w-24 h-24 rounded-2xl shadow-lg border-2 border-white/20"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-center"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className={`w-8 h-8 rounded-lg flex items-center justify-center mr-2 ${
                  isDark ? "bg-green-600/80" : "bg-green-500/80"
                }`}
              >
                <ListTodo className="h-4 w-4 text-white" />
              </motion.div>
              <span
                className={`text-xl font-bold ${
                  isDark ? "text-green-400" : "text-green-500"
                }`}
              >
                LIST IT
              </span>
            </motion.div>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mb-8"
          >
            <h1
              className={`text-2xl md:text-3xl font-bold mb-4 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Set New Password
            </h1>
            <p
              className={`text-base ${
                isDark ? "text-gray-300" : "text-gray-600"
              } leading-relaxed`}
            >
              Please enter and confirm your new secure password below.
            </p>
          </motion.div>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className={`mb-6 rounded-xl border-l-4 border-red-500 backdrop-blur-sm ${
                  isDark
                    ? "bg-red-900/30 text-red-300 border border-red-500/30"
                    : "bg-red-50/80 text-red-700 border border-red-200/50"
                } p-4 shadow-lg`}
                role="alert"
              >
                <div className="flex items-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <AlertCircle className="w-5 h-5 mr-2" aria-hidden="true" />
                  </motion.div>
                  <span>{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success message */}
          <AnimatePresence>
            {success && message && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className={`mb-6 rounded-xl border-l-4 border-green-500 backdrop-blur-sm ${
                  isDark
                    ? "bg-green-900/30 text-green-300 border border-green-500/30"
                    : "bg-green-50/80 text-green-700 border border-green-200/50"
                } p-4 shadow-lg`}
                role="alert"
              >
                <div className="flex items-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <CheckCircle className="w-5 h-5 mr-2" aria-hidden="true" />
                  </motion.div>
                  <span>{message}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form or success content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {!success ? (
              <form onSubmit={handleSetNewPassword} className="space-y-5">
                {/* New Password Input */}
                <motion.div whileFocus={{ scale: 1.02 }} className="relative">
                  <Lock
                    className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                    size={18}
                    aria-hidden="true"
                  />
                  <input
                    className={`w-full pl-10 pr-10 py-3 rounded-xl font-medium backdrop-blur-sm transition-all duration-300 ${
                      isDark
                        ? "bg-gray-700/50 border-gray-600/50 placeholder-gray-400 text-gray-100 focus:border-green-400 focus:bg-gray-700/70"
                        : "bg-white/50 border-gray-300/50 placeholder-gray-500 text-gray-800 focus:border-green-500 focus:bg-white/70"
                    } border focus:outline-none focus:ring-2 focus:ring-green-500/20 shadow-sm`}
                    type={showPassword ? "text" : "password"}
                    placeholder="New Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    minLength={8}
                    name="password"
                    id="password"
                    autoComplete="new-password"
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    onClick={togglePasswordVisibility}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors duration-200 ${
                      isDark
                        ? "text-gray-400 hover:text-gray-300 hover:bg-gray-600/50"
                        : "text-gray-500 hover:text-gray-600 hover:bg-gray-200/50"
                    } focus:outline-none`}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={18} aria-hidden="true" />
                    ) : (
                      <Eye size={18} aria-hidden="true" />
                    )}
                  </motion.button>
                </motion.div>

                {/* Confirm Password Input */}
                <motion.div whileFocus={{ scale: 1.02 }} className="relative">
                  <Lock
                    className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                    size={18}
                    aria-hidden="true"
                  />
                  <input
                    className={`w-full pl-10 pr-10 py-3 rounded-xl font-medium backdrop-blur-sm transition-all duration-300 ${
                      isDark
                        ? "bg-gray-700/50 border-gray-600/50 placeholder-gray-400 text-gray-100 focus:border-green-400 focus:bg-gray-700/70"
                        : "bg-white/50 border-gray-300/50 placeholder-gray-500 text-gray-800 focus:border-green-500 focus:bg-white/70"
                    } border focus:outline-none focus:ring-2 focus:ring-green-500/20 shadow-sm`}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    required
                    minLength={8}
                    name="confirmPassword"
                    id="confirmPassword"
                    autoComplete="new-password"
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    onClick={toggleConfirmPasswordVisibility}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors duration-200 ${
                      isDark
                        ? "text-gray-400 hover:text-gray-300 hover:bg-gray-600/50"
                        : "text-gray-500 hover:text-gray-600 hover:bg-gray-200/50"
                    } focus:outline-none`}
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} aria-hidden="true" />
                    ) : (
                      <Eye size={18} aria-hidden="true" />
                    )}
                  </motion.button>
                </motion.div>

                {/* Password requirements hint */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"} mt-2`}
                >
                  Password must be at least 8 characters long.
                </motion.p>

                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className={`w-full font-semibold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center backdrop-blur-sm shadow-lg ${
                    isDark
                      ? "bg-green-600/80 hover:bg-green-700/80 text-white border border-green-500/30"
                      : "bg-green-500/80 hover:bg-green-600/80 text-white border border-green-400/30"
                  } ${loading ? "opacity-70 cursor-not-allowed" : "hover:shadow-xl"}`}
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                    />
                  ) : null}
                  <span>{loading ? "Updating..." : "Update Password"}</span>
                </motion.button>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center space-y-4"
              >
                <div className="flex justify-center mb-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className={`w-16 h-16 rounded-full flex items-center justify-center ${
                      isDark ? "bg-green-600/20" : "bg-green-100"
                    }`}
                  >
                    <CheckCircle
                      className={`w-8 h-8 ${isDark ? "text-green-400" : "text-green-600"}`}
                    />
                  </motion.div>
                </div>

                <h2
                  className={`text-xl font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  Password Updated Successfully!
                </h2>

                <p
                  className={`${isDark ? "text-gray-300" : "text-gray-600"} mb-4`}
                >
                  Your password has been changed. You will be automatically
                  redirected to the login page.
                </p>

                {countdown !== null && countdown > 0 && (
                  <div className="space-y-3">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className={`inline-flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                        isDark
                          ? "border-green-400 text-green-400"
                          : "border-green-500 text-green-500"
                      } font-bold text-lg`}
                    >
                      {countdown}
                    </motion.div>
                    <p
                      className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Redirecting to login page in {countdown} second
                      {countdown !== 1 ? "s" : ""}...
                    </p>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={async () => {
                        // Clear the countdown interval
                        if (countdownInterval) {
                          clearInterval(countdownInterval);
                          setCountdownInterval(null);
                        }
                        setCountdown(null);

                        try {
                          await logout();
                        } catch (logoutError) {
                          console.error("Error during logout:", logoutError);
                        }
                        router.push("/login?password_reset=success");
                      }}
                      className={`mt-4 px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                        isDark
                          ? "bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border border-gray-600/50"
                          : "bg-gray-100/50 hover:bg-gray-200/50 text-gray-700 border border-gray-300/50"
                      }`}
                    >
                      Go to Login Now
                    </motion.button>
                  </div>
                )}

                {(countdown === null || countdown === 0) && (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-6 h-6 mx-auto border-2 border-green-500 border-t-transparent rounded-full animate-spin"
                  />
                )}
              </motion.div>
            )}
          </motion.div>

          {/* Back to login link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-8 text-center"
          >
            <Link
              href="/login"
              className={`inline-flex items-center text-sm font-medium transition-all duration-200 ${
                isDark
                  ? "text-green-400 hover:text-green-300"
                  : "text-green-500 hover:text-green-600"
              } hover:underline`}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Login
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
