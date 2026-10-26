"use client";

// The public privacy policy page.
//
// This is the URL given to Google Play Console under App content → Privacy
// policy, so three things about it are load-bearing:
//
//   * it sits in (public), outside the auth guard and outside middleware's
//     protectedRoutes, because Play requires the policy be readable by anyone
//     without signing in — a reviewer will open it signed out;
//   * it must stay at /privacy, because that path is typed into the Console and
//     into the store listing and changing it breaks both;
//   * the text comes from PolicyDocument, the same component the sign-up
//     consent sheet and Settings render, so the published policy and the
//     in-app one can never drift apart.
//
// Laid out to match /data-deletion — the two are a pair, reached from the same
// footer, and a reviewer going from one to the other should not feel the seam.

import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { IS_NATIVE_BUILD } from "@/lib/platform";
import PolicyDocument from "@/components/legal/PolicyDocument";

export default function PrivacyPolicyPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      className={`min-h-screen w-full px-4 py-12 ${
        isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
      // Two different things are being cleared at the top, depending on where
      // this renders.
      //
      // On the web, PublicLayout puts TopNavigation above it — `fixed top-0`,
      // 4rem tall, so it sits over the page rather than pushing it down. 3rem of
      // padding left the heading tucked under the bar at scroll-top, which is
      // the first thing anyone opening the policy URL would see. 4rem clears the
      // bar, 3rem is the breathing room the rest of the page uses: 7rem, which
      // is also what /landingpage's pt-28 comes to.
      //
      // In the app there is no top bar — PublicLayout omits it on native — so
      // what has to be cleared is the status bar instead, via the safe-area
      // variable. env() resolves to 0 in a browser, hence max() rather than a
      // sum: the two cases never apply at once.
      style={{
        paddingTop: IS_NATIVE_BUILD ? "max(3rem, var(--safe-top))" : "7rem",
        paddingBottom: "max(3rem, var(--safe-bottom))",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto w-full max-w-2xl"
      >
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p
          className={`mt-2 mb-7 text-sm ${
            isDark ? "text-gray-400" : "text-gray-600"
          }`}
        >
          How List It handles your information — what we collect, why, and how
          to get rid of it.
        </p>

        <div
          className={`rounded-xl border p-5 sm:p-6 ${
            isDark
              ? "border-gray-700 bg-gray-800/60"
              : "border-gray-200 bg-white"
          }`}
        >
          <PolicyDocument isDark={isDark} />
        </div>
      </motion.div>
    </div>
  );
}
