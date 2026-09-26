import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  createClient as createSupabaseClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { IS_NATIVE_BUILD } from "@/lib/platform";

function supabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase URL or Anon Key");
  }
  return { supabaseUrl, supabaseKey };
}

/**
 * The browser-side Supabase client.
 *
 * The two builds need different session storage:
 *
 *   * Web — `createClientComponentClient` keeps the session in a cookie, which is
 *     what `middleware.ts` and the /api/* route handlers read on every request.
 *     The server is what keeps that cookie alive, so it must stay cookie-based.
 *
 *   * Native — there is no server. The static export runs entirely in the WebView,
 *     so nothing refreshes a server-managed cookie and the session is silently
 *     lost on the next launch: sign-in appears to work, then the app reopens to
 *     the login screen. Persisting to localStorage and letting supabase-js refresh
 *     the token itself is the arrangement that actually survives a restart, and
 *     `apiFetch` sends that token as a bearer header instead of relying on cookies.
 */
function createBrowserClient(): SupabaseClient {
  if (!IS_NATIVE_BUILD) {
    return createClientComponentClient();
  }

  const { supabaseUrl, supabaseKey } = supabaseEnv();
  return createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // No OAuth redirect lands back in the WebView, so there is never a session
      // to parse out of the URL, and leaving this on makes supabase-js rewrite
      // the address on every load.
      detectSessionInUrl: false,
    },
  });
}

export const supabase = createBrowserClient();

export const createClient = () => {
  const { supabaseUrl, supabaseKey } = supabaseEnv();
  return createSupabaseClient(supabaseUrl, supabaseKey);
};
