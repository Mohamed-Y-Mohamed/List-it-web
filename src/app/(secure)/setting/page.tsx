"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { IS_NATIVE_BUILD, isNativeApp } from "@/lib/platform";
import { logoutRedirectUrl } from "@/lib/routes";
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
  Bell,
  LayoutGrid,
  Rows3,
  ChevronDown,
  LogOut,
  MessageSquarePlus,
  ExternalLink,
} from "lucide-react";
import { apiFetch } from "@/lib/apiFetch";
import { useListLayout } from "@/hooks/useListLayout";
import { type ListLayout } from "@/lib/listLayout";
import {
  SURFACE_LABELS,
  SURFACE_ORDER,
  surfaceRamp,
  type SurfaceChoice,
  type SurfaceTheme,
} from "@/lib/surfaceTheme";
import { ensureNotificationPermission } from "@/lib/notifications";
import { useNotificationPrefs } from "@/hooks/useNotificationPrefs";
import { DEFAULT_NOTIFICATION_PREFS } from "@/lib/notificationPrefs";
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

// On the web the theme toggle lives in the sidebar. The native app has no
// sidebar, so without this there is no way to change the theme in the app at all.
// The secure layout is what is one viewport tall in the native shell, and its own
// padding lives inside that height. A min-h-screen here as well made the document
// taller than the screen by the top inset, so these screens scrolled a little past
// their content and showed the wrapper padding at the end. The web keeps it: there
// is no such wrapper there, and this is what stops a short page floating.
const ROOT_MIN_HEIGHT = IS_NATIVE_BUILD ? "" : "min-h-screen";

// Appearance is on both platforms now. It was native-only because the only thing
// in it the web lacked was a theme toggle, which the sidebar already had — but the
// background choice has no home in the sidebar and is just as useful in a browser,
// so the section moves out and the one native-only control inside it (List layout)
// is gated on its own.
SETTINGS_SECTIONS.splice(1, 0, {
  id: "appearance",
  title: "Appearance",
  icon: Sun,
  description: "Theme, background and layout",
});

if (IS_NATIVE_BUILD) {
  // Still native only, and for the stronger reason: the browser has nothing to
  // deliver, so a switch there would promise something the web build cannot keep.
  SETTINGS_SECTIONS.splice(2, 0, {
    id: "notifications",
    title: "Notifications",
    icon: Bell,
    description: "Reminders from your tasks",
  });
}

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

/**
 * The List layout control: both options stated inline, one of them selected.
 *
 * It was a bare <select> pinned to the right of the row, which the system renders
 * as a grey box in its own typeface, and then a custom menu that opened under the
 * row. The menu could not work in this position. It was `absolute` inside the
 * Appearance section, and that section sits in two boxes that both clip it: the
 * body is `overflow-hidden` because the expand animates `height: 0 -> auto`, and
 * the card around it is `overflow-hidden` so content keeps to the rounded corners.
 * Both are load-bearing. Appearance is the last block in its card, so the menu
 * opened past the bottom edge and was cut to a sliver — unusable on Android.
 *
 * Two options do not need a popup. Stating both costs about 90px and gets rid of
 * the open state, the Escape handler, the outside-click catcher and the entrance
 * animation, none of which a pair of radio rows needs. It also reads as a pair with
 * the Dark mode toggle directly above, which was always inline.
 */
/**
 * The background picker: three grounds for the theme you are currently in.
 *
 * Only the current theme's three are offered. A dark background says nothing about
 * how the app should look in daylight, and showing six at once asks the user to
 * imagine five of them. The sets are paired — Black with White, Navy with Cool
 * grey, Charcoal with Warm paper — and stored separately, so switching theme keeps
 * whichever ground was chosen for it.
 *
 * Each swatch previews the ramp rather than one colour: the field with a card
 * drawn on it at the real radius and hairline. That is the thing worth showing,
 * because the risk with a chosen background is a card that vanishes into it.
 */
