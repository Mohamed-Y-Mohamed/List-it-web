import type { CapacitorConfig } from "@capacitor/cli";
import { KeyboardResize } from "@capacitor/keyboard";

// The Android shell around the static export in `out/`.
//
// Build the bundle with `npm run build:native`, then `npm run android:sync` to
// copy it into the native project. The iOS app is a separate SwiftUI codebase and
// is not managed from here.
const config: CapacitorConfig = {
  // Fixed permanently once the app is first uploaded: Play ties the store
  // listing to the applicationId and it can never be changed afterwards.
  // Deliberately not mirroring the iOS bundle id (com.abdul.List-It), which is
  // not a legal Android package name anyway because of the hyphen.
  appId: "com.list_it.app",
  appName: "List It",
  webDir: "out",

  server: {
    // Serve the bundle from https://localhost rather than a custom scheme. That
    // keeps the WebView a secure context — required for crypto.subtle, which the
    // Supabase client relies on — and fixes the origin that src/lib/cors.ts
    // allowlists. This is Capacitor's default, but it is set explicitly because
    // the API's CORS policy depends on it.
    androidScheme: "https",
  },

  android: {
    // Everything the app loads is either bundled or fetched over HTTPS.
    //
    // The exception is local end-to-end testing: the bundle is served from
    // https://localhost, so calling a plain-HTTP dev server on the host
    // (http://10.0.2.2:3000) counts as mixed content and the WebView blocks it.
    // `CAP_LOCAL_API=1 npm run android:local` opts into that for a debug build
    // only. It is never set for a release build — see scripts/build-native.mjs.
    allowMixedContent: process.env.CAP_LOCAL_API === "1",
  },

  plugins: {
    SplashScreen: {
      // The web app draws its own splash (SplashScreen.tsx) as soon as React
      // mounts. The native splash only needs to cover the gap before that, so it
      // hides as soon as the bundle is ready rather than on a fixed timer —
      // otherwise the user sees two splash screens in a row.
      launchAutoHide: false,
      // The light-mode field, matching @color/splashBackground. The launch splash
      // itself is drawn from the theme, which has a values-night override; this
      // only applies if something calls SplashScreen.show() by hand, and nothing
      // does.
      backgroundColor: "#ffffff",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },

    StatusBar: {
      // The WebView draws behind the system bars.
      //
      // This was false, which kept the WebView inside them and left the platform
      // painting both bands itself. Measured consequence: a 77px strip of
      // #FAFAFA under the tab bar and matching strips framing the sign-in
      // screen, in a colour the app never uses — and, because the WebView was
      // inset, env(safe-area-inset-*) resolved to 0, so every safe-area rule in
      // globals.css was silently doing nothing. The status-bar band, the
      // pt-safe-top headers and the tab bar's own bottom inset were all written
      // for edge-to-edge and only work now that they get real values.
      //
      // Android 15+ forces this anyway; setting it explicitly means older
      // versions behave the same rather than only some of the fleet being
      // edge-to-edge.
      overlaysWebView: true,
      // "LIGHT" means dark text for a light background — the pairing the app's
      // white surface needs. NativeShell flips it to "DARK" with the in-app
      // theme. No backgroundColor: with the WebView behind it, the bar is
      // transparent and the CSS band in globals.css is what shows through.
      style: "LIGHT",
    },

    Keyboard: {
      // Resize the document rather than the viewport so the sticky nav and any
      // open sheet stay anchored when the keyboard appears.
      resize: KeyboardResize.Body,
      resizeOnFullScreen: true,
    },
  },
};

export default config;
