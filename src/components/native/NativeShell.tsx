"use client";

// Wires the web app into the Android shell: dismisses the native splash, keeps
// the status bar in step with the in-app theme, and makes the hardware back
// button behave the way Android users expect.
//
// Renders nothing, and every effect is a no-op off-native, so mounting it in the
// root layout has no effect on the web app.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { App as CapacitorApp } from "@capacitor/app";
import { Keyboard } from "@capacitor/keyboard";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { LocalNotifications } from "@capacitor/local-notifications";
import { useTheme } from "@/context/ThemeContext";
import { useIsNative } from "@/hooks/useIsNative";
import { appPath } from "@/lib/routes";

// Matches the app's own surfaces: white in light mode, gray-900 in dark mode.
const STATUS_BAR_BACKGROUND = { light: "#ffffff", dark: "#111827" } as const;

export default function NativeShell() {
  const isNative = useIsNative();
  const { theme } = useTheme();
  const router = useRouter();

  // Tag the document so the native-only CSS in globals.css applies. Doing it from
  // here rather than server-side keeps the web HTML identical.
  useEffect(() => {
    if (!isNative) return;
    const root = document.documentElement;
    root.classList.add("capacitor-native");
    return () => root.classList.remove("capacitor-native");
  }, [isNative]);

  // Dismiss the native splash once React has painted. `launchAutoHide` is off in
  // capacitor.config.ts so that this hand-off is explicit — otherwise the native
  // splash can disappear before the web splash draws and the user sees a flash of
  // blank white between them.
  useEffect(() => {
    if (!isNative) return;
    SplashScreen.hide().catch(() => {
      // Nothing useful to do if it is already hidden.
    });
  }, [isNative]);

  // Keep the status bar matched to the active theme.
  useEffect(() => {
    if (!isNative) return;
    const isDark = theme === "dark";

    // Style.Dark means light text on a dark background, and vice versa.
    StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light }).catch(
      () => {}
    );
    StatusBar.setBackgroundColor({
      color: isDark ? STATUS_BAR_BACKGROUND.dark : STATUS_BAR_BACKGROUND.light,
    }).catch(() => {});
  }, [isNative, theme]);

  // Android's back button should retrace navigation and only leave the app from
  // the root. Without this the default is to close the app on the first press,
  // which feels broken inside a multi-screen app.
  useEffect(() => {
    if (!isNative) return;

    const listener = CapacitorApp.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) {
        router.back();
      } else {
        CapacitorApp.exitApp();
      }
    });

    return () => {
      listener.then((handle) => handle.remove()).catch(() => {});
    };
  }, [isNative, router]);

  // Tapping the due-today reminder opens the Today view, which is the list of
  // exactly what the notification was about. The notification is a summary, so
  // there is no single task to open.
  useEffect(() => {
    if (!isNative) return;

    const listener = LocalNotifications.addListener(
      "localNotificationActionPerformed",
      () => {
        router.push(appPath("/today"));
      }
    );

    return () => {
      listener.then((handle) => handle.remove()).catch(() => {});
    };
  }, [isNative, router]);

  // Expose the keyboard height as a CSS variable so sheets and sticky footers can
  // lift clear of it; see `--keyboard-offset` in globals.css.
  useEffect(() => {
    if (!isNative) return;

    const setOffset = (px: number) => {
      document.documentElement.style.setProperty("--keyboard-offset", `${px}px`);
    };

    const shown = Keyboard.addListener("keyboardWillShow", (info) => {
      setOffset(info.keyboardHeight);
    });
    const hidden = Keyboard.addListener("keyboardWillHide", () => setOffset(0));

    return () => {
      shown.then((handle) => handle.remove()).catch(() => {});
      hidden.then((handle) => handle.remove()).catch(() => {});
      setOffset(0);
    };
  }, [isNative]);

  return null;
}
