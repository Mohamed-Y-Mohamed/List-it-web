"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  User,
  Lock,
  Trash2,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Mail,
  AlertCircle,
  Shield,
} from "lucide-react";

// Types
interface UserProfile {
  id: string;
  full_name: string | null;
  email: string;
  created_at: string;
}

interface SettingsSection {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
}

interface NotificationState {
  type: "success" | "error" | "warning" | "info";
  message: string;
  visible: boolean;
}

// Settings sections configuration
const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: "profile",
    title: "Profile",
    icon: User,
    description: "Manage your personal information",
  },
  {
    id: "security",
    title: "Security",
    icon: Lock,
    description: "Password and security settings",
  },
  {
    id: "account",
    title: "Account",
    icon: Trash2,
    description: "Account deletion and data management",
  },
];

// Notification component
const Notification: React.FC<{
  notification: NotificationState;
  onClose: () => void;
}> = ({ notification, onClose }) => {
  useEffect(() => {
    if (notification.visible) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification.visible, onClose]);

  if (!notification.visible) return null;

  const getNotificationStyles = () => {
    switch (notification.type) {
      case "success":
        return {
          icon: CheckCircle,
          color: "text-green-600 dark:text-green-400",
          bg: "bg-green-100 dark:bg-green-900/30",
          border: "border-green-200 dark:border-green-800",
        };
      case "error":
        return {
          icon: AlertTriangle,
          color: "text-red-600 dark:text-red-400",
          bg: "bg-red-100 dark:bg-red-900/30",
          border: "border-red-200 dark:border-red-800",
        };
      case "warning":
        return {
          icon: AlertCircle,
          color: "text-yellow-600 dark:text-yellow-400",
          bg: "bg-yellow-100 dark:bg-yellow-900/30",
          border: "border-yellow-200 dark:border-yellow-800",
        };
      default:
        return {
          icon: AlertCircle,
          color: "text-blue-600 dark:text-blue-400",
          bg: "bg-blue-100 dark:bg-blue-900/30",
          border: "border-blue-200 dark:border-blue-800",
        };
    }
  };

  const styles = getNotificationStyles();
  const Icon = styles.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className={`fixed top-4 right-4 z-50 flex items-center space-x-3 rounded-lg border p-4 shadow-lg backdrop-blur-sm ${styles.bg} ${styles.border} ${styles.color}`}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <p className="text-sm font-medium">{notification.message}</p>
        <button
          onClick={onClose}
          className="ml-2 flex-shrink-0 rounded-md p-1 hover:bg-black/10 dark:hover:bg-white/10"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

// Loading component
const LoadingSpinner: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <div className="flex items-center justify-center space-x-2">
    <RefreshCw
      className={`h-4 w-4 animate-spin ${isDark ? "text-orange-400" : "text-sky-500"}`}
    />
    <span className="text-sm">Loading...</span>
  </div>
);

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("profile");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    type: "info",
    message: "",
    visible: false,
  });

  // Form states
  const [fullName, setFullName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const isDark = theme === "dark";

  // Show notification
  const showNotification = useCallback(
    (type: NotificationState["type"], message: string) => {
      setNotification({ type, message, visible: true });
    },
    []
  );

  // Hide notification
  const hideNotification = useCallback(() => {
    setNotification((prev) => ({ ...prev, visible: false }));
  }, []);

  // Fetch user profile
  const fetchUserProfile = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        showNotification("error", "Failed to load user profile");
        return;
      }

      if (data) {
        setUserProfile(data);
        setFullName(data.full_name || "");
      }
    } catch (error) {
      console.error("Unexpected error fetching user profile:", error);
      showNotification("error", "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [user, showNotification]);

  // Load user profile on mount
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  // Handle profile update
  const handleProfileUpdate = async () => {
    if (!user || !userProfile) return;

    if (!fullName.trim()) {
      showNotification("error", "Full name is required");
      return;
    }

    try {
      setIsSaving(true);

      const { error } = await supabase
        .from("users")
        .update({ full_name: fullName.trim() })
        .eq("id", user.id);

      if (error) {
        console.error("Error updating profile:", error);
        showNotification("error", "Failed to update profile");
        return;
      }

      setUserProfile((prev) =>
        prev ? { ...prev, full_name: fullName.trim() } : null
      );
      showNotification("success", "Profile updated successfully");
    } catch (error) {
      console.error("Unexpected error updating profile:", error);
      showNotification("error", "An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      showNotification("error", "All password fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      showNotification("error", "New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      showNotification("error", "New password must be at least 6 characters");
      return;
    }

    try {
      setIsSaving(true);

      // First verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userProfile?.email || "",
        password: currentPassword,
      });

      if (signInError) {
        showNotification("error", "Current password is incorrect");
        return;
      }

      // Update password using Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error("Error updating password:", error);
        showNotification("error", "Failed to update password");
        return;
      }

      // Clear password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showNotification("success", "Password updated successfully");
    } catch (error) {
      console.error("Unexpected error updating password:", error);
      showNotification("error", "An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle account deletion
  const handleAccountDeletion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    if (deleteConfirmation !== "DELETE") {
      showNotification("error", 'Please type "DELETE" to confirm');
      return;
    }

    try {
      setIsSaving(true);

      // Call our API route to delete the user account completely
      const response = await fetch("/api/delete-account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete account");
      }

      showNotification(
        "success",
        "Account deleted successfully. You will be signed out..."
      );

      // Clear local storage and sign out
      setTimeout(async () => {
        // Clear any local storage
        if (typeof window !== "undefined") {
          localStorage.clear();
          sessionStorage.clear();
        }

        // Sign out and redirect
        await supabase.auth.signOut();
        await logout();

        // Force redirect to home page
        window.location.href = "/";
      }, 2000);
    } catch (error) {
      console.error("Error deleting account:", error);
      showNotification(
        "error",
        error instanceof Error ? error.message : "Failed to delete account"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Render section content
  const renderSectionContent = () => {
    switch (activeSection) {
      case "profile":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div>
              <h2
                className={`text-2xl font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
              >
                Profile Settings
              </h2>
              <p
                className={`mt-1 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                Update your personal information and profile details
              </p>
            </div>

            <div className="space-y-6">
              {/* Email (read-only) */}
              <div>
                <label
                  className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
                >
                  Email Address
                </label>
                <div className="mt-1 flex items-center space-x-3">
                  <div
                    className={`flex-1 rounded-lg border px-3 py-2 ${
                      isDark
                        ? "border-gray-600 bg-gray-700/50 text-gray-300"
                        : "border-gray-300 bg-gray-50 text-gray-700"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span>{userProfile?.email}</span>
                    </div>
                  </div>
                  <div
                    className={`rounded-lg px-3 py-1 text-xs font-medium ${
                      isDark
                        ? "bg-gray-700 text-gray-300"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    Read-only
                  </div>
                </div>
                <p
                  className={`mt-1 text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}
                >
                  Email address cannot be changed
                </p>
              </div>

              {/* Full Name */}
              <div>
                <label
                  htmlFor="fullName"
                  className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
                >
                  Full Name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 ${
                      isDark
                        ? "border-gray-600 bg-gray-700/50 text-white focus:border-orange-400 focus:ring-orange-400/20"
                        : "border-gray-300 bg-white text-gray-900 focus:border-sky-500 focus:ring-sky-500/20"
                    }`}
                    placeholder="Enter your full name"
                    disabled={isSaving}
                  />
                </div>
              </div>

              {/* Account Created */}
              <div>
                <label
                  className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
                >
                  Account Created
                </label>
                <div
                  className={`mt-1 rounded-lg border px-3 py-2 ${
                    isDark
                      ? "border-gray-600 bg-gray-700/50 text-gray-300"
                      : "border-gray-300 bg-gray-50 text-gray-700"
                  }`}
                >
                  {userProfile?.created_at
                    ? new Date(userProfile.created_at).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )
                    : "Loading..."}
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleProfileUpdate}
                  disabled={isSaving || !fullName.trim()}
                  className={`flex items-center space-x-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    isDark
                      ? "bg-orange-500 text-white hover:bg-orange-600 disabled:bg-gray-700 disabled:text-gray-400"
                      : "bg-sky-500 text-white hover:bg-sky-600 disabled:bg-gray-300 disabled:text-gray-500"
                  } disabled:cursor-not-allowed`}
                >
                  {isSaving ? (
                    <LoadingSpinner isDark={isDark} />
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        );

      case "security":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div>
              <h2
                className={`text-2xl font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
              >
                Security Settings
              </h2>
              <p
                className={`mt-1 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                Manage your password and security preferences
              </p>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-6">
              {/* Current Password */}
              <div>
                <label
                  htmlFor="currentPassword"
                  className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
                >
                  Current Password
                </label>
                <div className="mt-1 relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    id="currentPassword"
                    name="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 pr-10 focus:outline-none focus:ring-2 ${
                      isDark
                        ? "border-gray-600 bg-gray-700/50 text-white focus:border-orange-400 focus:ring-orange-400/20"
                        : "border-gray-300 bg-white text-gray-900 focus:border-sky-500 focus:ring-sky-500/20"
                    }`}
                    placeholder="Enter current password"
                    disabled={isSaving}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                      isDark
                        ? "text-gray-400 hover:text-gray-300"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label
                  htmlFor="newPassword"
                  className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
                >
                  New Password
                </label>
                <div className="mt-1 relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    id="newPassword"
                    name="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 pr-10 focus:outline-none focus:ring-2 ${
                      isDark
                        ? "border-gray-600 bg-gray-700/50 text-white focus:border-orange-400 focus:ring-orange-400/20"
                        : "border-gray-300 bg-white text-gray-900 focus:border-sky-500 focus:ring-sky-500/20"
                    }`}
                    placeholder="Enter new password"
                    disabled={isSaving}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                      isDark
                        ? "text-gray-400 hover:text-gray-300"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p
                  className={`mt-1 text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}
                >
                  Password must be at least 6 characters long
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
                >
                  Confirm New Password
                </label>
                <div className="mt-1 relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 pr-10 focus:outline-none focus:ring-2 ${
                      isDark
                        ? "border-gray-600 bg-gray-700/50 text-white focus:border-orange-400 focus:ring-orange-400/20"
                        : "border-gray-300 bg-white text-gray-900 focus:border-sky-500 focus:ring-sky-500/20"
                    }`}
                    placeholder="Confirm new password"
                    disabled={isSaving}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                      isDark
                        ? "text-gray-400 hover:text-gray-300"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={
                    isSaving ||
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword
                  }
                  className={`flex items-center space-x-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    isDark
                      ? "bg-orange-500 text-white hover:bg-orange-600 disabled:bg-gray-700 disabled:text-gray-400"
                      : "bg-sky-500 text-white hover:bg-sky-600 disabled:bg-gray-300 disabled:text-gray-500"
                  } disabled:cursor-not-allowed`}
                >
                  {isSaving ? (
                    <LoadingSpinner isDark={isDark} />
                  ) : (
                    <>
                      <Shield className="h-4 w-4" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        );

      case "account":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div>
              <h2
                className={`text-2xl font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
              >
                Account Management
              </h2>
              <p
                className={`mt-1 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                Manage your account and data deletion
              </p>
            </div>

            <div
              className={`rounded-lg border p-6 ${
                isDark
                  ? "border-red-800 bg-red-900/20"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <div className="flex items-start space-x-3">
                <AlertTriangle
                  className={`mt-0.5 h-5 w-5 flex-shrink-0 ${
                    isDark ? "text-red-400" : "text-red-500"
                  }`}
                />
                <div className="flex-1">
                  <h3
                    className={`text-lg font-medium ${
                      isDark ? "text-red-400" : "text-red-800"
                    }`}
                  >
                    Delete Account
                  </h3>
                  <div
                    className={`mt-2 text-sm ${
                      isDark ? "text-red-300" : "text-red-700"
                    }`}
                  >
                    <p className="mb-3">
                      Once you delete your account, there is no going back.
                      Please be certain. This action will:
                    </p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Permanently delete all your lists and collections</li>
                      <li>Remove all your tasks and notes</li>
                      <li>Delete your account and profile information</li>
                    </ul>
                  </div>

                  <form
                    onSubmit={handleAccountDeletion}
                    className="mt-4 space-y-4"
                  >
                    <div>
                      <label
                        htmlFor="deleteConfirmation"
                        className={`block text-sm font-medium ${
                          isDark ? "text-red-300" : "text-red-700"
                        }`}
                      >
                        Type <strong>DELETE</strong> to confirm
                      </label>
                      <input
                        type="text"
                        id="deleteConfirmation"
                        name="deleteConfirmation"
                        value={deleteConfirmation}
                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                        className={`mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 ${
                          isDark
                            ? "border-red-600 bg-red-900/50 text-white focus:border-red-400 focus:ring-red-400/20"
                            : "border-red-300 bg-white text-gray-900 focus:border-red-500 focus:ring-red-500/20"
                        }`}
                        placeholder="Type DELETE to confirm"
                        disabled={isSaving}
                        autoComplete="off"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSaving || deleteConfirmation !== "DELETE"}
                      className={`flex items-center space-x-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                        isDark
                          ? "bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-400"
                          : "bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300 disabled:text-gray-500"
                      } disabled:cursor-not-allowed`}
                    >
                      {isSaving ? (
                        <LoadingSpinner isDark={isDark} />
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4" />
                          <span>Delete Account Permanently</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <main
      className={`transition-all pt-16 pr-4 md:pr-16 min-h-screen duration-300 pb-20 w-full relative ${
        isDark ? "text-gray-200" : "text-gray-800"
      }`}
    >
      {/* Background */}
      {isDark ? (
        <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(45deg,#000000_0%,#0a0c0f_20%,#141619_40%,#0f1114_70%,#000000_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.15)_0%,transparent_60%)] after:absolute after:inset-0 after:[background:radial-gradient(ellipse_at_top_right,rgba(147,197,253,0.08)_0%,transparent_50%)] before:content-[''] after:content-['']" />
      ) : (
        <div className="absolute inset-0 -z-10 size-full [background:linear-gradient(45deg,#f8fafc_0%,#f1f5f9_25%,#e2e8f0_50%,#f3f4f6_75%,#ffffff_100%)] before:absolute before:inset-0 before:[background:radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.08)_0%,transparent_60%)] after:absolute after:inset-0 after:[background:radial-gradient(ellipse_at_top_right,rgba(147,197,253,0.06)_0%,transparent_50%)] before:content-[''] after:content-['']" />
      )}

      <div className="max-w-7xl pl-4 md:pl-20 w-full mx-auto">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center mb-2">
            <Settings
              className={`h-7 w-7 mr-3 ${isDark ? "text-orange-400" : "text-sky-500"}`}
            />
            <h1
              className={`text-3xl md:text-4xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
            >
              Settings
            </h1>
          </div>
          <p
            className={`text-base ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            Manage your account, security, and preferences
          </p>
        </motion.header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Settings Navigation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div
              className={`rounded-xl p-4 backdrop-blur-sm border ${
                isDark
                  ? "bg-gray-800/50 border-gray-700/50"
                  : "bg-white/50 border-gray-300/50"
              } shadow-sm`}
            >
              <nav className="space-y-2">
                {SETTINGS_SECTIONS.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;

                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-start space-x-3 p-3 rounded-lg text-left transition-all duration-200 ${
                        isActive
                          ? isDark
                            ? "bg-orange-500/20 text-orange-400 border-orange-400/50"
                            : "bg-sky-100 text-sky-700 border-sky-300"
                          : isDark
                            ? "text-gray-300 hover:bg-gray-700/50 hover:text-orange-400"
                            : "text-gray-700 hover:bg-gray-100 hover:text-sky-600"
                      } border ${
                        isActive
                          ? isDark
                            ? "border-orange-400/50"
                            : "border-sky-300"
                          : "border-transparent"
                      }`}
                    >
                      <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">{section.title}</div>
                        <div
                          className={`text-xs ${
                            isActive
                              ? isDark
                                ? "text-orange-300"
                                : "text-sky-600"
                              : isDark
                                ? "text-gray-500"
                                : "text-gray-500"
                          }`}
                        >
                          {section.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          </motion.div>

          {/* Settings Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-3"
          >
            <div
              className={`rounded-xl p-6 backdrop-blur-sm border ${
                isDark
                  ? "bg-gray-800/50 border-gray-700/50"
                  : "bg-white/50 border-gray-300/50"
              } shadow-sm`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner isDark={isDark} />
                </div>
              ) : (
                renderSectionContent()
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Notification */}
      <Notification notification={notification} onClose={hideNotification} />
    </main>
  );
}
