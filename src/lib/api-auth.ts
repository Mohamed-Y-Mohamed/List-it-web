// lib/api-auth.ts
// Shared helpers for the /api/* route handlers.
//
// There are two ways a caller can present a session:
//
//   * Web    — the Supabase session cookie, set on the site origin. This is the
//              original path and still the only one the browser app uses.
//   * Native — an `Authorization: Bearer <access_token>` header. The Android app
//              is served from `https://localhost` inside a WebView, so it shares
//              no origin with this API and has no cookie to send.
//
// `requireAuth` accepts either. `getRouteClient` returns a Supabase client
// authenticated as that same caller, so row-level security applies identically
// on both paths — a cookie-less client would otherwise fall back to the anon
// role and silently return nothing.

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  createClient,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

type AuthSuccess = { user: User; error: null };
type AuthFailure = { user: null; error: NextResponse };

function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Missing Supabase URL or anon key");
  }
  return { url, anonKey };
}

/** Pulls the raw token out of an `Authorization: Bearer <token>` header. */
async function readBearerToken(): Promise<string | null> {
  const headerList = await headers();
  const authorization = headerList.get("authorization");
  if (!authorization) return null;

  const [scheme, token] = authorization.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) return null;
  return token.trim() || null;
}

/**
 * Verifies the caller has a valid session, by cookie or by bearer token.
 * Returns the authenticated user, or a 401/500 NextResponse to return as-is.
 */
export async function requireAuth(): Promise<AuthSuccess | AuthFailure> {
  const unauthorized = (): AuthFailure => ({
    user: null,
    error: NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    ),
  });
  const serverError = (): AuthFailure => ({
    user: null,
    error: NextResponse.json({ error: "Authentication error" }, { status: 500 }),
  });

  try {
    // 1. Cookie session — the web path, unchanged.
    const cookieClient = createServerComponentClient({ cookies });
    const { data: cookieData, error: cookieError } =
      await cookieClient.auth.getSession();

    if (cookieError) return serverError();
    if (cookieData.session?.user) {
      return { user: cookieData.session.user, error: null };
    }

    // 2. Bearer token — the native path. The token is verified against Supabase
    //    rather than merely decoded, so an unsigned or expired JWT is rejected.
    const token = await readBearerToken();
    if (!token) return unauthorized();

    const { url, anonKey } = supabaseEnv();
    const anonClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userError } =
      await anonClient.auth.getUser(token);
    if (userError || !userData.user) return unauthorized();

    return { user: userData.user, error: null };
  } catch {
    return serverError();
  }
}

/**
 * A Supabase client acting as the current caller, for use inside route handlers
 * once `requireAuth` has passed. Mirrors whichever credential the caller used,
 * so RLS policies see the real user on both the web and the native path.
 */
export async function getRouteClient(): Promise<SupabaseClient> {
  const token = await readBearerToken();
  if (!token) {
    return createServerComponentClient({ cookies });
  }

  const { url, anonKey } = supabaseEnv();
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}
