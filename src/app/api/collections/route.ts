// app/api/collections/route.ts
// Server-side API routes for collection CRUD, scoped to authenticated user.

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { logger } from "@/lib/logger";

// GET /api/collections
// Query params: list_id
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const { session } = auth;

  const { searchParams } = new URL(request.url);
  const supabase = createServerComponentClient({ cookies });

  try {
    let query = supabase
      .from("collection")
      .select("id, collection_name, bg_color_hex, created_at, list_id, user_id")
      .eq("user_id", session.user.id);

    const listId = searchParams.get("list_id");
    if (listId) query = query.eq("list_id", listId);

    const { data, error } = await query.order("collection_name", { ascending: true });

    if (error) {
      logger.error("GET /api/collections error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    logger.error("GET /api/collections unexpected error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/collections  — create a new collection
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const { session } = auth;

  try {
    const body = await request.json();
    const supabase = createServerComponentClient({ cookies });

    const { data, error } = await supabase
      .from("collection")
      .insert({ ...body, user_id: session.user.id })
      .select()
      .single();

    if (error) {
      logger.error("POST /api/collections error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    logger.error("POST /api/collections unexpected error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/collections  — update a collection (body must include id)
export async function PATCH(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const { session } = auth;

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Collection ID is required" }, { status: 400 });
    }

    const supabase = createServerComponentClient({ cookies });

    const { data, error } = await supabase
      .from("collection")
      .update(updates)
      .eq("id", id)
      .eq("user_id", session.user.id)
      .select()
      .single();

    if (error) {
      logger.error("PATCH /api/collections error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    logger.error("PATCH /api/collections unexpected error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/collections  — delete collections and their children
// body: { ids: string[] }
export async function DELETE(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const { session } = auth;

  try {
    const body = await request.json();
    const { ids } = body as { ids: string[] };

    if (!ids || ids.length === 0) {
      return NextResponse.json({ error: "Collection IDs are required" }, { status: 400 });
    }

    const supabase = createServerComponentClient({ cookies });

    // Verify ownership of each collection before deleting
    const { data: owned, error: ownershipError } = await supabase
      .from("collection")
      .select("id")
      .in("id", ids)
      .eq("user_id", session.user.id);

    if (ownershipError) {
      logger.error("DELETE /api/collections ownership check error", ownershipError);
      return NextResponse.json({ error: ownershipError.message }, { status: 500 });
    }

    const ownedIds = (owned ?? []).map((c: { id: string }) => c.id);
    if (ownedIds.length === 0) {
      return NextResponse.json({ error: "No matching collections found" }, { status: 404 });
    }

    // Delete children first to maintain referential integrity
    await supabase.from("task").delete().in("collection_id", ownedIds);
    await supabase.from("note").delete().in("collection_id", ownedIds);

    const { error } = await supabase
      .from("collection")
      .delete()
      .in("id", ownedIds);

    if (error) {
      logger.error("DELETE /api/collections error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("DELETE /api/collections unexpected error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
