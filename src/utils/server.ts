// utils/server.ts
// The cookie-backed Supabase client for anything running on the server.
//
// Next 15 made `cookies()` async. `@supabase/auth-helpers-nextjs`, which this
// used to call, hands the *function* to Supabase and lets it call it
// synchronously, which Next refuses — that was every
// `Route "/api/notes" used cookies().get(...)` line in the dev server output.
// The package is deprecated and will not be fixed; `@supabase/ssr` is its
// replacement and takes an already-resolved cookie store instead.
//
// One factory rather than three: the route handlers, the auth callback and
// `lib/api-auth.ts` all need the identical adapter, and three copies of a
// cookie bridge is three chances for one of them to drift.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing Supabase URL or anon key");
  }
  return { url, anonKey };
}

/**
 * A Supabase client bound to the current request's cookies.
 *
 * Must be awaited: the cookie store is resolved before the client is built, so
 * Supabase never reaches for it mid-request.
 */
export async function createClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  const { url, anonKey } = supabaseEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },

      setAll(cookiesToSet) {
        // A Server Component cannot write cookies, and Next throws if you try.
        // That is expected and harmless here: the middleware runs on every
        // matched request and refreshes the session cookie there instead, so
        // swallowing it loses nothing. Route handlers can write, and do.
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Written by the middleware on the next request.
        }
      },
    },
  });
}
