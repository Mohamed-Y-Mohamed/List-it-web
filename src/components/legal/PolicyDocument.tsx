"use client";

// The privacy policy, as one component.
//
// It is the single source for three surfaces, which is the whole point of it
// living here rather than in a page:
//
//   * /privacy — the standalone public page. This is the URL Google Play
//     Console points at, so it must stay publicly reachable without signing in.
//   * PolicyModal on the sign-up screen — what the consent checkbox links to.
//   * PolicyModal in Settings — the copy a signed-in user goes back to.
//
// Three copies of a legal document is three documents that will disagree, and a
// policy that disagrees with itself is worse than no policy: Play's reviewers
// compare the policy against the Data safety form against what the build
// actually does, and a mismatch is the most common cause of enforcement.
//
// EVERY CLAIM BELOW IS CHECKED AGAINST THE CODE. If you change what the app
// collects, this file changes in the same commit, and so does the Data safety
// form in Play Console. The specific things it asserts, and where they are true:
//
//   full_name / email          auth/callback/route.ts insert, api/user/profile
//   password never stored by us Supabase Auth holds the hash; nothing here reads it
//   lists/collections/tasks/notes  the four tables api/delete-account cascades
//   reminder + appearance prefs are device-local  lib/notificationPrefs.ts and the
//                              no-flash script in layout.tsx both use localStorage
//   no analytics in the app    scripts/build-native.mjs pins NEXT_PUBLIC_GA_ID=""
//   deletion is immediate      api/delete-account deletes auth user, then rows
//
// No chrome of its own — no page background, no max-width, no heading above the
// title. The page and the modal each supply their own container, because one is
// a document on a field and the other is a sheet over the app.

import React from "react";
import Link from "next/link";
import { appPath } from "@/lib/routes";
import { CONTACT_EMAIL, CONTACT_MAILTO } from "@/lib/contact";

/** Shown on the page and in the modal, so the two cannot date differently. */
export const POLICY_LAST_UPDATED = "26 October 2026";

function Section({
  n,
  title,
  isDark,
  children,
}: {
  n: number;
  title: string;
  isDark: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-7 first:mt-0">
      <h2
        className={`text-[17px] font-semibold ${
          isDark ? "text-white" : "text-gray-900"
        }`}
      >
        <span className={isDark ? "text-orange-400" : "text-sky-600"}>
          {n}.
        </span>{" "}
        {title}
      </h2>
      <div
        className={`mt-2 space-y-3 text-[14px] leading-relaxed ${
          isDark ? "text-gray-300" : "text-gray-700"
        }`}
      >
        {children}
      </div>
    </section>
  );
}

