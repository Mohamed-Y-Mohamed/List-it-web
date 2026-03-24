// app/api/tasks/route.ts
// Server-side API routes for task CRUD. All operations are scoped to the
// authenticated user; direct Supabase queries should not be made from client
// components.

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { logger } from "@/lib/logger";

// GET /api/tasks
// Query params: list_id, collection_id, is_completed, is_deleted, is_pinned
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const { session } = auth;

  const { searchParams } = new URL(request.url);
  const supabase = createServerComponentClient({ cookies });

  try {
    let query = supabase
      .from("task")
      .select("*")
      .eq("user_id", session.user.id);

    const listId = searchParams.get("list_id");
    const collectionId = searchParams.get("collection_id");
    const isCompleted = searchParams.get("is_completed");
    const isDeleted = searchParams.get("is_deleted");
    const isPinned = searchParams.get("is_pinned");

    if (listId) query = query.eq("list_id", listId);
    if (collectionId) query = query.eq("collection_id", collectionId);
    if (isCompleted !== null) query = query.eq("is_completed", isCompleted === "true");
    if (isDeleted !== null) query = query.eq("is_deleted", isDeleted === "true");
    if (isPinned !== null) query = query.eq("is_pinned", isPinned === "true");

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      logger.error("GET /api/tasks error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    logger.error("GET /api/tasks unexpected error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/tasks  — create a new task
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const { session } = auth;

  try {
    const body = await request.json();
    const supabase = createServerComponentClient({ cookies });

    const { data, error } = await supabase
      .from("task")
      .insert({ ...body, user_id: session.user.id })
      .select()
      .single();

    if (error) {
      logger.error("POST /api/tasks error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    logger.error("POST /api/tasks unexpected error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/tasks  — update a task (body must include id)
export async function PATCH(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const { session } = auth;

  try {
    const body = await request.json();
    const { id, ...updates } = body;
    delete updates.user_id;

    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const supabase = createServerComponentClient({ cookies });

    const { data, error } = await supabase
      .from("task")
      .update(updates)
      .eq("id", id)
      .eq("user_id", session.user.id)
      .select()
      .single();

    if (error) {
      logger.error("PATCH /api/tasks error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    logger.error("PATCH /api/tasks unexpected error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/tasks  — soft-delete or hard-delete (body: { id, hard?: boolean })
export async function DELETE(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const { session } = auth;

  try {
    const body = await request.json();
    const { id, hard } = body;

    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const supabase = createServerComponentClient({ cookies });

    let error;
    if (hard) {
      ({ error } = await supabase
        .from("task")
        .delete()
        .eq("id", id)
        .eq("user_id", session.user.id));
    } else {
      ({ error } = await supabase
        .from("task")
        .update({ is_deleted: true })
        .eq("id", id)
        .eq("user_id", session.user.id));
    }

    if (error) {
      logger.error("DELETE /api/tasks error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("DELETE /api/tasks unexpected error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
