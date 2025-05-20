"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mail, AlertCircle, CheckCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";

const ForgotPasswordPage: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { resetPassword } = useAuth();

  // Form state
  const [email, setEmail] = useState<string>("");

  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [waitTime, setWaitTime] = useState<number>(0);

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
      // seed a short cooldown so user can't immediately re-click
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
          <Image
            src="/app-icon.jpeg"
            width={128}
            height={128}
            alt="LIST IT Logo"
            className="w-24 mx-auto rounded-full"
          />

          <div className="mt-12 flex flex-col items-center">
            <h1
              className={`text-2xl xl:text-3xl font-extrabold ${
                isDark ? "text-gray-100" : "text-gray-900"
              } text-center`}
            >
              Reset Your Password
            </h1>
            <p
              className={`mt-4 text-center ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Enter your email and we’ll send you a link to reset your password.
            </p>

            {error && (
              <div
                className="mt-4 w-full bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
                role="alert"
              >
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {success && (
              <div
                className="mt-4 w-full bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded"
                role="alert"
              >
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span>
                    Reset link sent! Check your inbox (and spam folder).
                  </span>
                </div>
              </div>
            )}

            <div className="w-full flex-1 mt-8">
              {!success ? (
                <form onSubmit={handleSubmit} className="mx-auto max-w-xs">
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="email"
                      name="email"
                      id="email"
                      autoComplete="email"
                      className={`w-full pl-10 pr-3 py-4 rounded-lg font-medium ${
                        isDark
                          ? "bg-gray-700 border-gray-600 placeholder-gray-400 text-gray-200 focus:border-sky-400 focus:bg-gray-600"
                          : "bg-gray-100 border-gray-200 placeholder-gray-500 text-sm focus:border-sky-500 focus:bg-white"
                      } border text-sm focus:outline-none`}
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading || waitTime > 0}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || waitTime > 0}
                    className={`mt-5 tracking-wide font-semibold ${
                      isDark
                        ? "bg-sky-600 hover:bg-sky-700"
                        : "bg-sky-500 hover:bg-sky-600"
                    } text-white w-full py-4 rounded-lg transition-all duration-300 ease-in-out flex items-center justify-center ${
                      loading || waitTime > 0
                        ? "opacity-70 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {loading ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : null}
                    <span>
                      {waitTime > 0
                        ? `Wait ${waitTime}s`
                        : loading
                          ? "Sending..."
                          : "Send Reset Link"}
                    </span>
                  </button>
                </form>
              ) : (
                <div className="text-center mt-6">
                  <p
                    className={`${
                      isDark ? "text-gray-300" : "text-gray-600"
                    } mb-4`}
                  >
                    Didn’t receive it? Wait a moment, then try again.
                  </p>
                  <button
                    onClick={() => {
                      setSuccess(false);
                      setError(null);
                      setEmail("");
                    }}
                    className={`mt-2 tracking-wide font-semibold ${
                      isDark
                        ? "bg-gray-700 hover:bg-gray-600"
                        : "bg-gray-200 hover:bg-gray-300"
                    } ${
                      isDark ? "text-white" : "text-gray-800"
                    } px-6 py-2 rounded-lg transition-all duration-300 ease-in-out focus:shadow-outline focus:outline-none`}
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

export default ForgotPasswordPage;
