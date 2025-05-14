"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, Eye, EyeOff, Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/utils/client";

// Define error object interface
interface ErrorObject {
  message?: string;
}

export const ResetPassword: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();

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

  // Verify token on component mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Get current session
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        // If no session, redirect to login
        if (!data.session) {
          setError(
            "Invalid or expired reset link. Please request a new one from the login page."
          );
          // After 3 seconds, redirect to login
          setTimeout(() => {
            router.push("/login");
          }, 3000);
          return;
        }

        // Make sure this is actually a recovery session
        // Check URL for type=recovery or check if we're redirected from the auth callback
        const url = new URL(window.location.href);
        const isRecovery =
          url.searchParams.get("type") === "recovery" ||
          sessionStorage.getItem("pwd_reset_flow") === "true";

        if (!isRecovery) {
          // Store in session storage that we're in a recovery flow
          // This is because the URL params might be lost after the callback redirect
          sessionStorage.setItem("pwd_reset_flow", "true");
        }

        setValidToken(true);
      } catch (err) {
        console.error("Session check error:", err);
        setError(
          "Unable to verify reset session. Please try again or request a new reset link."
        );
      }
    };

    checkSession();
  }, [router]);

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

    setLoading(true);

    try {
      // Update the user's password
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      // Clear the password reset flow marker
      sessionStorage.removeItem("pwd_reset_flow");

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
                validToken ? (
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
                    <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p
                      className={`${isDark ? "text-gray-300" : "text-gray-600"}`}
                    >
                      Verifying reset token...
                    </p>
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
