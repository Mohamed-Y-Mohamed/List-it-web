// app/api/lists/route.ts
// Server-side API routes for list CRUD, scoped to authenticated user.

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { logger } from "@/lib/logger";

// GET /api/lists
// Query params: id (optional – returns single list when provided)
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const { session } = auth;

  const { searchParams } = new URL(request.url);
  const supabase = createServerComponentClient({ cookies });
  const id = searchParams.get("id");

  try {
    if (id) {
      const { data, error } = await supabase
        .from("list")
        .select("*")
        .eq("id", id)
        .eq("user_id", session.user.id)
        .single();

      if (error) {
        logger.error("GET /api/lists error", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data });
    }

    const { data, error } = await supabase
      .from("list")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: true });

    if (error) {
      logger.error("GET /api/lists error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    logger.error("GET /api/lists unexpected error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/lists  — create a new list
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const { session } = auth;

  try {
    const body = await request.json();
    const supabase = createServerComponentClient({ cookies });

    const { data, error } = await supabase
      .from("list")
      .insert({ ...body, user_id: session.user.id })
      .select()
      .single();

    if (error) {
      logger.error("POST /api/lists error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    logger.error("POST /api/lists unexpected error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/lists  — update a list (body must include id)
export async function PATCH(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const { session } = auth;

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "List ID is required" }, { status: 400 });
    }

    const supabase = createServerComponentClient({ cookies });

    const { data, error } = await supabase
      .from("list")
      .update(updates)
      .eq("id", id)
      .eq("user_id", session.user.id)
      .select()
      .single();

    if (error) {
      logger.error("PATCH /api/lists error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    logger.error("PATCH /api/lists unexpected error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/lists  — delete a list and all its children
// body: { id: string }
export async function DELETE(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const { session } = auth;

  try {
    const body = await request.json();
    const { id } = body as { id: string };

    if (!id) {
      return NextResponse.json({ error: "List ID is required" }, { status: 400 });
    }

    const supabase = createServerComponentClient({ cookies });

    // Verify ownership
    const { data: list, error: listCheckError } = await supabase
      .from("list")
      .select("id")
      .eq("id", id)
      .eq("user_id", session.user.id)
      .single();

    if (listCheckError || !list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    // Gather collection IDs
    const { data: collections } = await supabase
      .from("collection")
      .select("id")
      .eq("list_id", id);

    const collectionIds = (collections ?? []).map((c: { id: string }) => c.id);

    if (collectionIds.length > 0) {
      await supabase.from("task").delete().in("collection_id", collectionIds);
      await supabase.from("note").delete().in("collection_id", collectionIds);
    }

    // Delete tasks / notes directly on the list (not via collection)
    await supabase.from("task").delete().eq("list_id", id);
    await supabase.from("note").delete().eq("list_id", id);
    await supabase.from("collection").delete().eq("list_id", id);

    const { error } = await supabase
      .from("list")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (error) {
      logger.error("DELETE /api/lists error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("DELETE /api/lists unexpected error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
