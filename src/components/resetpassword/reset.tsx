"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/utils/client";

// Define error object interface
interface ErrorObject {
  message?: string;
}

const ResetPassword: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();
  const searchParams = useSearchParams();

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Mode state
  const [isResetMode, setIsResetMode] = useState(false);

  // Setup on initial load
  useEffect(() => {
    // Check for token in query parameters (from email link)
    const token = searchParams?.get("token");

    if (token) {
      setIsResetMode(true);

      // Pre-fill email if provided
      const email = searchParams?.get("email");
      if (email) {
        setEmail(email);
      }
    }
  }, [searchParams]);

  // Validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate password strength
  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number";
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      return "Password must contain at least one special character";
    }
    return null;
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Toggle confirm password visibility
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Handle sending password reset email
  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    // Validate email
    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!isValidEmail(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      // Send password reset email with the correct reset URL
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/resetPassword`,
        }
      );

      if (error) throw error;

      setSuccess(true);
      setMessage(
        "Password reset link has been sent to your email. Please check your inbox and spam folders."
      );
    } catch (err: unknown) {
      console.error("Password reset error:", err);

      if (err instanceof Error) {
        setError(err.message);
      } else if (
        typeof err === "object" &&
        err !== null &&
        (err as ErrorObject).message
      ) {
        setError((err as ErrorObject).message!);
      } else {
        setError("Failed to send reset link. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle setting new password
  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    // Validate email
    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!isValidEmail(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    // Validate password
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      // Update the user's password
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      setSuccess(true);
      setMessage(
        "Your password has been successfully updated. You will be redirected to the login page."
      );

      // Redirect to login page after 3 seconds
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: unknown) {
      console.error("Password update error:", err);

      if (err instanceof Error) {
        setError(err.message);
      } else if (
        typeof err === "object" &&
        err !== null &&
        (err as ErrorObject).message
      ) {
        setError((err as ErrorObject).message!);
      } else {
        setError("Failed to update password. Please request a new reset link.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen pt-18 ${
        isDark ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"
      } flex justify-center transition-colors duration-300`}
    >
      <div
        className={`max-w-md m-0 sm:m-10 ${
          isDark ? "bg-gray-800" : "bg-white"
        } shadow sm:rounded-lg flex justify-center flex-1`}
      >
        <div className="p-6 sm:p-12 w-full">
          <div>
            <Image
              src="/app-icon.jpeg"
              width={128}
              height={128}
              alt="LIST IT Logo"
              className="w-24 mx-auto rounded-full"
            />
          </div>
          <div className="mt-12 flex flex-col items-center">
            <h1
              className={`text-2xl xl:text-3xl font-extrabold ${
                isDark ? "text-gray-100" : "text-gray-900"
              } text-center`}
            >
              {isResetMode ? "Set New Password" : "Reset Your Password"}
            </h1>

            <p
              className={`mt-4 text-center ${isDark ? "text-gray-300" : "text-gray-600"}`}
            >
              {isResetMode
                ? "Please enter and confirm your new password below."
                : "Enter your email address and we'll send you a link to reset your password."}
            </p>

            {/* Error message display */}
            {error && (
              <div
                className={`mt-4 w-full bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative`}
                role="alert"
              >
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Success message display */}
            {success && message && (
              <div
                className={`mt-4 w-full bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative`}
                role="alert"
              >
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" aria-hidden="true" />
                  <span>{message}</span>
                </div>
              </div>
            )}

            <div className="w-full flex-1 mt-8">
              {!success ? (
                isResetMode ? (
                  <form
                    onSubmit={handleSetNewPassword}
                    className="mx-auto max-w-xs"
                  >
                    {/* Email is always required */}
                    <div className="relative">
                      <Mail
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        size={18}
                        aria-hidden="true"
                      />
                      <input
                        className={`w-full pl-10 pr-3 py-4 rounded-lg font-medium ${
                          isDark
                            ? "bg-gray-700 border-gray-600 placeholder-gray-400 text-gray-200 focus:border-sky-400 focus:bg-gray-600"
                            : "bg-gray-100 border-gray-200 placeholder-gray-500 text-sm focus:border-sky-500 focus:bg-white"
                        } border text-sm focus:outline-none`}
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        required
                        name="email"
                        id="email"
                        autoComplete="email"
                      />
                    </div>

                    {/* New Password Input */}
                    <div className="relative mt-5">
                      <Lock
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        size={18}
                        aria-hidden="true"
                      />
                      <input
                        className={`w-full pl-10 pr-10 py-4 rounded-lg font-medium ${
                          isDark
                            ? "bg-gray-700 border-gray-600 placeholder-gray-400 text-gray-200 focus:border-sky-400 focus:bg-gray-600"
                            : "bg-gray-100 border-gray-200 placeholder-gray-500 text-sm focus:border-sky-500 focus:bg-white"
                        } border text-sm focus:outline-none`}
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
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-500 focus:outline-none"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={18} aria-hidden="true" />
                        ) : (
                          <Eye size={18} aria-hidden="true" />
                        )}
                      </button>
                    </div>

                    {/* Confirm Password Input */}
                    <div className="relative mt-5">
                      <Lock
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        size={18}
                        aria-hidden="true"
                      />
                      <input
                        className={`w-full pl-10 pr-10 py-4 rounded-lg font-medium ${
                          isDark
                            ? "bg-gray-700 border-gray-600 placeholder-gray-400 text-gray-200 focus:border-sky-400 focus:bg-gray-600"
                            : "bg-gray-100 border-gray-200 placeholder-gray-500 text-sm focus:border-sky-500 focus:bg-white"
                        } border text-sm focus:outline-none`}
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
                      <button
                        type="button"
                        onClick={toggleConfirmPasswordVisibility}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-500 focus:outline-none"
                        aria-label={
                          showConfirmPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={18} aria-hidden="true" />
                        ) : (
                          <Eye size={18} aria-hidden="true" />
                        )}
                      </button>
                    </div>

                    {/* Password requirements hint */}
                    <p
                      className={`mt-2 text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Password must be at least 8 characters with uppercase,
                      lowercase, numbers, and a special character.
                    </p>

                    <button
                      type="submit"
                      disabled={loading}
                      className={`mt-5 tracking-wide font-semibold ${
                        isDark
                          ? "bg-sky-600 hover:bg-sky-700"
                          : "bg-sky-500 hover:bg-sky-600"
                      } text-white w-full py-4 rounded-lg transition-all duration-300 ease-in-out flex items-center justify-center focus:shadow-outline focus:outline-none ${
                        loading ? "opacity-70 cursor-not-allowed" : ""
                      }`}
                    >
                      {loading ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      ) : null}
                      <span>{loading ? "Updating..." : "Update Password"}</span>
                    </button>
                  </form>
                ) : (
                  <form
                    onSubmit={handleSendResetEmail}
                    className="mx-auto max-w-xs"
                  >
                    <div className="relative">
                      <Mail
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        size={18}
                        aria-hidden="true"
                      />
                      <input
                        className={`w-full pl-10 pr-3 py-4 rounded-lg font-medium ${
                          isDark
                            ? "bg-gray-700 border-gray-600 placeholder-gray-400 text-gray-200 focus:border-sky-400 focus:bg-gray-600"
                            : "bg-gray-100 border-gray-200 placeholder-gray-500 text-sm focus:border-sky-500 focus:bg-white"
                        } border text-sm focus:outline-none`}
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        required
                        name="email"
                        id="email"
                        autoComplete="email"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className={`mt-5 tracking-wide font-semibold ${
                        isDark
                          ? "bg-sky-600 hover:bg-sky-700"
                          : "bg-sky-500 hover:bg-sky-600"
                      } text-white w-full py-4 rounded-lg transition-all duration-300 ease-in-out flex items-center justify-center focus:shadow-outline focus:outline-none ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
                    >
                      {loading ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      ) : null}
                      <span>{loading ? "Sending..." : "Send Reset Link"}</span>
                    </button>
                  </form>
                )
              ) : (
                <div className="text-center mt-6">
                  <p
                    className={`${isDark ? "text-gray-300" : "text-gray-600"} mb-4`}
                  >
                    {isResetMode
                      ? "You will be redirected to the login page shortly."
                      : "Check your email for the reset link. If you don't see it, please check your spam folder."}
                  </p>
                  {!isResetMode && (
                    <button
                      onClick={() => {
                        setEmail("");
                        setSuccess(false);
                        setMessage(null);
                      }}
                      className={`mt-2 tracking-wide font-semibold ${
                        isDark
                          ? "bg-gray-700 hover:bg-gray-600"
                          : "bg-gray-200 hover:bg-gray-300"
                      } text-${isDark ? "white" : "gray-800"} px-6 py-2 rounded-lg transition-all duration-300 ease-in-out focus:shadow-outline focus:outline-none`}
                    >
                      Try Another Email
                    </button>
                  )}
                </div>
              )}

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className={`text-sm ${
                    isDark
                      ? "text-sky-400 hover:text-sky-300"
                      : "text-sky-500 hover:text-sky-600"
                  }`}
                >
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
