"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Mail,
  AlertCircle,
  CheckCircle,
  ListTodo,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";

interface ErrorObject {
  message?: string;
}

const ForgotPassword = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { resetPassword } = useAuth();
  const emailSentRef = useRef(false);

  // Form state
  const [email, setEmail] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Reset any previous error when returning to this page
  useEffect(() => {
    setError(null);
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    // Prevent multiple submissions for the same email
    if (emailSentRef.current && loading) {
      return;
    }

    setLoading(true);

    try {
      const { success, error } = await resetPassword(email.trim());

      if (!success) {
        throw error || new Error("Failed to send reset link");
      }

      // Mark that we've sent an email to prevent spam
      emailSentRef.current = true;
      setSuccess(true);
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

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background with radial gradient */}
      {isDark ? (
        <div className="absolute inset-0 -z-10 size-full items-center [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#7c2d12_100%)]" />
      ) : (
        <div className="absolute inset-0 -z-10 size-full bg-white [background:radial-gradient(125%_125%_at_60%_10%,#fff_20%,#bae6fd_100%)]" />
      )}

      <div
        className={`max-w-md w-full mx-auto rounded-xl shadow-2xl overflow-hidden ${
          isDark ? "bg-gray-800/70" : "bg-white/70"
        } backdrop-blur-sm p-8 md:p-10`}
      >
        <div className="flex flex-col items-center">
          {/* Logo */}
          <div className="flex items-center justify-center mb-6">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center mr-3 shadow-sm ${
                isDark ? "bg-orange-600" : "bg-sky-500"
              }`}
            >
              <ListTodo className="h-6 w-6 text-white" />
            </div>
            <span
              className={`text-2xl font-bold ${
                isDark ? "text-orange-400" : "text-sky-500"
              }`}
            >
              LIST IT
            </span>
          </div>

          <h1
            className={`text-2xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}
          >
            Reset Your Password
          </h1>

          <p
            className={`text-center mb-6 ${isDark ? "text-gray-300" : "text-gray-600"}`}
          >
            Enter your email address and we&apos;ll send you a link to reset
            your password.
          </p>

          {/* Error message display */}
          {error && (
            <div
              className={`w-full mb-6 rounded-lg border-l-4 border-red-500 ${
                isDark ? "bg-red-900/30 text-red-300" : "bg-red-50 text-red-700"
              } p-4`}
              role="alert"
            >
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Success message display */}
          {success && (
            <div
              className={`w-full mb-6 rounded-lg border-l-4 border-green-500 ${
                isDark
                  ? "bg-green-900/30 text-green-300"
                  : "bg-green-50 text-green-700"
              } p-4`}
              role="alert"
            >
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span>
                  Password reset link has been sent to your email. Please check
                  your inbox and spam folder.
                </span>
              </div>
            </div>
          )}

          <div className="w-full mt-4">
            {!success ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Mail
                    className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                    size={18}
                  />
                  <input
                    className={`w-full pl-10 pr-3 py-3 rounded-lg font-medium ${
                      isDark
                        ? "bg-gray-700/70 border-gray-600 placeholder-gray-400 text-gray-100 focus:border-orange-400"
                        : "bg-white/80 border-gray-300 placeholder-gray-500 text-gray-800 focus:border-sky-500"
                    } border focus:outline-none transition-colors`}
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                <div
                  className={`p-4 rounded-lg border-l-4 border-blue-500 ${
                    isDark
                      ? "bg-blue-900/30 text-blue-300"
                      : "bg-blue-50 text-blue-700"
                  }`}
                >
                  <p className="text-sm">
                    <strong>Important:</strong> After receiving the email, click
                    the reset link immediately. The link expires after 1 hour
                    for security reasons.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`mt-5 w-full font-semibold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center ${
                    isDark
                      ? "bg-orange-600 hover:bg-orange-700 text-white"
                      : "bg-sky-500 hover:bg-sky-600 text-white"
                  } ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  ) : null}
                  <span>{loading ? "Sending..." : "Send Reset Link"}</span>
                </button>
              </form>
            ) : (
              <div className="text-center mt-6">
                <p
                  className={`${isDark ? "text-gray-300" : "text-gray-600"} mb-4`}
                >
                  Check your email for the reset link. If you don&apos;t see it
                  within a few minutes, please check your spam folder.
                </p>
                <p
                  className={`${isDark ? "text-gray-400" : "text-gray-500"} mb-4 text-sm`}
                >
                  The reset link will expire in 1 hour.
                </p>
                <button
                  onClick={() => {
                    setEmail("");
                    setSuccess(false);
                    emailSentRef.current = false;
                  }}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                    isDark
                      ? "bg-gray-700 hover:bg-gray-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                  }`}
                >
                  Send Another Link
                </button>
              </div>
            )}

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className={`inline-flex items-center text-sm font-medium ${
                  isDark
                    ? "text-orange-400 hover:text-orange-300"
                    : "text-sky-500 hover:text-sky-600"
                }`}
              >
                <ArrowLeft size={16} className="mr-1" />
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
