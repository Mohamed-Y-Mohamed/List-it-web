// app/api/notes/route.ts
// Server-side API routes for note CRUD, scoped to authenticated user.

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { logger } from "@/lib/logger";

// GET /api/notes
// Query params: list_id, collection_id, is_deleted, is_pinned
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const { session } = auth;

  const { searchParams } = new URL(request.url);
  const supabase = createServerComponentClient({ cookies });

  try {
    let query = supabase
      .from("note")
      .select("*")
      .eq("user_id", session.user.id);

    const listId = searchParams.get("list_id");
    const collectionId = searchParams.get("collection_id");
    const isDeleted = searchParams.get("is_deleted");
    const isPinned = searchParams.get("is_pinned");

    if (listId) query = query.eq("list_id", listId);
    if (collectionId) query = query.eq("collection_id", collectionId);
    if (isDeleted !== null) query = query.eq("is_deleted", isDeleted === "true");
    if (isPinned !== null) query = query.eq("is_pinned", isPinned === "true");

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      logger.error("GET /api/notes error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    logger.error("GET /api/notes unexpected error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/notes  — create a new note
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const { session } = auth;

  try {
    const body = await request.json();
    const supabase = createServerComponentClient({ cookies });

    const { data, error } = await supabase
      .from("note")
      .insert({ ...body, user_id: session.user.id })
      .select()
      .single();

    if (error) {
      logger.error("POST /api/notes error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    logger.error("POST /api/notes unexpected error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/notes  — update a note (body must include id)
export async function PATCH(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const { session } = auth;

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Note ID is required" }, { status: 400 });
    }

    const supabase = createServerComponentClient({ cookies });

    const { data, error } = await supabase
      .from("note")
      .update(updates)
      .eq("id", id)
      .eq("user_id", session.user.id)
      .select()
      .single();

    if (error) {
      logger.error("PATCH /api/notes error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    logger.error("PATCH /api/notes unexpected error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/notes  — delete a note
// body: { id: string, hard?: boolean }
export async function DELETE(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const { session } = auth;

  try {
    const body = await request.json();
    const { id, hard } = body;

    if (!id) {
      return NextResponse.json({ error: "Note ID is required" }, { status: 400 });
    }

    const supabase = createServerComponentClient({ cookies });

    let error;
    if (hard) {
      ({ error } = await supabase
        .from("note")
        .delete()
        .eq("id", id)
        .eq("user_id", session.user.id));
    } else {
      ({ error } = await supabase
        .from("note")
        .update({ is_deleted: true })
        .eq("id", id)
        .eq("user_id", session.user.id));
    }

    if (error) {
      logger.error("DELETE /api/notes error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("DELETE /api/notes unexpected error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
