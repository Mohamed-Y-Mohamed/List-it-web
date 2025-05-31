"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Mail,
  AlertCircle,
  CheckCircle,
  ListTodo,
  ArrowLeft,
} from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const ForgotPasswordPage: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { resetPassword, logout } = useAuth(); // Changed from signOut to logout
  const router = useRouter();

  // Form state
  const [email, setEmail] = useState<string>("");

  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [waitTime, setWaitTime] = useState<number>(0);
  const [signingOut, setSigningOut] = useState<boolean>(false); // Keep name for consistency

  // Timer ref for countdown
  const timerRef = useRef<number | null>(null);

  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Countdown effect
  useEffect(() => {
    if (waitTime <= 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = window.setInterval(() => {
      setWaitTime((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [waitTime]);

  // Handle logout with error handling - matching reset password page pattern
  const handleSignOut = async (redirect: boolean = false) => {
    setSigningOut(true);
    try {
      await logout(); // Changed from signOut to logout
      if (redirect) {
        router.push("/login");
      }
    } catch (err) {
      console.error("Error during logout:", err);
      // Don't show error to user for logout, just continue
      if (redirect) {
        router.push("/login");
      }
    } finally {
      setSigningOut(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Cooldown check
    if (waitTime > 0) {
      setError(`Please wait ${waitTime}s before trying again.`);
      return;
    }

    const trimmed = email.trim();

    // Validation
    if (!trimmed) {
      setError("Email is required");
      return;
    }
    if (!emailRegex.test(trimmed)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const { success: ok, error: apiErr } = await resetPassword(trimmed);

      if (!ok) {
        // Supabase rate-limit message contains seconds
        const msg = apiErr?.message ?? "";
        const m = msg.match(/(\d+)\s*seconds?/);
        if (msg.includes("For security purposes") && m) {
          const secs = parseInt(m[1], 10);
          setWaitTime(secs);
          setError(`Please wait ${secs}s before requesting again.`);
        } else {
          throw apiErr || new Error("Failed to send reset link");
        }
        return;
      }

      setSuccess(true);
      // Log out the user after successful password reset request
      await handleSignOut(false);
      // Set a short cooldown so user can't immediately re-click
      setWaitTime(60);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Password reset error:", err);
        setError(err.message || "Failed to send reset link. Please try again.");
      } else {
        console.error("Password reset error:", err);
        setError("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle back to login with logout
  const handleBackToLogin = async (e: React.MouseEvent) => {
    e.preventDefault();
    await handleSignOut(true); // Log out and redirect
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/*  background */}
      {isDark ? (
        <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(135deg,#121212_0%,#1a1a1a_30%,#232323_70%,#2a1810_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_center,rgba(59,130,246,0.15)_0%,transparent_50%)] before:content-['']" />
      ) : (
        <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(135deg,#ffffff_0%,#fefefe_50%,#f9fafb_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_center,rgba(59,130,246,0.08)_0%,transparent_70%)] before:content-['']" />
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
        className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"
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
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
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
                className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur-xl opacity-40"
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
                  isDark ? "bg-blue-600/80" : "bg-blue-500/80"
                }`}
              >
                <ListTodo className="h-4 w-4 text-white" />
              </motion.div>
              <span
                className={`text-xl font-bold ${
                  isDark ? "text-blue-400" : "text-blue-500"
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
              Reset Your Password
            </h1>
            <p
              className={`text-base ${
                isDark ? "text-gray-300" : "text-gray-600"
              } leading-relaxed`}
            >
              Enter your email and we&apos;ll send you a secure link to reset
              your password.
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
                    <AlertCircle className="w-5 h-5 mr-2" />
                  </motion.div>
                  <span>{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success message */}
          <AnimatePresence>
            {success && (
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
                    <CheckCircle className="w-5 h-5 mr-2" />
                  </motion.div>
                  <span>
                    Reset link sent! Check your inbox (and spam folder). You
                    have been logged out for security.
                  </span>
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
              <form onSubmit={handleSubmit} className="space-y-6">
                <motion.div whileFocus={{ scale: 1.02 }} className="relative">
                  <Mail
                    className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                    size={18}
                  />
                  <input
                    type="email"
                    name="email"
                    id="email"
                    autoComplete="email"
                    className={`w-full pl-10 pr-3 py-3 rounded-xl font-medium backdrop-blur-sm transition-all duration-300 ${
                      isDark
                        ? "bg-gray-700/50 border-gray-600/50 placeholder-gray-400 text-gray-100 focus:border-blue-400 focus:bg-gray-700/70"
                        : "bg-white/50 border-gray-300/50 placeholder-gray-500 text-gray-800 focus:border-blue-500 focus:bg-white/70"
                    } border focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm`}
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading || waitTime > 0 || signingOut}
                    required
                  />
                </motion.div>

                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading || waitTime > 0 || signingOut}
                  className={`w-full font-semibold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center backdrop-blur-sm shadow-lg ${
                    isDark
                      ? "bg-blue-600/80 hover:bg-blue-700/80 text-white border border-blue-500/30"
                      : "bg-blue-500/80 hover:bg-blue-600/80 text-white border border-blue-400/30"
                  } ${loading || waitTime > 0 || signingOut ? "opacity-70 cursor-not-allowed" : "hover:shadow-xl"}`}
                >
                  {loading || signingOut ? (
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
                  <span>
                    {waitTime > 0
                      ? `Wait ${waitTime}s`
                      : loading
                        ? "Sending..."
                        : signingOut
                          ? "Signing out..."
                          : "Send Reset Link"}
                  </span>
                </motion.button>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center space-y-4"
              >
                <p
                  className={`${
                    isDark ? "text-gray-300" : "text-gray-600"
                  } mb-4`}
                >
                  Didn&apos;t receive it? Wait a moment, then try again.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={async () => {
                    setSuccess(false);
                    setError(null);
                    setEmail("");
                    // Log out again for security when sending another link
                    await handleSignOut(false);
                  }}
                  disabled={signingOut}
                  className={`font-medium px-6 py-2 rounded-xl transition-all duration-300 backdrop-blur-sm shadow-lg ${
                    isDark
                      ? "bg-gray-700/50 hover:bg-gray-600/50 text-white border border-gray-600/30"
                      : "bg-gray-200/50 hover:bg-gray-300/50 text-gray-800 border border-gray-300/30"
                  } hover:shadow-xl ${signingOut ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  {signingOut ? "Logging out..." : "Send Another Link"}
                </motion.button>
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
            <button
              onClick={handleBackToLogin}
              disabled={signingOut}
              className={`inline-flex items-center text-sm font-medium transition-all duration-200 ${
                isDark
                  ? "text-blue-400 hover:text-blue-300"
                  : "text-blue-500 hover:text-blue-600"
              } hover:underline ${signingOut ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              {signingOut ? "Logging out..." : "Back to Login"}
            </button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