function Bullets({ items, isDark }: { items: React.ReactNode[]; isDark: boolean }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5">
          <span
            aria-hidden="true"
            className={`mt-[0.55em] h-[5px] w-[5px] shrink-0 rounded-full ${
              isDark ? "bg-orange-400/70" : "bg-sky-500/70"
            }`}
          />
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function PolicyDocument({ isDark }: { isDark: boolean }) {
  const strong = isDark ? "text-white" : "text-gray-900";
  const link = isDark
    ? "text-orange-400 underline underline-offset-2"
    : "text-sky-600 underline underline-offset-2";

  return (
    <div>
      {/* The short version. Most people will read this and nothing else, so it
          has to be true on its own rather than a teaser for the detail below. */}
      <div
        className={`rounded-xl border p-4 ${
          isDark
            ? "border-white/[0.08] bg-white/[0.03]"
            : "border-black/[0.06] bg-black/[0.02]"
        }`}
      >
        <p
          className={`text-[13px] font-semibold uppercase tracking-wide ${
            isDark ? "text-orange-400" : "text-sky-600"
          }`}
        >
          The short version
        </p>
        <p
          className={`mt-2 text-[14px] leading-relaxed ${
            isDark ? "text-gray-200" : "text-gray-700"
          }`}
        >
          We ask for the bare minimum needed to run your account: your name,
          your email address, and whatever you choose to put in your lists. It
          is stored securely, it is never sold, and there is no advertising or
          tracking inside the app. You can delete all of it yourself, at any
          time, and it goes immediately.
        </p>
      </div>

      <p
        className={`mt-5 text-[13px] ${isDark ? "text-gray-500" : "text-gray-500"}`}
      >
        Last updated {POLICY_LAST_UPDATED}
      </p>

      <Section n={1} title="Who we are" isDark={isDark}>
        <p>
          List It is a task and note app for Android, iOS and the web. This
          policy covers all three and explains what we do with your
          information, why, and what you can tell us to do about it.
        </p>
        <p>
          For anything in this policy — a question, a correction, or a request
          about your data — email{" "}
          <a href={CONTACT_MAILTO} className={link}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </Section>

      <Section n={2} title="What we collect, and why" isDark={isDark}>
        <p>Only what the app needs to work:</p>
        <Bullets
          isDark={isDark}
          items={[
            <>
              <span className={strong}>Your name and email address.</span> Given
              when you register. The email identifies your account, verifies it,
              and is how a password reset reaches you.
            </>,
            <>
              <span className={strong}>Your password.</span> Handled by our
              authentication provider, which stores only a one-way hash of it.
              We never see it, and neither does anyone here.
            </>,
            <>
              <span className={strong}>What you put in the app.</span> Your
              lists, collections, tasks and notes, along with their dates and
              colours. This is the content the app exists to store, and it is
              yours.
            </>,
            <>
              <span className={strong}>Basic technical records.</span> Our
              hosting and database providers log IP addresses and request
              details, as any web service does, to keep the service running and
              to spot abuse.
            </>,
            <>
              <span className={strong}>If you sign in with Google</span> (iOS
              only), Google tells us your name and email address so we can
              create your account. Nothing else.
            </>,
          ]}
        />
      </Section>

      <Section n={3} title="What we do not collect" isDark={isDark}>
        <p>
          Stated plainly, because &ldquo;bare minimum&rdquo; should mean
          something:
        </p>
        <Bullets
          isDark={isDark}
          items={[
            "No phone number. The app has no field for one.",
            "No contacts, photos, files, calendar or location data.",
            "No advertising identifier, and no advertising of any kind.",
            "No analytics or tracking SDK inside the Android or iOS app.",
            "We do not sell your data, and we do not share it for advertising.",
          ]}
        />
        <p>
          Your reminder settings and your choice of theme and background never
          leave your device at all — they are stored by the app locally, not on
          our servers.
        </p>
      </Section>

      <Section n={4} title="Where it is kept, and who can touch it" isDark={isDark}>
        <p>
          Your account and content live in a database run by{" "}
          <span className={strong}>Supabase</span>, which provides our database
          and sign-in. The website and the app&rsquo;s API are hosted by{" "}
          <span className={strong}>Netlify</span>. They process this data on our
          instructions and for no purpose of their own.
        </p>
        <p>
          Everything travels over an encrypted HTTPS connection and is encrypted
          at rest by the database provider. Access is restricted to your own
          account: the app&rsquo;s interfaces check who you are on every request
          before returning or changing anything.
        </p>
      </Section>

      <Section n={5} title="Analytics on the website" isDark={isDark}>
        <p>
          The <span className={strong}>website</span> uses Google Analytics to
          count visits and see which pages are read. It sets cookies and records
          an approximate location derived from your IP address. You can block it
          with any ad or tracker blocker, or by refusing cookies in your
          browser.
        </p>
        <p>
          The <span className={strong}>Android and iOS apps contain no
          analytics at all.</span> Nothing you do inside the app is measured or
          reported anywhere.
        </p>
      </Section>

      <Section n={6} title="How long we keep it, and how to delete it" isDark={isDark}>
        <p>
          We keep your account and its content for as long as the account
          exists. There is no archive of deleted accounts.
        </p>
        <Bullets
          isDark={isDark}
          items={[
            <>
              <span className={strong}>Delete it yourself, immediately.</span>{" "}
              Settings → Account → Delete Account. Your sign-in, your profile and
              every list, collection, task and note are removed there and then.
            </>,
            <>
              <span className={strong}>Can&rsquo;t sign in?</span> Ask us at{" "}
              <Link href={appPath("/data-deletion")} className={link}>
                our deletion page
              </Link>{" "}
              or by email, and we will delete it within 30 days and confirm when
              it is done.
            </>,
          ]}
        />
        <p>Deletion is permanent. It cannot be undone, by you or by us.</p>
      </Section>

      <Section n={7} title="Your rights" isDark={isDark}>
        <p>
          Under UK and EU data protection law you can ask us to give you a copy
          of your data, correct it, delete it, hand it over in a portable form,
          or stop using it in a particular way. Most of this you can simply do
          in the app; for the rest, email{" "}
          <a href={CONTACT_MAILTO} className={link}>
            {CONTACT_EMAIL}
          </a>{" "}
          and we will answer within 30 days.
        </p>
        <p>
          We handle your data because we need it to provide the service you
          asked for, and — for website analytics — on the basis of consent you
          can withdraw. If you think we have got something wrong, you are
          entitled to complain to the UK Information Commissioner&rsquo;s Office
          at{" "}
          <a
            href="https://ico.org.uk/make-a-complaint/"
            target="_blank"
            rel="noopener noreferrer"
            className={link}
          >
            ico.org.uk
          </a>
          , though we would rather you told us first.
        </p>
      </Section>

      <Section n={8} title="Children" isDark={isDark}>
        <p>
          List It is not intended for anyone under 16, and we do not knowingly
          collect information from them. If you believe a child has created an
          account, email us and we will remove it.
        </p>
      </Section>

      <Section n={9} title="The service, and the limits of it" isDark={isDark}>
        <p>
          List It is provided as it is. We work to keep it available and to keep
          your data safe, but we cannot promise the service will be
          uninterrupted, error-free, or permanently available, and no software
          or storage is immune to failure.
        </p>
        <p>
          <span className={strong}>
            Keep your own copy of anything you cannot afford to lose.
          </span>{" "}
          List It is a place to organise your work, not a backup service or a
          system of record. To the fullest extent the law allows, we are not
          liable for loss or corruption of data, for lost profits, or for any
          indirect or consequential loss arising from your use of the app.
        </p>
        <p>
          Nothing in this policy limits anything that cannot lawfully be
          limited, including your rights as a consumer and our liability for
          death or personal injury caused by negligence, or for fraud.
        </p>
      </Section>

      <Section n={10} title="Agreeing to this" isDark={isDark}>
        <p>
          Creating a List It account means you accept this policy, including
          section 9. If you do not accept it, please do not create an account —
          and if you have one already, you can delete it at any time as
          described in section 6.
        </p>
      </Section>

      <Section n={11} title="Changes" isDark={isDark}>
        <p>
          If this policy changes in a way that matters, we will update the date
          at the top and, where the change is significant, tell you in the app
          or by email. Continuing to use List It after a change means you accept
          the updated policy.
        </p>
      </Section>
    </div>
  );
}
