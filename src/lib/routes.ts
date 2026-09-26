// lib/routes.ts
// URL shapes that differ between the web app and the native shell.

/**
 * Link to a list's detail screen.
 *
 * Web uses the canonical path segment. The native build is a static export, where
 * only prerendered paths exist on disk, so it addresses the single prerendered
 * /List page and carries the id in the query string instead.
 */
export function listHref(listId: string, isNative: boolean): string {
  return isNative
    ? `/List?id=${encodeURIComponent(listId)}`
    : `/List/${listId}`;
}

/**
 * Where to send the browser after signing out.
 *
 * On web this must stay a full document navigation: `middleware.ts` reads the
 * `logout=true` query and clears the auth cookies before the login page renders,
 * which a client-side push would skip entirely.
 *
 * On native there is no middleware and no cookie to clear, and only prerendered
 * paths exist on disk — so address the login page's own directory path directly.
 */
export function logoutRedirectUrl(isNative: boolean, hadError = false): string {
  if (isNative) return "/login/";
  return hadError ? "/login?logout=true&error=true" : "/login?logout=true";
}

/** The list id the given location is showing, in either URL shape. */
export function activeListId(
  pathname: string,
  searchParams: URLSearchParams | null
): string | null {
  if (pathname.includes("/List/")) {
    return pathname.split("/List/")[1] || null;
  }
  if (pathname === "/List" || pathname === "/List/") {
    return searchParams?.get("id") || null;
  }
  return null;
}
