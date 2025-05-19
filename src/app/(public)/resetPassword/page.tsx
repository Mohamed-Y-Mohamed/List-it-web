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
  Info,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/utils/client";

// Define interface for debugInfo to fix type errors
interface DebugInfo {
  "URL Parameters": Record<string, string>;
  "Hash Parameters": Record<string, string>;
  "Full URL": string;
  "Session Exists"?: string;
  "Has Token"?: string;
  "Is Recovery"?: string;
  "Token Length"?: number;
  "Token Appears Valid"?: string;
  "Session After Process"?: string;
  "Direct Verification"?: string;
  "Verification Error"?: string;
  "Session Check Error"?: string;
  "Overall Error"?: string;
}

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
  const [processingToken, setProcessingToken] = useState(true);

  // Debug state
  const [debugMode, setDebugMode] = useState(true);
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    "URL Parameters": {},
    "Hash Parameters": {},
    "Full URL": "",
  });

  // Detect and process recovery parameters
  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log("Starting session check for password reset");
        setProcessingToken(true);
        setError(null);

        // Debug: Extract URL parameters and hash parameters
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        );

        const urlParamsObj: Record<string, string> = {};
        urlParams.forEach((value, key) => {
          urlParamsObj[key] = value;
        });

        const hashParamsObj: Record<string, string> = {};
        hashParams.forEach((value, key) => {
          hashParamsObj[key] = value;
        });

        // Debug: Save full URL and parameters
        const debugData: DebugInfo = {
          "URL Parameters": urlParamsObj,
          "Hash Parameters": hashParamsObj,
          "Full URL": window.location.href,
        };

        // First check if we already have a session
        const { data: sessionData } = await supabase.auth.getSession();

        // Add session info to debug data
        debugData["Session Exists"] = sessionData.session ? "Yes" : "No";

        if (sessionData.session) {
          console.log("Session already exists");
          setValidSession(true);
          setProcessingToken(false);
          setDebugInfo(debugData);
          return;
        }

        // Check if we have proper token parameters
        const hasToken = hashParams.has("access_token");
        const isRecovery = hashParams.get("type") === "recovery";
        const tokenValue = hashParams.get("access_token") || "";

        // Add token info to debug data
        debugData["Has Token"] = hasToken ? "Yes" : "No";
        debugData["Is Recovery"] = isRecovery ? "Yes" : "No";
        debugData["Token Length"] = tokenValue.length;

        // Check if token looks valid (should be at least 20 chars for a real Supabase token)
        const tokenLooksValid = tokenValue.length > 20;
        debugData["Token Appears Valid"] = tokenLooksValid ? "Yes" : "No";

        setDebugInfo(debugData);

        if (hasToken && isRecovery) {
          console.log("Found recovery token in URL hash");

          // Remove development mode exception - require valid tokens always
          if (!tokenLooksValid) {
            console.warn("Token appears to be invalid");
            setError(
              "Invalid password reset token. Please request a new password reset link."
            );
            setValidSession(false);
            setProcessingToken(false);
            return;
          }

          // For valid tokens, let Supabase process it
          // Wait for Supabase to process the token
          setTimeout(async () => {
            try {
              // Check if a session was established
              const { data: refreshedSession } =
                await supabase.auth.getSession();

              // Update debug info with session check results
              setDebugInfo((prev: DebugInfo) => ({
                ...prev,
                "Session After Process": refreshedSession.session
                  ? "Yes"
                  : "No",
              }));

              if (refreshedSession.session) {
                console.log("Recovery session established");
                setValidSession(true);
              } else {
                console.warn("No session after recovery token processing");

                // Try a direct verification if no session was created
                try {
                  // This is a direct approach to verify the token - may work in some cases
                  const { error: verifyError } = await supabase.auth.verifyOtp({
                    token_hash: tokenValue,
                    type: "recovery",
                  });

                  if (verifyError) {
                    console.error(
                      "Direct token verification failed:",
                      verifyError
                    );
                    setDebugInfo((prev: DebugInfo) => ({
                      ...prev,
                      "Direct Verification": "Failed",
                      "Verification Error": verifyError.message,
                    }));
                    throw verifyError;
                  }

                  // If we get here, verification worked
                  console.log("Token verified via direct verification");
                  setDebugInfo((prev: DebugInfo) => ({
                    ...prev,
                    "Direct Verification": "Success",
                  }));
                  setValidSession(true);
                } catch (verifyErr) {
                  // Error: 'verifyErr' is defined but never used
                  // Fix: Log the error to use the variable
                  console.error("Verification error:", verifyErr);
                  setError(
                    "Password reset link is invalid or has expired. Please request a new one."
                  );
                  setValidSession(false);
                }
              }
            } catch (sessionErr) {
              console.error("Session check error:", sessionErr);
              setDebugInfo((prev: DebugInfo) => ({
                ...prev,
                "Session Check Error": String(sessionErr),
              }));
              setError("Failed to validate reset session. Please try again.");
              setValidSession(false);
            } finally {
              setProcessingToken(false);
            }
          }, 1000);
        } else {
          console.warn("No recovery token found in URL");
          setError(
            "No active password reset session found. Please request a new password reset link."
          );
          setValidSession(false);
          setProcessingToken(false);
        }
      } catch (err) {
        console.error("Session check error:", err);
        setDebugInfo((prev: DebugInfo) => ({
          ...prev,
          "Overall Error": String(err),
        }));
        setError("Failed to verify password reset session");
        setValidSession(false);
        setProcessingToken(false);
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

  // Toggle debug mode
  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
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
          {/* Debug mode toggle */}
          <button
            onClick={toggleDebugMode}
            className={`absolute top-3 right-3 p-2 rounded-full ${
              isDark
                ? "text-gray-300 hover:bg-gray-700"
                : "text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Info size={16} />
          </button>

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

          {/* Debug info display */}
          {debugMode && (
            <div
              className={`w-full mb-6 rounded-lg border-l-4 border-yellow-500 ${
                isDark
                  ? "bg-yellow-900/30 text-yellow-300"
                  : "bg-yellow-50 text-yellow-800"
              } p-4 text-xs font-mono overflow-auto`}
            >
              <h3 className="font-bold mb-2">DEBUG INFO:</h3>
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}

          {/* Loading message while processing token */}
          {processingToken && (
            <div
              className={`w-full mb-6 rounded-lg border-l-4 border-blue-500 ${
                isDark
                  ? "bg-blue-900/30 text-blue-300"
                  : "bg-blue-50 text-blue-700"
              } p-4`}
              role="alert"
            >
              <div className="flex items-center">
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                <span>Verifying your reset token...</span>
              </div>
            </div>
          )}

          {/* Error message display */}
          {!processingToken && error && (
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
            {/* Remove development mode exception from rendering condition */}
            {!processingToken && validSession && !success ? (
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
              !processingToken &&
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
