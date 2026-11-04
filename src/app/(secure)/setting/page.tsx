"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { logoutRedirectUrl } from "@/lib/routes";
import { passwordError, PASSWORD_RULE } from "@/lib/password";
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
  Sun,
  Moon,
  ChevronDown,
  LogOut,
  MessageSquarePlus,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import PolicyModal from "@/components/legal/PolicyModal";
import { apiFetch } from "@/lib/apiFetch";
import {
  SURFACE_LABELS,
  SURFACE_ORDER,
  surfaceRamp,
  type SurfaceChoice,
  type SurfaceTheme,
} from "@/lib/surfaceTheme";
import AppSurface from "@/components/AppSurface";

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

const ROOT_MIN_HEIGHT = "min-h-screen";

// Appearance sits second, after Profile.
SETTINGS_SECTIONS.splice(1, 0, {
  id: "appearance",
  title: "Appearance",
  icon: Sun,
  description: "Theme and background colour",
});


// Notification component
const Notification: React.FC<{
  notification: NotificationState;
  onClose: () => void;
}> = ({ notification, onClose }) => {
  // document.body does not exist during the server render, so the portal below
  // waits for the client. Same guard ModalShell uses.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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

  // Portalled to the body so `position: fixed` is relative to the window even
  // when an ancestor carries a transform.
  //
  // ModalShell portals for this same reason; this follows it rather than
  // inventing a second answer.
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        // Clears the status bar now that it really is at the top of the window.
        // env() is 0 in a browser, so max() leaves the web at its original 1rem.
        style={{ top: "max(1rem, calc(var(--safe-top) + 0.5rem))" }}
        className={`fixed right-4 z-50 flex items-center space-x-3 rounded-lg border p-4 shadow-lg backdrop-blur-sm ${styles.bg} ${styles.border} ${styles.color}`}
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
    </AnimatePresence>,
    document.body,
  );
};

/**
 * The background picker: four presets for the current theme plus a custom
 * colour. One choice covers both themes (each preset has a light and a dark
 * version), saved in a cookie so the page paints it straight away next visit.
 */
