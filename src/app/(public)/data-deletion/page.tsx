"use client";

// Public account and data deletion request page.
//
// Google Play requires a publicly reachable URL where anyone can request deletion
// of their account and data without signing in, so this route sits in (public)
// and is deliberately outside the auth guard and outside middleware's
// protectedRoutes. Do not move it.
//
// Submissions go to Netlify Forms. Netlify registers a form by parsing the HTML
// it receives at deploy time, which never includes React output — so the form is
// also declared statically in public/__forms.html. Keep the field names in the
// two files identical.

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle,
  Mail,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { IS_NATIVE_BUILD } from "@/lib/platform";

const FORM_NAME = "account-deletion";

// What the app removes, shown on the page so the commitment is explicit.
const DELETED_DATA = [
  "Your account and sign-in credentials",
  "All lists, collections, tasks and notes",
  "Your profile name and email address",
];

export default function DataDeletionPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("sending");
    setErrorMessage("");

    const form = event.currentTarget;
    const body = new URLSearchParams(
      new FormData(form) as unknown as Record<string, string>,
    ).toString();

    try {
      // Netlify accepts form posts at any path on the site; posting to the page
      // itself keeps it same-origin. The body must be url-encoded and carry
      // `form-name`, or Netlify cannot route it to the right form.
      const response = await fetch("/data-deletion/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });

      if (!response.ok) throw new Error(`Request failed (${response.status})`);
      setStatus("sent");
      form.reset();
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong",
      );
    }
  };

  const card = isDark
    ? "bg-gray-800/60 border-gray-700"
    : "bg-white border-gray-200";
  const field = isDark
    ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500"
    : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400";

  return (
    <div
      className={`min-h-screen w-full px-4 py-12 ${
        isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto w-full max-w-2xl space-y-6"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Delete your List It account and data
          </h1>
          <p
            className={`mt-2 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            You can remove your account yourself, or ask us to do it for you. No
            sign-in is needed to send a request from this page.
          </p>
        </div>

        {/* Self-service first: it is immediate and needs no human in the loop. */}
        <section className={`rounded-xl border p-5 ${card}`}>
          <div className="flex items-start gap-3">
            <ShieldCheck
              className={`mt-0.5 h-5 w-5 flex-shrink-0 ${isDark ? "text-green-400" : "text-green-600"}`}
            />
            <div>
              <h2 className="font-semibold">
                Fastest: delete it yourself, straight away
              </h2>
              <p
                className={`mt-1 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                In the app, open{" "}
                <strong>Settings → Account → Delete Account</strong>. Your
                account and everything in it are removed immediately — you will
                not have to wait for anyone to process a request.
              </p>
              <Link
                href="/login"
                className={`mt-3 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
                  isDark
                    ? "bg-orange-500 text-white hover:bg-orange-600"
                    : "bg-sky-500 text-white hover:bg-sky-600"
                }`}
              >
                <Trash2 className="h-4 w-4" />
                Sign in to delete your account
              </Link>
            </div>
          </div>
        </section>

        {/* Fallback for anyone who cannot get into their account. */}
        <section className={`rounded-xl border p-5 ${card}`}>
          <div className="flex items-start gap-3">
            <Mail
              className={`mt-0.5 h-5 w-5 flex-shrink-0 ${isDark ? "text-orange-400" : "text-sky-600"}`}
            />
            <div className="w-full">
              <h2 className="font-semibold">
                Can&apos;t sign in? Ask us instead
              </h2>
              <p
                className={`mt-1 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                Send the email address on the account and we will delete it
                within 30 days. We will email you when it is done.
              </p>

              {IS_NATIVE_BUILD ? (
                // The app is served from https://localhost inside a WebView, so a
                // form post cannot reach the site's form handler. Hand off to the
                // browser, where the request is same-origin and works.
                <a
                  href="https://list-it-dom.netlify.app/data-deletion"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
                    isDark
                      ? "bg-gray-700 text-white hover:bg-gray-600"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                  }`}
                >
                  Open the request form
                </a>
              ) : status === "sent" ? (
                <div
                  className={`mt-4 flex items-start gap-2 rounded-lg p-3 text-sm ${
                    isDark
                      ? "bg-green-900/30 text-green-300"
                      : "bg-green-50 text-green-800"
                  }`}
                >
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>
                    Request received. We will confirm by email once your account
                    has been deleted.
                  </span>
                </div>
              ) : (
                <form
                  name={FORM_NAME}
                  method="POST"
                  data-netlify="true"
                  netlify-honeypot="bot-field"
                  onSubmit={handleSubmit}
                  className="mt-4 space-y-3"
                >
                  {/* Netlify routes the submission by this value. */}
                  <input type="hidden" name="form-name" value={FORM_NAME} />

                  {/* Honeypot: hidden from people, filled in by bots. */}
                  <p className="hidden">
                    <label>
                      Leave this field empty
                      <input
                        name="bot-field"
                        tabIndex={-1}
                        autoComplete="off"
                      />
                    </label>
                  </p>

                  <div>
                    <label htmlFor="email" className="text-sm font-medium">
                      Account email <span aria-hidden="true">*</span>
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="you@example.com"
                      className={`mt-1 w-full rounded-lg border px-3 py-2 text-base outline-none focus:ring-2 focus:ring-sky-500 ${field}`}
                    />
                  </div>

                  <div>
                    <label htmlFor="full_name" className="text-sm font-medium">
                      Name on the account
                    </label>
                    <input
                      id="full_name"
                      name="full_name"
                      type="text"
                      autoComplete="name"
                      className={`mt-1 w-full rounded-lg border px-3 py-2 text-base outline-none focus:ring-2 focus:ring-sky-500 ${field}`}
                    />
                  </div>

                  <div>
                    <label htmlFor="reason" className="text-sm font-medium">
                      Anything we should know (optional)
                    </label>
                    <textarea
                      id="reason"
                      name="reason"
                      rows={3}
                      className={`mt-1 w-full rounded-lg border px-3 py-2 text-base outline-none focus:ring-2 focus:ring-sky-500 ${field}`}
                    />
                  </div>

                  {status === "error" && (
                    <div
                      className={`flex items-start gap-2 rounded-lg p-3 text-sm ${
                        isDark
                          ? "bg-red-900/30 text-red-300"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      <span>
                        Could not send your request ({errorMessage}). Please
                        email us instead.
                      </span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60 ${
                      isDark
                        ? "bg-orange-500 hover:bg-orange-600"
                        : "bg-sky-500 hover:bg-sky-600"
                    }`}
                  >
                    {status === "sending" ? "Sending…" : "Request deletion"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        <section className={`rounded-xl border p-5 ${card}`}>
          <h2 className="font-semibold">What gets deleted</h2>
          <ul
            className={`mt-2 list-inside list-disc space-y-1 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            {DELETED_DATA.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p
            className={`mt-3 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            Deletion is permanent and cannot be undone. Requests sent from this
            page are actioned within 30 days; deleting from inside the app is
            immediate. We keep no backups of deleted accounts beyond that
            window.
          </p>
        </section>
      </motion.div>
    </div>
  );
}
