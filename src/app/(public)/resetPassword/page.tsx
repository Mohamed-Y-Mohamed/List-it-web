"use client";

import React, { useState, useEffect } from "react";
import {
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  ListTodo,
  ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/utils/client";

const ResetPassword = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();

  // Form state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validSession, setValidSession] = useState(false);

  // Check if we have an active reset session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Session error:", error);
          setError("Invalid or expired password reset session");
          return;
        }

        if (data.session) {
          setValidSession(true);
        } else {
          setError(
            "No active password reset session found. Please request a new password reset link."
          );
        }
      } catch (err) {
        console.error("Error checking session:", err);
        setError("Failed to validate reset session");
      }
    };

    checkSession();
  }, []);

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Handle password reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate form
    if (!password) {
      setError("New password is required");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      // Update password via Supabase
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      // Success - show message and prepare to redirect
      setSuccess(true);

      // Sign out the user after password reset
      setTimeout(async () => {
        try {
          await supabase.auth.signOut();
          router.push("/login?reset=success");
        } catch (signOutError) {
          console.error(
            "Error signing out after password reset:",
            signOutError
          );
          // Still redirect even if sign out fails
          router.push("/login?reset=success");
        }
      }, 3000);
    } catch (err) {
      console.error("Password reset error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to reset password. Please try again.");
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
            Enter your new password below.
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
                  Your password has been reset successfully! Redirecting to
                  login...
                </span>
              </div>
            </div>
          )}

          <div className="w-full mt-4">
            {validSession && !success ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="relative">
                  <Lock
                    className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                    size={18}
                  />
                  <input
                    className={`w-full pl-10 pr-10 py-3 rounded-lg font-medium ${
                      isDark
                        ? "bg-gray-700/70 border-gray-600 placeholder-gray-400 text-gray-100 focus:border-orange-400"
                        : "bg-white/80 border-gray-300 placeholder-gray-500 text-gray-800 focus:border-sky-500"
                    } border focus:outline-none transition-colors`}
                    type={showPassword ? "text" : "password"}
                    placeholder="New Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                      isDark
                        ? "text-gray-400 hover:text-gray-300"
                        : "text-gray-500 hover:text-gray-600"
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
                  </button>
                </div>

                <div className="relative">
                  <Lock
                    className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                    size={18}
                  />
                  <input
                    className={`w-full pl-10 pr-10 py-3 rounded-lg font-medium ${
                      isDark
                        ? "bg-gray-700/70 border-gray-600 placeholder-gray-400 text-gray-100 focus:border-orange-400"
                        : "bg-white/80 border-gray-300 placeholder-gray-500 text-gray-800 focus:border-sky-500"
                    } border focus:outline-none transition-colors`}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={toggleConfirmPasswordVisibility}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                      isDark
                        ? "text-gray-400 hover:text-gray-300"
                        : "text-gray-500 hover:text-gray-600"
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
                  </button>
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
                  <span>{loading ? "Updating..." : "Reset Password"}</span>
                </button>
              </form>
            ) : (
              !success && (
                <div className="text-center">
                  <p
                    className={`${isDark ? "text-gray-300" : "text-gray-600"} mb-4`}
                  >
                    {error || "Loading reset session..."}
                  </p>
                  <Link href="/forgotPassword">
                    <button
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                        isDark
                          ? "bg-gray-700 hover:bg-gray-600 text-white"
                          : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                      }`}
                    >
                      Request New Reset Link
                    </button>
                  </Link>
                </div>
              )
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

export default ResetPassword;
