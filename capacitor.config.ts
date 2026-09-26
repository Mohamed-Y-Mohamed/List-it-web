import type { CapacitorConfig } from "@capacitor/cli";
import { KeyboardResize } from "@capacitor/keyboard";

// The Android shell around the static export in `out/`.
//
// Build the bundle with `npm run build:native`, then `npm run android:sync` to
// copy it into the native project. The iOS app is a separate SwiftUI codebase and
// is not managed from here.
const config: CapacitorConfig = {
  // iOS uses com.abdul.List-It, but an Android applicationId cannot contain a
  // hyphen, so the closest valid equivalent is used instead.
  appId: "com.abdul.listit",
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
      backgroundColor: "#4f46e5",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },

    StatusBar: {
      // Set at runtime to follow the in-app theme; see NativeShell.
      overlaysWebView: false,
      backgroundColor: "#4f46e5",
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
