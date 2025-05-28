"use client";

import React, { useState } from "react";
import {
  UserPlus,
  Mail,
  Lock,
  User,
  AlertCircle,
  Check,
  ListTodo,
  Eye,
  EyeOff,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";

const Signup = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();
  const { signup, loginWithGoogle, resendVerificationEmail } = useAuth();

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Toggle confirm password visibility
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Form validation
  const isFormValid = () => {
    if (!fullName.trim()) {
      setError("Full name is required");
      return false;
    }
    if (!email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  // Handle signup with email/password
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);
    setSuccess(null);
    setVerificationSent(false);

    if (!isFormValid()) return;

    // Prevent rapid fire requests
    if (loading) return;

    setLoading(true);

    try {
      const { success, error, emailVerificationSent } = await signup(
        email.trim(),
        password,
        fullName
      );

      if (!success) {
        throw error || new Error("Signup failed");
      }

      if (emailVerificationSent) {
        // Email confirmation required
        setVerificationSent(true);
        setSuccess(
          "Signup successful! Please check your email to confirm your account."
        );
      } else {
        // User was auto-confirmed (rare case)
        setSuccess("Account created successfully! Redirecting to dashboard...");
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      }
    } catch (err: unknown) {
      console.error("Signup error:", err);

      if (err instanceof Error) {
        // Handle specific errors
        if (err.message.includes("already registered")) {
          setError("This email is already registered. Please log in instead.");
        } else if (err.message.includes("For security purposes")) {
          setError("Please wait a few seconds before trying again");
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to sign up. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Google signup
  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      setError(null);

      await loginWithGoogle();
      // Redirect handled in the OAuth flow
    } catch (err: unknown) {
      console.error("Google signup error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to sign up with Google");
      }
      setLoading(false);
    }
  };

  // Handle resend verification email
  const handleResendVerification = async () => {
    if (!email.trim()) {
      setError("Email is required to resend verification");
      return;
    }

    setResendingVerification(true);

    try {
      const { success, error } = await resendVerificationEmail(email.trim());

      if (success) {
        setSuccess("Verification email resent! Please check your inbox.");
      } else if (error) {
        setError(error.message || "Failed to resend verification email");
      }
    } catch (err) {
      console.error("Error resending verification:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to resend verification email");
      }
    } finally {
      setResendingVerification(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/*  background */}
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
              Start Your Journey
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="text-gray-300 mb-8 max-w-sm mx-auto leading-relaxed"
            >
              Join our community to organize your tasks, boost productivity, and
              manage your projects with ease.
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

        {/* Right Panel - Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
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

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className={`text-2xl md:text-3xl font-bold mb-8 ${isDark ? "text-white" : "text-gray-900"}`}
            >
              Create your account
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
                      <Check className="w-5 h-5 mr-2" />
                    </motion.div>
                    <span>{success}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email verification instructions */}
            <AnimatePresence>
              {verificationSent && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className={`w-full mb-6 rounded-xl border-l-4 border-blue-500 backdrop-blur-sm ${
                    isDark
                      ? "bg-blue-900/30 text-blue-300 border border-blue-500/30"
                      : "bg-blue-50/80 text-blue-700 border border-blue-200/50"
                  } p-4 shadow-lg`}
                  role="alert"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center mb-2">
                      <Mail className="w-5 h-5 mr-2" />
                      <span className="font-medium">Check your inbox</span>
                    </div>
                    <p>
                      We&apos;ve sent a verification link to{" "}
                      <span className="font-medium">{email}</span>. Please check
                      your email and click the link to verify your account.
                    </p>
                    <p className="mt-2 text-sm opacity-80">
                      If you don&apos;t see the email, please check your spam
                      folder.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleResendVerification}
                      disabled={resendingVerification}
                      className={`mt-2 text-sm underline self-start ${
                        isDark ? "text-blue-300" : "text-blue-600"
                      } ${resendingVerification ? "opacity-50 cursor-not-allowed" : "hover:no-underline"}`}
                    >
                      {resendingVerification
                        ? "Sending..."
                        : "Resend verification email"}
                    </motion.button>
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
                      <AlertCircle className="w-5 h-5 mr-2" />
                    </motion.div>
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="w-full">
              {/* Google Sign Up Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-col items-center"
              >
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGoogleSignup}
                  disabled={loading}
                  className={`w-full mb-6 py-3 px-4 rounded-xl flex items-center justify-center transition-all duration-300 backdrop-blur-sm border shadow-lg ${
                    isDark
                      ? "bg-gray-700/50 hover:bg-gray-600/50 text-white border-gray-600/50 hover:shadow-xl"
                      : "bg-gray-100/50 hover:bg-gray-200/50 text-gray-800 border-gray-300/50 hover:shadow-xl"
                  } ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
                  aria-label="Sign up with Google"
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
                  <span className="font-medium">Sign up with Google</span>
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
                    Or sign up with email
                  </span>
                </div>
              </motion.div>

              <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                onSubmit={handleSignup}
                className="space-y-4"
              >
                <motion.div whileFocus={{ scale: 1.02 }} className="relative">
                  <User
                    className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                    size={18}
                  />
                  <input
                    className={`w-full pl-10 pr-3 py-3 rounded-xl font-medium backdrop-blur-sm transition-all duration-300 ${
                      isDark
                        ? "bg-gray-700/50 border-gray-600/50 placeholder-gray-400 text-gray-100 focus:border-orange-400 focus:bg-gray-700/70"
                        : "bg-white/50 border-gray-300/50 placeholder-gray-500 text-gray-800 focus:border-orange-500 focus:bg-white/70"
                    } border focus:outline-none focus:ring-2 focus:ring-orange-500/20 shadow-sm`}
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </motion.div>

                <motion.div whileFocus={{ scale: 1.02 }} className="relative">
                  <Mail
                    className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                    size={18}
                  />
                  <input
                    className={`w-full pl-10 pr-3 py-3 rounded-xl font-medium backdrop-blur-sm transition-all duration-300 ${
                      isDark
                        ? "bg-gray-700/50 border-gray-600/50 placeholder-gray-400 text-gray-100 focus:border-orange-400 focus:bg-gray-700/70"
                        : "bg-white/50 border-gray-300/50 placeholder-gray-500 text-gray-800 focus:border-orange-500 focus:bg-white/70"
                    } border focus:outline-none focus:ring-2 focus:ring-orange-500/20 shadow-sm`}
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </motion.div>

                <motion.div whileFocus={{ scale: 1.02 }} className="relative">
                  <Lock
                    className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                    size={18}
                  />
                  <input
                    className={`w-full pl-10 pr-10 py-3 rounded-xl font-medium backdrop-blur-sm transition-all duration-300 ${
                      isDark
                        ? "bg-gray-700/50 border-gray-600/50 placeholder-gray-400 text-gray-100 focus:border-orange-400 focus:bg-gray-700/70"
                        : "bg-white/50 border-gray-300/50 placeholder-gray-500 text-gray-800 focus:border-orange-500 focus:bg-white/70"
                    } border focus:outline-none focus:ring-2 focus:ring-orange-500/20 shadow-sm`}
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
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

                <motion.div whileFocus={{ scale: 1.02 }} className="relative">
                  <Lock
                    className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                    size={18}
                  />
                  <input
                    className={`w-full pl-10 pr-10 py-3 rounded-xl font-medium backdrop-blur-sm transition-all duration-300 ${
                      isDark
                        ? "bg-gray-700/50 border-gray-600/50 placeholder-gray-400 text-gray-100 focus:border-orange-400 focus:bg-gray-700/70"
                        : "bg-white/50 border-gray-300/50 placeholder-gray-500 text-gray-800 focus:border-orange-500 focus:bg-white/70"
                    } border focus:outline-none focus:ring-2 focus:ring-orange-500/20 shadow-sm`}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
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

                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading || verificationSent}
                  className={`mt-6 w-full font-semibold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center backdrop-blur-sm shadow-lg ${
                    isDark
                      ? "bg-orange-600/80 hover:bg-orange-700/80 text-white border border-orange-500/30"
                      : "bg-orange-500/80 hover:bg-orange-600/80 text-white border border-orange-400/30"
                  } ${loading || verificationSent ? "opacity-70 cursor-not-allowed" : "hover:shadow-xl"}`}
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
                  ) : (
                    <UserPlus className="w-5 h-5 mr-2" />
                  )}
                  <span>
                    {loading
                      ? "Signing Up..."
                      : verificationSent
                        ? "Check Your Email"
                        : "Sign Up"}
                  </span>
                </motion.button>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className={`text-xs text-center ${isDark ? "text-gray-400" : "text-gray-600"}`}
                >
                  By signing up, you agree to LIST IT&apos;s{" "}
                  <motion.a
                    whileHover={{ scale: 1.05 }}
                    href="#"
                    className={`${
                      isDark
                        ? "text-orange-400 hover:text-orange-300"
                        : "text-orange-500 hover:text-orange-600"
                    } underline`}
                  >
                    Terms of Service
                  </motion.a>{" "}
                  and{" "}
                  <motion.a
                    whileHover={{ scale: 1.05 }}
                    href="#"
                    className={`${
                      isDark
                        ? "text-orange-400 hover:text-orange-300"
                        : "text-orange-500 hover:text-orange-600"
                    } underline`}
                  >
                    Privacy Policy
                  </motion.a>
                </motion.p>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.9 }}
                  className={`text-sm text-center ${isDark ? "text-gray-400" : "text-gray-600"}`}
                >
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className={`${
                      isDark
                        ? "text-orange-400 hover:text-orange-300"
                        : "text-orange-500 hover:text-orange-600"
                    } font-bold underline hover:no-underline transition-all duration-200`}
                  >
                    Login
                  </Link>
                </motion.p>
              </motion.form>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Signup;
