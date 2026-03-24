// app/api/user/profile/route.ts
// Read and update the authenticated user's profile row in the `users` table.

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { logger } from "@/lib/logger";

// GET /api/user/profile
export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const { session } = auth;

  const supabase = createServerComponentClient({ cookies });

  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, display_name, avatar_url, created_at, last_login")
      .eq("id", session.user.id)
      .single();

    if (error) {
      logger.error("GET /api/user/profile error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    logger.error("GET /api/user/profile unexpected error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/user/profile  — update profile fields (display_name, avatar_url, etc.)
export async function PATCH(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const { session } = auth;

  try {
    const body = await request.json();
    // Strip id so the caller cannot override ownership
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, ...updates } = body;

    const supabase = createServerComponentClient({ cookies });

    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", session.user.id)
      .select()
      .single();

    if (error) {
      logger.error("PATCH /api/user/profile error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    logger.error("PATCH /api/user/profile unexpected error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
