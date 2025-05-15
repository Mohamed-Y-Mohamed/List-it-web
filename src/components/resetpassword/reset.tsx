"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, Eye, EyeOff, Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/utils/client";

// Define error object interface
interface ErrorObject {
  message?: string;
}

// Helper functions for sign-out
const clearSupabaseLocalStorage = () => {
  try {
    // Get all keys from localStorage
    const keys = Object.keys(localStorage);

    // Remove any keys that start with 'supabase.auth.' or are related to auth
    keys.forEach((key) => {
      if (
        key.startsWith("supabase.auth.") ||
        key.includes("supabase") ||
        key.includes("auth")
      ) {
        localStorage.removeItem(key);
      }
    });
  } catch (err) {
    console.error("Error clearing localStorage:", err);
  }
};

const clearAllAuthCookies = () => {
  // List of all cookies we might have set
  const cookiesToClear = [
    "auth_token",
    "isLoggedIn",
    "supabase-auth-token",
    "sb-access-token",
    "sb-refresh-token",
    "sb:token",
    "__supabase_session",
  ];

  // Clear each cookie by setting expiry in the past with various paths
  cookiesToClear.forEach((cookieName) => {
    document.cookie = `${cookieName}=; path=/; max-age=0; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    document.cookie = `${cookieName}=; path=/api; max-age=0; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    document.cookie = `${cookieName}=; path=/auth; max-age=0; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    document.cookie = `${cookieName}=; max-age=0; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  });
};

export const ResetPassword: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const searchParams = useSearchParams();

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
  const [validToken, setValidToken] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  // Extract and verify token on component mount
  useEffect(() => {
    const extractToken = () => {
      // Extract token from URL parameters
      const tokenFromParams = searchParams?.get("token");

      if (!tokenFromParams) {
        setError(
          "No reset token found. Please request a new password reset link."
        );
        setVerifying(false);
        return;
      }

      // Store token for password reset
      setToken(tokenFromParams);
      setValidToken(true);
      setVerifying(false);
    };

    extractToken();
  }, [searchParams]);

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
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number";
    }
    return null;
  };

  // Enhanced force sign out function
  const forceSignOut = async () => {
    try {
      // First try the official way
      await supabase.auth.signOut({ scope: "global" });

      // Then clear all storage regardless
      clearSupabaseLocalStorage();
      clearAllAuthCookies();

      // Clear any session storage items related to auth
      try {
        sessionStorage.removeItem("supabase.auth.token");
        sessionStorage.removeItem("supabase.auth.expires_at");
      } catch (err) {
        console.error("Error clearing sessionStorage:", err);
      }
    } catch (err) {
      console.error("Force sign out error:", err);
      // Even if there's an error, we still want to try clearing storage
      clearSupabaseLocalStorage();
      clearAllAuthCookies();
    }
  };

  // Handle setting new password
  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

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

    // Make sure we have a token
    if (!token) {
      setError("No valid reset token found. Please request a new reset link.");
      return;
    }

    setLoading(true);

    try {
      // First verify the OTP (token)
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: "recovery",
      });

      if (verifyError) {
        throw verifyError;
      }

      // Now update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        throw updateError;
      }

      // Force sign out to ensure we don't auto sign-in
      await forceSignOut();

      setSuccess(true);
      setMessage(
        "Your password has been successfully updated. You will be redirected to the login page."
      );

      // Set a flag in session storage to indicate password reset success
      try {
        sessionStorage.setItem("password_reset_success", "true");
      } catch (err) {
        console.error("Error setting session storage:", err);
      }

      // Redirect to login page after 3 seconds with success message
      setTimeout(() => {
        // Use window.location.href for a full page refresh to ensure clean state
        window.location.href = "/login?password_reset=success";
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
        setError(
          "Failed to update password. Please request a new reset link from the login page."
        );
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
              Set New Password
            </h1>

            <p
              className={`mt-4 text-center ${isDark ? "text-gray-300" : "text-gray-600"}`}
            >
              Please enter and confirm your new password below.
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
                verifying ? (
                  <div className="text-center mt-6">
                    <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p
                      className={`${isDark ? "text-gray-300" : "text-gray-600"}`}
                    >
                      Verifying your reset token...
                    </p>
                  </div>
                ) : validToken ? (
                  <form
                    onSubmit={handleSetNewPassword}
                    className="mx-auto max-w-xs"
                  >
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
                      lowercase, and numbers.
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
                  <div className="text-center mt-6">
                    <AlertCircle
                      className="w-12 h-12 text-red-500 mx-auto mb-4"
                      aria-hidden="true"
                    />
                    <p
                      className={`${isDark ? "text-gray-300" : "text-gray-600"} mb-4`}
                    >
                      {error || "Invalid or expired reset link."}
                    </p>
                    <Link
                      href="/resetpage"
                      className={`mt-2 tracking-wide font-semibold ${
                        isDark
                          ? "bg-sky-600 hover:bg-sky-700"
                          : "bg-sky-500 hover:bg-sky-600"
                      } text-white px-6 py-2 rounded-lg transition-all duration-300 ease-in-out focus:shadow-outline focus:outline-none inline-block`}
                      aria-label="Request new reset link"
                    >
                      Request New Link
                    </Link>
                  </div>
                )
              ) : (
                <div className="text-center mt-6">
                  <p
                    className={`${isDark ? "text-gray-300" : "text-gray-600"} mb-4`}
                  >
                    You will be redirected to the login page shortly.
                  </p>
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
