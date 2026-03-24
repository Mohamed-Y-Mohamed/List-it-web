// lib/api-auth.ts
// Shared helper: verify the caller has a valid Supabase session.
// Returns the session on success or a 401/500 NextResponse on failure.

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Session } from "@supabase/supabase-js";

type AuthSuccess = { session: Session; error: null };
type AuthFailure = { session: null; error: NextResponse };

export async function requireAuth(): Promise<AuthSuccess | AuthFailure> {
  try {
    const supabase = createServerComponentClient({ cookies });
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      return {
        session: null,
        error: NextResponse.json(
          { error: "Authentication error" },
          { status: 500 }
        ),
      };
    }

    if (!session) {
      return {
        session: null,
        error: NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        ),
      };
    }

    return { session, error: null };
  } catch {
    return {
      session: null,
      error: NextResponse.json(
        { error: "Authentication error" },
        { status: 500 }
      ),
    };
  }
}
