// lib/contact.ts
// The address users are told to write to, in one place.
//
// It appears on the privacy policy (twice), the account-deletion page and the
// email-verification screen. It was typed by hand in the last of those and had
// already gone wrong: it pointed at support@listit.com, a domain nobody here
// owns, so every click was a bounce.
//
// Both app stores check that a published contact address works, and the policy
// gives it as the route for a data-subject request — so this is not a cosmetic
// string. Four hand-typed copies is three chances to miss one when it changes.

/** Where data, privacy and support enquiries go. */
export const CONTACT_EMAIL = "m.y.m95@outlook.com";

/** `href` for a mail link to the above. */
export const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}`;
