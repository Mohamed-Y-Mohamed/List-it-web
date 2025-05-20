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
        {/* Left Panel - Form */}
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
              Log in to your account
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
                  <CheckCircle className="w-5 h-5 mr-2" aria-hidden="true" />
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
                  <AlertCircle className="w-5 h-5 mr-2" aria-hidden="true" />
                  <span>{error}</span>
                </div>

                {error.includes("verification") ||
                error.includes("expired") ||
                emailVerificationNeeded ? (
                  <div className="mt-3 ml-7">
                    <button
                      onClick={handleResendVerification}
                      disabled={resendingVerification || !!waitTime}
                      className={`text-sm underline ${
                        isDark ? "text-blue-300" : "text-blue-600"
                      } ${resendingVerification || !!waitTime ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {resendingVerification
                        ? "Sending..."
                        : waitTime
                          ? `Wait ${waitTime}s to resend`
                          : "Resend verification email"}
                    </button>
                  </div>
                ) : null}
              </div>
            )}

            <div className="w-full">
              {/* Google Sign In Button */}
              <div className="flex flex-col items-center">
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className={`w-full mb-6 py-3 px-4 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    isDark
                      ? "bg-gray-700 hover:bg-gray-600 text-white"
                      : "bg-gray-300 hover:bg-gray-400 text-gray-800"
                  } ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
                  aria-label="Login with Google"
                  type="button"
                >
                  <div className="bg-white p-1 rounded-full shadow-sm">
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
                  <span className="ml-4">Log in with Google</span>
                </button>
              </div>

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
                    Or log in with email
                  </span>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="relative">
                  <Mail
                    className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                    size={18}
                    aria-hidden="true"
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
                    disabled={loading}
                    required
                    name="email"
                    id="email"
                    autoComplete="email"
                  />
                </div>

                <div className="relative">
                  <Lock
                    className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                    size={18}
                    aria-hidden="true"
                  />
                  <input
                    className={`w-full pl-10 pr-10 py-3 rounded-lg font-medium ${
                      isDark
                        ? "bg-gray-700/70 border-gray-600 placeholder-gray-400 text-gray-100 focus:border-orange-400"
                        : "bg-white/80 border-gray-300 placeholder-gray-500 text-gray-800 focus:border-sky-500"
                    } border focus:outline-none transition-colors`}
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

                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className={`h-4 w-4 rounded focus:ring-2 ${
                        isDark
                          ? "bg-gray-700 border-gray-600 text-orange-500 focus:ring-orange-500"
                          : "bg-white border-gray-300 text-sky-500 focus:ring-sky-500"
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
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className={`text-sm font-medium ${
                      isDark
                        ? "text-orange-400 hover:text-orange-300"
                        : "text-sky-500 hover:text-sky-600"
                    }`}
                  >
                    Forgot password?
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
                    <div
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"
                      aria-hidden="true"
                    ></div>
                  ) : (
                    <LogIn className="w-5 h-5 mr-2" aria-hidden="true" />
                  )}
                  <span>{loading ? "Logging In..." : "Log In"}</span>
                </button>

                <p
                  className={`text-sm text-center ${isDark ? "text-gray-400" : "text-gray-600"}`}
                >
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/register"
                    className={`${
                      isDark
                        ? "text-orange-400 hover:text-orange-300"
                        : "text-sky-500 hover:text-sky-600"
                    } font-bold`}
                  >
                    Sign up
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>

        {/* Right Panel - Illustration */}
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
            <h2 className="text-3xl font-bold text-white mb-6">Welcome Back</h2>
            <p className="text-gray-300 mb-8 max-w-sm mx-auto">
              Log in to access your tasks, notes, and collections. Stay
              productive and organized with LIST IT.
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
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main page component that uses Suspense
const LoginPage = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gray-800 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2">Loading...</span>
        </div>
      }
    >
      <LoginWithSearchParams />
    </Suspense>
  );
};

export default LoginPage;
