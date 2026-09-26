import type { NextConfig } from "next";

// The same source tree produces two builds:
//
//   * default (BUILD_TARGET unset) — the web app, served by Next.js. Route
//     handlers, middleware and image optimisation all run. Unchanged.
//   * BUILD_TARGET=native          — a static export bundled into the Android app
//     by Capacitor. There is no Node server inside the WebView, so this build
//     drops everything that needs one.
//
// Run the native build with `npm run build:native`.
const isNativeBuild = process.env.BUILD_TARGET === "native";

const webConfig: NextConfig = {
  async redirects() {
    return [
      // Redirect old verification path to new path
      {
        source: "/auth/verification",
        destination: "/verification",
        permanent: true,
      },
    ];
  },
};

const nativeConfig: NextConfig = {
  // Emit plain HTML/CSS/JS into `out/` for Capacitor to bundle.
  output: "export",

  // Capacitor serves the bundle off the filesystem, where `/login` is really
  // `/login/index.html`. Trailing slashes keep those paths resolvable without a
  // server to rewrite them.
  trailingSlash: true,

  // The optimiser is a server route, which this build does not have.
  images: { unoptimized: true },

  // `redirects` is deliberately absent: static export does not support it. The
  // only redirect is a legacy verification path that the app never links to.
};

export default (isNativeBuild ? nativeConfig : webConfig) satisfies NextConfig;
