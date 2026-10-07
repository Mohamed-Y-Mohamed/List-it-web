"use client";

// Wires the web app into the Android shell: dismisses the native splash, keeps
// the status bar in step with the in-app theme, and makes the hardware back
// button behave the way Android users expect.
//
// Renders nothing, and every effect is a no-op off-native, so mounting it in the
// root layout has no effect on the web app.

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { App as CapacitorApp } from "@capacitor/app";
import { Keyboard } from "@capacitor/keyboard";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { LocalNotifications } from "@capacitor/local-notifications";
import { useTheme } from "@/context/ThemeContext";
import { useIsNative } from "@/hooks/useIsNative";
import { appPath, listHref } from "@/lib/routes";
import { HOME_TAB_PATH, isTabRoot } from "./navTabs";

export default function NativeShell() {
  const isNative = useIsNative();
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  // The back handler needs the current location but must not be torn down and
  // rebuilt on every navigation, so it reads the path from here instead of
  // closing over it.
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

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
  //
  // This is safe only because PWAProvider seeds `showSplash` from IS_NATIVE_BUILD,
  // so the web splash is in the same commit as this component and has therefore
  // painted by the time a passive effect runs. It used to be switched on in an
  // effect of its own, and since effects run child-first this call landed a frame
  // early and uncovered an empty document. **If that initial state ever goes back
  // to `false`, this hand-off breaks again.**
  useEffect(() => {
    if (!isNative) return;
    SplashScreen.hide().catch(() => {
      // Nothing useful to do if it is already hidden.
    });
  }, [isNative]);

  // Keep the status bar icons matched to the active theme.
  //
  // Only the style, not a background colour. The WebView now draws behind the
  // status bar, so the band under it is painted by globals.css — which follows
  // the in-app theme already. Setting a colour here as well would put an opaque
  // platform bar back on top of the page and undo the edge-to-edge layout.
  useEffect(() => {
    if (!isNative) return;
    const isDark = theme === "dark";

    // Style.Dark means light text on a dark background, and vice versa.
    StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light }).catch(
      () => {}
    );
  }, [isNative, theme]);

  // Android's back button should retrace navigation and only leave the app from
  // the first tab. Without this the default is to close the app on the first
  // press, which feels broken inside a multi-screen app.
  //
  // Tabs are peers rather than a stack, so a tab root cannot be treated as
  // somewhere to rewind from: pressing back on Settings must go to Lists, not to
  // whichever tab happened to be open beforehand. Only Lists exits, which is the
  // convention every Android app with a tab bar follows.
  useEffect(() => {
    if (!isNative) return;

    const listener = CapacitorApp.addListener("backButton", ({ canGoBack }) => {
      const path = pathnameRef.current;

      if (isTabRoot(path)) {
        if (path.replace(/\/+$/, "") === HOME_TAB_PATH) {
          CapacitorApp.exitApp();
        } else {
          router.replace(appPath(HOME_TAB_PATH));
        }
        return;
      }

      if (canGoBack) {
        router.back();
      } else {
        CapacitorApp.exitApp();
      }
    });

    return () => {
      listener.then((handle) => handle.remove()).catch(() => {});
    };
    // Deliberately not depending on the pathname: it is read through a ref so the
    // listener registers once. Re-registering on every navigation would leave a
    // window with no handler attached, during which a back press closes the app.
  }, [isNative, router]);

  // Tapping a reminder opens the list the task lives in.
  //
  // This used to push /today unconditionally, which was right when there was one
  // notification a day summarising everything due: there was no single task to
  // open. A reminder now belongs to one task, and landing on a screen that may
  // not even contain it is a dead end. syncTaskReminders puts the ids in `extra`
  // for exactly this.
  //
  // Falls back to Today when the payload is missing — an older notification
  // scheduled before this shipped, or one whose list has since been deleted.
  useEffect(() => {
    if (!isNative) return;

    const listener = LocalNotifications.addListener(
      "localNotificationActionPerformed",
      (event) => {
        const extra = event.notification?.extra as
          | { listId?: string | null; taskId?: string | null }
          | undefined;

        if (!extra?.listId) {
          router.push(appPath("/today"));
          return;
        }

        // Straight to the task's own view, not just the list it lives on.
        //
        // The detail sheet has no route — its open state lives inside the task
        // card — so the task id rides along as a query param and the collection
        // holding that row opens it on arrival. See `?task=` in Collection.
        const href = listHref(extra.listId, true);
        router.push(
          extra.taskId
            ? `${href}&task=${encodeURIComponent(extra.taskId)}`
            : href
        );
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
