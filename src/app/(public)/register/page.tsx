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
        router.push("/login");
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
      {isDark ? (
        <div className="absolute inset-0 -z-10 size-full items-center [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#7c2d12_100%)]" />
      ) : (
        <div className="absolute inset-0 -z-10 size-full bg-white [background:radial-gradient(125%_125%_at_60%_10%,#fff_20%,#bae6fd_100%)]" />
      )}

      <div
        className={`max-w-6xl w-full mx-auto rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row ${
          isDark ? "bg-gray-800/50" : "bg-white/50"
        } backdrop-blur-sm`}
      >
        {/* Left Panel - Illustration */}
        <div className="md:w-1/2 bg-gradient-to-br from-gray-800/70 to-gray-900 hidden md:flex md:flex-col justify-center items-center p-12 relative overflow-hidden">
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

            {/* Email verification instructions */}
            {verificationSent && (
              <div
                className={`w-full mb-6 rounded-lg border-l-4 border-blue-500 ${
                  isDark
                    ? "bg-blue-900/30 text-blue-300"
                    : "bg-blue-50 text-blue-700"
                } p-4`}
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
                  <p className="mt-2 text-sm">
                    If you don&apos;t see the email, please check your spam
                    folder.
                  </p>
                  <button
                    onClick={handleResendVerification}
                    disabled={resendingVerification}
                    className={`mt-2 text-sm underline ${
                      isDark ? "text-blue-300" : "text-blue-600"
                    } ${resendingVerification ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {resendingVerification
                      ? "Sending..."
                      : "Resend verification email"}
                  </button>
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

            <div className="w-full">
              {/* Google Sign Up Button */}
              <div className="flex flex-col items-center">
                <button
                  onClick={handleGoogleSignup}
                  disabled={loading}
                  className={`w-full mb-6 py-3 px-4 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    isDark
                      ? "bg-gray-700 hover:bg-gray-600 text-white"
                      : "bg-gray-300 hover:bg-gray-400 text-gray-800"
                  } ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
                  aria-label="Sign up with Google"
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
                  <span className="ml-4">Sign up with Google</span>
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
                    className={`w-full pl-10 pr-10 py-3 rounded-lg font-medium ${
                      isDark
                        ? "bg-gray-700/70 border-gray-600 placeholder-gray-400 text-gray-100 focus:border-orange-400"
                        : "bg-white/80 border-gray-300 placeholder-gray-500 text-gray-800 focus:border-sky-500"
                    } border focus:outline-none transition-colors`}
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                  disabled={loading || verificationSent}
                  className={`mt-5 w-full font-semibold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center ${
                    isDark
                      ? "bg-orange-600 hover:bg-orange-700 text-white"
                      : "bg-sky-500 hover:bg-sky-600 text-white"
                  } ${loading || verificationSent ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
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
    // End of Signup component
  );
};

export default Signup;
