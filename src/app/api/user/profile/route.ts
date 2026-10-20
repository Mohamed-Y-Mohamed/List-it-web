// app/api/user/profile/route.ts
// Read and update the authenticated user's profile row in the `users` table.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, getRouteClient } from "@/lib/api-auth";
import { logger } from "@/lib/logger";

// GET /api/user/profile
export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const { user } = auth;

  const supabase = await getRouteClient();

  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      logger.error("GET /api/user/profile error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    logger.error("GET /api/user/profile unexpected error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH /api/user/profile  — update profile fields (full_name, avatar_url, etc.)
//
// The account's name is held in two places and both have to move together:
//
//   * `users.full_name` — the source of truth. Every screen reads it, and the
//     iOS app reads the same row.
//   * `auth.user_metadata.full_name` — a mirror, written at sign-up by
//     AuthContext and read by the public top nav, which sits outside the app's
//     data cache and has nothing else to go on.
//
// Only the table was ever written here, so renaming yourself in Settings left
// the two disagreeing: the Lists screen said one thing and the marketing header
// another, until the account was recreated. The mirror is updated below.
export async function PATCH(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const { user } = auth;

  try {
    const body = await request.json();
    // Strip id so the caller cannot override ownership
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, ...updates } = body;

    const supabase = await getRouteClient();

    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      logger.error("PATCH /api/user/profile error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // The mirror, second and only once the row is safely written.
    //
    // A failure here is reported rather than swallowed, but it does not fail the
    // request: the name *has* changed, in the place that decides what the app
    // displays, and telling the user it did not would be the wrong lie. The
    // warning is what says the two are briefly out of step — the next successful
    // rename puts them back.
    let warning: string | undefined;

    if (typeof updates.full_name === "string") {
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { full_name: updates.full_name },
      });

      if (metadataError) {
        logger.error(
          "PATCH /api/user/profile auth metadata error",
          metadataError,
        );
        warning =
          "Your name was saved, but the copy held against your sign-in could not be updated.";
      }
    }

    return NextResponse.json(warning ? { data, warning } : { data });
  } catch (err) {
    logger.error("PATCH /api/user/profile unexpected error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
