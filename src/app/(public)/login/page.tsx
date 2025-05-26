"use client";

import React, { useState, useEffect, Suspense } from "react";
import {
  LogIn,
  Mail,
  Lock,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle,
  ListTodo,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";

// Inner component that uses useSearchParams
function LoginWithSearchParams() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loginWithGoogle, resendVerificationEmail } = useAuth();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [emailVerificationNeeded, setEmailVerificationNeeded] = useState(false);
  const [emailForVerification, setEmailForVerification] = useState("");
  const [resendingVerification, setResendingVerification] = useState(false);
  const [waitTime, setWaitTime] = useState<number | null>(null);

  // Handle URL parameters and load saved email
  useEffect(() => {
    try {
      // Load saved email if exists
      const savedEmail = localStorage.getItem("list_it_email");
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch (err) {
      console.error("Error loading saved email:", err);
    }

    // Check for hash parameters which often contain error info from Supabase
    if (typeof window !== "undefined") {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const errorInHash = hashParams.get("error");
      const errorCode = hashParams.get("error_code");
      const errorDescription = hashParams.get("error_description");

      if (errorInHash === "access_denied" && errorCode === "otp_expired") {
        setError(
          "Your verification link has expired. Please request a new one using the form below."
        );
      } else if (errorInHash) {
        setError(errorDescription || "Authentication error. Please try again.");
      }
    }

    // Handle URL parameters
    const isVerified = searchParams?.get("verified") === "true";
    const isPasswordReset = searchParams?.get("password_reset") === "success";
    const errorParam = searchParams?.get("error");
    const isLoggedOut = searchParams?.get("logout") === "true";

    // Only show success if there's no error in hash
    if (isVerified && !error) {
      setSuccess("Email verified successfully! You can now log in.");
    } else if (isPasswordReset) {
      setSuccess(
        "Password reset successfully! You can now log in with your new password."
      );
    } else if (errorParam) {
      setError(decodeURIComponent(errorParam));
    } else if (isLoggedOut) {
      setSuccess("You have been logged out successfully.");
    }
  }, [searchParams, error]);

  // Remember email
  const handleRememberCredentials = () => {
    try {
      if (rememberMe && email) {
        localStorage.setItem("list_it_email", email);
      } else {
        localStorage.removeItem("list_it_email");
      }
    } catch (err) {
      console.error("Error saving email preference:", err);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Handle login form submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setEmailVerificationNeeded(false);

    // Validate form
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!password) {
      setError("Password is required");
      return;
    }

    setLoading(true);

    try {
      const { success, error, isEmailUnverified } = await login(
        email.trim(),
        password
      );

      if (!success) {
        if (isEmailUnverified) {
          setEmailVerificationNeeded(true);
          setEmailForVerification(email.trim());
          setError("Please verify your email before logging in.");
        } else if (error) {
          throw error;
        }
        return;
      } else {
        if (success) {
          router.push("/dashboard");
          return;
        }
      }

      // Handle remember me
      handleRememberCredentials();

      // If success, the context will navigate us
    } catch (err: unknown) {
      console.error("Login error:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Invalid email or password. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle Google login
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      // Redirect is handled in the OAuth flow
    } catch (err: unknown) {
      console.error("Google login error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to log in with Google";
      setError(errorMessage);
      setLoading(false);
    }
  };

  // Handle resend verification email
  const handleResendVerification = async () => {
    if (!emailForVerification && !email) {
      setError("Please enter your email address to resend verification");
      return;
    }

    const emailToVerify = emailForVerification || email;
    setResendingVerification(true);
    setWaitTime(null);

    try {
      const { success, error, isRateLimited, waitTime } =
        await resendVerificationEmail(emailToVerify);

      if (success) {
        setSuccess(
          `Verification email sent to ${emailToVerify}! Please check your inbox.`
        );
      } else if (isRateLimited && waitTime) {
        setWaitTime(waitTime);
        setError(
          `Please wait ${waitTime} seconds before requesting another email.`
        );

        // Start countdown timer
        const timer = setInterval(() => {
          setWaitTime((prevTime) => {
            if (prevTime && prevTime > 1) {
              return prevTime - 1;
            } else {
              clearInterval(timer);
              setError(null);
              return null;
            }
          });
        }, 1000);
      } else {
        setError(
          error?.message ||
            "Failed to resend verification email. Please try again."
        );
      }
    } catch (err: unknown) {
      console.error("Error resending verification:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to resend verification email";
      setError(errorMessage);
    } finally {
      setResendingVerification(false);
    }
  };

  // Handle forgot password
  const handleForgotPassword = () => {
    router.push("/forgotPassword");
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/*  background */}
      {isDark ? (
        <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(45deg,#020617_0%,#0f172a_20%,#1e293b_40%,#0f1629_70%,#000000_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_bottom_left,rgba(37,99,235,0.2)_0%,transparent_58%)] after:absolute after:inset-0 after:[background:radial-gradient(ellipse_at_top_right,rgba(96,165,250,0.12)_0%,transparent_48%)] before:content-[''] after:content-['']" />
      ) : (
        <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(45deg,#f0f9ff_0%,#e0f2fe_25%,#bae6fd_50%,#e0f2fe_75%,#f8fafc_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.12)_0%,transparent_55%)] after:absolute after:inset-0 after:[background:radial-gradient(ellipse_at_top_right,rgba(147,197,253,0.08)_0%,transparent_45%)] before:content-[''] after:content-['']" />
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
        className="absolute top-1/4 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"
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
        className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"
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
        {/* Left Panel - Form */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="md:w-1/2 p-8 md:p-12 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center md:items-start">
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
                  isDark ? "bg-blue-600" : "bg-blue-500"
                }`}
              >
                <ListTodo className="h-6 w-6 text-white" />
              </motion.div>
              <span
                className={`text-2xl font-bold ${
                  isDark ? "text-blue-400" : "text-blue-500"
                }`}
              >
                LIST IT
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className={`text-2xl md:text-3xl font-bold mb-8 ${isDark ? "text-white" : "text-gray-900"}`}
            >
              Welcome back
            </motion.h1>

            {/* Success message display */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className={`w-full mb-6 rounded-xl border-l-4 border-green-500 backdrop-blur-sm ${
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
                      <CheckCircle
                        className="w-5 h-5 mr-2"
                        aria-hidden="true"
                      />
                    </motion.div>
                    <span>{success}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error message display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className={`w-full mb-6 rounded-xl border-l-4 border-red-500 backdrop-blur-sm ${
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
                      <AlertCircle
                        className="w-5 h-5 mr-2"
                        aria-hidden="true"
                      />
                    </motion.div>
                    <span>{error}</span>
                  </div>

                  {(error.includes("verification") ||
                    error.includes("expired") ||
                    emailVerificationNeeded) && (
                    <div className="mt-3 ml-7">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleResendVerification}
                        disabled={resendingVerification || !!waitTime}
                        className={`text-sm underline ${
                          isDark ? "text-blue-300" : "text-blue-600"
                        } ${resendingVerification || !!waitTime ? "opacity-50 cursor-not-allowed" : "hover:no-underline"}`}
                      >
                        {resendingVerification
                          ? "Sending..."
                          : waitTime
                            ? `Wait ${waitTime}s to resend`
                            : "Resend verification email"}
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="w-full">
              {/* Google Sign In Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-col items-center"
              >
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className={`w-full mb-6 py-3 px-4 rounded-xl flex items-center justify-center transition-all duration-300 backdrop-blur-sm border shadow-lg ${
                    isDark
                      ? "bg-gray-700/50 hover:bg-gray-600/50 text-white border-gray-600/50 hover:shadow-xl"
                      : "bg-gray-100/50 hover:bg-gray-200/50 text-gray-800 border-gray-300/50 hover:shadow-xl"
                  } ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
                  aria-label="Login with Google"
                  type="button"
                >
                  <div className="bg-white p-1 rounded-full shadow-sm mr-3">
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 533.5 544.3"
                      aria-hidden="true"
                    >
                      <path
                        d="M533.5 278.4c0-18.5-1.5-37.1-4.7-55.3H272.1v104.8h147c-6.1 33.8-25.7 63.7-54.4 82.7v68h87.7c51.5-47.4 81.1-117.4 81.1-200.2z"
                        fill="#4285f4"
                      />
                      <path
                        d="M272.1 544.3c73.4 0 135.3-24.1 180.4-65.7l-87.7-68c-24.4 16.6-55.9 26-92.6 26-71 0-131.2-47.9-152.8-112.3H28.9v70.1c46.2 91.9 140.3 149.9 243.2 149.9z"
                        fill="#34a853"
                      />
                      <path
                        d="M119.3 324.3c-11.4-33.8-11.4-70.4 0-104.2V150H28.9c-38.6 76.9-38.6 167.5 0 244.4l90.4-70.1z"
                        fill="#fbbc04"
                      />
                      <path
                        d="M272.1 107.7c38.8-.6 76.3 14 104.4 40.8l77.7-77.7C405 24.6 339.7-.8 272.1 0 169.2 0 75.1 58 28.9 150l90.4 70.1c21.5-64.5 81.8-112.4 152.8-112.4z"
                        fill="#ea4335"
                      />
                    </svg>
                  </div>
                  <span className="font-medium">Log in with Google</span>
                </motion.button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="relative my-6"
              >
                <div className="absolute inset-0 flex items-center">
                  <div
                    className={`w-full border-t ${isDark ? "border-gray-700/50" : "border-gray-300/50"}`}
                  ></div>
                </div>
                <div className="relative flex justify-center">
                  <span
                    className={`px-4 py-1 rounded-full backdrop-blur-sm ${isDark ? "bg-gray-800/70 text-gray-400" : "bg-white/70 text-gray-600"}`}
                  >
                    Or log in with email
                  </span>
                </div>
              </motion.div>

              <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                onSubmit={handleLogin}
                className="space-y-4"
              >
                <motion.div whileFocus={{ scale: 1.02 }} className="relative">
                  <Mail
                    className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                    size={18}
                    aria-hidden="true"
                  />
                  <input
                    className={`w-full pl-10 pr-3 py-3 rounded-xl font-medium backdrop-blur-sm transition-all duration-300 ${
                      isDark
                        ? "bg-gray-700/50 border-gray-600/50 placeholder-gray-400 text-gray-100 focus:border-blue-400 focus:bg-gray-700/70"
                        : "bg-white/50 border-gray-300/50 placeholder-gray-500 text-gray-800 focus:border-blue-500 focus:bg-white/70"
                    } border focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm`}
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                    name="email"
                    id="email"
                    autoComplete="email"
                  />
                </motion.div>

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
                        ? "bg-gray-700/50 border-gray-600/50 placeholder-gray-400 text-gray-100 focus:border-blue-400 focus:bg-gray-700/70"
                        : "bg-white/50 border-gray-300/50 placeholder-gray-500 text-gray-800 focus:border-blue-500 focus:bg-white/70"
                    } border focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm`}
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    name="password"
                    id="password"
                    autoComplete="current-password"
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

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                  className="flex justify-between items-center"
                >
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className={`h-4 w-4 rounded focus:ring-2 transition-colors ${
                        isDark
                          ? "bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500/30"
                          : "bg-white border-gray-300 text-blue-500 focus:ring-blue-500/30"
                      }`}
                    />
                    <label
                      htmlFor="remember-me"
                      className={`ml-2 block text-sm ${
                        isDark ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      Remember me
                    </label>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={handleForgotPassword}
                    className={`text-sm font-medium transition-colors ${
                      isDark
                        ? "text-blue-400 hover:text-blue-300"
                        : "text-blue-500 hover:text-blue-600"
                    }`}
                  >
                    Forgot password?
                  </motion.button>
                </motion.div>

                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className={`mt-6 w-full font-semibold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center backdrop-blur-sm shadow-lg ${
                    isDark
                      ? "bg-blue-600/80 hover:bg-blue-700/80 text-white border border-blue-500/30"
                      : "bg-blue-500/80 hover:bg-blue-600/80 text-white border border-blue-400/30"
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
                      aria-hidden="true"
                    />
                  ) : (
                    <LogIn className="w-5 h-5 mr-2" aria-hidden="true" />
                  )}
                  <span>{loading ? "Logging In..." : "Log In"}</span>
                </motion.button>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className={`text-sm text-center ${isDark ? "text-gray-400" : "text-gray-600"}`}
                >
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/register"
                    className={`${
                      isDark
                        ? "text-blue-400 hover:text-blue-300"
                        : "text-blue-500 hover:text-blue-600"
                    } font-bold underline hover:no-underline transition-all duration-200`}
                  >
                    Sign up
                  </Link>
                </motion.p>
              </motion.form>
            </div>
          </div>
        </motion.div>

        {/* Right Panel - Illustration */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="md:w-1/2 bg-gradient-to-br from-gray-800/90 to-gray-900/90 hidden md:flex md:flex-col justify-center items-center p-12 relative overflow-hidden backdrop-blur-sm"
        >
          {/* Animated background pattern */}
          <motion.div
            animate={{ rotate: -360 }}
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
                  isDark ? "bg-blue-600/80" : "bg-blue-500/80"
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
              Welcome Back
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="text-gray-300 mb-8 max-w-sm mx-auto leading-relaxed"
            >
              Log in to access your tasks, notes, and collections. Stay
              productive and organized with LIST IT.
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
                className="absolute inset-0 bg-gradient-to-r from-blue-500 to-teal-600 rounded-2xl blur-xl opacity-40"
              />
              <div className="relative backdrop-blur-sm">
                <Image
                  src="/app-icon.jpeg"
                  width={180}
                  height={180}
                  alt="LIST IT App"
                  className="mx-auto rounded-2xl shadow-2xl border-2 border-white/20"
                  priority
                />
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

// Main page component that uses Suspense
const LoginPage = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-6 h-6 border-2 border-gray-800 border-t-transparent rounded-full"
            />
            <span className="ml-2 text-gray-600">Loading...</span>
          </motion.div>
        </div>
      }
    >
      <LoginWithSearchParams />
    </Suspense>
  );
};

export default LoginPage;