const SurfaceSetting: React.FC<{
  isDark: boolean;
  theme: SurfaceTheme;
  surface: SurfaceChoice;
  onChange: (next: SurfaceChoice) => void;
  customColor: string | null;
  onCustomColor: (hex: string) => void;
}> = ({ isDark, theme, surface, onChange, customColor, onCustomColor }) => (
  <div>
    <div
      id="background-label"
      className={`mb-2 px-1 font-medium ${isDark ? "text-white" : "text-gray-900"}`}
    >
      Background
    </div>

    <div
      role="radiogroup"
      aria-labelledby="background-label"
      className="grid grid-cols-4 gap-2"
    >
      {SURFACE_ORDER.map((choice) => {
        const ramp = surfaceRamp(theme, choice);
        const { label } = SURFACE_LABELS[theme][choice];
        const isActive = choice === surface;

        return (
          <button
            key={choice}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(choice)}
            className={`flex flex-col items-stretch gap-2 rounded-xl border p-2 text-left transition-colors ${
              isActive
                ? isDark
                  ? "border-orange-400"
                  : "border-sky-500"
                : isDark
                  ? "border-[var(--surface-border)]"
                  : "border-gray-200"
            }`}
          >
            <span
              className="flex h-11 items-end rounded-lg p-1.5"
              style={{ backgroundColor: ramp.field }}
              aria-hidden="true"
            >
              <span
                className="h-5 w-full rounded-md border"
                style={{
                  backgroundColor: ramp.card,
                  borderColor: ramp.border,
                }}
              />
            </span>

            <span className="flex items-start justify-between gap-1">
              <span
                className={`min-w-0 text-[11px] font-medium leading-tight ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                {label}
              </span>
              {isActive && (
                <CheckCircle
                  className={`h-3.5 w-3.5 shrink-0 ${
                    isDark ? "text-orange-400" : "text-sky-500"
                  }`}
                />
              )}
            </span>
          </button>
        );
      })}
    </div>

    {/* Custom colour: any hex, with cards and borders derived from it. */}
    <label
      className={`mt-2 flex cursor-pointer items-center gap-3 rounded-xl border p-2 transition-colors ${
        surface === "custom"
          ? isDark
            ? "border-orange-400"
            : "border-sky-500"
          : isDark
            ? "border-[var(--surface-border)]"
            : "border-gray-200"
      }`}
    >
      <input
        type="color"
        aria-label="Custom background colour"
        value={(customColor ?? surfaceRamp(theme, "soft").field).toLowerCase()}
        onChange={(event) => onCustomColor(event.target.value)}
        className="h-9 w-12 shrink-0 cursor-pointer rounded-md border-0 bg-transparent p-0"
      />
      <span className="min-w-0 flex-1">
        <span
          className={`block text-[13px] font-medium ${isDark ? "text-white" : "text-gray-900"}`}
        >
          Custom colour
        </span>
        <span className="block text-[11px] text-gray-500">
          {customColor ?? "Pick any colour for the page background"}
        </span>
      </span>
      {surface === "custom" && (
        <CheckCircle
          className={`h-4 w-4 shrink-0 ${isDark ? "text-orange-400" : "text-sky-500"}`}
        />
      )}
    </label>

    <p className="mt-2 px-1 text-[12px] text-gray-500">
      {isDark
        ? "Light mode uses the matching light version of this colour."
        : "Dark mode uses the matching dark version of this colour."}
    </p>
  </div>
);

const LoadingSpinner: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <div className="flex items-center justify-center space-x-2">
    <RefreshCw
      className={`h-4 w-4 animate-spin ${isDark ? "text-orange-400" : "text-sky-500"}`}
    />
    <span className="text-sm">Loading...</span>
  </div>
);

export default function SettingsPage() {
  /**
   * Which section is open, or `null` for none — which is now also the state the
   * screen opens in.
   *
   * It opened on "profile", so arriving at Settings meant arriving at the
   * profile form rather than at a list of what Settings holds. Only one section
   * is ever open, so that one choice also pushed the other three below the fold
   * on a phone. Opening shut means the four headings are the first thing read
   * and every expand after that is the user's.
   */
  const [activeSection, setActiveSection] = useState<string | null>(null);
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
  // The privacy policy sheet, opened from the row beside Feedback.
  const [policyOpen, setPolicyOpen] = useState(false);

  const { theme, toggleTheme, surface, setSurface, customColor, setCustomColor } =
    useTheme();
  const { user, logout } = useAuth();
  const isDark = theme === "dark";


  // Show notification
  const showNotification = useCallback(
    (type: NotificationState["type"], message: string) => {
      setNotification({ type, message, visible: true });
    },
    [],
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

      const res = await apiFetch("/api/user/profile");
      if (!res.ok) {
        console.error("Error fetching user profile");
        showNotification("error", "Failed to load user profile");
        return;
      }
      const { data } = await res.json();

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

      const res = await apiFetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName.trim() }),
      });

      if (!res.ok) {
        console.error("Error updating profile");
        showNotification("error", "Failed to update profile");
        return;
      }

      // The route writes the `users` row and mirrors the name onto the sign-in
      // metadata. A half-done write comes back as a warning rather than an
      // error, because the row — which is what every screen reads — did save.
      const { warning } = await res.json();

      setUserProfile((prev) =>
        prev ? { ...prev, full_name: fullName.trim() } : null,
      );

      showNotification(
        warning ? "info" : "success",
        warning ?? "Profile updated successfully",
      );
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

    // Same rules the auth server enforces, checked here so the refusal is our
    // sentence and not Supabase's, which recites its whole symbol set.
    const pwError = passwordError(newPassword);
    if (pwError) {
      showNotification("error", pwError);
      return;
    }

    try {
      setIsSaving(true);

      // Verify current password and update to new password via API
      const res = await apiFetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const errData = await res.json();
        showNotification("error", errData.error || "Failed to update password");
        return;
      }

      // Clear password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Changing the password revokes every other session the account has,
      // which includes the one this screen is running on — measured: the
      // access token 401s and the refresh token is rejected the moment the
      // change lands. Staying put would leave the app holding a dead session
      // and failing on the next request for no visible reason, so say what
      // happened and go to sign-in deliberately.
      showNotification(
        "success",
        "Password changed. Sign in again with your new password.",
      );

      setTimeout(async () => {
        try {
          await logout();
        } catch (logoutError) {
          console.error("Error signing out after password change:", logoutError);
          window.location.href = logoutRedirectUrl();
        }
      }, 2200);
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
      const response = await apiFetch("/api/delete-account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const result = await response.json();
      console.log("Delete account response:", {
        status: response.status,
        result,
      });

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || result.details || "Failed to delete account",
        );
      }

      // Account successfully deleted
      showNotification(
        "success",
        "Account deleted successfully. Signing you out...",
      );

      // Clear local storage and sign out immediately
      setTimeout(async () => {
        try {
          // Clear any local storage
          if (typeof window !== "undefined") {
            localStorage.clear();
            sessionStorage.clear();
          }

          // Sign out and redirect
          await logout();
        } catch (logoutError) {
          console.error("Error during logout:", logoutError);
          // Force redirect even if logout fails
          window.location.href = logoutRedirectUrl();
        }
      }, 1500);
    } catch (error) {
      console.error("Error deleting account:", error);
      showNotification(
        "error",
        error instanceof Error ? error.message : "Failed to delete account",
      );
      setIsSaving(false);
    }
  };

  // Render section content
  const renderSectionContent = () => {
    switch (activeSection) {
      case "appearance":
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
                Appearance
              </h2>
              <p
                className={`mt-1 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                Choose how List It looks on this device.
              </p>
            </div>

            <div
              className={`flex items-center justify-between rounded-lg border bg-[var(--surface-raised)] p-4 ${
                isDark
                  ? "border-[var(--surface-border)]"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-center space-x-3">
                {isDark ? (
                  <Moon className="h-5 w-5 text-orange-400" />
                ) : (
                  <Sun className="h-5 w-5 text-sky-500" />
                )}
                <div>
                  <div
                    className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    Dark mode
                  </div>
                  <div
                    className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
                  >
                    {isDark ? "On" : "Off"}
                  </div>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={isDark}
                aria-label="Toggle dark mode"
                onClick={toggleTheme}
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ${
                  isDark ? "bg-orange-500" : "bg-gray-300"
                }`}
              >
                <span
                  // `left-0` anchors the knob to the track. Without it the knob
                  // takes its static position at the end of the button and the
                  // translate then pushes it clean outside the pill.
                  className={`absolute left-0 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                    isDark ? "translate-x-[26px]" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <SurfaceSetting
              isDark={isDark}
              theme={isDark ? "dark" : "light"}
              surface={surface}
              onChange={setSurface}
              customColor={customColor}
              onCustomColor={setCustomColor}
            />

          </motion.div>
        );

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
                        ? "border-[var(--surface-border)] bg-[var(--surface-raised)] text-gray-300"
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
                        ? "bg-[var(--surface-raised)] text-gray-300"
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
                        ? "border-[var(--surface-border)] bg-[var(--surface-raised)] text-white focus:border-orange-400 focus:ring-orange-400/20"
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
                      ? "border-[var(--surface-border)] bg-[var(--surface-raised)] text-gray-300"
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
                        },
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
                      ? "bg-orange-500 text-white hover:bg-orange-600 disabled:bg-[var(--surface-raised)] disabled:text-gray-400"
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
                        ? "border-[var(--surface-border)] bg-[var(--surface-raised)] text-white focus:border-orange-400 focus:ring-orange-400/20"
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
                        ? "border-[var(--surface-border)] bg-[var(--surface-raised)] text-white focus:border-orange-400 focus:ring-orange-400/20"
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
                  {PASSWORD_RULE}
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
                        ? "border-[var(--surface-border)] bg-[var(--surface-raised)] text-white focus:border-orange-400 focus:ring-orange-400/20"
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
                      ? "bg-orange-500 text-white hover:bg-orange-600 disabled:bg-[var(--surface-raised)] disabled:text-gray-400"
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
                          ? "bg-red-600 text-white hover:bg-red-700 disabled:bg-[var(--surface-raised)] disabled:text-gray-400"
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
      className={`transition-all pt-16 pr-4 md:pr-16 ${ROOT_MIN_HEIGHT} duration-300 pb-20 w-full relative ${
        isDark ? "text-gray-200" : "text-gray-800"
      }`}
    >
      {/* Background */}
      <AppSurface />

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

        {/* Collapsible sections, one open at a time.

            This was a navigation column beside a content panel — a desktop shape
            that on a phone stacked into a list of links above the thing they
            controlled, so every change meant scrolling past the menu to see the
            result. Each section now opens where it stands, and only the open one
            draws its controls.

            `null` is a real state: every section can be shut. The old version
            always had one selected, so there was no way to see the four headings
            on their own. */}
        <div className="space-y-3">
          {SETTINGS_SECTIONS.map((section) => {
            const Icon = section.icon;
            const isOpen = activeSection === section.id;

            return (
              <div
                key={section.id}
                /* Both arms read the ramp. The light one was a literal
                   `bg-white` with a `black/[0.06]` hairline, so on the White
                   background the section was #FFFFFF on a #FFFFFF field and the
                   only thing drawing it — collapsed or expanded — was a 6%
                   border. Same defect the mono light ramp was fixed for, and
                   for the same reason: the card never read the ramp in light
                   mode, so changing the background could not reach it.
                   `--surface-card` is #F4F4F5 against White's field, and tracks
                   Cream, Ice blue and Warm paper too.

                   The expanded body inherits this background — it only adds a
                   `border-t` — so this one value covers both states. */
                className="overflow-hidden rounded-2xl border border-[var(--surface-border)] bg-[var(--surface-card)]"
              >
                <button
                  type="button"
                  onClick={() => setActiveSection(isOpen ? null : section.id)}
                  aria-expanded={isOpen}
                  className="flex min-h-[60px] w-full items-center gap-3 px-4 py-3.5 text-left"
                >
                  <Icon
                    className={`h-5 w-5 shrink-0 ${
                      isOpen
                        ? "text-[#6366F1]"
                        : isDark
                          ? "text-gray-400"
                          : "text-gray-500"
                    }`}
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block truncate text-[15px] font-medium ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {section.title}
                    </span>
                    <span
                      className={`block truncate text-[12px] ${
                        isDark ? "text-gray-500" : "text-gray-500"
                      }`}
                    >
                      {section.description}
                    </span>
                  </span>
                  <ChevronDown
                    className={`h-4.5 w-4.5 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    } ${isDark ? "text-gray-500" : "text-gray-400"}`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      // 200ms, inside the 180–220 the brief asks for.
                      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <div
                        className={`border-t px-4 py-5 ${
                          isDark ? "border-white/[0.06]" : "border-black/[0.05]"
                        }`}
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <LoadingSpinner isDark={isDark} />
                          </div>
                        ) : (
                          renderSectionContent()
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {/* The privacy policy, as a sheet so there is no page to find a way back from. */}
          <button
            type="button"
            onClick={() => setPolicyOpen(true)}
            className={`flex min-h-[56px] w-full items-center gap-3 rounded-2xl border bg-[var(--surface-card)] px-4 py-3.5 text-left ${
              isDark ? "border-white/[0.08]" : "border-black/[0.06]"
            }`}
          >
            <ShieldCheck
              className={`h-5 w-5 shrink-0 ${isDark ? "text-orange-400" : "text-sky-500"}`}
            />
            <span className="min-w-0 flex-1">
              <span
                className={`block text-[15px] font-medium ${isDark ? "text-white" : "text-gray-900"}`}
              >
                Privacy Policy
              </span>
              <span className="block text-[12px] text-gray-500">
                What we collect, and how to delete it
              </span>
            </span>
          </button>

          {/* Feedback. Opens in a new tab; `rel` stops it reaching back through
              `window.opener`. */}
          <a
            href="https://forms.gle/dE21epzC4L8Tx1Kd9"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex min-h-[56px] w-full items-center gap-3 rounded-2xl border bg-[var(--surface-card)] px-4 py-3.5 text-left ${
              isDark
                ? "border-white/[0.08]"
                : "border-black/[0.06]"
            }`}
          >
            <MessageSquarePlus
              className={`h-5 w-5 shrink-0 ${isDark ? "text-orange-400" : "text-sky-500"}`}
            />
            <span className="min-w-0 flex-1">
              <span
                className={`block text-[15px] font-medium ${isDark ? "text-white" : "text-gray-900"}`}
              >
                Feedback and feature requests
              </span>
              <span className="block text-[12px] text-gray-500">
                Tell us what to build next
              </span>
            </span>
            <ExternalLink
              className={`h-4 w-4 shrink-0 ${isDark ? "text-gray-500" : "text-gray-400"}`}
              aria-hidden="true"
            />
          </a>

          {/* Sign out, also in the sidebar. Here too so it is one tap away on a phone. */}
            <button
              type="button"
              onClick={logout}
              className={`flex min-h-[56px] w-full items-center gap-3 rounded-2xl border bg-[var(--surface-card)] px-4 py-3.5 text-left ${
                isDark
                  ? "border-white/[0.08] text-orange-300"
                  : "border-black/[0.06] text-orange-600"
              }`}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium">Sign Out</span>
                <span
                  className={`block text-[12px] ${
                    isDark ? "text-gray-500" : "text-gray-500"
                  }`}
                >
                  Leave this account on this device
                </span>
              </span>
            </button>
        </div>
      </div>

      {/* Notification */}
      <Notification notification={notification} onClose={hideNotification} />

      <PolicyModal
        isOpen={policyOpen}
        onClose={() => setPolicyOpen(false)}
        isDark={isDark}
      />
    </main>
  );
}
