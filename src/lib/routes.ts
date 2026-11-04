// lib/routes.ts
// In-app link helpers.

/** Link to a list's detail screen. */
export function listHref(listId: string): string {
  return `/List/${listId}`;
}

/**
 * Where to send the browser after signing out.
 *
 * This must stay a full document navigation: `middleware.ts` reads the
 * `logout=true` query and clears the auth cookies before the login page renders,
 * which a client-side push would skip entirely.
 */
export function logoutRedirectUrl(hadError = false): string {
  return hadError ? "/login?logout=true&error=true" : "/login?logout=true";
}

/** The list id the given location is showing. */
export function activeListId(pathname: string): string | null {
  if (pathname.includes("/List/")) {
    return pathname.split("/List/")[1] || null;
  }
  return null;
}
