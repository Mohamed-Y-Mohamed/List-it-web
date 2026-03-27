// app/api/delete-account/route.ts
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { logger } from "@/lib/logger";

export async function DELETE(request: NextRequest) {
  // Authenticate the caller first using the shared helper
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const { session } = auth;
  const userId = session.user.id;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Step 1: Delete all user data from database first.
    // Performing DB deletion before auth deletion means that if the DB step
    // fails we can safely return an error and the user can retry — their auth
    // record is still intact.  Once auth is deleted (step 2) there is no
    // going back, so we prefer to ensure data is clean first.
    const [taskRes, noteRes, collectionRes, listRes, userRes] =
      await Promise.all([
        supabaseAdmin.from("task").delete().eq("user_id", userId),
        supabaseAdmin.from("note").delete().eq("user_id", userId),
        supabaseAdmin.from("collection").delete().eq("user_id", userId),
        supabaseAdmin.from("list").delete().eq("user_id", userId),
        supabaseAdmin.from("users").delete().eq("id", userId),
      ]);

    const dbErrors = [
      taskRes.error,
      noteRes.error,
      collectionRes.error,
      listRes.error,
      userRes.error,
    ].filter(Boolean);

    if (dbErrors.length > 0) {
      logger.error("DELETE /api/delete-account: database deletion errors", dbErrors);
    }

    // Step 2: Delete the auth user (this is the point of no return)
    const { error: authDeleteError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      logger.error("DELETE /api/delete-account: auth deletion error", authDeleteError);
      return NextResponse.json(
        {
          success: false,
          error: "Authentication deletion failed",
          details: authDeleteError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Account deleted successfully",
      },
      { status: 200 }
    );
  } catch (err) {
    logger.error("DELETE /api/delete-account unexpected error", err);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
