"use client";

import React, { useState, useEffect } from "react";
import {
  UserPlus,
  Mail,
  Lock,
  User,
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  X,
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

  // Password visibility state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Focus state for showing/hiding validation requirements
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  // Password validation states
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  const [passwordsMatch, setPasswordsMatch] = useState(false);

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Update password validation whenever password changes
  useEffect(() => {
    const validations = {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };
    setPasswordValidation(validations);
  }, [password]);

  // Check if passwords match
  useEffect(() => {
    setPasswordsMatch(password === confirmPassword && password !== "");
  }, [password, confirmPassword]);

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

    // Check all password criteria
    const allCriteriaMet = Object.values(passwordValidation).every(
      (value) => value
    );
    if (!allCriteriaMet) {
      setError("Password does not meet all requirements");
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

  // Function to toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Function to toggle confirm password visibility
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div
      className={`min-h-screen pt-18 ${
        isDark ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"
      } flex justify-center transition-colors duration-300`}
    >
      <div
        className={`max-w-screen-xl m-0 sm:m-10 ${
          isDark ? "bg-gray-800" : "bg-white"
        } shadow sm:rounded-lg flex justify-center flex-1`}
      >
        <div className="flex-1 bg-[#7d7e7f] text-center hidden lg:flex">
          <div
            className="m-12 xl:m-16 w-full bg-contain bg-center bg-no-repeat"
            style={{
              backgroundImage: "url('/images/signup.png')",
            }}
          ></div>
        </div>
        <div className="lg:w-1/2 xl:w-5/12 p-6 sm:p-12">
          <div>
            <Image
              src="/app-icon.jpeg"
              width={128}
              height={128}
              alt="LIST IT Logo"
              className="w-32 mx-auto rounded-full"
            />
          </div>
          <div className="mt-12 flex flex-col items-center">
            <h1
              className={`text-2xl xl:text-3xl font-extrabold ${
                isDark ? "text-gray-100" : "text-gray-900"
              }`}
            >
              Create your account
            </h1>

            {/* Success message display */}
            {success && (
              <div
                className="mt-4 w-full max-w-xs bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative"
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
                className="mt-4 w-full max-w-xs bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
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
                className="mt-4 w-full max-w-xs bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative"
                role="alert"
              >
                <div className="flex items-center">
                  <span>Sign up with Google will be available soon!</span>
                </div>
              </div>
            )}

            <div className="w-full flex-1 mt-8">
              <div className="flex flex-col items-center">
                <button
                  onClick={handleGoogleSignup}
                  disabled={loading}
                  className={`w-full max-w-xs font-bold shadow-sm rounded-lg py-3 ${
                    isDark
                      ? "bg-orange-900 text-gray-200"
                      : "bg-orange-100 text-gray-800"
                  } flex items-center justify-center transition-all duration-300 ease-in-out focus:outline-none hover:shadow focus:shadow-sm focus:shadow-outline ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
                  type="button"
                >
                  <div
                    className={`${
                      isDark ? "bg-gray-800" : "bg-white"
                    } p-2 rounded-full`}
                  >
                    <svg className="w-4" viewBox="0 0 533.5 544.3">
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
              </div>

              <div className="my-12 border-b text-center">
                <div
                  className={`leading-none px-2 inline-block text-sm ${
                    isDark
                      ? "text-gray-400 bg-gray-800"
                      : "text-gray-600 bg-white"
                  } tracking-wide font-medium transform translate-y-1/2`}
                >
                  Or sign up with e-mail
                </div>
              </div>

              <form onSubmit={handleSignup} className="mx-auto max-w-xs">
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    className={`w-full pl-10 pr-3 py-4 rounded-lg font-medium ${
                      isDark
                        ? "bg-gray-700 border-gray-600 placeholder-gray-400 text-gray-200 focus:border-orange-400 focus:bg-gray-600"
                        : "bg-gray-100 border-gray-200 placeholder-gray-500 text-sm focus:border-orange-500 focus:bg-white"
                    } border text-sm focus:outline-none`}
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="relative mt-5">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    className={`w-full pl-10 pr-3 py-4 rounded-lg font-medium ${
                      isDark
                        ? "bg-gray-700 border-gray-600 placeholder-gray-400 text-gray-200 focus:border-orange-400 focus:bg-gray-600"
                        : "bg-gray-100 border-gray-200 placeholder-gray-500 text-gray-800 focus:border-orange-500 focus:bg-white"
                    } border text-sm focus:outline-none`}
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {/* Password field with toggle visibility */}
                <div className="relative mt-5">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    className={`w-full pl-10 pr-12 py-4 rounded-lg font-medium ${
                      isDark
                        ? "bg-gray-700 border-gray-600 placeholder-gray-400 text-gray-200 focus:border-orange-400 focus:bg-gray-600"
                        : "bg-gray-100 border-gray-200 placeholder-gray-500 text-sm focus:border-orange-500 focus:bg-white"
                    } border text-sm focus:outline-none`}
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Password validation indicators - only shown when password field is focused */}
                {passwordFocused && (
                  <div className="mt-2 text-xs">
                    <div className="flex items-center mb-1">
                      {passwordValidation.minLength ? (
                        <Check size={14} className="text-green-500 mr-1" />
                      ) : (
                        <X size={14} className="text-red-500 mr-1" />
                      )}
                      <span
                        className={
                          passwordValidation.minLength
                            ? "text-green-500"
                            : "text-red-500"
                        }
                      >
                        At least 8 characters
                      </span>
                    </div>
                    <div className="flex items-center mb-1">
                      {passwordValidation.hasUpperCase ? (
                        <Check size={14} className="text-green-500 mr-1" />
                      ) : (
                        <X size={14} className="text-red-500 mr-1" />
                      )}
                      <span
                        className={
                          passwordValidation.hasUpperCase
                            ? "text-green-500"
                            : "text-red-500"
                        }
                      >
                        At least 1 uppercase letter
                      </span>
                    </div>
                    <div className="flex items-center mb-1">
                      {passwordValidation.hasLowerCase ? (
                        <Check size={14} className="text-green-500 mr-1" />
                      ) : (
                        <X size={14} className="text-red-500 mr-1" />
                      )}
                      <span
                        className={
                          passwordValidation.hasLowerCase
                            ? "text-green-500"
                            : "text-red-500"
                        }
                      >
                        At least 1 lowercase letter
                      </span>
                    </div>
                    <div className="flex items-center mb-1">
                      {passwordValidation.hasNumber ? (
                        <Check size={14} className="text-green-500 mr-1" />
                      ) : (
                        <X size={14} className="text-red-500 mr-1" />
                      )}
                      <span
                        className={
                          passwordValidation.hasNumber
                            ? "text-green-500"
                            : "text-red-500"
                        }
                      >
                        At least 1 number
                      </span>
                    </div>
                    <div className="flex items-center mb-1">
                      {passwordValidation.hasSpecialChar ? (
                        <Check size={14} className="text-green-500 mr-1" />
                      ) : (
                        <X size={14} className="text-red-500 mr-1" />
                      )}
                      <span
                        className={
                          passwordValidation.hasSpecialChar
                            ? "text-green-500"
                            : "text-red-500"
                        }
                      >
                        At least 1 special character
                      </span>
                    </div>
                  </div>
                )}

                {/* Confirm Password field with toggle visibility */}
                <div className="relative mt-5">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    className={`w-full pl-10 pr-12 py-4 rounded-lg font-medium ${
                      isDark
                        ? "bg-gray-700 border-gray-600 placeholder-gray-400 text-gray-200 focus:border-orange-400 focus:bg-gray-600"
                        : "bg-gray-100 border-gray-200 placeholder-gray-500 text-sm focus:border-orange-500 focus:bg-white"
                    } border text-sm focus:outline-none`}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onFocus={() => setConfirmPasswordFocused(true)}
                    onBlur={() => setConfirmPasswordFocused(false)}
                    required
                  />
                  <button
                    type="button"
                    onClick={toggleConfirmPasswordVisibility}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>

                {/* Password match indicator - only shown when confirm password field is focused or has content */}
                {(confirmPasswordFocused || confirmPassword) && (
                  <div className="mt-2 flex items-center text-xs">
                    {passwordsMatch ? (
                      <>
                        <Check size={14} className="text-green-500 mr-1" />
                        <span className="text-green-500">Passwords match</span>
                      </>
                    ) : (
                      <>
                        <X size={14} className="text-red-500 mr-1" />
                        <span className="text-red-500">
                          Passwords do not match
                        </span>
                      </>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={`mt-5 tracking-wide font-semibold ${
                    isDark
                      ? "bg-orange-600 hover:bg-orange-700"
                      : "bg-orange-500 hover:bg-orange-600"
                  } text-white w-full py-4 rounded-lg transition-all duration-300 ease-in-out flex items-center justify-center focus:shadow-outline focus:outline-none ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  ) : (
                    <UserPlus className="w-6 h-6 -ml-2" />
                  )}
                  <span className="ml-3">
                    {loading ? "Signing Up..." : "Sign Up"}
                  </span>
                </button>
                <p
                  className={`mt-6 text-xs ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  } text-center`}
                >
                  By signing up, you agree to LIST IT&apos;s{" "}
                  <a
                    href="#"
                    className={`${
                      isDark
                        ? "text-orange-400 hover:text-orange-300"
                        : "text-orange-500 hover:text-orange-600"
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
                        : "text-orange-500 hover:text-orange-600"
                    }`}
                  >
                    Privacy Policy
                  </a>
                </p>
                <p
                  className={`mt-4 text-sm ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  } text-center`}
                >
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className={`${
                      isDark
                        ? "text-orange-400 hover:text-orange-300"
                        : "text-orange-500 hover:text-orange-600"
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
