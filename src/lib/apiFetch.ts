// lib/apiFetch.ts
// Drop-in replacement for `fetch` when talking to this app's own /api/* routes.
//
// On web this is `fetch` with no behaviour change at all: the relative path is
// passed straight through and the browser attaches the Supabase session cookie
// automatically, exactly as before.
//
// Inside the native shell there is no shared origin and therefore no cookie to
// send, so the same request is re-pointed at the hosted API and the session is
// carried in an `Authorization: Bearer` header instead. `requireAuth` on the
// server accepts either form.

import { supabase } from "@/utils/client";
import { getApiBaseUrl, isNativeApp } from "@/lib/platform";

export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  if (!isNativeApp()) {
    return fetch(path, init);
  }

  const headers = new Headers(init.headers);

  // getSession() refreshes the access token when it has expired, so this also
  // keeps long-lived app sessions working without a manual refresh.
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
    // Nothing to send or store cross-origin; the bearer token is the session.
    credentials: "omit",
  });
}
