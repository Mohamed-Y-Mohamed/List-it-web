"use client";

import React, { useState } from "react";
import { Mail, AlertCircle, CheckCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/utils/client";

// Define error types for better type safety
interface ErrorObject {
  message?: string;
}

export const ForgotPassword: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const searchParams = useSearchParams();

  // Get email from URL if present
  const emailFromUrl = searchParams?.get("email") || "";

  // Form state
  const [email, setEmail] = useState(emailFromUrl || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Email validation
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle password reset request
  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate input
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
      // Use the exact URL format expected by your app
      // In development: "http://localhost:3000"
      // In production: your actual deployed URL
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ||
        (typeof window !== "undefined" ? window.location.origin : "");

      // IMPORTANT: Use the exact path to your reset password page - /resetPassword with camelCase
      const resetUrl = `${siteUrl}/resetPassword`;

      // For debugging

      // Call Supabase API with the correct redirect URL
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: resetUrl,
        }
      );

      if (error) throw error;

      setSuccess(true);
    } catch (err) {
      console.error("Password reset error:", err);

      if (err instanceof Error) {
        setError(err.message);
      } else if (
        typeof err === "object" &&
        err !== null &&
        (err as ErrorObject).message
      ) {
        setError((err as ErrorObject).message ?? null);
      } else {
        setError("Failed to send reset link. Please try again.");
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
              priority
            />
          </div>
          <div className="mt-12 flex flex-col items-center">
            <h1
              className={`text-2xl xl:text-3xl font-extrabold ${
                isDark ? "text-gray-100" : "text-gray-900"
              } text-center`}
            >
              Reset Your Password
            </h1>

            <p
              className={`mt-4 text-center ${isDark ? "text-gray-300" : "text-gray-600"}`}
            >
              Enter your email address and we&apos;ll send you a link to reset
              your password.
            </p>

            {/* Error message display */}
            {error && (
              <div
                className="mt-4 w-full bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
                role="alert"
              >
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Success message display */}
            {success && (
              <div
                className="mt-4 w-full bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative"
                role="alert"
              >
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" aria-hidden="true" />
                  <span>
                    Password reset link has been sent to your email. Please
                    check your inbox and spam folders.
                  </span>
                </div>
              </div>
            )}

            <div className="w-full flex-1 mt-8">
              {!success ? (
                <form
                  onSubmit={handleResetRequest}
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
                      aria-label="Email Address"
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
                    aria-label={
                      loading ? "Sending reset link..." : "Send reset link"
                    }
                  >
                    {loading ? (
                      <div
                        className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"
                        aria-hidden="true"
                      ></div>
                    ) : null}
                    <span>{loading ? "Sending..." : "Send Reset Link"}</span>
                  </button>
                </form>
              ) : (
                <div className="text-center mt-6">
                  <p
                    className={`${isDark ? "text-gray-300" : "text-gray-600"} mb-4`}
                  >
                    Check your email for the reset link. If you don&apos;t see
                    it, please check your spam folder.
                  </p>
                  <button
                    onClick={() => {
                      setEmail("");
                      setSuccess(false);
                    }}
                    className={`mt-2 tracking-wide font-semibold ${
                      isDark
                        ? "bg-gray-700 hover:bg-gray-600"
                        : "bg-gray-200 hover:bg-gray-300"
                    } text-${isDark ? "white" : "gray-800"} px-6 py-2 rounded-lg transition-all duration-300 ease-in-out focus:shadow-outline focus:outline-none`}
                    aria-label="Send another reset link"
                  >
                    Send Another Link
                  </button>
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
                  aria-label="Back to login page"
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

export default ForgotPassword;
