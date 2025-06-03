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

    const errors = [
      taskError,
      noteError,
      collectionError,
      listError,
      userError,
    ].filter((err): err is NonNullable<typeof err> => Boolean(err));

    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: "Database deletion failed",
          details: errors.map((err) => err.message),
        },
        { status: 500 }
      );
    }

    const { error: authDeleteError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      return NextResponse.json(
        {
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
