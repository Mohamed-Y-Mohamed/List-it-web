// app/api/colors_retriever/route.ts
// Server-side API route to retrieve available colors.

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { logger } from "@/lib/logger";

// GET /api/colors_retriever
// Returns all rows from the app_settings table (color palette).
export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const supabase = createServerComponentClient({ cookies });

  try {
    const { data, error } = await supabase
      .from("app_settings")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      logger.error("GET /api/colors_retriever error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    logger.error("GET /api/colors_retriever unexpected error", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
