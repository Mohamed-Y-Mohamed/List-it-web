// lib/password.ts
// What counts as an acceptable password, in one place.
//
// Supabase enforces this server-side; these are the same rules stated early so
// the person typing finds out before they submit. The three screens that take a
// new password — sign-up, Settings → Security, and the reset link — each had
// their own idea of the rule, and all three were wrong: two asked for 6
// characters and one for 8, and none of them mentioned that a password also
// needs an uppercase letter, a lowercase letter, a number and a symbol.
//
// So "abcdef" passed every check the app made and was then refused by the auth
// server, which answers with its own wording — a sentence listing the entire
// permitted symbol set, shown raw to the user.
//
// Measured against the project's own auth settings rather than assumed:
//
//   6 chars, all four classes  -> rejected, "should be at least 8 characters"
//   7 chars, all four classes  -> rejected, same
//   8 chars, all four classes  -> accepted
//   9 chars, no symbol         -> rejected, "one character of each: ..."
//   9 chars, no uppercase      -> rejected, same
//
// If the policy is ever changed in the Supabase dashboard, this file is what
// has to move with it.

export const PASSWORD_MIN_LENGTH = 8;

/** One line stating the whole rule, for a hint under a password field. */
export const PASSWORD_RULE =
  "At least 8 characters, including an uppercase letter, a lowercase letter, a number and a symbol.";

// The set the auth server accepts. Kept as a character class rather than
// "anything not alphanumeric" so the message cannot promise something the
// server then refuses.
const SYMBOLS = /[!@#$%^&*()_+\-=[\]{};':"|<>?,./`~\\]/;

/**
 * The first rule this password breaks, phrased for the person who typed it,
 * or null when it satisfies all of them.
 *
 * One message at a time, naming what is actually missing: a list of every
 * unmet requirement is longer to read and no more useful, and the common case
 * is a single thing short.
 */
export function passwordError(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  if (!/[a-z]/.test(password)) {
    return "Password must include a lowercase letter";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must include an uppercase letter";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must include a number";
  }
  if (!SYMBOLS.test(password)) {
    return "Password must include a symbol, such as ! ? @ or -";
  }
  return null;
}