const SurfaceSetting: React.FC<{
  isDark: boolean;
  theme: SurfaceTheme;
  surface: SurfaceChoice;
  onChange: (next: SurfaceChoice) => void;
}> = ({ isDark, theme, surface, onChange }) => (
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
      className="grid grid-cols-3 gap-2.5"
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
              className="flex h-14 items-end rounded-lg p-1.5"
              style={{ backgroundColor: ramp.field }}
              aria-hidden="true"
            >
              <span
                className="h-6 w-full rounded-md border"
                style={{
                  backgroundColor: ramp.card,
                  borderColor: ramp.border,
                }}
              />
            </span>

            <span className="flex items-center justify-between gap-1">
              <span
                className={`truncate text-[13px] font-medium ${
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

    <p className="mt-2 px-1 text-[12px] text-gray-500">
      {isDark
        ? "Applies to dark mode. Light mode keeps its own choice."
        : "Applies to light mode. Dark mode keeps its own choice."}
    </p>
  </div>
);

const LAYOUT_OPTIONS: {
  value: ListLayout;
  label: string;
  hint: string;
  Icon: React.ElementType;
}[] = [
  {
    value: "cards",
    label: "Cards",
    hint: "A three-column grid",
    Icon: LayoutGrid,
  },
  {
    value: "list",
    label: "List",
    hint: "One row each, swipe for actions",
    Icon: Rows3,
  },
];

const ListLayoutSetting: React.FC<{
  isDark: boolean;
  layout: ListLayout | null;
  onChange: (next: ListLayout) => void;
}> = ({ isDark, layout, onChange }) => {
  // `layout` is null only for the frame before the stored value is read, and the
  // default is what it resolves to for anyone who has never opened this.
  const current =
    LAYOUT_OPTIONS.find((option) => option.value === layout) ??
    LAYOUT_OPTIONS[0];

  return (
    <div>
      {/* The group needs a name of its own, now that no row carries one. */}
      <div
        id="list-layout-label"
        className={`mb-2 px-1 font-medium ${isDark ? "text-white" : "text-gray-900"}`}
      >
        List layout
      </div>

      <div
        role="radiogroup"
        aria-labelledby="list-layout-label"
        className={`overflow-hidden rounded-lg border ${
          isDark
            ? "divide-y divide-gray-700 border-[var(--surface-border)] bg-[var(--surface-raised)]"
            : "divide-y divide-gray-200 border-gray-200 bg-white"
        }`}
      >
        {LAYOUT_OPTIONS.map((option) => {
          const isActive = option.value === current.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onChange(option.value)}
              className={`flex min-h-[44px] w-full items-center gap-3 p-4 text-left transition-colors ${
                isActive
                  ? isDark
                    ? "bg-orange-500/15"
                    : "bg-sky-50"
                  : isDark
                    ? "hover:bg-[var(--surface-raised)]"
                    : "hover:bg-gray-50"
              }`}
            >
              <option.Icon
                className={`h-5 w-5 shrink-0 ${
                  isActive
                    ? isDark
                      ? "text-orange-400"
                      : "text-sky-500"
                    : isDark
                      ? "text-gray-400"
                      : "text-gray-500"
                }`}
              />
              <span className="min-w-0 flex-1">
                <span
                  className={`block font-medium ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  {option.label}
                </span>
                <span
                  className={`block text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
                >
                  {option.hint}
                </span>
              </span>
              {/* The tick, not just a tint: colour alone is not a state. */}
              {isActive && (
                <CheckCircle
                  className={`h-4 w-4 shrink-0 ${isDark ? "text-orange-400" : "text-sky-500"}`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
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
  const [activeSection, setActiveSection] = useState<string | null>("profile");
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

  const { theme, toggleTheme, surface, setSurface } = useTheme();
  const { user, logout } = useAuth();
  const isDark = theme === "dark";

  // Sits beside the theme because it answers the same kind of question: how this
  // device draws the app, nothing about the account's data. Native only in
  // practice — the whole Appearance section is.
  const { layout, setLayout } = useListLayout();

  // Also per device rather than per account: a reminder is delivered by the
  // install that holds this, so silencing one phone should not silence another.
  const { prefs: notificationPrefs, setPrefs: setNotificationPrefs } =
    useNotificationPrefs();

  // null only for the frame before the stored value is read, and the default is
  // what it resolves to for anyone who has never opened this.
  const remindersEnabled =
    notificationPrefs?.remindersEnabled ??
    DEFAULT_NOTIFICATION_PREFS.remindersEnabled;

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

      setUserProfile((prev) =>
        prev ? { ...prev, full_name: fullName.trim() } : null,
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
          window.location.href = logoutRedirectUrl(isNativeApp());
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
              className={`flex items-center justify-between rounded-lg border p-4 ${
                isDark
                  ? "border-[var(--surface-border)] bg-[var(--surface-raised)]"
                  : "border-gray-200 bg-white"
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
            />

            {/* Native only. The web dashboard has its own layout and nothing to
                switch between, so offering the choice there would promise
                something the browser build cannot keep — the same reasoning that
                kept Notifications off the web. */}
            {IS_NATIVE_BUILD && (
              <ListLayoutSetting
                isDark={isDark}
                layout={layout}
                onChange={setLayout}
              />
            )}
          </motion.div>
        );

      case "notifications":
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
                Notifications
              </h2>
              <p
                className={`mt-1 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                Choose what List It interrupts you for on this device.
              </p>
            </div>

            {/* The note belongs to the row, so it sits closer to it than the
                sections are to each other. */}
            <div className="space-y-3">
              <div
                className={`flex items-center justify-between rounded-lg border p-4 ${
                  isDark
                    ? "border-[var(--surface-border)] bg-[var(--surface-raised)]"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Bell
                    className={`h-5 w-5 ${isDark ? "text-orange-400" : "text-sky-500"}`}
                  />
                  <div>
                    <div
                      className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      Task reminders
                    </div>
                    <div
                      className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
                    >
                      {remindersEnabled ? "On" : "Off"}
                    </div>
                  </div>
                </div>

                {/* The pill is 28px tall, which is well under what a thumb
                    needs. The button is the full 44 and the pill is drawn
                    inside it, so the row looks the same as the Dark mode one
                    and the target is the size it should always have been. */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={remindersEnabled}
                  aria-label="Toggle task reminders"
                  onClick={() => {
                    const next = !remindersEnabled;
                    setNotificationPrefs({ remindersEnabled: next });

                    // The one place in Settings allowed to ask. Scheduling itself
                    // only ever checks, because it runs again on every resume and
                    // a prompt there traps anyone who dismisses it. Turning this
                    // on is an explicit request to be notified, so it is the right
                    // moment to ask the OS.
                    if (next) void ensureNotificationPermission();
                  }}
                  className="flex h-11 w-12 shrink-0 items-center"
                >
                  <span
                    className={`relative block h-7 w-12 rounded-full transition-colors duration-200 ${
                      remindersEnabled
                        ? isDark
                          ? "bg-orange-500"
                          : "bg-sky-500"
                        : "bg-gray-300"
                    }`}
                  >
                    <span
                      // `left-0` anchors the knob to the track. Without it the
                      // knob takes its static position at the end of the span
                      // and the translate then pushes it clean outside the pill.
                      className={`absolute left-0 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                        remindersEnabled
                          ? "translate-x-[26px]"
                          : "translate-x-1"
                      }`}
                    />
                  </span>
                </button>
              </div>

              <p
                className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
              >
                Turning this off keeps every reminder you have set, it just
                stops them being delivered. Reminders arrive through the mobile
                app, so this covers this device only.
              </p>
            </div>
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
                className={`overflow-hidden rounded-2xl border ${
                  isDark
                    ? "border-white/[0.08] bg-[var(--surface-card)]"
                    : "border-black/[0.06] bg-white"
                }`}
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

          {/* Feedback. Outside the sections for the same reason Sign out is: it
              is a way out of the app, not a preference.

              A plain anchor rather than the Browser plugin. capacitor.config.ts
              sets no `allowNavigation` allowlist, so the WebView hands any
              off-origin URL to the system browser — which is what we want, since
              a Google Form opened inside the shell would trap the user on a page
              with no address bar and no way back. `rel` is set because the form
              opens in a context that could otherwise reach back through
              `window.opener`. */}
          <a
            href="https://forms.gle/dE21epzC4L8Tx1Kd9"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex min-h-[56px] w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left ${
              isDark
                ? "border-white/[0.08] bg-[var(--surface-card)]"
                : "border-black/[0.06] bg-white"
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

          {/* Sign out. On the web this lives in the sidebar, which the native
              app does not have — without it there is no way to leave the account
              on Android. Outside the sections because it is not a setting. */}
          {IS_NATIVE_BUILD && (
            <button
              type="button"
              onClick={logout}
              className={`flex min-h-[56px] w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left ${
                isDark
                  ? "border-white/[0.08] bg-[var(--surface-card)] text-orange-300"
                  : "border-black/[0.06] bg-white text-orange-600"
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
          )}
        </div>
      </div>

      {/* Notification */}
      <Notification notification={notification} onClose={hideNotification} />
    </main>
  );
}
