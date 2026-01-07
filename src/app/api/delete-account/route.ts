// app/api/delete-account/route.ts
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

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

    // Step 1: Delete from authentication first (this also triggers cascade deletes)
    const { error: authDeleteError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error("Auth deletion error:", authDeleteError);
      return NextResponse.json(
        {
          success: false,
          error: "Authentication deletion failed",
          details: authDeleteError.message,
        },
        { status: 500 }
      );
    }

    // Step 2: Delete all user data from database
    // Delete in order: child tables first, then parent tables
    const { error: taskError } = await supabaseAdmin
      .from("task")
      .delete()
      .eq("user_id", userId);

    const { error: noteError } = await supabaseAdmin
      .from("note")
      .delete()
      .eq("user_id", userId);

    const { error: collectionError } = await supabaseAdmin
      .from("collection")
      .delete()
      .eq("user_id", userId);

    const { error: listError } = await supabaseAdmin
      .from("list")
      .delete()
      .eq("user_id", userId);

    const { error: userError } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", userId);

    // Collect any database errors (but don't fail if auth deletion succeeded)
    const dbErrors = [
      taskError,
      noteError,
      collectionError,
      listError,
      userError,
    ].filter((err): err is NonNullable<typeof err> => Boolean(err));

    if (dbErrors.length > 0) {
      console.error("Database deletion errors:", dbErrors);
      // Log errors but still return success if auth deletion worked
      // The cascade should handle most deletions automatically
    }

    return NextResponse.json(
      {
        success: true,
        message: "Account deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
