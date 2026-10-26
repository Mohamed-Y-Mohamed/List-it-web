// app/api/user/password/route.ts
// Verify the current password then update to a new one.

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { logger } from "@/lib/logger";

// POST /api/user/password
// body: { currentPassword: string, newPassword: string }
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const { user } = auth;

  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "currentPassword and newPassword are required" },
        { status: 400 },
      );
    }

    // Verify current password by attempting to sign in with the public anon key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      logger.error(
        "POST /api/user/password configuration error: missing Supabase env vars",
      );
      return NextResponse.json(
        { error: "Server configuration error: Supabase is not configured" },
        { status: 500 },
      );
    }

    const userEmail = user?.email;
    if (!userEmail) {
      logger.error(
        "POST /api/user/password configuration error: session is missing user email",
      );
      return NextResponse.json(
        { error: "Server configuration error: user email not available" },
        { status: 500 },
      );
    }

    // persistSession keeps this client's session in its own in-memory store
    // rather than a shared one, so two people changing their password at the
    // same moment cannot end up looking at each other's session. The session
    // still lives for as long as this client does, which is the point below.
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error: signInError } = await anonClient.auth.signInWithPassword({
      email: userEmail,
      password: currentPassword,
    });

    if (signInError) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 },
      );
    }

    // The update runs on the client that just signed in, because that is the
    // only client in this request that holds a session.
    //
    // It used to run on getRouteClient()'s client, which works on the web and
    // silently cannot work in the app. That client mirrors whichever credential
    // the caller used, and the Android app's credential is a bearer token
    // attached as a global request header. A header authenticates PostgREST, so
    // every `.from(...)` query behaves — but auth.updateUser reads the session
    // out of the client's own storage, finds nothing, and throws
    // AuthSessionMissingError before it makes any request at all. The route
    // returned 500 and the password was never changed, while the identical code
    // on the web returned 200 and worked. Confirmed against a running server:
    // bearer path "Auth session missing!", cookie path 200.
    const { error: updateError } = await anonClient.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      logger.error("POST /api/user/password updateUser error", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("POST /api/user/password unexpected error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
