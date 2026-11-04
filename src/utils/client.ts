// `createBrowserClient` is also the name of the local function below, so the
// import is aliased rather than renaming a function three other modules call.
import { createBrowserClient as createCookieClient } from "@supabase/ssr";
import {
  createClient as createSupabaseClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

function supabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase URL or Anon Key");
  }
  return { supabaseUrl, supabaseKey };
}

/**
 * The browser-side Supabase client. The `@supabase/ssr` browser client keeps the
 * session in a cookie, which is what `middleware.ts` and the /api/* route
 * handlers read on every request.
 */
function createBrowserClient(): SupabaseClient {
  const { supabaseUrl, supabaseKey } = supabaseEnv();
  return createCookieClient(supabaseUrl, supabaseKey);
}

export const supabase = createBrowserClient();

export const createClient = () => {
  const { supabaseUrl, supabaseKey } = supabaseEnv();
  return createSupabaseClient(supabaseUrl, supabaseKey);
};
