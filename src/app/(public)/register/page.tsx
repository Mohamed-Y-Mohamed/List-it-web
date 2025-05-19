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
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/utils/client";

interface ErrorWithMessage {
  message?: string;
  details?: string;
  status?: number;
}

const Signup = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [googleComingSoon, setGoogleComingSoon] = useState(false);
  const trimmedEmail = email.trim();

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

    if (!isFormValid()) return;

    // Prevent rapid fire requests (429 errors)
    if (loading) return;

    setLoading(true);

    try {
      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (authError) throw authError;

      // 2. Insert user into 'users' table WITHOUT waiting for authentication
      if (authData.user) {
        // Corrected: only include fields that actually exist in your users table
        try {
          const { error: profileError } = await supabase.from("users").insert([
            {
              id: authData.user.id,
              full_name: fullName,
              email: trimmedEmail,
              // Removed the 'lists' field since it doesn't exist in your schema
            },
          ]);

          if (profileError) {
            console.error("Profile error:", profileError);
            // Continue even if profile setup fails, but log the error

            // Check for specific schema errors
            if (
              profileError.message?.includes("column") &&
              profileError.message?.includes("schema cache")
            ) {
              console.warn(
                "Schema mismatch detected. Check your users table schema."
              );
            }
          }
        } catch (profileErr) {
          console.error("Error inserting user profile:", profileErr);
          // Continue with auth flow even if profile insertion fails
        }
      }

      // 3. Set authentication cookies
      if (authData.session?.access_token) {
        document.cookie = `auth_token=${authData.session.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        document.cookie = `isLoggedIn=true; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

        // 4. Redirect to dashboard
        setSuccess("Account created successfully! Redirecting to dashboard...");

        // Add a slight delay for the success message to be seen
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } else {
        // If we don't have a session yet, show email confirmation message
        setSuccess(
          "Signup successful! Please check your email to confirm your account."
        );
      }
    } catch (err: unknown) {
      console.error("Signup error:", err);

      // Type guard to check if error has message property
      const error = err as ErrorWithMessage;

      // Specific handler for rate limiting
      if (
        error?.message?.includes("For security purposes") ||
        error?.status === 429
      ) {
        setError("Please wait a few seconds before trying again");
      }
      // Provide other user-friendly error messages
      else if (error?.message?.includes("already registered")) {
        setError("This email is already registered. Please log in instead.");
      } else if (error?.message) {
        setError(error.message);
      } else if (error?.details) {
        setError(error.details);
      } else {
        setError("Failed to sign up. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle showing "coming soon" message for Google signup
  const handleGoogleSignup = () => {
    setError(null);
    setSuccess(null);
    setGoogleComingSoon(true);
    // Hide the message after 3 seconds
    setTimeout(() => setGoogleComingSoon(false), 3000);
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
        className={`max-w-6xl w-full mx-auto rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row ${
          isDark ? "bg-gray-800/70" : "bg-white/70"
        } backdrop-blur-sm`}
      >
        {/* Left Panel - Illustration */}
        <div className="md:w-1/2 bg-gradient-to-br from-gray-800 to-gray-900 hidden md:flex md:flex-col justify-center items-center p-12 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-pattern"></div>
          <div className="relative z-10 text-center">
            <div className="flex items-center justify-center mb-6">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mr-3 shadow-lg ${
                  isDark ? "bg-orange-600" : "bg-sky-500"
                }`}
              >
                <ListTodo className="h-8 w-8 text-white" />
              </div>
              <span className="text-4xl font-bold text-white">LIST IT</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-6">
              Organize Your Tasks
            </h2>
            <p className="text-gray-300 mb-8 max-w-sm mx-auto">
              Join our community to organize your tasks, stay productive, and
              manage your projects efficiently.
            </p>

            <div className="relative mt-8">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-orange-500 rounded-lg blur opacity-20"></div>
              <div className="relative">
                <Image
                  src="/app-icon.jpeg"
                  width={180}
                  height={180}
                  alt="LIST IT App"
                  className="mx-auto rounded-xl shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="md:w-1/2 p-8 md:p-12">
          <div className="flex flex-col items-center md:items-start">
            {/* Logo on mobile only */}
            <div className="md:hidden mb-8 flex items-center justify-center">
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
              className={`text-2xl font-bold mb-8 ${isDark ? "text-white" : "text-gray-900"}`}
            >
              Create your account
            </h1>

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
                  <Check className="w-5 h-5 mr-2" />
                  <span>{success}</span>
                </div>
              </div>
            )}

            {/* Error message display */}
            {error && (
              <div
                className={`w-full mb-6 rounded-lg border-l-4 border-red-500 ${
                  isDark
                    ? "bg-red-900/30 text-red-300"
                    : "bg-red-50 text-red-700"
                } p-4`}
                role="alert"
              >
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Google "Coming Soon" message */}
            {googleComingSoon && (
              <div
                className={`w-full mb-6 rounded-lg border-l-4 border-blue-500 ${
                  isDark
                    ? "bg-blue-900/30 text-blue-300"
                    : "bg-blue-50 text-blue-700"
                } p-4`}
                role="alert"
              >
                <div className="flex items-center">
                  <span>Sign up with Google will be available soon!</span>
                </div>
              </div>
            )}

            <div className="w-full">
              {/* Google Sign Up Button */}
              <button
                onClick={handleGoogleSignup}
                disabled={loading}
                className={`w-full mb-6 py-3 px-4 rounded-lg flex items-center justify-center transition-all duration-300 ${
                  isDark
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                } ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
                type="button"
              >
                <div className="bg-white p-1 rounded-full shadow-sm">
                  <svg className="w-5 h-5" viewBox="0 0 533.5 544.3">
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
                <span className="ml-4">
                  Sign up with Google{" "}
                  <span className="text-xs italic">(Coming Soon)</span>
                </span>
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div
                    className={`w-full border-t ${isDark ? "border-gray-700" : "border-gray-300"}`}
                  ></div>
                </div>
                <div className="relative flex justify-center">
                  <span
                    className={`px-3 ${isDark ? "bg-gray-800/70 text-gray-400" : "bg-white/70 text-gray-600"}`}
                  >
                    Or sign up with email
                  </span>
                </div>
              </div>

              <form onSubmit={handleSignup} className="space-y-4">
                <div className="relative">
                  <User
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
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

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
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="relative">
                  <Lock
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
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <div className="relative">
                  <Lock
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
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
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
                  ) : (
                    <UserPlus className="w-5 h-5 mr-2" />
                  )}
                  <span>{loading ? "Signing Up..." : "Sign Up"}</span>
                </button>

                <p
                  className={`text-xs text-center ${isDark ? "text-gray-400" : "text-gray-600"}`}
                >
                  By signing up, you agree to LIST IT&apos;s{" "}
                  <a
                    href="#"
                    className={`${
                      isDark
                        ? "text-orange-400 hover:text-orange-300"
                        : "text-sky-500 hover:text-sky-600"
                    }`}
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="#"
                    className={`${
                      isDark
                        ? "text-orange-400 hover:text-orange-300"
                        : "text-sky-500 hover:text-sky-600"
                    }`}
                  >
                    Privacy Policy
                  </a>
                </p>

                <p
                  className={`text-sm text-center ${isDark ? "text-gray-400" : "text-gray-600"}`}
                >
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className={`${
                      isDark
                        ? "text-orange-400 hover:text-orange-300"
                        : "text-sky-500 hover:text-sky-600"
                    } font-bold`}
                  >
                    Login
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
